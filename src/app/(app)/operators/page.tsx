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
import { dataSourceLabel, getOperators } from "@/lib/data";

export default async function OperatorsPage() {
  const { data: operators, source } = await getOperators({ limit: 100 });

  return (
    <>
      <PageHeader
        title="Operators"
        description={`Operator-level activity for planning crews, logistics, and capacity. Source: ${dataSourceLabel(source)}.`}
      />
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Operator roster</CardTitle>
          <CardDescription>Permits YTD and active rig proxy by producer</CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Operator</TableHead>
                <TableHead>HQ</TableHead>
                <TableHead>Focus</TableHead>
                <TableHead className="text-right">Permits YTD</TableHead>
                <TableHead className="text-right">Rigs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {operators.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.name}</TableCell>
                  <TableCell className="text-muted-foreground">{o.hq ?? "—"}</TableCell>
                  <TableCell>
                    {o.focus ? (
                      <Badge variant="outline">{o.focus}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{o.permitsYtd}</TableCell>
                  <TableCell className="text-right tabular-nums">{o.rigs}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
