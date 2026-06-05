import { getDataClient } from "@/lib/data/client";
import { mapActivityEvent } from "@/lib/data/mappers";
import { getMockDashboard } from "@/lib/data/mock";
import type { ActivityEvent, DataResult } from "@/lib/types";
import type { ActivityEventRow } from "@/lib/types/database";

export async function getActivityEvents(options?: {
  limit?: number;
  alertsOnly?: boolean;
}): Promise<DataResult<ActivityEvent[]>> {
  const limit = options?.limit ?? 20;
  const client = getDataClient();

  if (!client) {
    const feed = options?.alertsOnly
      ? []
      : getMockDashboard().latestActivity;
    return { data: feed.slice(0, limit), source: "mock" };
  }

  let query = client
    .from("activity_events")
    .select("*")
    .order("occurred_at", { ascending: false });

  if (options?.alertsOnly) {
    query = query.not("severity", "is", null);
  } else {
    query = query.is("severity", null);
  }

  const { data, error } = await query.limit(limit);

  if (error) {
    console.error("[getActivityEvents]", error.message);
    const feed = options?.alertsOnly ? [] : getMockDashboard().latestActivity;
    return { data: feed.slice(0, limit), source: "mock" };
  }

  const rows = (data ?? []) as ActivityEventRow[];
  return {
    data: rows.map(mapActivityEvent),
    source: "supabase",
  };
}
