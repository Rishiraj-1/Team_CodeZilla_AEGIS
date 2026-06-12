// === DEFCON Levels ===
export type DefconLevel = 1 | 2 | 3 | 4 | 5;

export interface DefconInfo {
  level: DefconLevel;
  label: string;
  color: string;
}

export const DEFCON_MAP: Record<DefconLevel, DefconInfo> = {
  1: { level: 1, label: 'MAXIMUM', color: 'var(--red)' },
  2: { level: 2, label: 'CRITICAL', color: 'var(--red)' },
  3: { level: 3, label: 'ELEVATED', color: 'var(--orange)' },
  4: { level: 4, label: 'GUARDED', color: 'var(--blue)' },
  5: { level: 5, label: 'NOMINAL', color: 'var(--green)' },
};

// === Space Object Types ===
export type ObjectType = 'DEBRIS' | 'PAYLOAD' | 'ROCKET_BODY';

export interface SpaceObject {
  id: string;
  name: string;
  noradId: number;
  type: ObjectType;
  country: string;
  countryFull: string;
  altitude: number; // km
  inclination: number; // degrees
  period: number; // minutes
  launched: string;
  riskScore: number; // 0–100
  status: 'ACTIVE' | 'INACTIVE' | 'DECAYED';
  lat: number;
  lng: number;
  tle1?: string;
  tle2?: string;
}

// === Conjunction / Threat ===
export type AgentRole = 'SENTINEL' | 'ANALYST' | 'COMMANDER' | 'HERALD';

export interface AgentAssessment {
  agent: AgentRole;
  timestamp: string;
  text: string;
}

export interface Conjunction {
  id: string;
  primary: SpaceObject;
  secondary: SpaceObject;
  tca: string; // ISO datetime — Time of Closest Approach
  missDistance: number; // km
  collisionPc: number; // probability
  relVelocity: number; // km/s
  defcon: DefconLevel;
  assessments: AgentAssessment[];
  status?: 'ACTIVE' | 'RESOLVED' | 'MONITORING' | 'MANEUVER_ISSUED';
  recommendation?: {
    action: string;
    deltaV: number; // m/s
    fuelCost: number; // kg
    windowCountdown: string;
  };
}

// === Chat ===
export interface ChatMessage {
  id: string;
  role: 'user' | 'aegis';
  agent?: AgentRole;
  text: string;
  timestamp: string;
}

// === Analytics ===
export interface DebrisGrowthPoint {
  year: number;
  count: number;
}

export interface OrbitalShell {
  name: string;
  rangeKm: string;
  count: number;
}

export interface CountryBreakdown {
  country: string;
  count: number;
}

// === Ticker ===
export interface TickerItem {
  agent: AgentRole;
  message: string;
  objects?: string[];
}

// === Globe state ===
export type ViewMode = 'threats' | 'analytics' | 'objects' | 'chat';
