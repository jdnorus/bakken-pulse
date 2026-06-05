import { ArrowUpRight, Sparkles, TrendingUp } from "lucide-react";

import { PageHeader } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { dataSourceLabel, getDashboard } from "@/lib/data";
import { formatDateTime } from "@/lib/format";

export default async function DashboardPage() {
  const { data, source } = await getDashboard();
  const { stats, topCounties, latestActivity, riskSummary } = data;
  const maxCountyPermits = Math.max(...topCounties.map((c) => c.permitsYtd), 1);
  const sourceLabel = dataSourceLabel(source);

  return (
    <>
      <PageHeader
        title="Operations dashboard"
        description={`Weekly permit velocity, operator presence, county mix, and capacity risk. Source: ${sourceLabel}.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="border-b pb-4">
            <CardDescription>Permits this week</CardDescription>
            <CardTitle className="text-3xl font-semibold tabular-nums">
              {stats.permitsThisWeek}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {stats.permitsWeekChangePct != null ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="size-4 text-emerald-600" aria-hidden />
                <span>
                  {stats.permitsWeekChangePct >= 0 ? "Up" : "Down"}{" "}
                  <span className="font-medium text-foreground">
                    {Math.abs(stats.permitsWeekChangePct)}%
                  </span>{" "}
                  vs. prior week
                </span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Week-over-week change unavailable</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b pb-4">
            <CardDescription>Active operators</CardDescription>
            <CardTitle className="text-3xl font-semibold tabular-nums">
              {stats.activeOperators}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">
              {stats.operatorsChange != null ? (
                <>
                  <span className="font-medium text-foreground">
                    {stats.operatorsChange >= 0 ? "+" : ""}
                    {stats.operatorsChange}
                  </span>{" "}
                  net change in trailing 30 days
                </>
              ) : (
                "Active producers in the Bakken footprint"
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader className="border-b pb-4">
            <CardDescription>Rig count (reference)</CardDescription>
            <CardTitle className="text-3xl font-semibold tabular-nums">{stats.activeRigs}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">
              Aggregated rig proxy from operator and county rollups.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="border-b">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <CardTitle>Top counties</CardTitle>
                <CardDescription>Permit share year-to-date</CardDescription>
              </div>
              <Badge variant="outline">YTD</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {topCounties.map((c) => (
              <div key={c.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{c.name}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {c.permitsYtd}{" "}
                    <span className="text-xs">permits</span>
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary/80"
                    style={{ width: `${(c.permitsYtd / maxCountyPermits) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-gradient-to-b from-primary/5 to-card">
          <CardHeader className="border-b border-primary/10">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="size-4" aria-hidden />
              </div>
              <div>
                <CardTitle>Capacity risk summary</CardTitle>
                <CardDescription>Latest risk readout</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="uppercase">
                {riskSummary.riskLevel}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Generated {formatDateTime(riskSummary.generatedAt)}
              </span>
            </div>
            <p className="text-sm font-medium leading-snug">{riskSummary.headline}</p>
            <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
              {riskSummary.bullets.map((b) => (
                <li key={b} className="leading-relaxed">
                  {b}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            Populated from risk_summaries when ND ingest and models are connected.
          </CardFooter>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHeader className="border-b">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Latest activity</CardTitle>
              <CardDescription>Permits, spuds, and regulatory touchpoints</CardDescription>
            </div>
            <Badge variant="outline" className="gap-1">
              {source === "supabase" ? "Live" : "Preview"}
              <ArrowUpRight className="size-3" aria-hidden />
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="divide-y divide-border px-0">
          {latestActivity.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">No recent activity events.</p>
          ) : (
            latestActivity.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-1 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{item.title}</p>
                    <Badge variant="secondary" className="text-[10px] uppercase">
                      {item.eventType}
                    </Badge>
                  </div>
                  <p className="truncate text-sm text-muted-foreground">{item.detail}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
                  <span className="text-xs font-medium text-muted-foreground">{item.countyName}</span>
                  <time className="text-xs tabular-nums text-muted-foreground" dateTime={item.occurredAt}>
                    {formatDateTime(item.occurredAt)}
                  </time>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </>
  );
}
