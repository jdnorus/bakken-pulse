export type ActivityEventType =
  | "permit"
  | "spud"
  | "completion"
  | "regulatory"
  | "logistics";

export type AlertSeverity = "info" | "warning" | "critical";

export type RiskLevel = "low" | "moderate" | "elevated" | "critical";

export interface OperatorRow {
  id: string;
  external_id: string | null;
  name: string;
  hq: string | null;
  focus_areas: string | null;
  permits_ytd: number;
  rigs: number;
  is_active: boolean;
  source_system: string;
  source_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CountyRow {
  id: string;
  name: string;
  permits_ytd: number;
  rigs: number;
  median_cycle_days: number | null;
  top_operator_name: string | null;
  source_system: string;
  source_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PermitRow {
  id: string;
  external_id: string;
  operator_id: string | null;
  operator_name: string;
  well_name: string;
  county_id: string | null;
  county_name: string;
  permit_type: string;
  status: string;
  filed_at: string;
  source_system: string;
  source_record_id: string | null;
  source_payload: Record<string, unknown> | null;
  source_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityEventRow {
  id: string;
  title: string;
  detail: string;
  body: string | null;
  county_name: string;
  event_type: ActivityEventType;
  severity: AlertSeverity | null;
  occurred_at: string;
  permit_id: string | null;
  operator_id: string | null;
  source_system: string;
  source_record_id: string | null;
  created_at: string;
}

export interface RiskSummaryRow {
  id: string;
  headline: string;
  bullets: string[];
  risk_level: RiskLevel;
  generated_at: string;
  is_current: boolean;
  source_system: string;
  created_at: string;
}

type TableDef<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      operators: TableDef<OperatorRow>;
      counties: TableDef<CountyRow>;
      permits: TableDef<PermitRow>;
      activity_events: TableDef<ActivityEventRow>;
      risk_summaries: TableDef<RiskSummaryRow>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      activity_event_type: ActivityEventType;
      alert_severity: AlertSeverity;
      risk_level: RiskLevel;
    };
    CompositeTypes: Record<string, never>;
  };
}
