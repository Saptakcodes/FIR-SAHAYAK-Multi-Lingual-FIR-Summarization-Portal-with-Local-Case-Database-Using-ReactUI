import { createFileRoute } from "@tanstack/react-router";
import { UploadPage } from "@/components/portal-pages";

export const Route = createFileRoute("/upload")({
  head: () => ({ meta: [{ title: "Upload & Summarize | FIR Summarizer" }, { name: "description", content: "Process an FIR document with local OCR and summarization." }, { property: "og:title", content: "Upload & Summarize | FIR Summarizer" }, { property: "og:description", content: "Process an FIR document with local OCR and summarization." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: UploadPage,
});