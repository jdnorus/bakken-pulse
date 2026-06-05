import type { ActivityEventType, AlertSeverity, RiskLevel } from "./database";

export type DataSource = "supabase" | "mock";

export interface DataResult<T> {
  data: T;
  source: DataSource;
}

export interface Permit {
  id: string;
  externalId: string;
  operatorId: string | null;
  operatorName: string;
  wellName: string;
  countyName: string;
  permitType: string;
  status: string;
  filedAt: string;
}

export interface Operator {
  id: string;
  externalId: string | null;
  name: string;
  permitsYtd: number;
  rigs: number;
  hq: string | null;
  focus: string | null;
  isActive: boolean;
}

export interface County {
  id: string;
  name: string;
  permitsYtd: number;
  rigs: number;
  medianCycleDays: number | null;
  topOperatorName: string | null;
  /** Computed for dashboard bar charts */
  sharePct?: number;
}

export interface ActivityEvent {
  id: string;
  title: string;
  detail: string;
  countyName: string;
  eventType: ActivityEventType;
  occurredAt: string;
}

export interface Alert {
  id: string;
  title: string;
  body: string;
  countyName: string;
  severity: AlertSeverity;
  createdAt: string;
}

export interface RiskSummary {
  id: string;
  headline: string;
  bullets: string[];
  riskLevel: RiskLevel;
  generatedAt: string;
}

export interface DashboardStats {
  permitsThisWeek: number;
  permitsWeekChangePct: number | null;
  activeOperators: number;
  operatorsChange: number | null;
  activeRigs: number;
}

export interface DashboardData {
  stats: DashboardStats;
  topCounties: County[];
  latestActivity: ActivityEvent[];
  riskSummary: RiskSummary;
}
