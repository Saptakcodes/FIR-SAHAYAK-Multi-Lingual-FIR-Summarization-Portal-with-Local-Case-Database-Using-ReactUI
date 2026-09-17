import { useEffect, useRef, useState } from "react";
import { CheckCircle2, FileText, Languages, Lock, ScanLine, Sparkles } from "lucide-react";

const STEPS = [
  { key: "scan", label: "Reading document", icon: ScanLine },
  { key: "extract", label: "Extracting fields", icon: FileText },
  { key: "summarize", label: "Writing summary", icon: Sparkles },
  { key: "done", label: "Ready for review", icon: CheckCircle2 },
] as const;

const FIELDS = [
  ["FIR number", "42/0125/2024"],
  ["Police station", "Barrackpore"],
  ["District", "North 24 Parganas"],
  ["Date of report", "18 March 2024"],
  ["Complainant", "Sujata Mondal"],
  ["Sections", "IPC 379, 411"],
];

const SUMMARY_LINES = [
  "A two-wheeler was reported stolen from the market parking area between 19:30 and 21:00 hours.",
  "The complainant identified the vehicle by registration and produced ownership papers at the station.",
  "Investigation assigned to the station duty officer; nearby shop cameras to be examined.",
];

const OCR_LINES = [
  "प्रथम सूचना रिपोर्ट — थाना बैरकपुर",
  "दिनांक 18/03/2024, समय 21:15",
  "शिकायतकर्ता: सुजाता मंडल, आयु 34",
  "मोटरसाइकिल बाजार पार्किंग से चोरी",
];

const DEMO_PHASE_DURATION = 2400;

/** Auto-cycling walkthrough of the summarize flow — a looping product demo. */
export function LandingDemo({ wide = false }: { wide?: boolean }) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => setVisible(entries.some((entry) => entry.isIntersecting)),
      { threshold: 0.25 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(
      () => setStep((current) => (current + 1) % (STEPS.length + 1)),
      DEMO_PHASE_DURATION,
    );
    return () => window.clearInterval(timer);
  }, [visible]);

  const active = Math.min(step, STEPS.length - 1);

  return (
    <div ref={ref} className="relative">
      <div
        data-wide={wide ? "true" : "false"}
        className="landing-demo-window overflow-hidden rounded-lg border border-border bg-card shadow-xl"
      >
        <div className="flex items-center gap-2.5 border-b border-border bg-muted/60 px-3 py-2.5">
          <span className="flex gap-1.5" aria-hidden>
            <span className="size-2 rounded-full bg-chart-4/70" />
            <span className="size-2 rounded-full bg-chart-5/80" />
            <span className="size-2 rounded-full bg-chart-2/60" />
          </span>
          <span className="flex flex-1 items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground">
            <Lock className="size-2.5" aria-hidden />
            localhost:8000 / summarize
          </span>
          <span className="hidden rounded-full bg-chart-2/12 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-chart-2 sm:inline">
            Offline
          </span>
        </div>

          <div className={`landing-demo-body grid min-h-0 gap-0 ${wide ? "flex-1 sm:grid-cols-[.82fr_1.18fr]" : "sm:grid-cols-[.85fr_1.15fr]"}`}>
          <div
            className={`relative min-w-0 overflow-hidden border-b border-border bg-muted/25 sm:border-b-0 sm:border-r ${wide ? "p-4 sm:p-5" : "p-5"}`}
          >
            <p className="portal-kicker">Scanned FIR</p>
            <div className="relative mt-4 overflow-hidden rounded-md border border-border bg-card px-4 py-4 shadow-[0_1px_0_var(--color-border)]">
              <div className="space-y-2.5">
                {OCR_LINES.map((line, index) => (
                  <p
                    key={line}
                    className="text-[11px] leading-5 text-foreground/75"
                    style={{ opacity: step >= 1 ? 1 : 0.28, transitionDelay: `${index * 70}ms` }}
                  >
                    {line}
                  </p>
                ))}
              </div>
              <div className="mt-4 space-y-2 border-t border-border pt-4" aria-hidden>
                {[100, 92, 96, 74].map((width, index) => (
                  <span
                    key={index}
                    className="block h-1.5 rounded-full bg-primary/10"
                    style={{ width: `${width}%` }}
                  />
                ))}
              </div>
              {step === 0 && <span className="landing-scanline" aria-hidden />}
            </div>
            <p className="mt-3 text-[10px] uppercase tracking-wider text-muted-foreground">
              Page 1 of 2 · Hindi OCR
            </p>
            <dl className="mt-5 space-y-2 border-t border-border pt-4 text-[10px] uppercase tracking-wider">
              {[
                ["Source", "Station scanner"],
                ["Detected script", "Devanagari"],
                ["Pages read", step >= 1 ? "2 / 2" : "1 / 2"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-semibold text-foreground/80">{value}</dd>
                </div>
              ))}
            </dl>
          </div>


           <div className={`min-w-0 ${wide ? "p-4 sm:p-5" : "p-5"}`}>
            <div className="flex flex-wrap items-center gap-2">
              {STEPS.map((item, index) => {
                const Icon = item.icon;
                const state = index < active ? "past" : index === active ? "now" : "next";
                return (
                  <span
                    key={item.key}
                    className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors duration-500 ${
                      state === "now"
                        ? "border-accent bg-accent/30 text-accent-foreground"
                        : state === "past"
                          ? "border-border bg-muted/60 text-muted-foreground"
                          : "border-border/60 text-muted-foreground/55"
                    }`}
                  >
                    <Icon className="size-3" aria-hidden />
                    {item.label}
                  </span>
                );
              })}
            </div>

             <div className={`mt-4 grid gap-2.5 ${wide ? "grid-cols-2 lg:grid-cols-3" : "grid-cols-2"}`}>
              {FIELDS.map(([label, value], index) => (
                <div
                  key={label}
                  className="rounded-md border border-border bg-background px-3 py-2"
                  style={{
                    opacity: step >= 2 ? 1 : 0.22,
                    transform: step >= 2 ? "none" : "translateY(6px)",
                     transitionDelay: `${index * 70}ms`,
                  }}
                >
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
                  <p className="mt-0.5 truncate text-xs font-semibold">{value}</p>
                </div>
              ))}
            </div>

             <div className="mt-4 rounded-md border border-border bg-muted/35 p-3.5">
              <p className="portal-kicker">English summary</p>
              <div className="mt-3 space-y-2">
                {SUMMARY_LINES.map((line, index) => (
                  <p
                    key={line}
                    className="text-[11px] leading-5 text-foreground/85"
                    style={{
                      opacity: step >= 3 ? 1 : 0.18,
                      transform: step >= 3 ? "none" : "translateY(6px)",
                       transitionDelay: `${index * 90}ms`,
                    }}
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>

            <div
              className="mt-4 flex flex-wrap items-center gap-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
              style={{ opacity: step >= 4 ? 1 : 0.35 }}
            >
              <span className="flex items-center gap-1.5 text-chart-2">
                <CheckCircle2 className="size-3.5" aria-hidden /> Saved to local index
              </span>
              <span className="flex items-center gap-1.5">
                <Languages className="size-3.5" aria-hidden /> Translation optional
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
