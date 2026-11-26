"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import katex from "katex"
import "katex/dist/katex.min.css"
import type { RichTextViewerProps } from "@/types/rich-text"
import { sanitizeHtml } from "./sanitize"
import { isEmpty } from "./utils"
import { cn } from "cn"
import "./editor.css"

const RichTextEditor = dynamic(
  () => import("./RichTextEditor").then((m) => m.RichTextEditor),
  { ssr: false }
)

function hydrateMathInHtml(html: string): string {
  return html.replace(
    /<span[^>]*data-type="math"[^>]*data-formula="([^"]*)"[^>]*>[\s\S]*?<\/span>/gi,
    (_match, formula: string) => {
      try {
        const rendered = katex.renderToString(formula, {
          throwOnError: false,
          displayMode: false,
          strict: false,
        })
        return `<span data-type="math" data-formula="${formula}">${rendered}</span>`
      } catch {
        return `<span data-type="math" data-formula="${formula}">${formula}</span>`
      }
    }
  )
}

export function RichTextViewer({
  value,
  className,
  emptyFallback,
}: RichTextViewerProps) {
  const empty = React.useMemo(() => isEmpty(value), [value])

  if (empty) {
    if (!emptyFallback) return null
    return (
      <p className={cn("text-xs italic text-muted-foreground", className)}>
        {emptyFallback}
      </p>
    )
  }

  // If value is Tiptap JSON, delegate safely to read-only editor
  if (typeof value === "object" && value !== null) {
    return (
      <RichTextEditor
        value={value}
        readOnly
        className={cn("border-0 bg-transparent shadow-none", className)}
      />
    )
  }

  const rawHtml = typeof value === "string" ? value : ""
  const safeHtml = hydrateMathInHtml(sanitizeHtml(rawHtml))

  return (
    <div
      className={cn("rich-text-prose", className)}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  )
}
