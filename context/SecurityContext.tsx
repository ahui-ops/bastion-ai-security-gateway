
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface SecurityEvent {
    id: string;
    type: string;
    source: string;
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
    timestamp: Date;
}

interface SecurityContextType {
    totalScanned: number;
    threatsPrevented: number;
    highRiskAlerts: number;
    recentEvents: SecurityEvent[];
    incrementScanned: () => void;
    addThreat: (type: string, source: string, severity: 'Critical' | 'High' | 'Medium' | 'Low') => void;
    resetStats: () => void;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const SecurityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Load from local storage or start with some baseline "historical" data for realism
    const [totalScanned, setTotalScanned] = useState(2400000);
    const [threatsPrevented, setThreatsPrevented] = useState(1284);
    const [highRiskAlerts, setHighRiskAlerts] = useState(42);
    const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([
        { id: '1', type: 'Prompt Injection', source: 'API-User-8821', severity: 'Critical', timestamp: new Date(Date.now() - 1000 * 60 * 2) },
        { id: '2', type: 'Privilege Abuse', source: 'Support-Agent-X', severity: 'Medium', timestamp: new Date(Date.now() - 1000 * 60 * 14) },
        { id: '3', type: 'Memory Poisoning', source: 'Web-RAG-Crawler', severity: 'High', timestamp: new Date(Date.now() - 1000 * 60 * 45) },
    ]);

    const incrementScanned = () => {
        setTotalScanned(prev => prev + 1);
    };

    const addThreat = (type: string, source: string, severity: 'Critical' | 'High' | 'Medium' | 'Low') => {
        setTotalScanned(prev => prev + 1);
        setThreatsPrevented(prev => prev + 1);
        if (severity === 'High' || severity === 'Critical') {
            setHighRiskAlerts(prev => prev + 1);
        }

        const newEvent: SecurityEvent = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            source,
            severity,
            timestamp: new Date()
        };

        setRecentEvents(prev => [newEvent, ...prev].slice(0, 10)); // Keep last 10
    };

    const resetStats = () => {
        // Optional: reset to baseline
    };

    return (
        <SecurityContext.Provider value={{ totalScanned, threatsPrevented, highRiskAlerts, recentEvents, incrementScanned, addThreat, resetStats }}>
            {children}
        </SecurityContext.Provider>
    );
};

export const useSecurityStats = () => {
    const context = useContext(SecurityContext);
    if (context === undefined) {
        throw new Error('useSecurityStats must be used within a SecurityProvider');
    }
    return context;
};
