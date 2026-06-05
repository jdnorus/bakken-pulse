import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database";
import type {
  NdIngestOptions,
  NdIngestResult,
  NdWellAttributes,
  NdWellFeature,
  NdWellsQueryResponse,
  NormalizedActivityEvent,
  NormalizedCounty,
  NormalizedOperator,
  NormalizedPermit,
} from "@/lib/ingest/types";

/** ND DMR public Wells layer (MapServer supports query; FeatureServer layer 0 does not). */
export const ND_WELLS_MAPSERVER_QUERY_URL =
  "https://gis.dmr.nd.gov/dmrpublicservices/rest/services/OilGasPublicMapDataVectorTiles/Wells/MapServer/0/query";

export const ND_SOURCE_SYSTEM = "nd_oil_gas";

const DEFAULT_LOOKBACK_DAYS = 90;
const DEFAULT_PAGE_SIZE = 1000;
const DEFAULT_MAX_PAGES = 25;

export function slugifyOperator(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function normalizeCountyName(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "Unknown";
  return trimmed
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function mapWellType(raw: string | null | undefined): string {
  if (!raw) return "Unknown";
  const t = raw.trim();
  const map: Record<string, string> = {
    OG: "Oil & Gas",
    Confidential: "Confidential",
  };
  return map[t] ?? t;
}

function mapWellStatus(raw: string | null | undefined): string {
  if (!raw) return "Unknown";
  const s = raw.trim();
  const map: Record<string, string> = {
    DRL: "Drilling",
    PA: "Producing",
    TA: "Temporarily Abandoned",
    "P&A": "Plugged & Abandoned",
    A: "Active",
  };
  return map[s] ?? s;
}

function arcgisDateToIso(ms: number | null | undefined): string | null {
  if (ms == null || !Number.isFinite(ms) || ms <= 0) return null;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function arcgisDateToTimestamp(ms: number | null | undefined): string | null {
  if (ms == null || !Number.isFinite(ms) || ms <= 0) return null;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function normalizeWellFeature(
  feature: NdWellFeature,
  lookbackCutoffMs: number,
): {
  permit: NormalizedPermit;
  operator: NormalizedOperator;
  county: NormalizedCounty;
  activity: NormalizedActivityEvent;
} | null {
  const a = feature.attributes;
  const fileno = a.fileno;
  const operatorName = (a.operator ?? "").trim();
  const wellName = (a.well_name ?? "").trim();
  const countyRaw = (a.County ?? "").trim();

  if (fileno == null || !operatorName || !wellName) {
    return null;
  }

  const spudMs = a.spud_date ?? null;
  if (spudMs == null || spudMs < lookbackCutoffMs) {
    return null;
  }

  const filedAt = arcgisDateToIso(spudMs);
  const occurredAt = arcgisDateToTimestamp(spudMs);
  if (!filedAt || !occurredAt) {
    return null;
  }

  const countyName = normalizeCountyName(countyRaw || "Unknown");
  const operatorExternalId = slugifyOperator(operatorName);
  const externalId = `ND-${fileno}`;
  const status = mapWellStatus(a.status);
  const permitType = mapWellType(a.well_type);

  const eventType: NormalizedActivityEvent["eventType"] =
    status === "Drilling" || a.status === "DRL" ? "spud" : "permit";

  return {
    operator: {
      externalId: operatorExternalId,
      name: operatorName,
      focusAreas: countyName,
    },
    county: { name: countyName },
    permit: {
      externalId,
      sourceRecordId: String(fileno),
      operatorExternalId,
      operatorName,
      wellName,
      countyName,
      permitType,
      status,
      filedAt,
      sourcePayload: a as unknown as Record<string, unknown>,
    },
    activity: {
      sourceRecordId: `well-${fileno}-${filedAt}`,
      title:
        eventType === "spud" ? "Spud / drilling activity recorded" : "Well activity recorded",
      detail: `${operatorName} — ${wellName}`,
      countyName,
      eventType,
      occurredAt,
      operatorExternalId,
    },
  };
}

export async function fetchNdWellsRecent(
  options: NdIngestOptions = {},
): Promise<{ features: NdWellFeature[]; error?: string }> {
  const lookbackDays = options.lookbackDays ?? DEFAULT_LOOKBACK_DAYS;
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;
  const maxPages = options.maxPages ?? DEFAULT_MAX_PAGES;
  const lookbackCutoffMs = Date.now() - lookbackDays * 24 * 60 * 60 * 1000;

  const allFeatures: NdWellFeature[] = [];
  let offset = 0;
  let page = 0;
  let stop = false;

  while (page < maxPages && !stop) {
    const params = new URLSearchParams({
      where: "spud_date IS NOT NULL",
      outFields:
        "fileno,api_no,operator,well_name,County,status,well_type,spud_date,api,latitude,longitude",
      orderByFields: "spud_date DESC",
      resultRecordCount: String(pageSize),
      resultOffset: String(offset),
      f: "json",
    });

    let response: Response;
    try {
      response = await fetch(`${ND_WELLS_MAPSERVER_QUERY_URL}?${params}`, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(60_000),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network request failed";
      return { features: [], error: `ND GIS unreachable: ${message}` };
    }

    if (!response.ok) {
      return {
        features: [],
        error: `ND GIS HTTP ${response.status}: ${response.statusText}`,
      };
    }

    let body: NdWellsQueryResponse;
    try {
      body = (await response.json()) as NdWellsQueryResponse;
    } catch {
      return { features: [], error: "ND GIS returned invalid JSON" };
    }

    if (body.error) {
      return {
        features: [],
        error: body.error.message ?? "ND GIS query failed",
      };
    }

    const pageFeatures = body.features ?? [];
    if (pageFeatures.length === 0) {
      break;
    }

    for (const feature of pageFeatures) {
      const spud = feature.attributes?.spud_date;
      if (spud != null && spud < lookbackCutoffMs) {
        stop = true;
        break;
      }
      allFeatures.push(feature);
    }

    if (!body.exceededTransferLimit || pageFeatures.length < pageSize) {
      break;
    }

    offset += pageSize;
    page += 1;
  }

  return { features: allFeatures };
}

async function countExistingByKey(
  client: SupabaseClient<Database>,
  table: "operators" | "counties" | "permits",
  key: "external_id" | "name",
  values: string[],
): Promise<Set<string>> {
  const existing = new Set<string>();
  const chunkSize = 200;

  for (let i = 0; i < values.length; i += chunkSize) {
    const chunk = values.slice(i, i + chunkSize);
    const { data, error } = await client.from(table).select(key).in(key, chunk);
    if (error) {
      console.warn(`[ingest] Could not load existing ${table}:`, error.message);
      continue;
    }
    for (const row of (data ?? []) as Record<string, string | null>[]) {
      const val = row[key];
      if (typeof val === "string") existing.add(val);
    }
  }

  return existing;
}

async function upsertOperators(
  client: SupabaseClient<Database>,
  operators: NormalizedOperator[],
  now: string,
): Promise<{ counts: { created: number; updated: number }; idByExternalId: Map<string, string> }> {
  const unique = new Map<string, NormalizedOperator>();
  for (const op of operators) {
    unique.set(op.externalId, op);
  }

  const keys = [...unique.keys()];
  const existing = await countExistingByKey(client, "operators", "external_id", keys);

  const rows: Database["public"]["Tables"]["operators"]["Insert"][] = [...unique.values()].map(
    (op) => ({
      external_id: op.externalId,
      name: op.name,
      focus_areas: op.focusAreas,
      is_active: true,
      source_system: ND_SOURCE_SYSTEM,
      source_updated_at: now,
    }),
  );

  const { data, error } = await client
    .from("operators")
    .upsert(rows as never, { onConflict: "external_id" })
    .select("id, external_id");

  if (error) {
    throw new Error(`operators upsert failed: ${error.message}`);
  }

  const idByExternalId = new Map<string, string>();
  for (const row of (data ?? []) as Pick<
    Database["public"]["Tables"]["operators"]["Row"],
    "id" | "external_id"
  >[]) {
    if (row.external_id) idByExternalId.set(row.external_id, row.id);
  }

  let created = 0;
  let updated = 0;
  for (const key of keys) {
    if (existing.has(key)) updated += 1;
    else created += 1;
  }

  return { counts: { created, updated }, idByExternalId };
}

async function upsertCounties(
  client: SupabaseClient<Database>,
  counties: NormalizedCounty[],
  now: string,
): Promise<{ counts: { created: number; updated: number }; idByName: Map<string, string> }> {
  const unique = new Map<string, NormalizedCounty>();
  for (const c of counties) {
    unique.set(c.name, c);
  }

  const keys = [...unique.keys()];
  const existing = await countExistingByKey(client, "counties", "name", keys);

  const rows: Database["public"]["Tables"]["counties"]["Insert"][] = [...unique.values()].map(
    (c) => ({
      name: c.name,
      source_system: ND_SOURCE_SYSTEM,
      source_updated_at: now,
    }),
  );

  const { data, error } = await client
    .from("counties")
    .upsert(rows as never, { onConflict: "name" })
    .select("id, name");

  if (error) {
    throw new Error(`counties upsert failed: ${error.message}`);
  }

  const idByName = new Map<string, string>();
  for (const row of (data ?? []) as Pick<
    Database["public"]["Tables"]["counties"]["Row"],
    "id" | "name"
  >[]) {
    idByName.set(row.name, row.id);
  }

  let created = 0;
  let updated = 0;
  for (const key of keys) {
    if (existing.has(key)) updated += 1;
    else created += 1;
  }

  return { counts: { created, updated }, idByName };
}

async function upsertPermits(
  client: SupabaseClient<Database>,
  permits: NormalizedPermit[],
  operatorIds: Map<string, string>,
  countyIds: Map<string, string>,
  now: string,
): Promise<{ counts: { created: number; updated: number } }> {
  const unique = new Map<string, NormalizedPermit>();
  for (const p of permits) {
    unique.set(p.externalId, p);
  }

  const keys = [...unique.keys()];
  const existing = await countExistingByKey(client, "permits", "external_id", keys);

  const rows: Database["public"]["Tables"]["permits"]["Insert"][] = [...unique.values()].map(
    (p) => ({
      external_id: p.externalId,
      operator_id: operatorIds.get(p.operatorExternalId) ?? null,
      operator_name: p.operatorName,
      well_name: p.wellName,
      county_id: countyIds.get(p.countyName) ?? null,
      county_name: p.countyName,
      permit_type: p.permitType,
      status: p.status,
      filed_at: p.filedAt,
      source_system: ND_SOURCE_SYSTEM,
      source_record_id: p.sourceRecordId,
      source_payload: p.sourcePayload,
      source_updated_at: now,
    }),
  );

  const { error } = await client
    .from("permits")
    .upsert(rows as never, { onConflict: "external_id" });
  if (error) {
    throw new Error(`permits upsert failed: ${error.message}`);
  }

  let created = 0;
  let updated = 0;
  for (const key of keys) {
    if (existing.has(key)) updated += 1;
    else created += 1;
  }

  return { counts: { created, updated } };
}

async function insertActivityEvents(
  client: SupabaseClient<Database>,
  events: NormalizedActivityEvent[],
  operatorIds: Map<string, string>,
): Promise<{ created: number; skipped: number }> {
  const unique = new Map<string, NormalizedActivityEvent>();
  for (const e of events) {
    unique.set(e.sourceRecordId, e);
  }

  const sourceIds = [...unique.keys()];
  const existing = new Set<string>();
  const chunkSize = 200;

  for (let i = 0; i < sourceIds.length; i += chunkSize) {
    const chunk = sourceIds.slice(i, i + chunkSize);
    const { data } = await client
      .from("activity_events")
      .select("source_record_id")
      .eq("source_system", ND_SOURCE_SYSTEM)
      .in("source_record_id", chunk);

    for (const row of (data ?? []) as Pick<
      Database["public"]["Tables"]["activity_events"]["Row"],
      "source_record_id"
    >[]) {
      if (row.source_record_id) existing.add(row.source_record_id);
    }
  }

  const toInsert = [...unique.values()].filter((e) => !existing.has(e.sourceRecordId));
  if (toInsert.length === 0) {
    return { created: 0, skipped: unique.size };
  }

  const rows: Database["public"]["Tables"]["activity_events"]["Insert"][] = toInsert.map(
    (e) => ({
      title: e.title,
      detail: e.detail,
      county_name: e.countyName,
      event_type: e.eventType,
      occurred_at: e.occurredAt,
      operator_id: e.operatorExternalId
        ? (operatorIds.get(e.operatorExternalId) ?? null)
        : null,
      source_system: ND_SOURCE_SYSTEM,
      source_record_id: e.sourceRecordId,
      severity: null,
    }),
  );

  const { error } = await client
    .from("activity_events")
    .insert(rows as never);
  if (error) {
    throw new Error(`activity_events insert failed: ${error.message}`);
  }

  return { created: toInsert.length, skipped: unique.size - toInsert.length };
}

async function refreshRollups(
  client: SupabaseClient<Database>,
  now: string,
): Promise<{ countiesUpdated: number; operatorsUpdated: number }> {
  const yearStart = `${new Date().getFullYear()}-01-01`;

  const { data: permits, error } = await client
    .from("permits")
    .select("county_name, operator_name, operator_id, status, filed_at")
    .gte("filed_at", yearStart);

  if (error || !permits?.length) {
    return { countiesUpdated: 0, operatorsUpdated: 0 };
  }

  type PermitRollup = Pick<
    Database["public"]["Tables"]["permits"]["Row"],
    "county_name" | "operator_name" | "operator_id" | "status" | "filed_at"
  >;
  const permitRows = permits as PermitRollup[];

  type CountyAgg = { permitsYtd: number; rigs: number; byOperator: Map<string, number> };
  const countyAgg = new Map<string, CountyAgg>();
  const operatorAgg = new Map<string, { permitsYtd: number; rigs: number; name: string }>();

  for (const p of permitRows) {
    const county = p.county_name;
    if (!countyAgg.has(county)) {
      countyAgg.set(county, { permitsYtd: 0, rigs: 0, byOperator: new Map() });
    }
    const ca = countyAgg.get(county)!;
    ca.permitsYtd += 1;
    if (p.status === "Drilling" || p.status === "DRL") {
      ca.rigs += 1;
    }
    ca.byOperator.set(p.operator_name, (ca.byOperator.get(p.operator_name) ?? 0) + 1);

    const opKey = p.operator_id ?? p.operator_name;
    if (!operatorAgg.has(opKey)) {
      operatorAgg.set(opKey, { permitsYtd: 0, rigs: 0, name: p.operator_name });
    }
    const oa = operatorAgg.get(opKey)!;
    oa.permitsYtd += 1;
    if (p.status === "Drilling" || p.status === "DRL") {
      oa.rigs += 1;
    }
  }

  let countiesUpdated = 0;
  for (const [name, agg] of countyAgg) {
    let topOperator: string | null = null;
    let topCount = 0;
    for (const [op, count] of agg.byOperator) {
      if (count > topCount) {
        topCount = count;
        topOperator = op;
      }
    }

    const { error: upErr } = await client
      .from("counties")
      .update({
        permits_ytd: agg.permitsYtd,
        rigs: agg.rigs,
        top_operator_name: topOperator,
        source_updated_at: now,
      } as never)
      .eq("name", name);

    if (!upErr) countiesUpdated += 1;
  }

  let operatorsUpdated = 0;
  for (const [key, agg] of operatorAgg) {
    const isUuid = key.includes("-") && key.length > 20;
    const query = client.from("operators").update({
      permits_ytd: agg.permitsYtd,
      rigs: agg.rigs,
      source_updated_at: now,
    } as never);

    const { error: upErr } = isUuid
      ? await query.eq("id", key)
      : await query.eq("name", agg.name);

    if (!upErr) operatorsUpdated += 1;
  }

  return { countiesUpdated, operatorsUpdated };
}

export async function runNdOilGasIngest(
  client: SupabaseClient<Database>,
  options: NdIngestOptions = {},
): Promise<NdIngestResult> {
  const started = Date.now();
  const lookbackDays = options.lookbackDays ?? DEFAULT_LOOKBACK_DAYS;
  const lookbackCutoffMs = Date.now() - lookbackDays * 24 * 60 * 60 * 1000;
  const now = new Date().toISOString();

  const emptyResult = (error: string): NdIngestResult => ({
    ok: false,
    error,
    source: "nd_mapserver",
    lookbackDays,
    fetched: 0,
    normalized: 0,
    permits: { created: 0, updated: 0 },
    operators: { created: 0, updated: 0 },
    counties: { created: 0, updated: 0 },
    activityEvents: { created: 0, skipped: 0 },
    rollups: { countiesUpdated: 0, operatorsUpdated: 0 },
    durationMs: Date.now() - started,
  });

  const { features, error: fetchError } = await fetchNdWellsRecent(options);
  if (fetchError) {
    return emptyResult(fetchError);
  }

  const operators: NormalizedOperator[] = [];
  const counties: NormalizedCounty[] = [];
  const permits: NormalizedPermit[] = [];
  const activities: NormalizedActivityEvent[] = [];

  for (const feature of features) {
    const normalized = normalizeWellFeature(feature, lookbackCutoffMs);
    if (!normalized) continue;
    operators.push(normalized.operator);
    counties.push(normalized.county);
    permits.push(normalized.permit);
    activities.push(normalized.activity);
  }

  if (permits.length === 0) {
    return {
      ok: true,
      source: "nd_mapserver",
      lookbackDays,
      fetched: features.length,
      normalized: 0,
      permits: { created: 0, updated: 0 },
      operators: { created: 0, updated: 0 },
      counties: { created: 0, updated: 0 },
      activityEvents: { created: 0, skipped: 0 },
      rollups: { countiesUpdated: 0, operatorsUpdated: 0 },
      durationMs: Date.now() - started,
    };
  }

  try {
    const { counts: opCounts, idByExternalId: operatorIds } = await upsertOperators(
      client,
      operators,
      now,
    );
    const { counts: countyCounts, idByName: countyIds } = await upsertCounties(
      client,
      counties,
      now,
    );
    const permitCounts = await upsertPermits(client, permits, operatorIds, countyIds, now);
    const activityCounts = await insertActivityEvents(client, activities, operatorIds);
    const rollups = await refreshRollups(client, now);

    return {
      ok: true,
      source: "nd_mapserver",
      lookbackDays,
      fetched: features.length,
      normalized: permits.length,
      permits: permitCounts.counts,
      operators: opCounts,
      counties: countyCounts,
      activityEvents: activityCounts,
      rollups,
      durationMs: Date.now() - started,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ingest upsert failed";
    return emptyResult(message);
  }
}
