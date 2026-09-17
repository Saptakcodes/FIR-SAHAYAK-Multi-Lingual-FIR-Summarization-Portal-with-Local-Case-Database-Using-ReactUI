import { createFileRoute } from "@tanstack/react-router";
import { AssistantPage } from "@/components/portal-pages";

export const Route = createFileRoute("/assistant")({
  head: () => ({ meta: [{ title: "Record Assistant | FIR Summarizer" }, { name: "description", content: "Retrieve relevant indexed FIR records using natural language." }, { property: "og:title", content: "Record Assistant | FIR Summarizer" }, { property: "og:description", content: "Retrieve relevant indexed FIR records using natural language." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: AssistantPage,
});