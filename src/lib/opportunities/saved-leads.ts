import type { DemandCategory, SavedLead, SavedLeadsSummary, ServiceOpportunity } from "@/lib/opportunities/types";
import { DEMAND_CATEGORIES } from "@/lib/opportunities/types";

export const SAVED_LEADS_STORAGE_KEY = "bakken-pulse-saved-leads";

export function loadSavedLeads(): SavedLead[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SAVED_LEADS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedLead[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLead(opportunity: ServiceOpportunity): SavedLead[] {
  const existing = loadSavedLeads();
  if (existing.some((l) => l.id === opportunity.id)) return existing;

  const lead: SavedLead = {
    ...opportunity,
    savedAt: new Date().toISOString(),
  };
  const next = [lead, ...existing];
  localStorage.setItem(SAVED_LEADS_STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function removeSavedLead(id: string): SavedLead[] {
  const next = loadSavedLeads().filter((l) => l.id !== id);
  localStorage.setItem(SAVED_LEADS_STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function isLeadSaved(id: string, saved: SavedLead[]): boolean {
  return saved.some((l) => l.id === id);
}

export function summarizeSavedLeads(leads: SavedLead[]): SavedLeadsSummary {
  const categories: Partial<Record<DemandCategory, number>> = {};
  let scoreSum = 0;

  for (const lead of leads) {
    categories[lead.demandCategory] = (categories[lead.demandCategory] ?? 0) + 1;
    scoreSum += lead.opportunityScore;
  }

  return {
    count: leads.length,
    avgScore: leads.length ? Math.round(scoreSum / leads.length) : 0,
    categories,
  };
}

function csvEscape(value: string | number): string {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportSavedLeadsCsv(leads: SavedLead[]): void {
  const headers = [
    "Opportunity Score",
    "County",
    "Operator",
    "Demand Category",
    "Confidence",
    "Entity Type",
    "Entity Label",
    "Activity At",
    "Saved At",
    "Rationale",
  ];

  const rows = leads.map((l) =>
    [
      l.opportunityScore,
      l.countyName,
      l.operatorName,
      l.demandCategory,
      l.confidence,
      l.entityType,
      l.entityLabel,
      l.activityAt,
      l.savedAt,
      l.rationale,
    ]
      .map(csvEscape)
      .join(","),
  );

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `bakken-pulse-leads-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function formatCategoryBreakdown(
  categories: Partial<Record<DemandCategory, number>>,
): string {
  const parts = DEMAND_CATEGORIES.filter((c) => (categories[c] ?? 0) > 0).map(
    (c) => `${c} (${categories[c]})`,
  );
  return parts.length ? parts.join(", ") : "None yet";
}
