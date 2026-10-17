"use client";

import dynamic from "next/dynamic";

export const MarkdownSourceEditor = dynamic(
  () => import("./markdown-source-editor").then((mod) => mod.MarkdownSourceEditor),
  {
    ssr: false,
    loading: () => <div className="min-h-0 flex-1" />,
  }
);
