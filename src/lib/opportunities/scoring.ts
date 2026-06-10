import type { Operator, Permit } from "@/lib/types";
import type {
  ConfidenceLevel,
  DemandCategory,
  OpportunitiesData,
  OpportunitiesSummary,
  ServiceOpportunity,
} from "@/lib/opportunities/types";
import { DEMAND_CATEGORIES } from "@/lib/opportunities/types";

/** Deterministic 0–1 noise from a string seed (mock AI signal). */
function seedNoise(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return (h % 1000) / 1000;
}

function daysSince(isoDate: string): number {
  const filed = new Date(isoDate).getTime();
  if (Number.isNaN(filed)) return 365;
  return Math.max(0, (Date.now() - filed) / (1000 * 60 * 60 * 24));
}

function statusMultiplier(status: string): number {
  const s = status.toLowerCase();
  if (s.includes("drill") || s === "drl") return 1;
  if (s.includes("approved")) return 0.85;
  if (s.includes("review")) return 0.65;
  return 0.5;
}

function categoryWeightsForPermit(
  permit: Permit,
): Record<DemandCategory, number> {
  const status = statusMultiplier(permit.status);
  const type = permit.permitType.toLowerCase();
  const isDrilling = type.includes("drill") || type.includes("oil");
  const isRecomplete = type.includes("recomp");
  const recency = Math.max(0.4, 1 - daysSince(permit.filedAt) / 120);
  const base = status * recency;

  return {
    Welding: clamp(base * (isDrilling ? 0.72 : 0.45) + seedNoise(permit.id + "weld") * 0.15),
    "Dirt work": clamp(base * (isDrilling ? 0.95 : 0.55) + seedNoise(permit.id + "dirt") * 0.12),
    "Water hauling": clamp(base * (isDrilling ? 0.88 : 0.5) + seedNoise(permit.id + "water") * 0.14),
    Electrical: clamp(base * (isDrilling ? 0.7 : 0.6) + seedNoise(permit.id + "elec") * 0.13),
    Rentals: clamp(base * (isDrilling ? 0.92 : 0.48) + seedNoise(permit.id + "rent") * 0.1),
    "Safety services": clamp(base * 0.8 + seedNoise(permit.id + "safe") * 0.12),
  };
}

function categoryWeightsForOperator(
  operator: Operator,
  countyPermitDensity: number,
): Record<DemandCategory, number> {
  const activity = Math.min(1, operator.permitsYtd / 40);
  const rigs = Math.min(1, operator.rigs / 8);
  const density = Math.min(1, countyPermitDensity / 20);
  const base = clamp(activity * 0.5 + rigs * 0.35 + density * 0.15);

  return {
    Welding: clamp(base * 0.7 + seedNoise(operator.id + "weld") * 0.2),
    "Dirt work": clamp(base * 0.85 + seedNoise(operator.id + "dirt") * 0.15),
    "Water hauling": clamp(base * 0.8 + seedNoise(operator.id + "water") * 0.18),
    Electrical: clamp(base * 0.65 + seedNoise(operator.id + "elec") * 0.15),
    Rentals: clamp(base * 0.9 + seedNoise(operator.id + "rent") * 0.12),
    "Safety services": clamp(base * 0.75 + seedNoise(operator.id + "safe") * 0.15),
  };
}

function clamp(n: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, n));
}

function toScore(weight: number): number {
  return Math.round(clamp(weight) * 100);
}

function toConfidence(score: number, recencyDays?: number): ConfidenceLevel {
  if (score >= 75 && (recencyDays === undefined || recencyDays <= 45)) return "high";
  if (score >= 50) return "medium";
  return "low";
}

function rationaleForPermit(permit: Permit, category: DemandCategory, score: number): string {
  return `Mock model: ${category} demand inferred from ${permit.status} status, ${permit.permitType} permit type, and ${permit.filedAt} filing date (score ${score}).`;
}

function rationaleForOperator(operator: Operator, category: DemandCategory, score: number): string {
  return `Mock model: ${category} demand inferred from ${operator.permitsYtd} YTD permits and ${operator.rigs} active rig proxy (score ${score}).`;
}

function scorePermit(permit: Permit): ServiceOpportunity[] {
  const weights = categoryWeightsForPermit(permit);
  const recency = daysSince(permit.filedAt);

  return DEMAND_CATEGORIES.map((category) => {
    const opportunityScore = toScore(weights[category]);
    return {
      id: `permit-${permit.id}-${category.toLowerCase().replace(/\s+/g, "-")}`,
      entityType: "permit" as const,
      entityId: permit.id,
      entityLabel: permit.wellName,
      operatorName: permit.operatorName,
      countyName: permit.countyName,
      demandCategory: category,
      opportunityScore,
      confidence: toConfidence(opportunityScore, recency),
      rationale: rationaleForPermit(permit, category, opportunityScore),
    };
  }).filter((o) => o.opportunityScore >= 40);
}

function scoreOperator(
  operator: Operator,
  countyName: string,
  countyPermitCount: number,
): ServiceOpportunity[] {
  const weights = categoryWeightsForOperator(operator, countyPermitCount);

  return DEMAND_CATEGORIES.map((category) => {
    const opportunityScore = toScore(weights[category]);
    return {
      id: `operator-${operator.id}-${category.toLowerCase().replace(/\s+/g, "-")}`,
      entityType: "operator" as const,
      entityId: operator.id,
      entityLabel: operator.name,
      operatorName: operator.name,
      countyName,
      demandCategory: category,
      opportunityScore,
      confidence: toConfidence(opportunityScore),
      rationale: rationaleForOperator(operator, category, opportunityScore),
    };
  }).filter((o) => o.opportunityScore >= 45);
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

export function scoreOpportunitiesFromActivity(
  permits: Permit[],
  operators: Operator[],
): OpportunitiesData {
  const countyPermitCounts = new Map<string, number>();
  for (const p of permits) {
    countyPermitCounts.set(p.countyName, (countyPermitCounts.get(p.countyName) ?? 0) + 1);
  }

  const permitOpps = permits.flatMap(scorePermit);

  const operatorOpps = operators.flatMap((op) => {
    const focusCounty = op.focus?.split("/")[0]?.trim() ?? "McKenzie";
    const county =
      [...countyPermitCounts.keys()].find(
        (c) => c.toLowerCase() === focusCounty.toLowerCase(),
      ) ?? focusCounty;
    return scoreOperator(op, county, countyPermitCounts.get(county) ?? op.permitsYtd);
  });

  const opportunities = [...permitOpps, ...operatorOpps]
    .sort((a, b) => b.opportunityScore - a.opportunityScore)
    .slice(0, 120);

  return {
    opportunities,
    summary: buildSummary(opportunities),
  };
}

/** Fallback when no permit/operator rows are available. */
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
