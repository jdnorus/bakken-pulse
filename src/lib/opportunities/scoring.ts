import type { Operator, Permit } from "@/lib/types";
import type {
  ConfidenceLevel,
  DemandCategory,
  OpportunitiesData,
  OpportunitiesSummary,
  ServiceOpportunity,
} from "@/lib/opportunities/types";
import { DEMAND_CATEGORIES } from "@/lib/opportunities/types";

/** Category demand coefficients by operational context (field-services model). */
const PERMIT_CATEGORY_WEIGHTS: Record<
  DemandCategory,
  { drilling: number; completion: number; default: number }
> = {
  Welding: { drilling: 0.62, completion: 0.78, default: 0.45 },
  "Dirt work": { drilling: 0.95, completion: 0.55, default: 0.4 },
  "Water hauling": { drilling: 0.9, completion: 0.5, default: 0.35 },
  Electrical: { drilling: 0.72, completion: 0.68, default: 0.5 },
  Rentals: { drilling: 0.88, completion: 0.42, default: 0.38 },
  "Safety services": { drilling: 0.8, completion: 0.7, default: 0.55 },
};

const OPERATOR_CATEGORY_WEIGHTS: Record<DemandCategory, number> = {
  Welding: 0.68,
  "Dirt work": 0.82,
  "Water hauling": 0.76,
  Electrical: 0.64,
  Rentals: 0.86,
  "Safety services": 0.74,
};

function clamp(n: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, n));
}

function daysSince(isoDate: string): number {
  const filed = new Date(isoDate).getTime();
  if (Number.isNaN(filed)) return 365;
  return Math.max(0, (Date.now() - filed) / (1000 * 60 * 60 * 24));
}

function recencyScore(days: number): number {
  if (days <= 7) return 1;
  if (days <= 30) return 0.85;
  if (days <= 60) return 0.65;
  if (days <= 90) return 0.45;
  return 0.25;
}

function statusIntensity(status: string): number {
  const s = status.toLowerCase();
  if (s.includes("drill") || s === "drl") return 1;
  if (s.includes("approved")) return 0.82;
  if (s.includes("review")) return 0.6;
  if (s.includes("bond")) return 0.5;
  return 0.4;
}

function permitContext(permit: Permit): "drilling" | "completion" | "default" {
  const type = permit.permitType.toLowerCase();
  const status = permit.status.toLowerCase();
  if (type.includes("recomp") || status.includes("complet")) return "completion";
  if (type.includes("drill") || type.includes("oil") || status.includes("drill") || status === "drl") {
    return "drilling";
  }
  return "default";
}

function toConfidence(
  score: number,
  signalStrength: number,
  recencyDays: number,
): ConfidenceLevel {
  if (score >= 72 && signalStrength >= 0.65 && recencyDays <= 45) return "high";
  if (score >= 48 && signalStrength >= 0.4) return "medium";
  return "low";
}

function buildCountyHeat(countyPermitCounts: Map<string, number>): Map<string, number> {
  const max = Math.max(1, ...countyPermitCounts.values());
  const heat = new Map<string, number>();
  for (const [county, count] of countyPermitCounts) {
    heat.set(county, count / max);
  }
  return heat;
}

