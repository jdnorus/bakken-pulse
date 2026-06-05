import { getDataClient } from "@/lib/data/client";
import { mapAlert } from "@/lib/data/mappers";
import { mockAlerts } from "@/lib/data/mock";
import type { Alert, DataResult } from "@/lib/types";
import type { ActivityEventRow } from "@/lib/types/database";

export async function getAlerts(options?: { limit?: number }): Promise<DataResult<Alert[]>> {
  const limit = options?.limit ?? 50;
  const client = getDataClient();

  if (!client) {
    return { data: mockAlerts.slice(0, limit), source: "mock" };
  }

  const { data, error } = await client
    .from("activity_events")
    .select("*")
    .not("severity", "is", null)
    .order("occurred_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getAlerts]", error.message);
    return { data: mockAlerts.slice(0, limit), source: "mock" };
  }

  const rows = (data ?? []) as ActivityEventRow[];
  return {
    data: rows.map(mapAlert),
    source: "supabase",
  };
}
