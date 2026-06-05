import { getDataClient } from "@/lib/data/client";
import { mapPermit } from "@/lib/data/mappers";
import { mockPermits } from "@/lib/data/mock";
import type { DataResult, Permit } from "@/lib/types";
import type { PermitRow } from "@/lib/types/database";

export async function getPermits(options?: { limit?: number }): Promise<DataResult<Permit[]>> {
  const limit = options?.limit ?? 50;
  const client = getDataClient();

  if (!client) {
    return { data: mockPermits.slice(0, limit), source: "mock" };
  }

  const { data, error } = await client
    .from("permits")
    .select("*")
    .order("filed_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getPermits]", error.message);
    return { data: mockPermits.slice(0, limit), source: "mock" };
  }

  const rows = (data ?? []) as PermitRow[];
  return {
    data: rows.map(mapPermit),
    source: "supabase",
  };
}
