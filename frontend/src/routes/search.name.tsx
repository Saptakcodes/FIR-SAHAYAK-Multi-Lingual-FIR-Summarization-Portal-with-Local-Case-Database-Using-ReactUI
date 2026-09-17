import { createFileRoute } from "@tanstack/react-router";
import { NameSearchPage } from "@/components/portal-pages";

export const Route = createFileRoute("/search/name")({
  head: () => ({ meta: [{ title: "Name Search | FIR Summarizer" }, { name: "description", content: "Search indexed FIR records by complainant, accused, station, or text." }, { property: "og:title", content: "Name Search | FIR Summarizer" }, { property: "og:description", content: "Search indexed FIR records by complainant, accused, station, or text." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: NameSearchPage,
});