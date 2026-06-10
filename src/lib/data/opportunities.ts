import { dataSourceLabel } from "@/lib/data/config";
import { getOperators } from "@/lib/data/operators";
import { getPermits } from "@/lib/data/permits";
import {
  mockOpportunities,
  scoreOpportunitiesFromActivity,
} from "@/lib/opportunities/scoring";
import type { OpportunitiesData } from "@/lib/opportunities/types";
import type { DataResult } from "@/lib/types";

export async function getOpportunities(): Promise<DataResult<OpportunitiesData>> {
  const [permitsResult, operatorsResult] = await Promise.all([
    getPermits({ limit: 100 }),
    getOperators({ limit: 50, activeOnly: true }),
  ]);

  const source =
    permitsResult.source === "supabase" || operatorsResult.source === "supabase"
      ? "supabase"
      : "mock";

  const permits = permitsResult.data;
  const operators = operatorsResult.data;

  if (permits.length === 0 && operators.length === 0) {
    return { data: mockOpportunities(), source: "mock" };
  }

  const data = scoreOpportunitiesFromActivity(permits, operators);
  if (data.opportunities.length === 0) {
    return { data: mockOpportunities(), source: "mock" };
  }

  return { data, source };
}

export { dataSourceLabel };
