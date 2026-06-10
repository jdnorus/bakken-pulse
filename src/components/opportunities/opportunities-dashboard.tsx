"use client";

import { useMemo, useState } from "react";
import {
  Bookmark,
  BookmarkCheck,
  Download,
  Filter,
  SlidersHorizontal,
  Target,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DEFAULT_FILTERS,
  extractFilterOptions,
  filterOpportunities,
  sortOpportunities,
} from "@/lib/opportunities/filters";
import {
  exportSavedLeadsCsv,
  formatCategoryBreakdown,
  isLeadSaved,
  loadSavedLeads,
  removeSavedLead,
  saveLead,
  summarizeSavedLeads,
} from "@/lib/opportunities/saved-leads";
import type { DataSource } from "@/lib/types";
import type {
  ConfidenceLevel,
  OpportunitiesData,
  OpportunityFilters,
  OpportunitySortKey,
  SavedLead,
  ServiceOpportunity,
} from "@/lib/opportunities/types";
import { DEMAND_CATEGORIES } from "@/lib/opportunities/types";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const selectClass =
  "flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function confidenceVariant(level: ConfidenceLevel) {
  if (level === "high") return "secondary" as const;
  if (level === "medium") return "outline" as const;
  return "destructive" as const;
}

function scoreBarClass(score: number): string {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 55) return "bg-primary/80";
  return "bg-amber-500";
}

interface OpportunitiesDashboardProps {
  data: OpportunitiesData;
  source: DataSource;
  sourceLabel: string;
}

