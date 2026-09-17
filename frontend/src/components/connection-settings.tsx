import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, PlugZap, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PortalShell } from "@/components/portal-shell";
import {
  DEFAULT_BACKEND_URL,
  getBackendUrl,
  getHealth,
  setBackendUrl,
  type ApiMode,
  type HealthResponse,
} from "@/lib/fir-api";

type Probe = {
  path: string;
  label: string;
  status: "idle" | "checking" | "ok" | "fail";
  detail?: string;
};

const PROBES: Array<{ path: string; label: string }> = [
  { path: "/health", label: "Service health" },
  { path: "/records?limit=1", label: "Records listing" },
  { path: "/search?name=test", label: "Name search (POST)" },
  { path: "/ask?q=test", label: "Assistant query" },
];

export function ConnectionSettingsPage() {
  const [url, setUrl] = useState(DEFAULT_BACKEND_URL);
  const [mode, setMode] = useState<ApiMode>("offline");
  const [health, setHealth] = useState<HealthResponse>({
    status: "offline",
    model_loaded: false,
    records: 0,
  });
  const [probes, setProbes] = useState<Probe[]>(PROBES.map((p) => ({ ...p, status: "idle" })));
  const [testing, setTesting] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setUrl(getBackendUrl());
    void getHealth().then(({ data, mode: m }) => {
      setHealth(data);
      setMode(m);
    });
  }, []);

  async function runTests() {
    const base = setBackendUrl(url);
    setUrl(base);
    setSaved(true);
    setTesting(true);
    setProbes(PROBES.map((p) => ({ ...p, status: "checking" })));

    const results = await Promise.all(
      PROBES.map(async (probe) => {
        const controller = new AbortController();
        const timer = window.setTimeout(() => controller.abort(), 6000);
        try {
          const response = await fetch(`${base}${probe.path}`, {
            method: probe.path.startsWith("/search") ? "POST" : "GET",
            signal: controller.signal,
            headers: { Accept: "application/json" },
          });
          return {
            ...probe,
            status: response.ok ? ("ok" as const) : ("fail" as const),
            detail: `HTTP ${response.status}`,
          };
        } catch {
          return { ...probe, status: "fail" as const, detail: "Unreachable" };
        } finally {
          window.clearTimeout(timer);
        }
      }),
    );

    setProbes(results);
    const next = await getHealth();
    setHealth(next.data);
    setMode(next.mode);
    setTesting(false);
  }

  return (
    <PortalShell mode={mode} health={health}>
      <div className="mx-auto w-full max-w-3xl px-5 py-8 md:px-8">
        <p className="portal-kicker text-primary">Configuration</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Backend connection
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Point the portal at your local FastAPI service. When it is unreachable the portal shows an
          explicit offline state until the service is available.
        </p>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">API base URL</CardTitle>
            <CardDescription>
              Stored on this workstation only. Default is {DEFAULT_BACKEND_URL}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                value={url}
                onChange={(event) => {
                  setUrl(event.target.value);
                  setSaved(false);
                }}
                placeholder="http://localhost:8000"
                aria-label="Backend base URL"
                className="font-mono text-sm"
              />
              <Button onClick={() => void runTests()} disabled={testing} className="sm:w-48">
                {testing ? <Loader2 className="animate-spin" /> : <PlugZap />}
                {testing ? "Testing…" : "Save & test"}
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">{mode === "live" ? "Live backend" : "Offline"}</Badge>
              {health && (
                <span>
                  Model {health.model_loaded ? "loaded" : "loading"} · {health.records ?? "—"}{" "}
                  records indexed
                </span>
              )}
              {saved && !testing && <span>Settings saved.</span>}
            </div>
          </CardContent>
        </Card>

        <Card className="mt-5">
          <CardHeader>
            <CardTitle className="text-base">Endpoint checks</CardTitle>
            <CardDescription>
              Each documented endpoint is probed directly against the configured host.
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            {probes.map((probe) => (
              <div
                key={probe.path}
                className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{probe.label}</p>
                  <p className="truncate font-mono text-xs text-muted-foreground">{probe.path}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-xs">
                  {probe.status === "checking" && (
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  )}
                  {probe.status === "ok" && <CheckCircle2 className="size-4 text-primary" />}
                  {probe.status === "fail" && <XCircle className="size-4 text-destructive" />}
                  <span className="text-muted-foreground">
                    {probe.status === "idle" ? "Not tested" : probe.detail || probe.status}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PortalShell>
  );
}
