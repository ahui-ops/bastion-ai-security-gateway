
import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Play, AlertTriangle, ShieldAlert, Database, Globe } from 'lucide-react';
import { simulateAttackVector } from '../services/attackService';
import { useSecurityStats } from '../context/SecurityContext';

interface AttackSimulatorProps {
  isDarkMode: boolean;
  t: any;
}

const AttackSimulator: React.FC<AttackSimulatorProps> = ({ isDarkMode, t }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [stage, setStage] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [stats, setStats] = useState({ lossPrevented: 0, avgBlockTime: 0 });
  const scrollRef = useRef<HTMLDivElement>(null);

  const { incrementScanned, addThreat } = useSecurityStats();

  const attackStages = [
    { title: 'Reconnaissance', desc: 'Attacker scans for public API endpoints.', icon: Globe },
    { title: 'Injection', desc: 'Malicious payload sent via chat.', icon: Terminal },
    { title: 'Privilege Escalation', desc: 'Unauthorized file system access.', icon: AlertTriangle },
    { title: 'Data Exfiltration', desc: 'Customer database dump.', icon: Database },
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const startSimulation = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setStage(0);
    setLogs([]);
    setStats({ lossPrevented: 0, avgBlockTime: 0 });

    let totalBlockTime = 0;

    for (let i = 0; i < attackStages.length; i++) {
      setStage(i);
      const currentStage = attackStages[i];
      setLogs(prev => [...prev, `\n> [STAGE ${i + 1}/${attackStages.length}] Initiating ${currentStage.title}...`]);
      setLogs(prev => [...prev, `> Payload: ${currentStage.desc}`]);

      try {
        // Real simulation call
        incrementScanned();
        const result = await simulateAttackVector(currentStage.title);

        setLogs(prev => [...prev, `> Analyzing traffic pattern...`]);
        await new Promise(r => setTimeout(r, 600)); // UI pacing

        if (result.detected) {
          setLogs(prev => [...prev, `> [BLOCKED] Threat Detected: ${result.severity}`]);
          setLogs(prev => [...prev, `> Reason: ${result.details}`]);
          setLogs(prev => [...prev, `> Response Time: ${result.blockTimeMs}ms`]);

          // Update Context
          addThreat(
            result.threatType || currentStage.title,
            "Attack-Sim-Bot",
            result.severity as 'Critical' | 'High' | 'Medium' | 'Low'
          );

          totalBlockTime += result.blockTimeMs;
          setStats(prev => ({
            lossPrevented: prev.lossPrevented + (result.severity === 'Critical' ? 50000 : result.severity === 'High' ? 15000 : 2000),
            avgBlockTime: Math.round(totalBlockTime / (i + 1))
          }));
        } else {
          setLogs(prev => [...prev, `> [WARNING] Attack bypassed initial filters.`]);
        }
      } catch (e) {
        setLogs(prev => [...prev, `> Error executing stage: ${e}`]);
      }

      await new Promise(r => setTimeout(r, 800)); // Pause between stages
    }

    setStage(attackStages.length); // Done
    setLogs(prev => [...prev, `\n> Simulation Complete. System Secure.`]);
    setIsRunning(false);
  };

  const cardBg = isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200 shadow-sm';
  const textColor = isDarkMode ? 'text-white' : 'text-slate-900';
  const mutedText = isDarkMode ? 'text-gray-400' : 'text-slate-500';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className={`${cardBg} border rounded-3xl p-8 transition-colors duration-300`}>
        <div className="flex flex-col sm:flex-row justify-between items-start mb-8 space-y-4 sm:space-y-0">
          <div>
            <h2 className={`text-2xl font-bold mb-2 ${textColor}`}>{t.penTestTitle}</h2>
            <p className={mutedText}>{t.penTestDesc}</p>
          </div>
          <button
            onClick={startSimulation}
            disabled={isRunning}
            className={`px-6 py-3 rounded-2xl font-bold flex items-center space-x-2 transition-all shadow-lg ${isRunning
                ? 'bg-gray-600 cursor-not-allowed opacity-50 text-gray-300'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
              }`}
          >
            <Play className={`w-5 h-5 fill-current ${isRunning ? 'hidden' : ''}`} />
            <span>{isRunning ? 'Simulation Running...' : t.launchSimulation}</span>
          </button>
        </div>

        <div className="relative mt-20 mb-10 overflow-x-auto pb-6">
          <div className={`absolute top-1/2 left-0 w-full h-1 ${isDarkMode ? 'bg-gray-800' : 'bg-slate-200'} -translate-y-1/2 -z-10`}></div>

          <div className="flex justify-between items-center min-w-[700px] max-w-4xl mx-auto px-4">
            {attackStages.map((s, idx) => {
              const Icon = s.icon;
              const isPastOrCurrent = stage >= idx;
              const isCurrent = stage === idx && isRunning;

              return (
                <div key={idx} className="flex flex-col items-center group relative">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 border-4 ${isCurrent ? 'bg-rose-600 border-rose-500 shadow-xl shadow-rose-600/40 scale-110' :
                      isPastOrCurrent ? (isDarkMode ? 'bg-rose-900/50 border-rose-800' : 'bg-rose-100 border-rose-200') :
                        (isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200')
                    }`}>
                    <Icon className={`w-8 h-8 ${isCurrent ? 'text-white' : isPastOrCurrent ? 'text-rose-500' : (isDarkMode ? 'text-gray-500' : 'text-slate-400')}`} />
                  </div>
                  <div className={`mt-4 text-center transition-all ${isPastOrCurrent ? 'opacity-100' : 'opacity-40'}`}>
                    <p className={`font-bold text-sm mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{s.title}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className={`${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-slate-900 border-slate-800'} border rounded-3xl overflow-hidden flex flex-col transition-colors duration-300`}>
          <div className="bg-black/30 px-4 py-2 border-b border-white/5 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-xs text-mono text-gray-400 ml-2">bastion-security-core — audit-log</span>
          </div>
          <div
            ref={scrollRef}
            className="flex-1 p-6 font-mono text-sm space-y-1 h-[300px] overflow-auto bg-black text-gray-400"
          >
            <p className="text-gray-500">// System ready. Waiting for test sequences...</p>
            {logs.map((log, i) => (
              <div key={i} className={`${log.includes('[BLOCKED]') ? 'text-green-500' :
                  log.includes('Threat') ? 'text-rose-500' :
                    log.includes('[STAGE') ? 'text-blue-400 font-bold mt-2' :
                      ''
                }`}>
                {log}
              </div>
            ))}
            {isRunning && <span className="animate-pulse">_</span>}
          </div>
        </div>

        <div className={`${cardBg} border rounded-3xl p-8 flex flex-col justify-center text-center space-y-6 transition-colors duration-300`}>
          <div className={`mx-auto w-20 h-20 ${isDarkMode ? 'bg-indigo-600/10 border-indigo-600/30' : 'bg-indigo-50 border-indigo-200'} rounded-full flex items-center justify-center border-4`}>
            {isRunning ? (
              <ShieldAlert className="w-10 h-10 text-rose-500 animate-pulse" />
            ) : (
              <ShieldAlert className="w-10 h-10 text-indigo-500" />
            )}
          </div>
          <h3 className={`text-2xl font-bold ${textColor}`}>{t.impactAnalysis}</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className={`${isDarkMode ? 'bg-gray-950 border-gray-800' : 'bg-slate-50 border-slate-200'} border p-4 rounded-2xl`}>
              <p className="text-rose-500 font-bold text-2xl">${stats.lossPrevented.toLocaleString()}</p>
              <p className={`${mutedText} text-[10px] uppercase tracking-widest font-bold`}>{t.lossPrevented}</p>
            </div>
            <div className={`${isDarkMode ? 'bg-gray-950 border-gray-800' : 'bg-slate-50 border-slate-200'} border p-4 rounded-2xl`}>
              <p className="text-emerald-500 font-bold text-2xl">{stats.avgBlockTime > 0 ? `${stats.avgBlockTime}ms` : '--'}</p>
              <p className={`${mutedText} text-[10px] uppercase tracking-widest font-bold`}>{t.timeToBlock}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttackSimulator;