function operatorPrimaryCounty(
  operator: Operator,
  permits: Permit[],
  countyHeat: Map<string, number>,
): string {
  const byCounty = new Map<string, number>();
  for (const p of permits) {
    if (p.operatorName === operator.name) {
      byCounty.set(p.countyName, (byCounty.get(p.countyName) ?? 0) + 1);
    }
  }
  if (byCounty.size > 0) {
    return [...byCounty.entries()].sort((a, b) => b[1] - a[1])[0]![0];
  }
  const focus = operator.focus?.split("/")[0]?.trim();
  if (focus) return focus;
  return [...countyHeat.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "McKenzie";
}

function latestOperatorActivity(operator: Operator, permits: Permit[]): string {
  const dates = permits
    .filter((p) => p.operatorName === operator.name)
    .map((p) => p.filedAt)
    .sort()
    .reverse();
  if (dates[0]) return `${dates[0]}T12:00:00.000Z`;
  return new Date().toISOString();
}

function scorePermit(
  permit: Permit,
  countyHeat: number,
): { opportunities: ServiceOpportunity[]; signals: Record<DemandCategory, number> } {
  const ctx = permitContext(permit);
  const recencyDays = daysSince(permit.filedAt);
  const recency = recencyScore(recencyDays);
  const status = statusIntensity(permit.status);
  const heat = countyHeat;

  const opportunities: ServiceOpportunity[] = [];
  const signals: Record<DemandCategory, number> = {} as Record<DemandCategory, number>;

  for (const category of DEMAND_CATEGORIES) {
    const coef = PERMIT_CATEGORY_WEIGHTS[category][ctx];
    const signalStrength = clamp(recency * 0.4 + status * 0.35 + heat * 0.25);
    signals[category] = signalStrength;

    const raw = signalStrength * coef;
    const opportunityScore = Math.round(clamp(raw) * 100);
    const confidence = toConfidence(opportunityScore, signalStrength, recencyDays);

    opportunities.push({
      id: `permit-${permit.id}-${category.toLowerCase().replace(/\s+/g, "-")}`,
      entityType: "permit",
      entityId: permit.id,
      entityLabel: permit.wellName,
      operatorName: permit.operatorName,
      countyName: permit.countyName,
      demandCategory: category,
      opportunityScore,
      confidence,
      activityAt: `${permit.filedAt}T12:00:00.000Z`,
      signalStrength: Math.round(signalStrength * 100) / 100,
      rationale: `Activity model: ${category} demand from ${permit.status} permit in ${permit.countyName} (filed ${permit.filedAt}). Signals — recency ${Math.round(recency * 100)}%, status ${Math.round(status * 100)}%, county heat ${Math.round(heat * 100)}%.`,
    });
  }

  return { opportunities, signals };
}

function scoreOperator(
  operator: Operator,
  countyName: string,
  countyHeat: number,
  permits: Permit[],
): ServiceOpportunity[] {
  const activityScale = clamp(operator.permitsYtd / 50);
  const rigScale = clamp(operator.rigs / 10);
  const heat = countyHeat;
  const activityAt = latestOperatorActivity(operator, permits);
  const recencyDays = daysSince(activityAt.slice(0, 10));

  return DEMAND_CATEGORIES.map((category) => {
    const coef = OPERATOR_CATEGORY_WEIGHTS[category];
    const signalStrength = clamp(activityScale * 0.45 + rigScale * 0.35 + heat * 0.2);
    const raw = signalStrength * coef;
    const opportunityScore = Math.round(clamp(raw) * 100);
    const confidence = toConfidence(opportunityScore, signalStrength, recencyDays);

    return {
      id: `operator-${operator.id}-${category.toLowerCase().replace(/\s+/g, "-")}`,
      entityType: "operator" as const,
      entityId: operator.id,
      entityLabel: operator.name,
      operatorName: operator.name,
      countyName,
      demandCategory: category,
      opportunityScore,
      confidence,
      activityAt,
      signalStrength: Math.round(signalStrength * 100) / 100,
      rationale: `Activity model: ${category} demand from operator footprint — ${operator.permitsYtd} permits YTD, ${operator.rigs} rigs, ${countyName} county heat ${Math.round(heat * 100)}%.`,
    };
  });
}

function buildSummary(opportunities: ServiceOpportunity[]): OpportunitiesSummary {
  const byCategory: OpportunitiesSummary["byCategory"] = {};
  let scoreSum = 0;
  let highConfidence = 0;

  for (const o of opportunities) {
    byCategory[o.demandCategory] = (byCategory[o.demandCategory] ?? 0) + 1;
    scoreSum += o.opportunityScore;
    if (o.confidence === "high") highConfidence += 1;
  }

  return {
    total: opportunities.length,
    byCategory,
    avgScore: opportunities.length ? Math.round(scoreSum / opportunities.length) : 0,
    highConfidence,
  };
}

/**
 * Scores service demand from real permit and operator activity.
 * Weighted field-services model — no random/mock seeding.
 */
export function scoreOpportunitiesFromActivity(
  permits: Permit[],
  operators: Operator[],
): OpportunitiesData {
  const countyPermitCounts = new Map<string, number>();
  for (const p of permits) {
    countyPermitCounts.set(p.countyName, (countyPermitCounts.get(p.countyName) ?? 0) + 1);
  }
  const countyHeat = buildCountyHeat(countyPermitCounts);

  const permitOpps = permits.flatMap((p) => {
    const heat = countyHeat.get(p.countyName) ?? 0.3;
    return scorePermit(p, heat).opportunities;
  });

  const operatorOpps = operators.flatMap((op) => {
    const county = operatorPrimaryCounty(op, permits, countyHeat);
    const heat = countyHeat.get(county) ?? 0.3;
    return scoreOperator(op, county, heat, permits);
  });

  const opportunities = [...permitOpps, ...operatorOpps].sort(
    (a, b) => b.opportunityScore - a.opportunityScore,
  );

  return {
    opportunities,
    summary: buildSummary(opportunities),
  };
}

export function mockOpportunities(): OpportunitiesData {
  const mockPermits: Permit[] = [
    {
      id: "mock-p1",
      externalId: "ND-26-08421",
      operatorId: null,
      operatorName: "Continental Resources",
      wellName: "Hawkeye Federal 5-32H",
      countyName: "McKenzie",
      permitType: "Oil & Gas",
      status: "Drilling",
      filedAt: new Date().toISOString().slice(0, 10),
    },
    {
      id: "mock-p2",
      externalId: "ND-26-08407",
      operatorId: null,
      operatorName: "Hess Corporation",
      wellName: "Elm Coulee 12-24H",
      countyName: "Williams",
      permitType: "Oil & Gas",
      status: "Approved",
      filedAt: new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10),
    },
  ];

  const mockOperators: Operator[] = [
    {
      id: "mock-op-1",
      externalId: "op-continental",
      name: "Continental Resources",
      permitsYtd: 62,
      rigs: 8,
      hq: "Oklahoma City, OK",
      focus: "McKenzie / Williams",
      isActive: true,
    },
  ];

  return scoreOpportunitiesFromActivity(mockPermits, mockOperators);
}
