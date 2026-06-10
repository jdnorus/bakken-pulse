import type { ComponentProps } from "react";
import { Sparkles, TrendingUp } from "lucide-react";

import { PageHeader } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { dataSourceLabel, getOpportunities } from "@/lib/data/opportunities";
import type { ConfidenceLevel } from "@/lib/opportunities/types";
import { DEMAND_CATEGORIES } from "@/lib/opportunities/types";
import { cn } from "@/lib/utils";

function confidenceVariant(
  level: ConfidenceLevel,
): ComponentProps<typeof Badge>["variant"] {
  if (level === "high") return "secondary";
  if (level === "medium") return "outline";
  return "destructive";
}

function scoreBarClass(score: number): string {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 55) return "bg-primary/80";
  return "bg-amber-500";
}

export default async function OpportunitiesPage() {
  const { data, source } = await getOpportunities();
  const { opportunities, summary } = data;

  return (
    <>
      <PageHeader
        title="Service opportunities"
        description={`Mock AI demand scoring from permit and operator activity. Categories: ${DEMAND_CATEGORIES.join(", ")}. Source: ${dataSourceLabel(source)}.`}
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="border-b pb-4">
            <CardDescription>Opportunities ranked</CardDescription>
            <CardTitle className="text-3xl font-semibold tabular-nums">{summary.total}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 text-sm text-muted-foreground">
            Permit + operator rows above score threshold
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="border-b pb-4">
            <CardDescription>Average opportunity score</CardDescription>
            <CardTitle className="text-3xl font-semibold tabular-nums">{summary.avgScore}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 text-sm text-muted-foreground">0–100 mock model output</CardContent>
        </Card>
        <Card>
          <CardHeader className="border-b pb-4">
            <CardDescription>High confidence</CardDescription>
            <CardTitle className="text-3xl font-semibold tabular-nums">
              {summary.highConfidence}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 text-sm text-muted-foreground">
            Strong signal from status, recency, and activity
          </CardContent>
        </Card>
        <Card className="border-primary/20 bg-gradient-to-b from-primary/5 to-card">
          <CardHeader className="border-b border-primary/10 pb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" aria-hidden />
              <CardDescription>Scoring mode</CardDescription>
            </div>
            <CardTitle className="text-base font-medium">Mock AI (rules + seed)</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 text-sm text-muted-foreground">
            Replace with a model when ND ingest and historical baselines mature.
          </CardContent>
        </Card>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {DEMAND_CATEGORIES.map((cat) => (
          <Badge key={cat} variant="outline" className="gap-1">
            <TrendingUp className="size-3 opacity-60" aria-hidden />
            {cat}
            <span className="tabular-nums text-muted-foreground">
              ({summary.byCategory[cat] ?? 0})
            </span>
          </Badge>
        ))}
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Ranked opportunities</CardTitle>
          <CardDescription>
            Sorted by opportunity score. Each row ties a permit or operator to an estimated service
            demand category.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-0">
          {opportunities.length === 0 ? (
            <p className="px-4 py-8 text-sm text-muted-foreground">
              No opportunities met the score threshold. Run ingest or seed data, then refresh.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Score</TableHead>
                  <TableHead>County</TableHead>
                  <TableHead>Operator</TableHead>
                  <TableHead>Demand category</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {opportunities.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="w-8 font-semibold tabular-nums">{o.opportunityScore}</span>
                        <div className="h-2 w-16 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn("h-full rounded-full", scoreBarClass(o.opportunityScore))}
                            style={{ width: `${o.opportunityScore}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{o.countyName}</TableCell>
                    <TableCell className="font-medium">{o.operatorName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{o.demandCategory}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={confidenceVariant(o.confidence)} className="uppercase">
                        {o.confidence}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      <span className="text-xs uppercase tracking-wide">{o.entityType}</span>
                      <span className="mx-1">·</span>
                      {o.entityLabel}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
