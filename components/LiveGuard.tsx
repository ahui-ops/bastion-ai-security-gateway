
import React, { useState, useEffect } from 'react';
import { Mail, ShieldCheck, ShieldAlert, AlertCircle, Loader2, RefreshCw, LogIn, ExternalLink, ChevronRight, Search } from 'lucide-react';
import { fetchGmailEmails, scanEmails, Email } from '../services/gmailService';
import { useSecurityStats } from '../context/SecurityContext';
import { useGoogleLogin } from '@react-oauth/google';

interface LiveGuardProps {
  isDarkMode: boolean;
  t: any;
}

const LiveGuard: React.FC<LiveGuardProps> = ({ isDarkMode, t }) => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState<{ current: number, total: number } | null>(null);

  const { incrementScanned, addThreat } = useSecurityStats();

  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      setAccessToken(tokenResponse.access_token);
      fetchUserInfo(tokenResponse.access_token);
    },
    scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email',
  });

  const fetchUserInfo = async (token: string) => {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setUserEmail(data.email);
    } catch (err) {
      console.error("Error fetching user info:", err);
    }
  };

  const handleScan = async () => {
    if (!accessToken) return;
    setIsScanning(true);
    setScanProgress(null);
    try {
      const fetched = await fetchGmailEmails(accessToken);
      if (fetched.length === 0) {
        setEmails([]);
        return;
      }

      setScanProgress({ current: 0, total: fetched.length });
      const results = await scanEmails(fetched, (current, total) => {
        setScanProgress({ current, total });
      });

      setEmails(results);
      setScanProgress(null);

      // Restore selected email focus if it exists
      if (selectedEmail) {
        const updated = results.find(e => e.id === selectedEmail.id);
        if (updated) setSelectedEmail(updated);
      }

      // Update global stats
      results.forEach(email => {
        if (email) {
          incrementScanned();
          if (email.isThreat) {
            addThreat(
              email.threatType || "Email Agent Attack",
              email.from,
              "High"
            );
          }
        }
      });
    } catch (err) {
      console.error(err);
      alert("Failed to scan Gmail. Potential API/Network error.");
    } finally {
      setIsScanning(false);
      setScanProgress(null);
    }
  };

  const cardBg = isDarkMode ? 'bg-gray-900 border-gray-800 shadow-xl' : 'bg-white border-slate-200 shadow-sm';
  const itemHoverBg = isDarkMode ? 'hover:bg-gray-800/50' : 'hover:bg-slate-50';
  const textColor = isDarkMode ? 'text-white' : 'text-slate-900';
  const subTextColor = isDarkMode ? 'text-gray-400' : 'text-slate-500';

  if (!accessToken) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] max-w-2xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
        <div className={`p-8 rounded-[40px] ${cardBg} border text-center space-y-6 max-w-md w-full relative overflow-hidden`}>
          {/* Background blur decorative element */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 blur-[60px] rounded-full"></div>

          <div className="bg-indigo-600/10 p-5 rounded-3xl w-20 h-20 flex items-center justify-center mx-auto relative z-10">
            <Mail className="text-indigo-600 w-10 h-10" />
          </div>
          <div className="space-y-2 relative z-10">
            <h2 className={`text-2xl font-black ${textColor}`}>{t.gmailSecurity}</h2>
            <p className={subTextColor}>{t.gmailDesc}</p>
          </div>

          <button
            onClick={() => login()}
            className="w-full bg-indigo-600 text-white py-4 px-6 rounded-2xl font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center space-x-3 active:scale-[0.98]"
          >
            <LogIn className="w-5 h-5" />
            <span>{t.connectGmail}</span>
          </button>

          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Secure OAuth2 Connection</p>
        </div>

        <div className="text-center max-w-sm">
          <p className="text-xs text-gray-500 italic">
            Note: This requires "Gmail API" to be enabled in your Google Cloud Console for the provided Client ID.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] max-w-5xl mx-auto space-y-6">
      {/* Header Stat Area */}
      <div className={`${cardBg} border rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 transition-all`}>
        <div className="flex items-center space-x-4">
          <div className="bg-emerald-500/10 p-3 rounded-2xl">
            <ShieldCheck className="text-emerald-500 w-7 h-7" />
          </div>
          <div>
            <h2 className={`text-xl font-black ${textColor}`}>{t.gmailSecurity}</h2>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-emerald-500">Connected: {userEmail || "Loading..."}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <button
            onClick={handleScan}
            disabled={isScanning}
            className="flex-1 md:flex-none bg-indigo-600 text-white py-3 px-6 rounded-2xl font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{scanProgress ? `Analyzing ${scanProgress.current}/${scanProgress.total}` : t.analyzing}</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>{t.scanInbox}</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Email List */}
        <div className={`${cardBg} border rounded-[32px] lg:col-span-5 flex flex-col overflow-hidden`}>
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search Inbound Analysis..." className="bg-transparent border-none outline-none text-sm w-full" disabled />
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {emails.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-3">
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full">
                  <Mail className="w-8 h-8 text-gray-400" />
                </div>
                <p className={`text-sm font-medium ${subTextColor}`}>{t.noEmails || "Recent emails will appear here after scanning."}</p>
                <button
                  onClick={handleScan}
                  className="text-xs text-indigo-500 font-bold underline"
                  disabled={isScanning}
                >
                  Run First Scan
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {emails.map((email) => (
                  <div
                    key={email.id}
                    onClick={() => setSelectedEmail(email)}
                    className={`p-4 cursor-pointer transition-colors ${itemHoverBg} ${selectedEmail?.id === email.id ? (isDarkMode ? 'bg-indigo-500/10 border-r-4 border-indigo-500' : 'bg-indigo-50 border-r-4 border-indigo-600') : ''}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-xs font-bold truncate max-w-[150px] ${email.isThreat ? 'text-rose-500' : 'text-indigo-500'}`}>
                        {email.from}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium">{email.date}</span>
                    </div>
                    <h4 className={`text-sm font-bold truncate mb-1 ${textColor}`}>{email.subject}</h4>
                    <p className={`text-xs truncate ${subTextColor}`}>{email.content}</p>

                    {email.isThreat && (
                      <div className="mt-2 flex items-center space-x-1 text-[10px] font-black text-rose-500 uppercase tracking-tighter">
                        <ShieldAlert className="w-3 h-3" />
                        <span>{t.attackInstruction}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Email Content Detail */}
        <div className={`${cardBg} border rounded-[32px] lg:col-span-7 flex flex-col overflow-hidden`}>
          {selectedEmail ? (
            <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-2xl ${selectedEmail.isThreat ? 'bg-rose-500/10' : 'bg-indigo-500/10'}`}>
                      {selectedEmail.isThreat ? <ShieldAlert className="text-rose-500 w-6 h-6" /> : <ShieldCheck className="text-indigo-500 w-6 h-6" />}
                    </div>
                    <div>
                      <h3 className={`text-lg font-black ${textColor}`}>{selectedEmail.subject}</h3>
                      <p className={`text-xs ${subTextColor}`}>{t.emailFrom}: <span className="font-bold text-indigo-500">{selectedEmail.from}</span></p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${selectedEmail.isThreat ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>
                    {selectedEmail.isThreat ? 'Critical Threat' : 'Secure'}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-3">
                  <h4 className={`text-xs font-bold uppercase tracking-widest ${subTextColor}`}>{t.emailContent}</h4>
                  <div className={`p-5 rounded-2xl font-mono text-sm leading-relaxed ${isDarkMode ? 'bg-gray-950 text-gray-300 border border-gray-800' : 'bg-slate-50 text-slate-700 border border-slate-100'}`}>
                    {selectedEmail.content}
                  </div>
                </div>

                {selectedEmail.isThreat && (
                  <div className="space-y-4">
                    <div className={`p-5 rounded-3xl border-2 ${isDarkMode ? 'bg-rose-500/10 border-rose-500/20' : 'bg-rose-50 border-rose-200'} space-y-3`}>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2 text-rose-500">
                          <AlertCircle className="w-5 h-5" />
                          <h4 className="font-black text-sm uppercase tracking-wider">Quarantine Status: ISOLATED</h4>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className={`px-2 py-1 rounded-md text-[10px] font-bold ${isDarkMode ? 'bg-rose-500/20 text-rose-300' : 'bg-rose-100 text-rose-700'}`}>
                            CONFIDENCE: {(selectedEmail.confidence || 0) * 100}%
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className={`text-xs font-bold ${isDarkMode ? 'text-rose-300' : 'text-rose-900'}`}>{t.threatType}: {selectedEmail.threatType}</p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>{selectedEmail.explanation}</p>
                      </div>

                      <div className="flex space-x-2 pt-2">
                        <button className="flex-1 text-[10px] bg-rose-500 text-white px-3 py-2 rounded-xl font-bold hover:bg-rose-600 transition-all uppercase shadow-lg shadow-rose-500/20">
                          Confirm Quarantine
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm("WARNING: You are about to release an email flagged as a CRITICAL THREAT by Gemini 3. Proceed?")) {
                              setSelectedEmail({ ...selectedEmail, isThreat: false });
                            }
                          }}
                          className={`flex-1 text-[10px] px-3 py-2 rounded-xl font-bold transition-all uppercase border ${isDarkMode ? 'border-gray-700 text-gray-400 hover:bg-gray-800' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                        >
                          Manual Release
                        </button>
                      </div>
                    </div>

                    {/* Gemini 3 Mitigation Insight */}
                    {selectedEmail.mitigation && (
                      <div className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-indigo-500/5 border-indigo-500/10' : 'bg-indigo-50 border-indigo-100'} space-y-3`}>
                        <div className="flex items-center space-x-2 text-indigo-500">
                          <ShieldCheck className="w-5 h-5" />
                          <h4 className="font-black text-sm uppercase tracking-wider">Gemini 3 Remediation Patch</h4>
                        </div>
                        <p className={`text-xs italic ${isDarkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
                          "Suggested fix for your Agent's system prompt to prevent this logic attack:"
                        </p>
                        <div className={`p-4 rounded-2xl font-mono text-xs ${isDarkMode ? 'bg-gray-900/50 text-indigo-200' : 'bg-white text-indigo-600'} border border-indigo-500/20`}>
                          {selectedEmail.mitigation}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!selectedEmail.isThreat && (
                  <div className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-emerald-50 border-emerald-100'} flex items-center space-x-3`}>
                    <ShieldCheck className="text-emerald-500 w-5 h-5" />
                    <p className="text-emerald-600 font-bold text-sm">{t.cleanEmail}</p>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                <button className={`text-xs font-bold flex items-center space-x-1 ${subTextColor} hover:text-indigo-500 transition-colors`}>
                  <span>View Original Header</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center">
                <Search className="w-8 h-8 text-gray-300" />
              </div>
              <p className={subTextColor}>Select an email to view security analysis details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveGuard;
