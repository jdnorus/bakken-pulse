import { NextRequest } from "next/server";

import { runNdOilGasIngest } from "@/lib/ingest/ndOilGas";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
/** Allow long-running ingest on supported hosts (Vercel Pro). */
export const maxDuration = 300;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  // Optional query token for simple local cron: curl "...?token=..."
  const queryToken = request.nextUrl.searchParams.get("token");
  return queryToken === secret;
}

export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET?.trim()) {
    return Response.json(
      { ok: false, error: "CRON_SECRET is not configured on this deployment" },
      { status: 503 },
    );
  }

  if (!isAuthorized(request)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const client = createAdminSupabaseClient();
  if (!client) {
    return Response.json(
      { ok: false, error: "Supabase credentials are not configured" },
      { status: 503 },
    );
  }

  const lookbackParam = request.nextUrl.searchParams.get("lookback-days");
  const lookbackDays = lookbackParam ? Number.parseInt(lookbackParam, 10) : undefined;

  const result = await runNdOilGasIngest(client, {
    lookbackDays: Number.isFinite(lookbackDays) && lookbackDays! > 0 ? lookbackDays : undefined,
  });

  return Response.json(result, { status: result.ok ? 200 : 500 });
}
