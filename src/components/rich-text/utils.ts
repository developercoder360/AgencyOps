import type { RichTextValue } from "@/types/rich-text"

export const MAX_DOC_SIZE_BYTES = 51200 // 50 KB
export const RECENT_COLORS_KEY = "rt_recent_colors_v1"

export const EMPTY_DOC: Record<string, unknown> = {
  type: "doc",
  content: [{ type: "paragraph" }],
}

/**
 * Allows http(s), mailto, relative paths, blob URLs, and safe raster data URLs.
 * Explicitly blocks javascript:, vbscript:, and data:text/html.
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false
  const trimmed = url.trim()
  if (!trimmed) return false
  if (/^(javascript|vbscript|data:text\/html):/i.test(trimmed)) return false
  return /^(https?:\/\/|mailto:|\/|blob:|data:image\/(png|jpe?g|gif|webp|avif);)/i.test(
    trimmed
  )
}

export function toYouTubeEmbedUrl(url: string): string | null {
  if (!url || typeof url !== "string") return null
  const trimmed = url.trim()
  try {
    const parsed = new URL(trimmed)
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase()
    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      if (parsed.pathname.startsWith("/embed/")) {
        return `https://www.youtube-nocookie.com${parsed.pathname}`
      }
      const v = parsed.searchParams.get("v")
      if (v) return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(v)}`
      if (parsed.pathname.startsWith("/shorts/")) {
        const id = parsed.pathname.split("/")[2]
        if (id) return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`
      }
    }
    if (host === "youtu.be") {
      const id = parsed.pathname.replace(/^\//, "").split("/")[0]
      if (id) return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`
    }
    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const parts = parsed.pathname.split("/").filter(Boolean)
      const videoId = parts[parts.length - 1]
      if (videoId && /^\d+$/.test(videoId)) {
        return `https://player.vimeo.com/video/${videoId}`
      }
    }
  } catch {
    return null
  }
  return null
}

export function isValidEmbedUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false
  return /^(https:\/\/www\.youtube(?:-nocookie)?\.com\/embed\/|https:\/\/player\.vimeo\.com\/video\/)/i.test(
    url.trim()
  )
}

export function jsonDocToPlainText(doc: unknown): string {
  if (!doc) return ""
  if (typeof doc === "string") return getPlainText(doc)
  if (typeof doc !== "object") return ""
  const d = doc as Record<string, unknown>

  if (d.type === "text" && typeof d.text === "string") {
    return d.text
  }
  if (d.type === "mention" && d.attrs && typeof d.attrs === "object") {
    const label = (d.attrs as Record<string, unknown>).label
    return typeof label === "string" ? `@${label}` : ""
  }
  if (d.type === "taskRef" && d.attrs && typeof d.attrs === "object") {
    const code = (d.attrs as Record<string, unknown>).code
    return typeof code === "string" ? `#${code}` : ""
  }

  if (Array.isArray(d.content)) {
    const pieces = d.content
      .map((c) => jsonDocToPlainText(c))
      .filter(Boolean)
    return pieces.join(d.type === "doc" ? "\n" : " ").trim()
  }
  return ""
}

export function getPlainText(value: RichTextValue | unknown): string {
  if (!value) return ""
  if (typeof value === "object") {
    return jsonDocToPlainText(value)
  }
  if (typeof value !== "string") return ""
  const withSpaces = value
    .replace(/<\/(p|div|li|h[1-6]|blockquote|tr|pre)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
  return withSpaces.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim()
}

export function getWordCount(value: RichTextValue | unknown): number {
  const plain = getPlainText(value)
  if (!plain) return 0
  return plain.split(/\s+/).filter(Boolean).length
}

export function isEmpty(value: RichTextValue | unknown): boolean {
  if (!value) return true
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>
    if (obj.type === "doc" && Array.isArray(obj.content)) {
      const hasMedia = JSON.stringify(obj).includes('"type":"image"') ||
        JSON.stringify(obj).includes('"type":"attachment"') ||
        JSON.stringify(obj).includes('"type":"table"') ||
        JSON.stringify(obj).includes('"type":"youtube"')
      if (hasMedia) return false
    }
    return getPlainText(value).length === 0
  }
  if (typeof value !== "string") return true
  if (/<(img|iframe|hr|table|div\s+data-type="attachment")/i.test(value)) {
    return false
  }
  return getPlainText(value).length === 0
}

export function plainTextToDoc(text: string): Record<string, unknown> {
  const trimmed = text.trim()
  if (!trimmed) return EMPTY_DOC
  const lines = trimmed.split(/\r?\n/)
  return {
    type: "doc",
    content: lines.map((line) =>
      line
        ? { type: "paragraph", content: [{ type: "text", text: line }] }
        : { type: "paragraph" }
    ),
  }
}

export function sanitizeDoc(raw: unknown): Record<string, unknown> {
  if (!raw) return EMPTY_DOC
  if (typeof raw === "string") return plainTextToDoc(raw)
  if (typeof raw !== "object") return EMPTY_DOC
  const d = raw as Record<string, unknown>
  if (d.type !== "doc" || !Array.isArray(d.content) || d.content.length === 0) {
    return EMPTY_DOC
  }
  return d
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${Math.max(1, Math.round(kb))} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

export function getRecentColors(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(RECENT_COLORS_KEY)
    const parsed = raw ? (JSON.parse(raw) as unknown) : []
    return Array.isArray(parsed)
      ? parsed.filter((c): c is string => typeof c === "string").slice(0, 6)
      : []
  } catch {
    return []
  }
}

export function pushRecentColor(hex: string): string[] {
  const prev = getRecentColors()
  const next = [hex, ...prev.filter((c) => c.toLowerCase() !== hex.toLowerCase())].slice(0, 6)
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(next))
    } catch {
      // Ignore quota errors
    }
  }
  return next
}
