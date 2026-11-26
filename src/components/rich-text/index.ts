import dynamic from "next/dynamic"

export const RichTextEditor = dynamic(
  () => import("./RichTextEditor").then((m) => m.RichTextEditor),
  { ssr: false }
)
export { RichTextEditorSkeleton } from "./RichTextEditorSkeleton"
export { RichTextViewer } from "./RichTextViewer"
export { sanitizeHtml, cleanPastedHtml } from "./sanitize"
export {
  EMPTY_DOC,
  MAX_DOC_SIZE_BYTES,
  getPlainText,
  getWordCount,
  isEmpty,
  isValidUrl,
  isValidEmbedUrl,
  toYouTubeEmbedUrl,
  jsonDocToPlainText,
  plainTextToDoc,
  sanitizeDoc,
} from "./utils"
