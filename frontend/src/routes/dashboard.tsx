import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/components/portal-pages";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard | FIR Summarizer" }, { name: "description", content: "Monitor local FIR processing status and recent investigation records." }, { property: "og:title", content: "Dashboard | FIR Summarizer" }, { property: "og:description", content: "Monitor local FIR processing status and recent investigation records." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: DashboardPage,
});