import type {
  OpportunityFilters,
  OpportunitySortKey,
  ServiceOpportunity,
} from "@/lib/opportunities/types";

export const DEFAULT_FILTERS: OpportunityFilters = {
  county: "all",
  operator: "all",
  demandCategory: "all",
  confidence: "all",
  minScore: 0,
};

export function filterOpportunities(
  opportunities: ServiceOpportunity[],
  filters: OpportunityFilters,
): ServiceOpportunity[] {
  return opportunities.filter((o) => {
    if (filters.county !== "all" && o.countyName !== filters.county) return false;
    if (filters.operator !== "all" && o.operatorName !== filters.operator) return false;
    if (filters.demandCategory !== "all" && o.demandCategory !== filters.demandCategory) {
      return false;
    }
    if (filters.confidence !== "all" && o.confidence !== filters.confidence) return false;
    if (o.opportunityScore < filters.minScore) return false;
    return true;
  });
}

export function sortOpportunities(
  opportunities: ServiceOpportunity[],
  sortKey: OpportunitySortKey,
): ServiceOpportunity[] {
  const sorted = [...opportunities];
  switch (sortKey) {
    case "activity":
      sorted.sort(
        (a, b) => new Date(b.activityAt).getTime() - new Date(a.activityAt).getTime(),
      );
      break;
    case "county":
      sorted.sort((a, b) => a.countyName.localeCompare(b.countyName));
      break;
    case "operator":
      sorted.sort((a, b) => a.operatorName.localeCompare(b.operatorName));
      break;
    case "score":
    default:
      sorted.sort((a, b) => b.opportunityScore - a.opportunityScore);
      break;
  }
  return sorted;
}

export function extractFilterOptions(opportunities: ServiceOpportunity[]) {
  const counties = [...new Set(opportunities.map((o) => o.countyName))].sort();
  const operators = [...new Set(opportunities.map((o) => o.operatorName))].sort();
  return { counties, operators };
}
