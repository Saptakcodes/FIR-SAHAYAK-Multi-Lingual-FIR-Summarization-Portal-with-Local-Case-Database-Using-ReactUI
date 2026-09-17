import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { FirSearchPage } from "@/components/portal-pages";

export const Route = createFileRoute("/search/fir")({
  validateSearch: z.object({ q: z.string().optional() }),
  head: () => ({ meta: [{ title: "FIR Number Search | FIR Summarizer" }, { name: "description", content: "Find an indexed FIR by its registered number." }, { property: "og:title", content: "FIR Number Search | FIR Summarizer" }, { property: "og:description", content: "Find an indexed FIR by its registered number." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: FirSearchRoute,
});
function FirSearchRoute() { const { q } = Route.useSearch(); return <FirSearchPage initialQuery={q ?? ""} />; }