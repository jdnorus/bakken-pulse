import { getDataClient } from "@/lib/data/client";
import { mapRiskSummary } from "@/lib/data/mappers";
import { getMockDashboard } from "@/lib/data/mock";
import type { DataResult, RiskSummary } from "@/lib/types";
import type { RiskSummaryRow } from "@/lib/types/database";

export async function getCurrentRiskSummary(): Promise<DataResult<RiskSummary | null>> {
  const client = getDataClient();

  if (!client) {
    return { data: getMockDashboard().riskSummary, source: "mock" };
  }

  const { data, error } = await client
    .from("risk_summaries")
    .select("*")
    .eq("is_current", true)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[getCurrentRiskSummary]", error.message);
    return { data: getMockDashboard().riskSummary, source: "mock" };
  }

  if (!data) {
    const latest = await client
      .from("risk_summaries")
      .select("*")
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latest.error || !latest.data) {
      return { data: null, source: "supabase" };
    }
    return { data: mapRiskSummary(latest.data as RiskSummaryRow), source: "supabase" };
  }

  return { data: mapRiskSummary(data as RiskSummaryRow), source: "supabase" };
}
