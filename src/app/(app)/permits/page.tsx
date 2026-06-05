import type { ComponentProps } from "react";

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
import { dataSourceLabel, getPermits } from "@/lib/data";

function statusVariant(status: string): ComponentProps<typeof Badge>["variant"] {
  if (status === "Approved") return "secondary";
  if (status === "Under review") return "outline";
  if (status === "Awaiting bond") return "destructive";
  return "outline";
}

export default async function PermitsPage() {
  const { data: permits, source } = await getPermits({ limit: 50 });

  return (
    <>
      <PageHeader
        title="Permits"
        description={`Track drilling, recompletion, and regulatory filings across North Dakota counties. Source: ${dataSourceLabel(source)}.`}
      />
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Recent filings</CardTitle>
          <CardDescription>
            {permits.length} permit{permits.length === 1 ? "" : "s"} loaded
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Permit ID</TableHead>
                <TableHead>Operator</TableHead>
                <TableHead>Well</TableHead>
                <TableHead>County</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Filed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {permits.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.externalId}</TableCell>
                  <TableCell className="font-medium">{p.operatorName}</TableCell>
                  <TableCell className="text-muted-foreground">{p.wellName}</TableCell>
                  <TableCell>{p.countyName}</TableCell>
                  <TableCell>{p.permitType}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(p.status)}>{p.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {p.filedAt}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
