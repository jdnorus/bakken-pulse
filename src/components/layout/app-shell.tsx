"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Bell,
  LayoutDashboard,
  MapPinned,
  Settings,
  Building2,
  FileText,
  Droplets,
} from "lucide-react";

import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/permits", label: "Permits", icon: FileText },
  { href: "/operators", label: "Operators", icon: Building2 },
  { href: "/counties", label: "Counties", icon: MapPinned },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard" || pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen w-full bg-muted/30">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex md:flex-col">
        <Link
          href="/dashboard"
          className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4 transition-colors hover:bg-sidebar-accent/40"
        >
          <div className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Droplets className="size-4" aria-hidden />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight">Bakken Pulse</p>
            <p className="text-[11px] text-muted-foreground">North Dakota activity</p>
          </div>
        </Link>
        <nav className="flex flex-1 flex-col gap-0.5 p-2">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="size-4 opacity-80" aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-3 text-[11px] text-muted-foreground">
          Mock data preview. Connect Supabase when ready.
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur md:hidden">
          <Link href="/dashboard" className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Droplets className="size-4" aria-hidden />
            </div>
            <p className="truncate text-sm font-semibold">Bakken Pulse</p>
          </Link>
        </header>
        <div className="flex gap-1 overflow-x-auto border-b border-border bg-background px-2 py-2 md:hidden">
          {nav.map(({ href, label }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1 text-xs font-medium",
                  active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {label}
              </Link>
            );
          })}
        </div>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-8 flex flex-col gap-1">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Activity className="size-4" aria-hidden />
        <span className="text-xs font-medium uppercase tracking-wider">Bakken Pulse</span>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {title}
      </h1>
      {description ? (
        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">{description}</p>
      ) : null}
    </div>
  );
}
