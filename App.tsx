
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import StaticScan from './components/StaticScan';
import LiveGuard from './components/LiveGuard';
import AttackSimulator from './components/AttackSimulator';
import AuditLogs from './components/AuditLogs';
import { SecurityView, SecurityFinding } from './types';
import { translations, Language } from './translations';
import { SecurityProvider } from './context/SecurityContext';
import { GoogleOAuthProvider } from '@react-oauth/google';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<SecurityView>(SecurityView.DASHBOARD);
  const [findings, setFindings] = useState<any[]>([]);
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved === 'zh' ? 'zh' : 'en') as Language;
  });
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = translations[language];

  const handleExportReport = () => {
    if (findings.length === 0) {
      alert(language === 'zh' ? '请先进行项目扫描以生成报告' : 'Please scan a project first to generate a report.');
      return;
    }

    let report = `# Bastion AI Security Audit Report\n`;
    report += `Generated on: ${new Date().toLocaleString()}\n\n`;
    report += `## Summary\n`;
    report += `- Total Findings: ${findings.length}\n`;
    report += `- Critical/High Risk: ${findings.filter(f => f.level === 'CRITICAL' || f.level === 'HIGH').length}\n\n`;
    report += `--------------------------------------------------\n\n`;

    findings.forEach((f, idx) => {
      report += `### ${idx + 1}. [${f.level}] ${f.title}\n`;
      report += `- **File Path**: \`${f.filePath}\`\n`;
      report += `- **Line Number**: ${f.line}\n`;
      report += `- **Description**: ${f.description}\n`;
      report += `- **Evidence**:\n\`\`\`\n${f.evidence}\n\`\`\`\n`;
      report += `- **Suggested Remediation Patch**:\n\`\`\`\n${f.remediation || 'Run scan to generate patch'}\n\`\`\`\n\n`;
    });

    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bastion_Security_Report_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderContent = () => {
    switch (currentView) {
      case SecurityView.DASHBOARD:
        return (
          <Dashboard
            isDarkMode={isDarkMode}
            t={t}
            setCurrentView={setCurrentView}
            onExport={handleExportReport}
          />
        );
      case SecurityView.STATIC_SCAN:
        return (
          <StaticScan
            isDarkMode={isDarkMode}
            t={t}
            findings={findings}
            setFindings={setFindings}
          />
        );
      case SecurityView.LIVE_GUARD:
        return <LiveGuard isDarkMode={isDarkMode} t={t} />;
      case SecurityView.ATTACK_SIMULATOR:
        return <AttackSimulator isDarkMode={isDarkMode} t={t} />;
      case SecurityView.AUDIT_LOGS:
        return <AuditLogs isDarkMode={isDarkMode} t={t} />;
      default:
        return <Dashboard isDarkMode={isDarkMode} t={t} setCurrentView={setCurrentView} onExport={handleExportReport} />;
    }
  };

  const googleClientId = process.env.VITE_GOOGLE_CLIENT_ID || '';

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <SecurityProvider>
        <div className={`flex h-screen w-full transition-colors duration-300 overflow-hidden ${isDarkMode ? 'bg-gray-950 text-gray-100' : 'bg-slate-50 text-slate-900'}`}>
          <Sidebar
            currentView={currentView}
            setCurrentView={setCurrentView}
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            language={language}
            setLanguage={setLanguage}
            t={t}
          />
          <main className="flex-1 overflow-y-auto p-8 relative">
            <div className="max-w-7xl mx-auto h-full">
              {renderContent()}
            </div>
          </main>
        </div>
      </SecurityProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
