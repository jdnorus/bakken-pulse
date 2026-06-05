import { getDataClient } from "@/lib/data/client";
import { mapCounty } from "@/lib/data/mappers";
import { mockCounties } from "@/lib/data/mock";
import type { County, DataResult } from "@/lib/types";
import type { CountyRow } from "@/lib/types/database";

export async function getCounties(options?: { limit?: number }): Promise<DataResult<County[]>> {
  const limit = options?.limit ?? 50;
  const client = getDataClient();

  if (!client) {
    return { data: mockCounties.slice(0, limit), source: "mock" };
  }

  const { data, error } = await client
    .from("counties")
    .select("*")
    .order("permits_ytd", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getCounties]", error.message);
    return { data: mockCounties.slice(0, limit), source: "mock" };
  }

  const rows = (data ?? []) as CountyRow[];
  return {
    data: rows.map(mapCounty),
    source: "supabase",
  };
}
