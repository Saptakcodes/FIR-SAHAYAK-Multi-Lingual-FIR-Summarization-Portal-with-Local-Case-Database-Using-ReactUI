import { Link } from "@tanstack/react-router";
import { ChevronRight, Copy, Download, FileText, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { FirRecord, SummaryResponse } from "@/lib/fir-api";

/**
 * Friendly display labels for backend metadata keys.
 * Anything not in this map is shown as-is.
 */
const METADATA_LABEL_MAP: Record<string, string> = {
  "Complainant Father": "Complainant's Father / Husband",
};

function displayLabel(key: string): string {
  return METADATA_LABEL_MAP[key] ?? key;
}

export function valueOrFallback(value: unknown) {
  return value === null || value === undefined || value === "" || value === "Not available"
    ? "Not explicitly stated"
    : String(value);
}

export function RecordTable({
  records,
  emptyMessage = "No FIR records match this search.",
  onRowClick,
}: {
  records: FirRecord[];
  emptyMessage?: string;
  onRowClick?: (record: FirRecord) => void;
}) {
  if (!records.length) {
    return (
      <div className="portal-panel flex flex-col items-center justify-center px-6 py-16 text-center rounded-xl border border-border bg-card shadow-sm">
        <FileText className="mb-3 size-8 text-muted-foreground/50" />
        <h3 className="font-serif text-lg font-bold">No records found</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="portal-panel overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px] text-left text-sm">
          <thead className="border-b border-border/60 bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">FIR #</th>
              <th className="px-4 py-3 font-semibold">Complainant</th>
              <th className="px-4 py-3 font-semibold">Accused</th>
              <th className="px-4 py-3 font-semibold">Station</th>
              <th className="px-4 py-3 font-semibold">District</th>
              <th className="px-4 py-3 font-semibold">Registered</th>
              <th className="px-4 py-3 font-semibold">Incident</th>
              <th className="px-4 py-3 font-semibold">Sections</th>
              <th className="px-4 py-3 font-semibold">Property</th>
              <th className="px-4 py-3 font-semibold">Value (Rs)</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {records.map((record) => (
              <tr
                key={record.id}
                className="group cursor-pointer transition-colors duration-150 hover:bg-muted/20"
                onClick={() => onRowClick?.(record)}
              >
                <td className="px-4 py-4 align-top">
                  <span className="font-semibold text-primary">{record.fir_number}</span>
                  <span className="mt-1 block text-[10px] text-muted-foreground">#{record.id}</span>
                </td>
                <td className="px-4 py-4 align-top">
                  <span className="font-medium">{valueOrFallback(record.complainant)}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {valueOrFallback(record.complainant_father)}
                  </span>
                </td>
                <td className="px-4 py-4 align-top text-sm">{valueOrFallback(record.accused)}</td>
                <td className="px-4 py-4 align-top">
                  <span className="flex items-center gap-1.5 font-medium">
                    <MapPin className="size-3.5 text-chart-1" />
                    {valueOrFallback(record.police_station)}
                  </span>
                </td>
                <td className="px-4 py-4 align-top text-sm text-muted-foreground">{valueOrFallback(record.district)}</td>
                <td className="whitespace-nowrap px-4 py-4 align-top text-sm text-muted-foreground">
                  {valueOrFallback(record.fir_date)}
                  <span className="mt-1 block text-xs">{valueOrFallback(record.fir_time)}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-4 align-top text-sm text-muted-foreground">
                  {valueOrFallback(record.incident_date)}
                  <span className="mt-1 block text-xs">{valueOrFallback(record.incident_time)}</span>
                </td>
                <td className="px-4 py-4 align-top">
                  <Badge variant="secondary" className="font-mono text-[11px] bg-muted/60">
                    {valueOrFallback(record.legal_sections)}
                  </Badge>
                </td>
                <td className="px-4 py-4 align-top text-sm truncate max-w-[120px]">{valueOrFallback(record.property)}</td>
                <td className="px-4 py-4 align-top text-sm font-mono">{valueOrFallback(record.total_value)}</td>
                <td className="px-2 py-4 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-50 transition-opacity duration-150 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRowClick?.(record);
                    }}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function MetadataGrid({ metadata }: { metadata: Record<string, string> }) {
  return (
    <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-muted/30 sm:grid-cols-2 lg:grid-cols-3">
      {Object.entries(metadata).map(([label, value]) => (
        <div key={label} className="bg-card/80 px-4 py-3 transition-colors hover:bg-muted/20">
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {displayLabel(label)}
          </dt>
          <dd className="mt-1 break-words text-sm font-medium text-foreground">
            {valueOrFallback(value)}
          </dd>
        </div>
      ))}
    </div>
  );
}

export async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}

export function SummaryActions({
  summary,
  filename = "fir-summary.txt",
}: {
  summary: SummaryResponse;
  filename?: string;
}) {
  const content = `FIR SUMMARY\n\n${summary.summary}\n\nMETADATA\n${Object.entries(summary.metadata)
    .map(([key, value]) => `${displayLabel(key)}: ${value}`)
    .join("\n")}`;
  const download = () => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={() => void copyText(content)}>
        <Copy className="mr-1 size-3.5" /> Copy summary
      </Button>
      <Button variant="outline" size="sm" onClick={download}>
        <Download className="mr-1 size-3.5" /> Download .txt
      </Button>
    </div>
  );
}

export function RecordDetail({ record }: { record: FirRecord }) {
  const detailFields: { label: string; key: keyof FirRecord }[] = [
    { label: "FIR Number", key: "fir_number" },
    { label: "Police Station", key: "police_station" },
    { label: "District", key: "district" },
    { label: "FIR Date", key: "fir_date" },
    { label: "FIR Time", key: "fir_time" },
    { label: "Incident Date", key: "incident_date" },
    { label: "Incident Time", key: "incident_time" },
    { label: "Legal Sections", key: "legal_sections" },
    { label: "Complainant", key: "complainant" },
    { label: "Complainant's Father / Husband", key: "complainant_father" },
    { label: "Address", key: "address" },
    { label: "Accused", key: "accused" },
    { label: "Property", key: "property" },
    { label: "Total Value (Rs)", key: "total_value" },
  ];

  return (
    <div className="portal-panel rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-3 border-b border-border/60 pb-4 sm:flex-row">
        <div>
          <p className="portal-kicker text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            FIR record
          </p>
          <h2 className="mt-1 font-serif text-2xl font-bold">{record.fir_number}</h2>
        </div>
        <Badge variant="secondary" className="bg-muted/40">
          Registered {record.fir_date}
        </Badge>
      </div>

      <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {detailFields.map(({ label, key }) => (
          <div key={key} className="rounded-lg border border-border/40 bg-muted/10 px-3 py-2">
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
            <dd className="mt-1 break-words text-sm font-medium text-foreground">
              {valueOrFallback(record[key])}
            </dd>
          </div>
        ))}
      </dl>

      {record.summary && (
        <div className="mt-5 border-t border-border/60 pt-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Summary</p>
          <p className="mt-2 text-sm leading-relaxed text-foreground/85">
            {valueOrFallback(record.summary)}
          </p>
        </div>
      )}
    </div>
  );
}