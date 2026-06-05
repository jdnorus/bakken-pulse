import { getDataClient } from "@/lib/data/client";
import { mapOperator } from "@/lib/data/mappers";
import { mockOperators } from "@/lib/data/mock";
import type { DataResult, Operator } from "@/lib/types";
import type { OperatorRow } from "@/lib/types/database";

export async function getOperators(options?: {
  limit?: number;
  activeOnly?: boolean;
}): Promise<DataResult<Operator[]>> {
  const limit = options?.limit ?? 100;
  const client = getDataClient();

  if (!client) {
    const data = options?.activeOnly
      ? mockOperators.filter((o) => o.isActive)
      : mockOperators;
    return { data: data.slice(0, limit), source: "mock" };
  }

  let query = client.from("operators").select("*").order("permits_ytd", { ascending: false });

  if (options?.activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query.limit(limit);

  if (error) {
    console.error("[getOperators]", error.message);
    return { data: mockOperators.slice(0, limit), source: "mock" };
  }

  const rows = (data ?? []) as OperatorRow[];
  return {
    data: rows.map(mapOperator),
    source: "supabase",
  };
}
