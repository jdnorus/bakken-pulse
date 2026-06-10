export const DEMAND_CATEGORIES = [
  "Welding",
  "Dirt work",
  "Water hauling",
  "Electrical",
  "Rentals",
  "Safety services",
] as const;

export type DemandCategory = (typeof DEMAND_CATEGORIES)[number];

export type ConfidenceLevel = "low" | "medium" | "high";

export type OpportunityEntityType = "permit" | "operator";

export type OpportunitySortKey = "score" | "activity" | "county" | "operator";

export interface ServiceOpportunity {
  id: string;
  entityType: OpportunityEntityType;
  entityId: string;
  entityLabel: string;
  operatorName: string;
  countyName: string;
  demandCategory: DemandCategory;
  opportunityScore: number;
  confidence: ConfidenceLevel;
  /** ISO timestamp for sorting by recent activity */
  activityAt: string;
  rationale: string;
  signalStrength: number;
}

export interface OpportunitiesSummary {
  total: number;
  byCategory: Partial<Record<DemandCategory, number>>;
  avgScore: number;
  highConfidence: number;
}

export interface OpportunitiesData {
  opportunities: ServiceOpportunity[];
  summary: OpportunitiesSummary;
}

export interface SavedLead extends ServiceOpportunity {
  savedAt: string;
}

export interface SavedLeadsSummary {
  count: number;
  avgScore: number;
  categories: Partial<Record<DemandCategory, number>>;
}

export interface OpportunityFilters {
  county: string;
  operator: string;
  demandCategory: string;
  confidence: string;
  minScore: number;
}
