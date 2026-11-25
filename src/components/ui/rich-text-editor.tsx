"use client"

export {
  RichTextEditor,
  RichTextEditorSkeleton,
  RichTextViewer,
  EMPTY_DOC,
  MAX_DOC_SIZE_BYTES,
  sanitizeDoc,
  plainTextToDoc,
  isValidUrl,
  jsonDocToPlainText as docToPlainText,
} from "@/components/rich-text"
export type { RichTextEditorProps } from "@/types/rich-text"

export function isValidDoc(doc: unknown): boolean {
  if (!doc || typeof doc !== "object") return false
  const d = doc as Record<string, unknown>
  if (d.type !== "doc") return false
  try {
    return JSON.stringify(d).length <= 51200
  } catch {
    return false
  }
}

export function appendMentionToDoc(
  doc: Record<string, unknown>,
  name: string
): Record<string, unknown> {
  const mentionText = `@${name} `
  const content = Array.isArray(doc.content) ? [...doc.content] : []
  if (content.length === 0) {
    return {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: mentionText }] },
      ],
    }
  }
  const lastIdx = content.length - 1
  const lastNode = content[lastIdx] as Record<string, unknown>
  if (lastNode && lastNode.type === "paragraph") {
    const inner = Array.isArray(lastNode.content) ? [...lastNode.content] : []
    inner.push({ type: "text", text: ` ${mentionText}`.replace(/^\s{2,}/, " ") })
    content[lastIdx] = { ...lastNode, content: inner }
  } else {
    content.push({
      type: "paragraph",
      content: [{ type: "text", text: mentionText }],
    })
  }
  return { ...doc, content }
}
