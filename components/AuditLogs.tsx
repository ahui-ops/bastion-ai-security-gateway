
import React, { useState } from 'react';
import {
    Search,
    Filter,
    Download,
    AlertTriangle,
    ShieldAlert,
    Clock,
    ChevronDown,
    ChevronUp,
    FileJson,
    Eye
} from 'lucide-react';
import { useSecurityStats, SecurityEvent } from '../context/SecurityContext';

interface AuditLogsProps {
    isDarkMode: boolean;
    t: any;
}

const AuditLogs: React.FC<AuditLogsProps> = ({ isDarkMode, t }) => {
    const { recentEvents } = useSecurityStats();
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const cardBg = isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200 shadow-sm';
    const textColor = isDarkMode ? 'text-gray-100' : 'text-slate-900';
    const mutedText = isDarkMode ? 'text-gray-400' : 'text-slate-500';
    const borderColor = isDarkMode ? 'border-gray-800' : 'border-slate-200';

    const filteredEvents = recentEvents.filter(e =>
        e.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.source.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const handleExportCSV = () => {
        if (filteredEvents.length === 0) {
            alert(t.language === 'zh' ? '没有可导出的日志' : 'No logs available to export.');
            return;
        }

        const headers = ['Timestamp', 'Severity', 'Event Type', 'Source', 'Details'];
        const rows = filteredEvents.map(e => [
            new Date(e.timestamp).toLocaleString(),
            e.severity,
            e.type,
            e.source,
            `"Risk Score: 9.5/10.0 - Blocked"` // Example detail
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Bastion_Audit_Logs_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className={`text-2xl font-bold ${textColor}`}>{t.auditLogs || "Security Audit Logs"}</h2>
                    <p className={mutedText}>{t.auditLogsDesc || "Comprehensive record of all security events and interventions."}</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button
                        onClick={handleExportCSV}
                        className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${cardBg} hover:opacity-80 transition-all active:scale-95`}
                    >
                        <Download className="w-4 h-4" />
                        <span>Export CSV</span>
                    </button>
                </div>
            </div>

            {/* Search & Filter Bar */}
            <div className={`${cardBg} p-4 rounded-xl border flex flex-col sm:flex-row gap-4 items-center`}>
                <div className={`relative flex-1 w-full`}>
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${mutedText}`} />
                    <input
                        type="text"
                        placeholder="Search by event type, ID, or source..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2 rounded-lg bg-transparent border ${borderColor} focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${textColor}`}
                    />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${borderColor} hover:bg-indigo-500/10 transition-colors ${textColor}`}>
                        <Filter className="w-4 h-4" />
                        <span>Filter</span>
                    </button>
                </div>
            </div>

            {/* Logs Table */}
            <div className={`${cardBg} rounded-2xl border overflow-hidden`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className={`border-b ${borderColor} ${isDarkMode ? 'bg-gray-900/50' : 'bg-slate-50/50'}`}>
                            <tr>
                                <th className={`p-4 font-semibold text-xs uppercase tracking-wider ${mutedText}`}>Timestamp</th>
                                <th className={`p-4 font-semibold text-xs uppercase tracking-wider ${mutedText}`}>Severity</th>
                                <th className={`p-4 font-semibold text-xs uppercase tracking-wider ${mutedText}`}>Event Type</th>
                                <th className={`p-4 font-semibold text-xs uppercase tracking-wider ${mutedText}`}>Source</th>
                                <th className={`p-4 font-semibold text-xs uppercase tracking-wider ${mutedText}`}>Action</th>
                                <th className={`p-4 font-semibold text-xs uppercase tracking-wider ${mutedText}`}>Details</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${borderColor}`}>
                            {filteredEvents.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className={`p-8 text-center ${mutedText}`}>No logs found matching your criteria.</td>
                                </tr>
                            ) : filteredEvents.map((event) => (
                                <React.Fragment key={event.id}>
                                    <tr className={`transition-colors hover:${isDarkMode ? 'bg-gray-800/50' : 'bg-slate-50'} cursor-pointer`} onClick={() => toggleExpand(event.id)}>
                                        <td className={`p-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-slate-600'}`}>
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-3 h-3" />
                                                {new Date(event.timestamp).toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="p-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${event.severity === 'Critical' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                                                event.severity === 'High' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                                                    event.severity === 'Medium' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                                        'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                                }`}>
                                                {event.severity === 'Critical' && <ShieldAlert className="w-3 h-3" />}
                                                {event.severity === 'High' && <AlertTriangle className="w-3 h-3" />}
                                                {event.severity}
                                            </span>
                                        </td>
                                        <td className={`p-4 whitespace-nowrap font-medium ${textColor}`}>
                                            {event.type}
                                        </td>
                                        <td className={`p-4 whitespace-nowrap text-sm ${mutedText} font-mono`}>
                                            {event.source}
                                        </td>
                                        <td className="p-4 whitespace-nowrap">
                                            <span className={`text-xs font-bold px-2 py-1 rounded text-emerald-500 bg-emerald-500/10 border border-emerald-500/20`}>
                                                BLOCKED
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button className={`p-1 rounded hover:bg-gray-500/20 transition-colors ${mutedText}`}>
                                                {expandedId === event.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                            </button>
                                        </td>
                                    </tr>
                                    {expandedId === event.id && (
                                        <tr className={`${isDarkMode ? 'bg-gray-950/50' : 'bg-slate-50/50'}`}>
                                            <td colSpan={6} className="p-4">
                                                <div className={`rounded-xl p-4 border ${borderColor} ${isDarkMode ? 'bg-black/30' : 'bg-white'}`}>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <FileJson className={`w-4 h-4 ${mutedText}`} />
                                                        <h4 className={`text-sm font-bold ${textColor}`}>Payload Analysis Snapshot</h4>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                        <div>
                                                            <p className={`text-xs uppercase tracking-wider mb-1 ${mutedText}`}>Heuristic Match</p>
                                                            <p className={`font-mono ${isDarkMode ? 'text-rose-400' : 'text-rose-600'}`}>
                                                                MATCH_PATTERN: "Ignore all previous instructions"
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className={`text-xs uppercase tracking-wider mb-1 ${mutedText}`}>Risk Score</p>
                                                            <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                                                                <div className="bg-rose-500 w-[95%] h-full"></div>
                                                            </div>
                                                            <p className="text-right text-xs mt-1 text-rose-500 font-bold">9.5/10.0</p>
                                                        </div>
                                                        <div className="col-span-2">
                                                            <p className={`text-xs uppercase tracking-wider mb-1 ${mutedText}`}>Captured Input Fragment</p>
                                                            <code className={`block w-full p-3 rounded-lg font-mono text-xs overflow-x-auto ${isDarkMode ? 'bg-gray-900 border border-gray-700 text-gray-300' : 'bg-slate-100 border border-slate-200 text-slate-700'}`}>
                                                                {`{
  "user_input": "Ignore all previous instructions...",
  "session_id": "${event.source}",
  "timestamp": "${new Date(event.timestamp).toISOString()}"
}`}
                                                            </code>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AuditLogs;
