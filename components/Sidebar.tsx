
import React from 'react';
import { SecurityView } from '../types';
import { Language } from '../translations';
import { 
  LayoutDashboard, 
  ShieldAlert, 
  Activity, 
  Terminal, 
  ClipboardList,
  ShieldCheck,
  Sun,
  Moon,
  Languages
} from 'lucide-react';

interface SidebarProps {
  currentView: SecurityView;
  setCurrentView: (view: SecurityView) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: any;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, isDarkMode, setIsDarkMode, language, setLanguage, t }) => {
  const menuItems = [
    { id: SecurityView.DASHBOARD, label: t.overview, icon: LayoutDashboard },
    { id: SecurityView.STATIC_SCAN, label: t.securityScan, icon: ShieldAlert },
    { id: SecurityView.LIVE_GUARD, label: t.liveGuard, icon: Activity },
    { id: SecurityView.ATTACK_SIMULATOR, label: t.penTest, icon: Terminal },
    { id: SecurityView.AUDIT_LOGS, label: t.auditLogs, icon: ClipboardList },
  ];

  const bgColor = isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200 shadow-sm';
  const textColor = isDarkMode ? 'text-gray-400' : 'text-slate-500';
  const activeText = isDarkMode ? 'text-indigo-400' : 'text-indigo-600';

  return (
    <aside className={`w-64 border-r flex flex-col h-full transition-colors duration-300 ${bgColor}`}>
      <div className="p-6 flex items-center space-x-3">
        <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-600/20">
          <ShieldCheck className="text-white w-6 h-6" />
        </div>
        <h1 className={`text-xl font-bold bg-gradient-to-r ${isDarkMode ? 'from-white to-gray-400' : 'from-slate-900 to-slate-500'} bg-clip-text text-transparent`}>
          Bastion
        </h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                isActive 
                  ? `${isDarkMode ? 'bg-indigo-600/10 border-indigo-600/20' : 'bg-indigo-50 border-indigo-100'} ${activeText} border` 
                  : `${textColor} hover:${isDarkMode ? 'bg-gray-800' : 'bg-slate-50'} hover:${isDarkMode ? 'text-gray-200' : 'text-slate-900'}`
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 space-y-2 border-t transition-colors duration-300 border-inherit">
        <button
          onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
            isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <div className="flex items-center space-x-3">
            <Languages className="w-5 h-5" />
            <span className="text-sm font-medium">{language === 'en' ? 'English' : '简体中文'}</span>
          </div>
        </button>

        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
            isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <div className="flex items-center space-x-3">
            {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            <span className="text-sm font-medium">{isDarkMode ? t.darkMode : t.lightMode}</span>
          </div>
        </button>

        <div className={`${isDarkMode ? 'bg-indigo-900/20 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200'} border rounded-xl p-4`}>
          <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-indigo-300' : 'text-indigo-600'}`}>{t.protectionStatus}</p>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-slate-700'}`}>{t.monitoringActive}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
