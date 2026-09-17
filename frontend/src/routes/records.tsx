import { createFileRoute } from "@tanstack/react-router";
import { RecordsPage } from "@/components/portal-pages";

export const Route = createFileRoute("/records")({
  head: () => ({ meta: [{ title: "All Records | FIR Summarizer" }, { name: "description", content: "Browse indexed FIR records from the local investigation database." }, { property: "og:title", content: "All Records | FIR Summarizer" }, { property: "og:description", content: "Browse indexed FIR records from the local investigation database." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: RecordsPage,
});