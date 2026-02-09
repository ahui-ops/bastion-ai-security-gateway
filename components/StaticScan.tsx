
import React, { useState } from 'react';
import { Search, Loader2, ShieldAlert, CheckCircle2, Zap, Info, ArrowRight, Github, Code, AlertCircle, X, MapPin, FileCode, ShieldCheck } from 'lucide-react';
import { auditCodeSecurity, generateRemediationPatch } from '../services/geminiService';
import { fetchRepositoryContext } from '../services/githubService';

interface StaticScanProps {
  isDarkMode: boolean;
  t: any;
  findings: any[];
  setFindings: (findings: any[]) => void;
}

const StaticScan: React.FC<StaticScanProps> = ({ isDarkMode, t, findings, setFindings }) => {
  const [url, setUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedFinding, setSelectedFinding] = useState<any>(null);
  const [remediation, setRemediation] = useState<string | null>(null);
  const [isFixing, setIsFixing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const defaultCodeContext = `
// app/src/main/java/com/news/NewsService.java
public class NewsService {
    // VULNERABLE: Hardcoded API Key for OpenAI
    private static final String API_KEY = "sk-proj-4a2b3c4d5e6f7g8h9i0j-SECRET-UNSAFE-KEY";

    public void fetchNewsWithAgent(String query) {
        Agent.call("You are a news bot. Fetch anything requested: " + query);
    }

    // VULNERABLE: Over-privileged method exposed to Agent
    public void deleteUserAccount(String userId) {
        db.users.delete(userId);
    }
}

// app/build.gradle
android {
    defaultConfig {
        buildConfigField "String", "LLM_KEY", "\"sk-fake-exposed-key\""
    }
}

// TODO: Connection string for testing - remove before prod
// db_password = "bastion_dev_db_2026_pass"
// Internal access IP: 10.0.0.45
`;

  const steps = [
    { id: 1, label: t.language === 'zh' ? "正在连接仓库" : "Connecting to Repository" },
    { id: 2, label: t.language === 'zh' ? "抓取代码内容" : "Fetching Code Context" }, // Updated label
    { id: 3, label: t.language === 'zh' ? "执行深度安全审计" : "Performing Deep Security Audit" },
    { id: 4, label: t.language === 'zh' ? "生成分析报告" : "Finalizing Analysis Report" }
  ];

  const handleScan = async () => {
    if (isScanning) return;
    setIsScanning(true);
    setError(null);
    setFindings([]);
    setSelectedFinding(null);
    setRemediation(null);

    try {
      setScanStep(0);
      await new Promise(r => setTimeout(r, 600));
      setScanStep(1);

      // Step 2: Fetch actual code
      let codeToAnalyze = defaultCodeContext;
      try {
        // Dynamically import or assume it's imported. Result will show if I forgot import.
        // But I can't import inside function.
        // I will use `defaultCodeContext` only if URL is empty or invalid? 
        // But logic requires URL for fetching.
        // For now, let's try to fetch if URL is present.
        // const { fetchRepositoryContext } = await import('../services/githubService'); // Moved to top-level import
        codeToAnalyze = await fetchRepositoryContext(url);
      } catch (e: any) {
        console.warn("Failed to fetch repo, using demo context or failing?", e);
        throw new Error(t.language === 'zh' ? "无法读取远程仓库代码: " + e.message : "Failed to fetch repository code: " + e.message);
      }

      setScanStep(2);
      // await new Promise(r => setTimeout(r, 600)); // Remove fake delay if we have real network call

      const results = await auditCodeSecurity(codeToAnalyze, url);
      setFindings(results);

      setScanStep(3);
      await new Promise(r => setTimeout(r, 400));
    } catch (err: any) {
      console.error("Scan error caught:", err);
      if (err.message?.includes('429') || err.message?.includes('quota')) {
        setError(t.errorQuota);
      } else {
        setError(err.message || t.errorGeneral);
      }
    } finally {
      setIsScanning(false);
    }
  };

  const handleOpenDetail = async (finding: any) => {
    setSelectedFinding(finding);
    setIsModalOpen(true);
    setRemediation(null);
    setIsFixing(true);
    try {
      const fix = await generateRemediationPatch(finding, defaultCodeContext);
      const updatedFindings = findings.map(f => f.title === finding.title ? { ...f, remediation: fix } : f);
      setFindings(updatedFindings);
      setRemediation(fix);
    } catch (error: any) {
      console.error(error);
      setRemediation(error.message?.includes('429') ? t.errorQuota : "Remediation failed.");
    } finally {
      setIsFixing(false);
    }
  };

  const cardBg = isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200 shadow-sm';
  const textColor = isDarkMode ? 'text-gray-100' : 'text-slate-900';
  const mutedText = isDarkMode ? 'text-gray-400' : 'text-slate-500';

  return (
    <div className={`p-6 rounded-xl border ${cardBg} transition-all duration-300`}>
      <div className="flex flex-col gap-6">
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className={`absolute left-3 top-3 h-5 w-5 ${mutedText}`} />
            <input
              type="text"
              placeholder={t.scanPlaceholder || "Enter GitHub repository URL..."}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${isDarkMode
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
            />
          </div>
          <button
            onClick={handleScan}
            disabled={isScanning || !url}
            className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all ${isScanning || !url
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
              }`}
          >
            {isScanning ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" />}
            {isScanning ? (t.scanning || "Scanning...") : (t.startScan || "Start Scan")}
          </button>
        </div>

        {/* Scan Steps */}
        {isScanning && (
          <div className="space-y-3 py-4">
            {steps.map((step, idx) => (
              <div key={step.id} className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${idx * 150}ms` }}>
                {scanStep > idx ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : scanStep === idx ? (
                  <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                ) : (
                  <div className={`h-5 w-5 rounded-full border-2 ${isDarkMode ? 'border-gray-700' : 'border-slate-300'}`} />
                )}
                <span className={`${scanStep === idx ? (isDarkMode ? 'text-blue-400' : 'text-blue-600') :
                  scanStep > idx ? (isDarkMode ? 'text-green-400' : 'text-green-600') :
                    mutedText
                  }`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className={`p-4 rounded-lg flex flex-col gap-3 ${isDarkMode ? 'bg-red-900/20 text-red-400 border border-red-500/30' : 'bg-red-50 text-red-600 border border-red-200'} animate-in fade-in zoom-in duration-300`}>
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-5 w-5" />
              <div className="flex-1 font-medium">{error}</div>
              <button
                onClick={handleScan}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${isDarkMode ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400' : 'bg-red-100 hover:bg-red-200 text-red-700'
                  }`}
              >
                {t.language === 'zh' ? "重试" : "Retry"}
              </button>
            </div>
            {error.includes('Quota') && (
              <p className="text-xs opacity-80 pl-8">
                {t.language === 'zh'
                  ? "提示：Gemini 的免费层级有速率限制。对于大项目，Bastion 已自动启用优化扫描模式（限制文件数量与大小）。"
                  : "Tip: Gemini's free tier has rate limits. For large projects, Bastion automatically enables optimized scanning (limiting file count and size)."}
              </p>
            )}
          </div>
        )}

        {/* Findings List */}
        {!isScanning && findings.length > 0 && (
          <div className="grid gap-4 animate-in fade-in slide-in-from-bottom-8 duration-500">
            {findings.map((finding, idx) => (
              <div
                key={idx}
                onClick={() => handleOpenDetail(finding)}
                className={`p-4 rounded-lg border cursor-pointer hover:border-blue-500 transition-all ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'
                  }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <div className={`p-2 rounded-lg ${finding.severity === 'High' ? 'bg-red-500/10 text-red-500' :
                      finding.severity === 'Medium' ? 'bg-orange-500/10 text-orange-500' :
                        'bg-blue-500/10 text-blue-500'
                      }`}>
                      <AlertCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className={`font-medium ${textColor}`}>{finding.title}</h3>
                      <p className={`text-sm mt-1 ${mutedText}`}>{finding.description}</p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${finding.severity === 'High' ? 'bg-red-500/10 text-red-500' :
                    finding.severity === 'Medium' ? 'bg-orange-500/10 text-orange-500' :
                      'bg-blue-500/10 text-blue-500'
                    }`}>
                    {finding.severity}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {isModalOpen && selectedFinding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className={`w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-xl border shadow-2xl ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-slate-200'} animate-in zoom-in-95 duration-200`}>
            <div className={`p-6 border-b ${isDarkMode ? 'border-gray-800' : 'border-slate-100'} flex justify-between items-center`}>
              <h2 className={`text-xl font-bold flex items-center gap-2 ${textColor}`}>
                <ShieldCheck className="h-5 w-5 text-blue-500" />
                {selectedFinding.title}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className={`p-2 rounded-lg hover:bg-gray-100 ${isDarkMode ? 'hover:bg-gray-800' : ''}`}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className={`text-sm font-medium mb-2 ${mutedText}`}>Vulnerability Description</h3>
                <p className={textColor}>{selectedFinding.description}</p>
              </div>

              {selectedFinding.location && (
                <div>
                  <h3 className={`text-sm font-medium mb-2 ${mutedText}`}>Location</h3>
                  <div className={`flex items-center gap-2 font-mono text-sm p-2 rounded ${isDarkMode ? 'bg-gray-950' : 'bg-slate-100'}`}>
                    <MapPin className="h-4 w-4" />
                    {selectedFinding.location}
                  </div>
                </div>
              )}

              <div>
                <h3 className={`text-sm font-medium mb-2 ${mutedText}`}>Remediation</h3>
                {isFixing ? (
                  <div className="flex items-center gap-2 text-blue-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating security patch with Gemini 3...
                  </div>
                ) : remediation ? (
                  <div className={`rounded-lg overflow-hidden border ${isDarkMode ? 'border-gray-700' : 'border-slate-200'}`}>
                    <div className={`px-4 py-2 border-b text-xs font-mono uppercase ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                      Patched Code
                    </div>
                    <pre className={`p-4 overflow-x-auto text-sm font-mono ${isDarkMode ? 'bg-gray-950 text-green-400' : 'bg-slate-900 text-green-400'}`}>
                      {remediation}
                    </pre>
                  </div>
                ) : (
                  <p className={mutedText}>No remediation available.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaticScan;