/** Raw attributes from ND DMR Oil & Gas Wells MapServer layer 0 */
export interface NdWellAttributes {
  fileno?: number | null;
  api_no?: string | null;
  operator?: string | null;
  well_name?: string | null;
  County?: string | null;
  status?: string | null;
  well_type?: string | null;
  spud_date?: number | null;
  api?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface NdWellFeature {
  attributes: NdWellAttributes;
}

export interface NdWellsQueryResponse {
  features?: NdWellFeature[];
  exceededTransferLimit?: boolean;
  error?: { code?: number; message?: string; details?: string[] };
}

export interface NormalizedOperator {
  externalId: string;
  name: string;
  focusAreas: string | null;
}

export interface NormalizedCounty {
  name: string;
}

export interface NormalizedPermit {
  externalId: string;
  sourceRecordId: string;
  operatorExternalId: string;
  operatorName: string;
  wellName: string;
  countyName: string;
  permitType: string;
  status: string;
  filedAt: string;
  sourcePayload: Record<string, unknown>;
}

export interface NormalizedActivityEvent {
  sourceRecordId: string;
  title: string;
  detail: string;
  countyName: string;
  eventType: "permit" | "spud" | "completion";
  occurredAt: string;
  operatorExternalId: string | null;
}

export interface IngestCounts {
  created: number;
  updated: number;
}

export interface NdIngestResult {
  ok: boolean;
  error?: string;
  source: "nd_mapserver";
  lookbackDays: number;
  fetched: number;
  normalized: number;
  permits: IngestCounts;
  operators: IngestCounts;
  counties: IngestCounts;
  activityEvents: { created: number; skipped: number };
  rollups: { countiesUpdated: number; operatorsUpdated: number };
  durationMs: number;
}

export interface NdIngestOptions {
  lookbackDays?: number;
  pageSize?: number;
  maxPages?: number;
}
