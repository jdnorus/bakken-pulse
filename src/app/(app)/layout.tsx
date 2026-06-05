import { AppShell } from "@/components/layout/app-shell";

/** Re-fetch dashboard data from Supabase at most once per hour. */
export const revalidate = 3600;

export default function AppSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
