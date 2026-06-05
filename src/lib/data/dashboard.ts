import { getDataClient } from "@/lib/data/client";
import { mapCounty, withCountySharePct } from "@/lib/data/mappers";
import { getMockDashboard } from "@/lib/data/mock";
import { getActivityEvents } from "@/lib/data/activity-events";
import { getCurrentRiskSummary } from "@/lib/data/risk-summaries";
import type { DashboardData, DashboardStats, DataResult } from "@/lib/types";
import type { CountyRow, OperatorRow } from "@/lib/types/database";

function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function computeStatsFromSupabase(): Promise<DashboardStats> {
  const client = getDataClient();
  if (!client) {
    return getMockDashboard().stats;
  }

  const now = new Date();
  const thisWeekStart = startOfWeek(now);
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(thisWeekStart);
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);

  const thisWeekIso = toDateString(thisWeekStart);
  const lastWeekStartIso = toDateString(lastWeekStart);
  const lastWeekEndIso = toDateString(lastWeekEnd);

  const [thisWeekRes, lastWeekRes, operatorsRes, countiesRes] = await Promise.all([
    client
      .from("permits")
      .select("id", { count: "exact", head: true })
      .gte("filed_at", thisWeekIso),
    client
      .from("permits")
      .select("id", { count: "exact", head: true })
      .gte("filed_at", lastWeekStartIso)
      .lte("filed_at", lastWeekEndIso),
    client.from("operators").select("id, rigs").eq("is_active", true),
    client.from("counties").select("rigs"),
  ]);

  const permitsThisWeek = thisWeekRes.count ?? 0;
  const permitsLastWeek = lastWeekRes.count ?? 0;
  const operators = (operatorsRes.data ?? []) as Pick<OperatorRow, "id" | "rigs">[];
  const counties = (countiesRes.data ?? []) as Pick<CountyRow, "rigs">[];
  const activeOperators = operators.length;
  const activeRigs =
    operators.reduce((sum, o) => sum + (o.rigs ?? 0), 0) ||
    counties.reduce((sum, c) => sum + (c.rigs ?? 0), 0) ||
    0;

  let permitsWeekChangePct: number | null = null;
  if (permitsLastWeek > 0) {
    permitsWeekChangePct = Math.round(
      ((permitsThisWeek - permitsLastWeek) / permitsLastWeek) * 100,
    );
  }

  return {
    permitsThisWeek,
    permitsWeekChangePct,
    activeOperators,
    operatorsChange: null,
    activeRigs,
  };
}

export async function getDashboard(): Promise<DataResult<DashboardData>> {
  const client = getDataClient();

  if (!client) {
    const mock = getMockDashboard();
    return { data: mock, source: "mock" };
  }

  const [stats, countiesRes, activityRes, riskRes] = await Promise.all([
    computeStatsFromSupabase(),
    client.from("counties").select("*").order("permits_ytd", { ascending: false }).limit(5),
    getActivityEvents({ limit: 5 }),
    getCurrentRiskSummary(),
  ]);

  if (countiesRes.error) {
    console.error("[getDashboard] counties", countiesRes.error.message);
    const mock = getMockDashboard();
    return { data: mock, source: "mock" };
  }

  const countyRows = (countiesRes.data ?? []) as CountyRow[];
  const topCounties = withCountySharePct(countyRows.map(mapCounty), 5);
  const riskSummary =
    riskRes.data ??
    ({
      id: "empty",
      headline: "No capacity risk summary on file",
      bullets: ["Run ingest or add a current risk_summaries row."],
      riskLevel: "moderate" as const,
      generatedAt: new Date().toISOString(),
    });

  return {
    data: {
      stats,
      topCounties,
      latestActivity: activityRes.data,
      riskSummary,
    },
    source: "supabase",
  };
}
