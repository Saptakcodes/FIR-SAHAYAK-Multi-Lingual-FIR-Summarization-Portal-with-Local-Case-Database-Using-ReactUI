import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Database, FileCheck2, FileUp, Languages, Loader2, MessageSquareText, Search, Server, ShieldCheck, Sparkles, WifiOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PortalShell, PageHeader, SectionLabel } from "@/components/portal-shell";
import { MetadataGrid, RecordDetail, RecordTable, SummaryActions, valueOrFallback } from "@/components/record-ui";
import { askRecords, getHealth, getRecords, searchByFirNumber, searchRecords, summarizeFile, type ApiMode, type FirRecord, type HealthResponse, type RecordsResponse, type SummaryResponse } from "@/lib/fir-api";

const languages = [
  { value: "none", label: "English only" },
  { value: "bn", label: "বাংলা · Bengali" },
  { value: "hi", label: "हिन्दी · Hindi" },
  { value: "te", label: "తెలుగు · Telugu" },
  { value: "ta", label: "தமிழ் · Tamil" },
  { value: "or", label: "ଓଡ଼ିଆ · Odia" },
  { value: "mr", label: "मराठी · Marathi" },
  { value: "gu", label: "ગુજરાતી · Gujarati" },
  { value: "kn", label: "ಕನ್ನಡ · Kannada" },
  { value: "ml", label: "മലയാളം · Malayalam" },
  { value: "pa", label: "ਪੰਜਾਬੀ · Punjabi" },
  { value: "ur", label: "اردو · Urdu" },
  { value: "sa", label: "संस्कृतम् · Sanskrit" },
];

const LANGUAGE_MAP: Record<string, string> = Object.fromEntries(
  languages.map(({ value, label }) => [value, label])
);

// ─────────────────────────────────────────────────────────────
// Crime chips — keys match CRIME_KEYWORD_MAP in parser.py
// ─────────────────────────────────────────────────────────────
const CRIME_CHIPS = [
  { key: "robbery", label: "Robbery" },
  { key: "theft", label: "Theft" },
  { key: "dacoity", label: "Dacoity" },
  { key: "burglary", label: "Burglary" },
  { key: "assault", label: "Assault" },
  { key: "harassment", label: "Harassment" },
  { key: "molestation", label: "Molestation" },
  { key: "cheating", label: "Cheating / Fraud" },
  { key: "cyber crime", label: "Cyber Crime" },
  { key: "kidnapping", label: "Kidnapping" },
  { key: "extortion", label: "Extortion" },
  { key: "domestic violence", label: "Domestic Violence" },
  { key: "murder", label: "Murder" },
  { key: "hurt", label: "Hurt / Injury" },
] as const;

