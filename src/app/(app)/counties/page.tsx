import { PageHeader } from "@/components/layout/app-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { dataSourceLabel, getCounties } from "@/lib/data";

export default async function CountiesPage() {
  const { data: counties, source } = await getCounties();

  return (
    <>
      <PageHeader
        title="Counties"
        description={`County-level intensity for sand, water, power, and midstream planning. Source: ${dataSourceLabel(source)}.`}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {counties.map((c) => (
          <Card key={c.id}>
            <CardHeader className="border-b pb-4">
              <CardTitle>{c.name}</CardTitle>
              <CardDescription>
                Leading operator: {c.topOperatorName ?? "—"}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 pt-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Permits YTD</span>
                <span className="font-semibold tabular-nums">{c.permitsYtd}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Rigs</span>
                <span className="font-semibold tabular-nums">{c.rigs}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Median cycle (days)</span>
                <span className="font-semibold tabular-nums">
                  {c.medianCycleDays ?? "—"}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
