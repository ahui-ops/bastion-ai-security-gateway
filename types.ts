
export enum SecurityView {
  DASHBOARD = 'DASHBOARD',
  STATIC_SCAN = 'STATIC_SCAN',
  LIVE_GUARD = 'LIVE_GUARD',
  ATTACK_SIMULATOR = 'ATTACK_SIMULATOR',
  AUDIT_LOGS = 'AUDIT_LOGS'
}

export enum ThreatType {
  PROMPT_INJECTION = 'PROMPT_INJECTION',
  INDIRECT_INJECTION = 'INDIRECT_INJECTION',
  MEMORY_POISONING = 'MEMORY_POISONING',
  PRIVILEGE_ABUSE = 'PRIVILEGE_ABUSE',
  SECRET_LEAK = 'SECRET_LEAK'
}

export enum ThreatLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface SecurityFinding {
  id: string;
  type: ThreatType;
  level: ThreatLevel;
  title: string;
  description: string;
  evidence: string;
  remediation: string;
  fixed?: boolean;
}

export interface GuardrailEvent {
  timestamp: string;
  input: string;
  riskScore: number;
  blocked: boolean;
  reason: string;
}

export interface ToolAudit {
  name: string;
  description: string;
  risk: 'READ_ONLY' | 'HIGH_RISK_WRITE';
  status: 'ALLOWED' | 'SUSPENDED' | 'DENIED';
}
