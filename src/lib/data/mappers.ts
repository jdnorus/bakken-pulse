import type {
  ActivityEventRow,
  CountyRow,
  OperatorRow,
  PermitRow,
  RiskSummaryRow,
} from "@/lib/types/database";
import type {
  ActivityEvent,
  Alert,
  County,
  Operator,
  Permit,
  RiskSummary,
} from "@/lib/types/domain";

export function mapPermit(row: PermitRow): Permit {
  return {
    id: row.id,
    externalId: row.external_id,
    operatorId: row.operator_id,
    operatorName: row.operator_name,
    wellName: row.well_name,
    countyName: row.county_name,
    permitType: row.permit_type,
    status: row.status,
    filedAt: row.filed_at,
  };
}

export function mapOperator(row: OperatorRow): Operator {
  return {
    id: row.id,
    externalId: row.external_id,
    name: row.name,
    permitsYtd: row.permits_ytd,
    rigs: row.rigs,
    hq: row.hq,
    focus: row.focus_areas,
    isActive: row.is_active,
  };
}

export function mapCounty(row: CountyRow): County {
  return {
    id: row.id,
    name: row.name,
    permitsYtd: row.permits_ytd,
    rigs: row.rigs,
    medianCycleDays: row.median_cycle_days,
    topOperatorName: row.top_operator_name,
  };
}

export function mapActivityEvent(row: ActivityEventRow): ActivityEvent {
  return {
    id: row.id,
    title: row.title,
    detail: row.detail,
    countyName: row.county_name,
    eventType: row.event_type,
    occurredAt: row.occurred_at,
  };
}

export function mapAlert(row: ActivityEventRow): Alert {
  return {
    id: row.id,
    title: row.title,
    body: row.body ?? row.detail,
    countyName: row.county_name,
    severity: row.severity!,
    createdAt: row.occurred_at,
  };
}

export function mapRiskSummary(row: RiskSummaryRow): RiskSummary {
  const bullets = Array.isArray(row.bullets) ? row.bullets : [];
  return {
    id: row.id,
    headline: row.headline,
    bullets,
    riskLevel: row.risk_level,
    generatedAt: row.generated_at,
  };
}

export function withCountySharePct(counties: County[], limit = 5): County[] {
  const sorted = [...counties].sort((a, b) => b.permitsYtd - a.permitsYtd).slice(0, limit);
  const total = sorted.reduce((sum, c) => sum + c.permitsYtd, 0) || 1;
  return sorted.map((c) => ({
    ...c,
    sharePct: Math.round((c.permitsYtd / total) * 100),
  }));
}
