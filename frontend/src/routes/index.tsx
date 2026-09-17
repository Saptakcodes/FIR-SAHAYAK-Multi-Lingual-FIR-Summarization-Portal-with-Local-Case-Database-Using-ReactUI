import { createFileRoute } from "@tanstack/react-router";
import { HomeLanding } from "@/components/landing";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FIR Summarizer | Local Investigation Portal" },
      { name: "description", content: "Extract, summarize, translate, and search FIR records from one local investigation workspace." },
      { property: "og:title", content: "FIR Summarizer | Local Investigation Portal" },
      { property: "og:description", content: "Extract, summarize, translate, and search FIR records from one local investigation workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomeLanding,
});
