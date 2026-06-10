import { PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Workspace preferences and notification controls. Forms are static until Supabase auth and profiles are wired."
      />
      <Tabs defaultValue="workspace" className="w-full">
        <TabsList>
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>
        <TabsContent value="workspace" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Company profile</CardTitle>
              <CardDescription>Shown on shared exports and alert footers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="company">Company name</Label>
                <Input id="company" defaultValue="Prairie Basin Services" readOnly />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="region">Primary operating region</Label>
                <Input id="region" defaultValue="Williston Basin — ND" readOnly />
              </div>
            </CardContent>
            <CardFooter className="border-t bg-muted/40">
              <Button type="button" disabled>
                Save changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Digest and thresholds</CardTitle>
              <CardDescription>Control how your team hears about new permits and alerts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label htmlFor="digest">Weekly Bakken digest</Label>
                  <p className="text-sm text-muted-foreground">Summary email every Monday 06:00 CT</p>
                </div>
                <Switch id="digest" defaultChecked aria-label="Weekly digest" />
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label htmlFor="critical">Critical alerts only</Label>
                  <p className="text-sm text-muted-foreground">SMS for disposal and gas plant risk tiers</p>
                </div>
                <Switch id="critical" aria-label="Critical alerts only" />
              </div>
            </CardContent>
            <CardFooter className="border-t bg-muted/40">
              <p className="text-xs text-muted-foreground">
                Notification delivery will use Supabase-backed preferences in a later iteration.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="data" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Supabase connection</CardTitle>
              <CardDescription>
                Set <code className="rounded bg-muted px-1 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
                and <code className="rounded bg-muted px-1 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
                from your project dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Apply <code className="rounded bg-muted px-1 py-0.5 text-xs">supabase/migrations/001_initial_schema.sql</code>{" "}
                in the Supabase SQL editor, then optionally run{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">supabase/seed.sql</code> for dev data.
              </p>
              <p>
                Pages read through <code className="rounded bg-muted px-1 py-0.5 text-xs">src/lib/data</code> and
                fall back to mock preview data when env vars are missing.
              </p>
              <p>
                Load ND well activity with{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">npm run ingest:nd</code> (uses{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">src/lib/ingest/ndOilGas.ts</code> and the
                public DMR MapServer wells layer).
              </p>
              <p>
                <strong className="text-foreground">Scheduled ingest:</strong> GitHub Actions hourly (
                <code className="rounded bg-muted px-1 py-0.5 text-xs">.github/workflows/ingest-nd.yml</code>
                ), Vercel Cron daily on Hobby (
                <code className="rounded bg-muted px-1 py-0.5 text-xs">/api/cron/ingest-nd</code> +{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">CRON_SECRET</code>
                ), or local{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">npm run ingest:nd:cron</code> via crontab.
              </p>
              <p>
                Dashboard pages auto-refresh from Supabase every hour (
                <code className="rounded bg-muted px-1 py-0.5 text-xs">revalidate = 3600</code> in production).
              </p>
            </CardContent>
            <CardFooter className="border-t bg-muted/40">
              <Button variant="outline" type="button" disabled>
                Verify connection
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