export function OpportunitiesDashboard({
  data,
  source,
  sourceLabel,
}: OpportunitiesDashboardProps) {
  const [filters, setFilters] = useState<OpportunityFilters>(DEFAULT_FILTERS);
  const [sortKey, setSortKey] = useState<OpportunitySortKey>("score");
  const [savedLeads, setSavedLeads] = useState<SavedLead[]>(() => loadSavedLeads());

  const { counties, operators } = useMemo(
    () => extractFilterOptions(data.opportunities),
    [data.opportunities],
  );

  const filtered = useMemo(() => {
    const f = filterOpportunities(data.opportunities, filters);
    return sortOpportunities(f, sortKey);
  }, [data.opportunities, filters, sortKey]);

  const savedSummary = useMemo(() => summarizeSavedLeads(savedLeads), [savedLeads]);

  function handleSave(opp: ServiceOpportunity) {
    setSavedLeads(saveLead(opp));
  }

  function handleUnsave(id: string) {
    setSavedLeads(removeSavedLead(id));
  }

  function updateFilter<K extends keyof OpportunityFilters>(key: K, value: OpportunityFilters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="space-y-8">
      {source === "mock" && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="pt-6 text-sm">
            <p className="font-medium text-foreground">Showing preview leads only</p>
            <p className="mt-1 text-muted-foreground">
              Supabase is not connected on this deployment. Add{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
              </code>{" "}
              in your Vercel project settings, then redeploy to load live ND permit data.
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card">
        <CardHeader className="border-b border-primary/10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-1 flex items-center gap-2 text-primary">
                <Target className="size-4" aria-hidden />
                <span className="text-xs font-semibold uppercase tracking-wider">Sales lead board</span>
              </div>
              <CardTitle className="text-xl">Service demand opportunities</CardTitle>
              <CardDescription className="mt-1 max-w-2xl">
                Activity-weighted scoring from permit filings and operator footprint. Source: {sourceLabel}.
              </CardDescription>
            </div>
            <Badge variant="outline" className="shrink-0">
              {filtered.length} of {data.opportunities.length} leads shown
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Pipeline opportunities</p>
            <p className="text-2xl font-semibold tabular-nums">{data.summary.total}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Avg opportunity score</p>
            <p className="text-2xl font-semibold tabular-nums">{data.summary.avgScore}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">High confidence</p>
            <p className="text-2xl font-semibold tabular-nums">{data.summary.highConfidence}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Scoring engine</p>
            <p className="text-sm font-medium">Activity-weighted model</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <BookmarkCheck className="size-4 text-primary" aria-hidden />
                Saved leads
              </CardTitle>
              <CardDescription>Stored locally in your browser — no account required</CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={savedLeads.length === 0}
              onClick={() => exportSavedLeadsCsv(savedLeads)}
            >
              <Download className="size-4" aria-hidden />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Saved leads</p>
            <p className="text-2xl font-semibold tabular-nums">{savedSummary.count}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Average saved score</p>
            <p className="text-2xl font-semibold tabular-nums">{savedSummary.avgScore}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs text-muted-foreground">Demand categories saved</p>
            <p className="mt-1 text-sm leading-relaxed text-foreground">
              {formatCategoryBreakdown(savedSummary.categories)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="size-4" aria-hidden />
            Filters &amp; sorting
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className="space-y-1.5">
            <Label htmlFor="filter-county">County</Label>
            <select
              id="filter-county"
              className={selectClass}
              value={filters.county}
              onChange={(e) => updateFilter("county", e.target.value)}
            >
              <option value="all">All counties</option>
              {counties.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="filter-operator">Operator</Label>
            <select
              id="filter-operator"
              className={selectClass}
              value={filters.operator}
              onChange={(e) => updateFilter("operator", e.target.value)}
            >
              <option value="all">All operators</option>
              {operators.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="filter-category">Demand category</Label>
            <select
              id="filter-category"
              className={selectClass}
              value={filters.demandCategory}
              onChange={(e) => updateFilter("demandCategory", e.target.value)}
            >
              <option value="all">All categories</option>
              {DEMAND_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="filter-confidence">Confidence</Label>
            <select
              id="filter-confidence"
              className={selectClass}
              value={filters.confidence}
              onChange={(e) => updateFilter("confidence", e.target.value)}
            >
              <option value="all">All levels</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="filter-min-score">Min score</Label>
            <Input
              id="filter-min-score"
              type="number"
              min={0}
              max={100}
              value={filters.minScore}
              onChange={(e) => updateFilter("minScore", Number(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="filter-sort" className="flex items-center gap-1">
              <SlidersHorizontal className="size-3.5" aria-hidden />
              Sort by
            </Label>
            <select
              id="filter-sort"
              className={selectClass}
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as OpportunitySortKey)}
            >
              <option value="score">Highest score</option>
              <option value="activity">Most recent activity</option>
              <option value="county">County (A–Z)</option>
              <option value="operator">Operator (A–Z)</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Lead pipeline</CardTitle>
          <CardDescription>
            Save promising leads to build a call list. Scores reflect permit status, recency, and
            county activity heat.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-0">
          {filtered.length === 0 ? (
            <p className="px-4 py-8 text-sm text-muted-foreground">
              No leads match your filters. Try lowering the minimum score or clearing filters.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[90px]">Score</TableHead>
                  <TableHead>County</TableHead>
                  <TableHead>Operator</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Last activity</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((o) => {
                  const saved = isLeadSaved(o.id, savedLeads);
                  return (
                    <TableRow key={o.id} className={cn(saved && "bg-primary/5")}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="w-7 font-semibold tabular-nums">{o.opportunityScore}</span>
                          <div className="h-2 w-14 overflow-hidden rounded-full bg-muted">
                            <div
                              className={cn("h-full rounded-full", scoreBarClass(o.opportunityScore))}
                              style={{ width: `${o.opportunityScore}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{o.countyName}</TableCell>
                      <TableCell className="max-w-[160px] truncate font-medium">
                        {o.operatorName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{o.demandCategory}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={confidenceVariant(o.confidence)} className="uppercase">
                          {o.confidence}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <time dateTime={o.activityAt}>{formatDateTime(o.activityAt)}</time>
                        <p className="mt-0.5 max-w-[200px] truncate">{o.entityLabel}</p>
                      </TableCell>
                      <TableCell className="text-right">
                        {saved ? (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => handleUnsave(o.id)}
                          >
                            <BookmarkCheck className="size-4" aria-hidden />
                            Saved
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleSave(o)}
                          >
                            <Bookmark className="size-4" aria-hidden />
                            Save lead
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
