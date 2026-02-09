
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Shield, AlertTriangle, Eye, Zap, AlertCircle } from 'lucide-react';
import { SecurityView } from '../types';
import { useSecurityStats } from '../context/SecurityContext';

interface DashboardProps {
  isDarkMode: boolean;
  t: any;
  setCurrentView: (view: SecurityView) => void;
  onExport: () => void;
}

const COLORS = ['#6366f1', '#f43f5e', '#eab308', '#22c55e'];

const StatCard = ({ title, value, change, icon: Icon, color, isDarkMode }: any) => (
  <div className={`${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200 shadow-sm'} border p-6 rounded-2xl transition-colors duration-300`}>
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl bg-opacity-10 ${color}`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
      <span className={`text-xs font-bold px-2 py-1 rounded-full ${change.startsWith('+') ? 'bg-green-500/10 text-green-500' : change.startsWith('-') ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
        {change}
      </span>
    </div>
    <p className={`${isDarkMode ? 'text-gray-400' : 'text-slate-500'} text-sm font-medium`}>{title}</p>
    <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{value}</p>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ isDarkMode, t, setCurrentView, onExport }) => {
  const { totalScanned, threatsPrevented, highRiskAlerts, recentEvents } = useSecurityStats();

  const data = [
    { name: '00:00', attacks: 12, blocks: 10 },
    { name: '04:00', attacks: 34, blocks: 32 },
    { name: '08:00', attacks: 23, blocks: 23 },
    { name: '12:00', attacks: 56, blocks: 54 },
    { name: '16:00', attacks: 45, blocks: 45 },
    { name: '20:00', attacks: 78, blocks: 76 },
    { name: '23:59', attacks: 23, blocks: 23 },
  ];

  const threatDistribution = [
    { name: t.threatTypes?.PROMPT_INJECTION || 'Prompt Injection', value: 45 },
    { name: t.threatTypes?.PRIVILEGE_ABUSE || 'Privilege Abuse', value: 25 },
    { name: t.threatTypes?.LEAKAGE || 'Data Leakage', value: 20 },
    { name: t.threatTypes?.MEMORY_POISONING || 'Memory Poisoning', value: 10 },
  ];

  const cardBg = isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200 shadow-sm';
  const titleColor = isDarkMode ? 'text-white' : 'text-slate-900';
  const gridColor = isDarkMode ? '#1f2937' : '#e2e8f0';
  const tickColor = isDarkMode ? '#6b7280' : '#94a3b8';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h2 className={`text-3xl font-bold mb-2 ${titleColor}`}>{t.securityOverview}</h2>
          <p className={isDarkMode ? 'text-gray-400' : 'text-slate-500'}>{t.monitoringDesc}</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={onExport}
            className={`${isDarkMode ? 'bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-sm'} px-6 py-2 rounded-xl border transition-colors font-medium`}
          >
            {t.exportReport}
          </button>
          <button
            onClick={() => setCurrentView(SecurityView.STATIC_SCAN)}
            className="bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 font-medium"
          >
            {t.scanProject}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={t.totalRequests} value={totalScanned.toLocaleString()} change="+12.5%" icon={Eye} color="bg-indigo-500" isDarkMode={isDarkMode} />
        <StatCard title={t.threatsPrevented} value={threatsPrevented.toLocaleString()} change="+4.2%" icon={Shield} color="bg-green-500" isDarkMode={isDarkMode} />
        <StatCard title={t.highRiskAlerts} value={highRiskAlerts.toLocaleString()} change="-2.1%" icon={AlertTriangle} color="bg-rose-500" isDarkMode={isDarkMode} />
        <StatCard title={t.uptimeAccuracy} value="99.99%" change="Stable" icon={Zap} color="bg-yellow-500" isDarkMode={isDarkMode} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`${cardBg} lg:col-span-2 border rounded-2xl p-6 transition-colors duration-300`}>
          <h3 className={`text-lg font-bold mb-6 ${titleColor}`}>{t.threatActivity}</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorAttacks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="name" stroke={tickColor} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={tickColor} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#111827' : '#ffffff',
                    border: `1px solid ${isDarkMode ? '#374151' : '#e2e8f0'}`,
                    borderRadius: '12px',
                    color: isDarkMode ? '#f3f4f6' : '#1e293b'
                  }}
                  itemStyle={{ color: isDarkMode ? '#f3f4f6' : '#1e293b' }}
                />
                <Area type="monotone" dataKey="attacks" stroke="#6366f1" fillOpacity={1} fill="url(#colorAttacks)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`${cardBg} border rounded-2xl p-6 transition-colors duration-300`}>
          <h3 className={`text-lg font-bold mb-6 ${titleColor}`}>{t.attackVectors}</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={threatDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {threatDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-3">
            {threatDistribution.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>{item.name}</span>
                </div>
                <span className={`text-sm font-bold ${titleColor}`}>{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={`${cardBg} border rounded-2xl overflow-hidden transition-colors duration-300`}>
        <div className={`p-6 border-b transition-colors duration-300 ${isDarkMode ? 'border-gray-800' : 'border-slate-200'}`}>
          <h3 className={`text-lg font-bold ${titleColor}`}>{t.recentEvents}</h3>
        </div>
        <div className={`divide-y transition-colors duration-300 ${isDarkMode ? 'divide-gray-800' : 'divide-slate-200'}`}>
          {recentEvents.map((event) => (
            <div key={event.id} className={`p-4 transition-colors ${isDarkMode ? 'hover:bg-gray-800/50' : 'hover:bg-slate-50'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-lg ${event.severity === 'Critical' ? 'bg-rose-500/10 text-rose-500' :
                      event.severity === 'High' ? 'bg-orange-500/10 text-orange-500' :
                        event.severity === 'Medium' ? 'bg-yellow-500/10 text-yellow-500' :
                          'bg-blue-500/10 text-blue-500'
                    }`}>
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-slate-800'}`}>{event.type}</p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-slate-400'}`}>Source: {event.source}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>{getTimeAgo(event.timestamp)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${event.severity === 'Critical' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                      event.severity === 'High' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                        event.severity === 'Medium' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                          'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                    }`}>
                    {event.severity}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Helper for time ago
function getTimeAgo(date: Date) {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "m ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return Math.floor(seconds) + "s ago";
}

export default Dashboard;
