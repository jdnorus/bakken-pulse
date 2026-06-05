import { AlertTriangle, Info } from "lucide-react";

import { PageHeader } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { dataSourceLabel, getAlerts } from "@/lib/data";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export default async function AlertsPage() {
  const { data: alerts, source } = await getAlerts();

  return (
    <>
      <PageHeader
        title="Alerts"
        description={`Rule-based and model-derived signals for capacity, permitting clusters, and regulatory drift. Source: ${dataSourceLabel(source)}.`}
      />
      <div className="space-y-4">
        {alerts.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground">
              No alerts with severity are on file. Ingest ND activity events with severity set, or
              use mock preview data.
            </CardContent>
          </Card>
        ) : (
          alerts.map((a) => (
            <Card
              key={a.id}
              className={cn(
                a.severity === "critical" && "border-destructive/40",
                a.severity === "warning" && "border-amber-500/35",
              )}
            >
              <CardHeader className="border-b">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {a.severity === "info" ? (
                        <Info className="size-4 text-primary" aria-hidden />
                      ) : (
                        <AlertTriangle
                          className={cn(
                            "size-4",
                            a.severity === "critical" ? "text-destructive" : "text-amber-600",
                          )}
                          aria-hidden
                        />
                      )}
                      <CardTitle className="text-base">{a.title}</CardTitle>
                    </div>
                    <CardDescription>{a.countyName} County</CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge
                      variant={a.severity === "critical" ? "destructive" : "secondary"}
                      className="uppercase"
                    >
                      {a.severity}
                    </Badge>
                    <time className="text-xs text-muted-foreground" dateTime={a.createdAt}>
                      {formatDateTime(a.createdAt)}
                    </time>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 text-sm leading-relaxed text-muted-foreground">
                {a.body}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