/** Convert ISO "2025-01-01" → "1 Jan 2025" so the backend parser understands it. */
function isoToNatural(iso: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

function usePortalData() {
  const [mode, setMode] = useState<ApiMode>("offline");
  const [health, setHealth] = useState<HealthResponse>({ status: "offline", model_loaded: false, records: 0 });
  useEffect(() => { let active = true; void getHealth().then((result) => { if (active) { setMode(result.mode); setHealth(result.data); } }); return () => { active = false; }; }, []);
  return { mode, health };
}

// ----- UPDATED StatusPanel -----
function StatusPanel({ mode, health }: { mode: ApiMode; health: HealthResponse | null }) {
  const isLive = mode === "live";
  return (
    <div
      className={`flex flex-col gap-4 rounded-xl border p-5 shadow-sm transition-all sm:flex-row sm:items-center sm:justify-between ${
        isLive
          ? "border-chart-2/30 bg-chart-2/5"
          : "border-chart-4/30 bg-chart-4/5"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex size-10 items-center justify-center rounded-lg ${
            isLive
              ? "bg-chart-2/15 text-chart-2"
              : "bg-chart-4/15 text-chart-4"
          }`}
        >
          {isLive ? <Server className="size-5" /> : <WifiOff className="size-5" />}
        </span>
        <div>
          <p className="text-sm font-semibold">
            {isLive ? "✅ Service connected" : "⚠️ No local index connected"}
          </p>
          <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
            {isLive
              ? health?.model_loaded
                ? "OCR and summarization model ready. Live records are shown."
                : "The service is starting its local model. Try again shortly."
              : "Connect the local processing service or upload a document to begin."}
          </p>
        </div>
      </div>
      <Badge
        variant={isLive ? "default" : "outline"}
        className={`shrink-0 ${
          isLive
            ? "bg-chart-2/15 text-chart-2 hover:bg-chart-2/20"
            : ""
        }`}
      >
        {`${health?.records ?? 0} records indexed`}
      </Badge>
    </div>
  );
}

// ----- Legacy home (unchanged) -----
function LegacyHomeLanding() {
  return <div className="portal-grid min-h-screen bg-background"><header className="border-b border-sidebar-border bg-sidebar text-sidebar-foreground"><div className="mx-auto flex h-16 w-[min(100%-2rem,1180px)] items-center justify-between"><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-sm bg-sidebar-primary text-sidebar-primary-foreground"><ShieldCheck className="size-5" /></span><div><span className="block font-serif text-sm font-bold tracking-wide">FIR SUMMARIZER</span><span className="block text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/65">Investigation portal</span></div></div><Badge variant="outline" className="border-sidebar-border bg-sidebar/70 text-sidebar-foreground">Local-first workspace</Badge></div></header><main className="mx-auto w-[min(100%-2rem,1180px)] py-14 sm:py-20"><div className="portal-rise max-w-3xl"><p className="portal-kicker">For investigation teams</p><h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">Turn handwritten FIRs into a clearer case brief.</h1><p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">Extract the record, review the evidence, summarize the narrative, and find related FIRs from one focused workstation portal.</p><div className="mt-8 flex flex-wrap gap-3"><Button asChild size="lg"><Link to="/dashboard">Enter investigation portal <ArrowRight /></Link></Button><Button asChild variant="outline" size="lg"><Link to="/upload">Upload an FIR <FileUp /></Link></Button></div></div><div className="mt-16 grid gap-4 border-t border-border pt-8 sm:grid-cols-3"><Feature icon={FileCheck2} title="Structured extraction" text="Review 14 core metadata fields alongside the original OCR narrative." /><Feature icon={Sparkles} title="Local summarization" text="Use a locally hosted model without sending case documents away." /><Feature icon={Search} title="Fast retrieval" text="Search by FIR number, complainant, station, or natural language." /></div><div className="mt-14 grid gap-4 sm:grid-cols-3"><Metric value="PDF · PNG · JPG" label="Accepted documents" /><Metric value="12+ languages" label="Optional translation" /><Metric value="SQLite" label="Local record store" /></div></main></div>;
}

function Feature({ icon: Icon, title, text }: { icon: typeof FileCheck2; title: string; text: string }) { return <div className="border-l-2 border-accent pl-4"><Icon className="size-5 text-chart-1" /><h2 className="mt-3 font-serif text-lg font-bold">{title}</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p></div>; }
function Metric({ value, label }: { value: string; label: string }) { return <div className="border border-border bg-card p-4"><p className="font-serif text-xl font-bold text-primary">{value}</p><p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{label}</p></div>; }

// ----- UPDATED Stat -----
function Stat({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: typeof Database;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-chart-1/20 hover:shadow-md">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-chart-1/10 p-2.5 text-chart-1">
          <Icon className="size-5" />
        </div>
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <p className="mt-3 font-serif text-3xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
      <div className="absolute -right-4 -top-4 size-16 rounded-full bg-chart-1/5 blur-2xl transition-colors group-hover:bg-chart-1/10" />
    </div>
  );
}

// ----- UPDATED ActionLink -----
function ActionLink({
  to,
  icon: Icon,
  label,
}: {
  to: "/upload" | "/search/fir" | "/search/name" | "/assistant";
  icon: typeof FileUp;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-center justify-between rounded-lg border border-border bg-card/50 px-4 py-3.5 text-sm font-medium transition-all hover:border-chart-1/30 hover:bg-muted/30 hover:shadow-sm"
    >
      <span className="flex items-center gap-3">
        <span className="rounded-md bg-chart-1/10 p-1.5 text-chart-1 transition-colors group-hover:bg-chart-1/20">
          <Icon className="size-4" />
        </span>
        {label}
      </span>
      <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
    </Link>
  );
}

// ----- UPDATED DashboardPage -----
export function DashboardPage() {
  const { mode, health } = usePortalData();
  const [records, setRecords] = useState<FirRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<FirRecord | null>(null);

  useEffect(() => {
    void getRecords(5).then((result) => setRecords(result.data.results));
  }, []);

  return (
    <PortalShell mode={mode} health={health}>
      <div className="portal-main">
        <PageHeader
          eyebrow="Overview"
          title="Investigation dashboard"
          description="A current view of the local FIR processing service and indexed case records."
          action={
            <Button asChild>
              <Link to="/upload">
                <FileUp /> New upload
              </Link>
            </Button>
          }
        />

        <StatusPanel mode={mode} health={health} />

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <Stat
            icon={Database}
            label="Total records"
            value={String(health?.records ?? 0)}
            note={mode === "live" ? "From local database" : "No index connected"}
          />
          <Stat
            icon={Languages}
            label="Languages"
            value="12+"
            note="Optional translation"
          />
          <Stat
            icon={Clock3}
            label="OCR speed"
            value="< 2 sec"
            note="Per page, typical"
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
          <section>
            <div className="mb-3 flex items-end justify-between">
              <div>
                <SectionLabel>Recent activity</SectionLabel>
                <h2 className="mt-1 font-serif text-2xl font-bold">
                  Latest FIR records
                </h2>
              </div>
              <Link
                to="/records"
                className="portal-focus text-sm font-semibold text-primary hover:underline"
              >
                View all
              </Link>
            </div>
            <RecordTable
              records={records}
              emptyMessage="No FIR records found on this workstation. Upload a document to start processing."
              onRowClick={setSelectedRecord}
            />
          </section>

          <section className="portal-panel rounded-xl border border-border bg-card p-5 shadow-sm">
            <SectionLabel>Quick actions</SectionLabel>
            <h2 className="mt-1 font-serif text-2xl font-bold">
              Start a workflow
            </h2>
            <div className="mt-5 space-y-2.5">
              <ActionLink to="/upload" icon={FileUp} label="Upload & summarize" />
              <ActionLink
                to="/search/fir"
                icon={FileCheck2}
                label="Search FIR number"
              />
              <ActionLink
                to="/search/name"
                icon={Search}
                label="Search by name"
              />
              <ActionLink
                to="/assistant"
                icon={MessageSquareText}
                label="Ask about records"
              />
            </div>
          </section>
        </div>
      </div>

      {selectedRecord && (
        <RecordDetailPanel
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </PortalShell>
  );
}

// ----- RecordDetailPanel (unchanged) -----
function RecordDetailPanel({ record, onClose }: { record: FirRecord; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/30 backdrop-blur-sm">
      <div className="relative h-full w-full max-w-2xl overflow-y-auto bg-background p-6 shadow-2xl animate-in slide-in-from-right">
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
          <X className="size-5" />
        </button>
        <div className="mt-8">
          <RecordDetail record={record} />
        </div>
      </div>
    </div>
  );
}

// ----- UploadPage (unchanged) -----
export function UploadPage() {
  const { mode, health } = usePortalData(); const [file, setFile] = useState<File | null>(null); const [language, setLanguage] = useState("none"); const [result, setResult] = useState<SummaryResponse | null>(null); const [processing, setProcessing] = useState(false); const [error, setError] = useState(""); const [translationUnavailable, setTranslationUnavailable] = useState(false);
  const process = async () => { if (!file) return; setProcessing(true); setError(""); setResult(null); try { const response = await summarizeFile(file, language); setResult(response.data); if (response.data.translation_status === "failed") setTranslationUnavailable(true); } catch (err) { const status = (err as { status?: number }).status; setError(status === 503 ? "The summarization model is still loading. Please retry in a moment." : status === 400 ? "This document could not be read. Try a clearer scan or a supported file type." : "The local processing service returned an error. Please retry."); } finally { setProcessing(false); } };
  return <PortalShell mode={mode} health={health}><div className="portal-main"><PageHeader eyebrow="Document intake" title="Upload & summarize" description="Process a scanned FIR, inspect extracted fields, and save a reviewable summary." /><div className="grid gap-6 lg:grid-cols-[.72fr_1.28fr]"><section className="space-y-5"><div className="portal-panel p-5"><SectionLabel>Step 01 · Document</SectionLabel><h2 className="mt-1 font-serif text-xl font-bold">Select an FIR file</h2><label className="mt-5 flex min-h-44 cursor-pointer flex-col items-center justify-center border border-dashed border-input bg-muted/30 px-5 text-center transition-colors hover:border-chart-1 hover:bg-muted/55"><FileUp className="size-7 text-chart-1" /><span className="mt-3 text-sm font-semibold">{file ? file.name : "Choose a document"}</span><span className="mt-1 text-xs text-muted-foreground">PDF, PNG, JPG, JPEG, TIFF, or TXT · up to your backend limit</span><input type="file" accept=".pdf,.png,.jpg,.jpeg,.tiff,.txt" className="sr-only" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setResult(null); }} /></label>{file && <p className="mt-3 text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB selected</p>}</div><div className="portal-panel p-5"><SectionLabel>Step 02 · Translation</SectionLabel><h2 className="mt-1 font-serif text-xl font-bold">Choose output language</h2><select value={language} disabled={processing || translationUnavailable} onChange={(event) => setLanguage(event.target.value)} className="portal-focus mt-5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="none">English only</option>{languages.filter((item) => item.value !== "none").map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select><p className="mt-3 text-xs leading-5 text-muted-foreground">Translation requires an internet connection. OCR and English summarization remain local.</p>{translationUnavailable && <p className="mt-2 flex gap-2 text-xs text-chart-4"><WifiOff className="size-3.5" />Translation is unavailable; English-only output is selected.</p>}<Button className="mt-5 w-full" disabled={!file || processing} onClick={() => void process()}>{processing ? <><Loader2 className="animate-spin" />Processing document…</> : <><Sparkles />Process FIR</>}</Button></div>{error && <div className="flex gap-3 border border-chart-4/40 bg-chart-4/10 p-4 text-sm"><AlertCircle className="size-5 shrink-0 text-chart-4" /><span>{error}</span></div>}</section><section>{processing ? <div className="portal-panel flex min-h-[460px] flex-col items-center justify-center p-8 text-center"><Loader2 className="size-9 animate-spin text-chart-1" /><h2 className="mt-5 font-serif text-xl font-bold">Reading the FIR</h2><p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">OCR and summarization can take 10–30 seconds on a workstation. Keep this page open.</p></div> : result ? <SummaryResult result={result} /> : <div className="portal-panel flex min-h-[460px] flex-col items-center justify-center p-8 text-center"><FileCheck2 className="size-9 text-muted-foreground/40" /><h2 className="mt-5 font-serif text-xl font-bold">Your result will appear here</h2><p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Select an FIR document to see extracted metadata, an English summary, optional translation, and raw OCR.</p></div>}</section></div></div></PortalShell>;
}

function SummaryResult({ result }: { result: SummaryResponse }) {
  const displayLanguage = LANGUAGE_MAP[result.target_language ?? ""] ?? result.target_language ?? "English";
  return <div className="space-y-5"><div className="portal-panel p-5"><div className="flex flex-col justify-between gap-3 border-b border-border pb-4 sm:flex-row sm:items-start"><div><SectionLabel>Processed result</SectionLabel><h2 className="mt-1 font-serif text-2xl font-bold">FIR brief ready</h2></div><Badge variant={result.translation_status === "failed" ? "destructive" : "secondary"}>
      {result.translation_status === "ok"
        ? `Translated · ${displayLanguage}`
        : result.translation_status === "skipped"
          ? "English output"
          : result.translation_status}
    </Badge></div><div className="mt-5"><MetadataGrid metadata={result.metadata} /></div></div><div className="portal-panel p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><SectionLabel>English summary</SectionLabel><h2 className="mt-1 font-serif text-xl font-bold">Case narrative</h2></div><SummaryActions summary={result} /></div><p className="mt-5 text-sm leading-7 text-foreground/85">{result.summary}</p></div>{result.translated_summary && <div className="portal-panel p-5"><SectionLabel>Translation</SectionLabel><h2 className="mt-1 font-serif text-xl font-bold">{displayLanguage} output</h2><p className="mt-4 text-sm leading-8 text-foreground/85">{result.translated_summary}</p>{result.translation_note && <p className="mt-3 text-xs text-muted-foreground">{result.translation_note}</p>}</div>}<details className="portal-panel group p-5"><summary className="cursor-pointer list-none font-semibold"><span className="flex items-center justify-between">Raw OCR text <ChevronRight className="size-4 transition-transform group-open:rotate-90" /></span></summary><div className="mt-4 border-t border-border pt-4"><p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{result.original_text || result.narrative}</p></div></details></div>;
}

// ----- SearchPage (unchanged) -----
export function FirSearchPage({ initialQuery = "" }: { initialQuery?: string }) { return <SearchPage kind="fir" initialQuery={initialQuery} />; }
export function NameSearchPage() { return <SearchPage kind="name" />; }

function SearchPage({ kind, initialQuery = "" }: { kind: "fir" | "name"; initialQuery?: string }) {
  const { mode, health } = usePortalData();
  const [query, setQuery] = useState(initialQuery);
  const [result, setResult] = useState<RecordsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<FirRecord | null>(null);
  const title = kind === "fir" ? "Search by FIR number" : "Search by name";
  const run = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    try {
      const response = kind === "fir" ? await searchByFirNumber(query.trim()) : await searchRecords(query.trim());
      setResult(response.data);
    } catch (err) {
      const status = (err as { status?: number }).status;
      setResult(null);
      setError(status === 404 ? "No matching FIR was found." : "The search service returned an error. Please retry.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { if (initialQuery) void run(); }, []);
  return (
    <PortalShell mode={mode} health={health}>
      <div className="portal-main">
        <PageHeader eyebrow="Record retrieval" title={title} description={kind === "fir" ? "Locate a specific case using its registered FIR number." : "Find records by complainant, accused person, station, address, or indexed text."} />
        <div className="portal-panel p-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void run(); }} className="pl-9" placeholder={kind === "fir" ? "e.g. 0125/2024" : "e.g. complainant name"} aria-label={title} />
            </div>
            <Button onClick={() => void run()} disabled={!query.trim() || loading}>{loading ? <Loader2 className="animate-spin" /> : <Search />} Search records</Button>
          </div>
        </div>
        <div className="mt-8">
          {error ? <div className="flex gap-3 border border-chart-4/40 bg-chart-4/10 p-4 text-sm"><AlertCircle className="size-5 text-chart-4" />{error}</div> : result ? <>
            <div className="mb-3 flex items-center justify-between">
              <div><SectionLabel>Results</SectionLabel><p className="mt-1 text-sm text-muted-foreground">{result.count} matching record{result.count === 1 ? "" : "s"}</p></div>
            </div>
            <RecordTable records={result.results} onRowClick={setSelectedRecord} />
          </> : <div className="portal-panel flex min-h-60 flex-col items-center justify-center text-center"><Search className="size-8 text-muted-foreground/40" /><p className="mt-3 text-sm text-muted-foreground">Enter a query to inspect indexed records.</p></div>}
        </div>
      </div>
      {selectedRecord && <RecordDetailPanel record={selectedRecord} onClose={() => setSelectedRecord(null)} />}
    </PortalShell>
  );
}

// ----- RecordsPage (unchanged) -----
export function RecordsPage() {
  const { mode, health } = usePortalData();
  const [page, setPage] = useState(0);
  const [data, setData] = useState<RecordsResponse>({ results: [], count: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<FirRecord | null>(null);
  const limit = 5;
  useEffect(() => {
    setLoading(true);
    void getRecords(limit, page * limit).then((result) => setData(result.data)).finally(() => setLoading(false));
  }, [page]);
  const total = data.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / limit));
  return (
    <PortalShell mode={mode} health={health}>
      <div className="portal-main">
        <PageHeader eyebrow="Record index" title="All FIR records" description="Browse the locally indexed records with the same fields returned by the backend." action={<Button asChild variant="outline"><Link to="/search/name"><Search /> Search records</Link></Button>} />
        {loading ? <div className="portal-panel flex min-h-52 items-center justify-center"><Loader2 className="animate-spin text-chart-1" /></div> : <>
          <RecordTable records={data.results} onRowClick={setSelectedRecord} />
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>Page {page + 1} of {pages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" aria-label="Previous page" disabled={page === 0} onClick={() => setPage((value) => value - 1)}><ChevronLeft /></Button>
              <Button variant="outline" size="icon" aria-label="Next page" disabled={page + 1 >= pages} onClick={() => setPage((value) => value + 1)}><ChevronRight /></Button>
            </div>
          </div>
        </>}
      </div>
      {selectedRecord && <RecordDetailPanel record={selectedRecord} onClose={() => setSelectedRecord(null)} />}
    </PortalShell>
  );
}

// ----- UPDATED AssistantPage with quick filters -----
export function AssistantPage() {
  const { mode, health } = usePortalData();
  const [freeText, setFreeText] = useState("");
  const [activeCrime, setActiveCrime] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [messages, setMessages] = useState<{ role: "user" | "system"; text: string; results?: FirRecord[] }[]>([
    { role: "system", text: "Ask about the indexed FIR records. Use the quick filters below or type freely — I'll combine them automatically." }
  ]);
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<FirRecord | null>(null);

  const buildQuery = (overrideText?: string) => {
    const parts: string[] = [];
    const text = (overrideText ?? freeText).trim();

    if (activeCrime) {
      parts.push(activeCrime);
      parts.push("cases");
    }
    if (text) {
      parts.push(text);
    }

    // Date range — always emit both endpoints if either is set
    let fromVal = dateFrom;
    let toVal = dateTo;
    if (fromVal && !toVal) {
      toVal = new Date().toISOString().slice(0, 10);
    }
    if (toVal && !fromVal) {
      fromVal = "2020-01-01";
    }
    if (fromVal && toVal) {
      parts.push(`between ${isoToNatural(fromVal)} and ${isoToNatural(toVal)}`);
    }

    return parts.join(" ").trim() || "show me all FIRs";
  };

  const run = async (overrideText?: string) => {
    const q = buildQuery(overrideText);
    if (!q) return;

    setMessages((items) => [...items, { role: "user", text: q }]);
    setFreeText("");
    setLoading(true);

    try {
      const response = await askRecords(q);
      const count = response.data.count || 0;
      const results = response.data.results || [];
      const msg = count
        ? `I found ${count} matching record${count === 1 ? "" : "s"}.`
        : "No matching FIRs were found in the indexed records.";
      setMessages((items) => [...items, { role: "system", text: msg, results }]);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setActiveCrime(null);
    setDateFrom("");
    setDateTo("");
  };

  const hasActiveFilters = Boolean(activeCrime || dateFrom || dateTo);

  return (
    <PortalShell mode={mode} health={health}>
      <div className="portal-main">
        <PageHeader
          eyebrow="Record assistant"
          title="Ask the FIR index"
          description="Combine quick filters with free-form queries to retrieve matching cases from the local database."
        />

        <div className="portal-panel overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {/* Chat area */}
          <div className="min-h-[360px] max-h-[520px] space-y-5 overflow-y-auto bg-muted/20 p-5">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={message.role === "user" ? "ml-auto max-w-[85%]" : "max-w-[85%]"}
              >
                <div className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}>
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-sm ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-accent text-accent-foreground"
                    }`}
                  >
                    {message.role === "user"
                      ? <MessageSquareText className="size-4" />
                      : <Database className="size-4" />}
                  </span>
                  <div
                    className={`border p-3 text-sm leading-6 ${
                      message.role === "user"
                        ? "border-primary/20 bg-primary text-primary-foreground"
                        : "border-border bg-card"
                    }`}
                  >
                    {message.text}
                    {message.results && message.results.length > 0 && (
                      <div className="mt-3">
                        <RecordTable
                          records={message.results}
                          onRowClick={setSelectedRecord}
                          emptyMessage="No records found"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Searching indexed records…
              </div>
            )}
          </div>

          {/* Quick filters bar */}
          <div className="border-t border-border bg-card px-4 pt-4">
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowFilters((v) => !v)}
                className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
              >
                <Sparkles className="size-3.5" />
                Quick filters
                <ChevronRight className={`size-3.5 transition-transform ${showFilters ? "rotate-90" : ""}`} />
              </button>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-xs font-medium text-chart-4 hover:underline"
                >
                  <X className="size-3.5" /> Clear filters
                </button>
              )}
            </div>

            {showFilters && (
              <div className="space-y-3 pb-3">
                {/* Crime type chips */}
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Crime type
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {CRIME_CHIPS.map((chip) => {
                      const active = activeCrime === chip.key;
                      return (
                        <button
                          key={chip.key}
                          type="button"
                          onClick={() => setActiveCrime(active ? null : chip.key)}
                          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                            active
                              ? "border-chart-1 bg-chart-1/15 text-chart-1"
                              : "border-border bg-background text-muted-foreground hover:border-chart-1/40 hover:text-foreground"
                          }`}
                        >
                          {chip.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Date range */}
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Date range (registered)
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="h-9 w-auto text-xs"
                      aria-label="From date"
                    />
                    <span className="text-xs text-muted-foreground">to</span>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="h-9 w-auto text-xs"
                      aria-label="To date"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Free text input + send */}
          <div className="border-t border-border bg-card p-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Textarea
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void run();
                  }
                }}
                placeholder="Optional: add free text (e.g. in Belghoria, involving a scooter)"
                className="min-h-12 resize-none"
                aria-label="Free text query"
              />
              <Button onClick={() => void run()} disabled={loading}>
                <Search /> Search
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Filters and text are combined automatically. Verify every detail against the original FIR.
            </p>
          </div>
        </div>
      </div>
      {selectedRecord && (
        <RecordDetailPanel record={selectedRecord} onClose={() => setSelectedRecord(null)} />
      )}
    </PortalShell>
  );
}