import { createFileRoute } from "@tanstack/react-router";
import { ConnectionSettingsPage } from "@/components/connection-settings";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Backend connection | FIR Summarizer" }, { name: "description", content: "Configure and test the local FastAPI backend used by the FIR investigation portal." }, { property: "og:title", content: "Backend connection | FIR Summarizer" }, { property: "og:description", content: "Configure and test the local FastAPI backend used by the FIR investigation portal." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: ConnectionSettingsPage,
});
