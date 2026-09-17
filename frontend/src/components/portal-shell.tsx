import { Link, useLocation } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Activity, ClipboardList, FileSearch, FolderOpen, LayoutDashboard, Menu, MessageSquareText, PanelLeftClose, Settings2, ShieldCheck, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ApiMode, HealthResponse } from "@/lib/fir-api";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/upload", label: "Upload & summarize", icon: Upload },
  { to: "/search/fir", label: "FIR number search", icon: FileSearch },
  { to: "/search/name", label: "Name search", icon: ClipboardList },
  { to: "/records", label: "All records", icon: FolderOpen },
  { to: "/assistant", label: "Assistant", icon: MessageSquareText },
  { to: "/settings", label: "Backend connection", icon: Settings2 },
] as const;

export function ModeBadge({ mode, health }: { mode: ApiMode; health?: HealthResponse | null }) {
  const isReady = mode === "live" && health?.model_loaded !== false;
  return (
    <Badge variant="outline" className={cn("gap-1.5 border-sidebar-border bg-sidebar/70 text-sidebar-foreground", mode === "demo" && "border-accent/70 text-accent")}>
      <span className={cn("size-1.5 rounded-full bg-accent", !isReady && "bg-chart-4")} />
      {isReady ? "System online" : "Local index offline"}
    </Badge>
  );
}

export function PortalShell({ children, mode = "demo", health = null }: { children: ReactNode; mode?: ApiMode; health?: HealthResponse | null }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const close = () => setMobileOpen(false);

  return (
    <div className="portal-shell min-h-screen bg-background">
      {/* Header — full width, no max-width constraint */}
      <header className="sticky top-0 z-30 w-full border-b border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="flex h-16 w-full items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" className="portal-focus flex items-center gap-3 rounded-sm" onClick={close}>
            <span className="flex size-9 items-center justify-center rounded-sm bg-sidebar-primary text-sidebar-primary-foreground">
              <ShieldCheck className="size-5" />
            </span>
            <span className="hidden sm:block">
              <span className="block font-serif text-sm font-bold tracking-wide">FIR SUMMARIZER</span>
              <span className="block text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/65">Investigation portal</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <ModeBadge mode={mode} health={health} />
            <Button
              variant="ghost"
              size="icon"
              className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground md:hidden"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
            >
              <Menu />
            </Button>
          </div>
        </div>
      </header>

      {/* Main layout: sidebar + content, full width */}
      <div className="flex w-full">
        {/* Sidebar — fixed left, no max-width wrapper */}
        <aside
          className={cn(
            "fixed inset-y-16 left-0 z-20 w-72 border-r border-sidebar-border bg-sidebar p-4 transition-transform md:sticky md:top-16 md:block md:h-[calc(100vh-4rem)] md:translate-x-0",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="mb-4 flex items-center justify-between md:hidden">
            <span className="portal-kicker text-sidebar-primary">Navigation</span>
            <Button
              variant="ghost"
              size="icon"
              className="text-sidebar-foreground hover:bg-sidebar-accent"
              aria-label="Close navigation"
              onClick={close}
            >
              <X />
            </Button>
          </div>
          <nav className="space-y-1" aria-label="Portal navigation">
            {navItems.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={close}
                className={cn(
                  "portal-focus flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  location.pathname === to &&
                    "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                )}
              >
                <Icon className="size-4" />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
          <div className="mt-8 border-t border-sidebar-border pt-5">
            <div className="flex items-start gap-2 text-sidebar-foreground/60">
              <Activity className="mt-0.5 size-4 text-sidebar-primary" />
              <p className="text-xs leading-5">
                Local workstation mode.<br />
                Records stay on this machine.
              </p>
            </div>
          </div>
        </aside>

        {/* Mobile overlay */}
        {mobileOpen && (
          <Button
            variant="ghost"
            className="fixed inset-0 z-10 h-auto w-auto rounded-none bg-sidebar/20 md:hidden"
            aria-label="Close navigation overlay"
            onClick={close}
          />
        )}

        {/* Main content — fills remaining space */}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-5 border-b border-border pb-6 sm:flex-row sm:items-end">
      <div>
        <p className="portal-kicker mb-2">{eyebrow}</p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="portal-kicker">{children}</p>;
}