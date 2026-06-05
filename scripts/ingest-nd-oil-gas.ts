import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/** Load .env.local when present (local dev). CI passes env via workflow secrets. */
function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;

  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvLocal();

/**
 * CLI: ingest recent ND Oil & Gas well activity into Supabase.
 *
 * Usage:
 *   npm run ingest:nd
 *   npm run ingest:nd -- --lookback-days=60
 *
 * Scheduled options:
 *   - GitHub Actions: .github/workflows/ingest-nd.yml (hourly)
 *   - Vercel Cron: vercel.json → GET /api/cron/ingest-nd (hourly)
 *   - Local macOS/Linux: scripts/cron-ingest-hourly.sh via crontab
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (recommended)
 * or NEXT_PUBLIC_SUPABASE_ANON_KEY if RLS allows writes.
 */
import { runNdOilGasIngest } from "../src/lib/ingest/ndOilGas";
import { createAdminSupabaseClient } from "../src/lib/supabase/admin";
import {
  getSupabaseAnonKey,
  getSupabaseServiceKey,
  getSupabaseUrl,
} from "../src/lib/supabase/env";

function parseLookbackDays(): number | undefined {
  const arg = process.argv.find((a) => a.startsWith("--lookback-days="));
  if (!arg) return undefined;
  const value = Number.parseInt(arg.split("=")[1] ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

async function main() {
  const url = getSupabaseUrl();
  const serviceKey = getSupabaseServiceKey();
  const clientKey = getSupabaseAnonKey();

  if (!url || !(serviceKey || clientKey)) {
    console.error(
      "[ingest:nd] Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL plus SUPABASE_SERVICE_ROLE_KEY (recommended) or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local",
    );
    process.exit(1);
  }

  if (!serviceKey) {
    console.warn(
      "[ingest:nd] SUPABASE_SERVICE_ROLE_KEY not set — using publishable/anon key; upserts may fail under RLS.",
    );
  }

  const client = createAdminSupabaseClient();
  if (!client) {
    console.error("[ingest:nd] Could not create Supabase client.");
    process.exit(1);
  }
  const lookbackDays = parseLookbackDays();

  console.log("[ingest:nd] Starting ND Oil & Gas Division ingest (MapServer wells layer)...");
  if (lookbackDays) {
    console.log(`[ingest:nd] Lookback: ${lookbackDays} days`);
  }

  const result = await runNdOilGasIngest(client, { lookbackDays });

  if (!result.ok) {
    console.error(`[ingest:nd] Failed: ${result.error ?? "Unknown error"}`);
    console.error(
      "[ingest:nd] Dashboard UI is unchanged — fix source connectivity or Supabase credentials and retry.",
    );
    process.exit(1);
  }

  console.log("[ingest:nd] Completed successfully");
  console.log(`  Source:        ${result.source}`);
  console.log(`  Lookback:      ${result.lookbackDays} days`);
  console.log(`  Fetched:       ${result.fetched} well features`);
  console.log(`  Normalized:    ${result.normalized} permits`);
  console.log(
    `  Operators:     ${result.operators.created} created, ${result.operators.updated} updated`,
  );
  console.log(
    `  Counties:      ${result.counties.created} created, ${result.counties.updated} updated`,
  );
  console.log(
    `  Permits:       ${result.permits.created} created, ${result.permits.updated} updated`,
  );
  console.log(
    `  Activity:      ${result.activityEvents.created} created, ${result.activityEvents.skipped} skipped (existing)`,
  );
  console.log(
    `  Rollups:       ${result.rollups.countiesUpdated} counties, ${result.rollups.operatorsUpdated} operators`,
  );
  console.log(`  Duration:      ${result.durationMs}ms`);

  if (result.normalized === 0) {
    console.warn("[ingest:nd] No rows matched the lookback window — try a longer --lookback-days value.");
  }
}

main().catch((err) => {
  console.error("[ingest:nd] Unexpected error:", err instanceof Error ? err.message : err);
  process.exit(1);
});
