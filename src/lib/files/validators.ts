import { formatFileSize, getFileExtension, isImageFileItem } from "./format"

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024 // 25 MB configurable limit

export const ACCEPTED_FILE_EXTENSIONS = [
  "png",
  "jpg",
  "jpeg",
  "webp",
  "gif",
  "svg",
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "zip",
  "txt",
  "csv",
  "ai",
  "psd",
  "eps",
  "fig",
] as const

export const ACCEPTED_FILE_INPUT = ACCEPTED_FILE_EXTENSIONS.map(
  (ext) => `.${ext}`
).join(",")

const EXTENSION_MIME_FALLBACK: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  zip: "application/zip",
  txt: "text/plain",
  csv: "text/csv",
  ai: "application/postscript",
  psd: "image/vnd.adobe.photoshop",
  eps: "application/postscript",
  fig: "application/x-figma",
}

export function resolveMimeType(file: File): string {
  if (file.type) return file.type
  const ext = getFileExtension(file.name)
  return EXTENSION_MIME_FALLBACK[ext] ?? "application/octet-stream"
}

export interface FileValidationResult {
  valid: boolean
  error?: string
}

export function validateUploadFile(
  file: File,
  maxSizeBytes = MAX_FILE_SIZE_BYTES
): FileValidationResult {
  const ext = getFileExtension(file.name)
  const acceptedSet = new Set<string>(ACCEPTED_FILE_EXTENSIONS)
  if (!ext || !acceptedSet.has(ext)) {
    return {
      valid: false,
      error: `Unsupported file type "${ext ? `.${ext}` : "unknown"}". Allowed: ${ACCEPTED_FILE_EXTENSIONS.join(", ")}.`,
    }
  }

  if (file.size <= 0) {
    return {
      valid: false,
      error: "File is empty (0 bytes).",
    }
  }

  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size (${formatFileSize(file.size)}) exceeds the ${formatFileSize(maxSizeBytes)} limit.`,
    }
  }

  return { valid: true }
}

function readFileAsDataUrl(file: File): Promise<string | undefined> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => {
      resolve(typeof reader.result === "string" ? reader.result : undefined)
    }
    reader.onerror = () => resolve(undefined)
    reader.readAsDataURL(file)
  })
}

async function readImageMetadata(
  file: File
): Promise<{ width?: number; height?: number; thumbnailUrl?: string }> {
  if (typeof window === "undefined") return {}
  const tempUrl = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement | null>((resolve) => {
      const element = new window.Image()
      element.onload = () => resolve(element)
      element.onerror = () => resolve(null)
      element.src = tempUrl
    })

    if (!img) return {}
    const width = img.naturalWidth || undefined
    const height = img.naturalHeight || undefined

    // SVG keeps crisp vector data URL cleanly without rasterizing
    if (getFileExtension(file.name) === "svg" || file.type === "image/svg+xml") {
      const dataUrl = file.size <= 1.5 * 1024 * 1024 ? await readFileAsDataUrl(file) : undefined
      return { width, height, thumbnailUrl: dataUrl }
    }

    // Create a compact thumbnail (max 480px) so it safely fits in localStorage
    const maxDim = 480
    const scale =
      width && height
        ? Math.min(1, maxDim / Math.max(width, height))
        : 1
    const targetW = Math.max(1, Math.round((width ?? maxDim) * scale))
    const targetH = Math.max(1, Math.round((height ?? maxDim) * scale))

    const canvas = document.createElement("canvas")
    canvas.width = targetW
    canvas.height = targetH
    const ctx = canvas.getContext("2d")
    if (!ctx) return { width, height }
    ctx.drawImage(img, 0, 0, targetW, targetH)
    const thumbMime = file.type === "image/png" || file.type === "image/webp" ? file.type : "image/jpeg"
    const thumbnailUrl = canvas.toDataURL(thumbMime, 0.82)
    return { width, height, thumbnailUrl }
  } catch {
    return {}
  } finally {
    URL.revokeObjectURL(tempUrl)
  }
}

export interface ProcessedFileAsset {
  url: string
  thumbnailUrl?: string
  width?: number
  height?: number
}

/**
 * Converts uploaded browser File into persistent store URLs safely respecting localStorage size limits.
 */
export async function processUploadedFile(file: File): Promise<ProcessedFileAsset> {
  const mimeType = resolveMimeType(file)
  const isImage = isImageFileItem({ mimeType, name: file.name })

  // Keep full data URLs for files under ~1.2MB so images & PDFs survive browser reloads cleanly
  const DATA_URL_PERSIST_LIMIT = 1.2 * 1024 * 1024

  if (isImage) {
    const meta = await readImageMetadata(file)
    if (file.size <= DATA_URL_PERSIST_LIMIT) {
      const dataUrl = await readFileAsDataUrl(file)
      return {
        url: dataUrl ?? meta.thumbnailUrl ?? URL.createObjectURL(file),
        thumbnailUrl: meta.thumbnailUrl ?? dataUrl,
        width: meta.width,
        height: meta.height,
      }
    }
    return {
      url: URL.createObjectURL(file),
      thumbnailUrl: meta.thumbnailUrl,
      width: meta.width,
      height: meta.height,
    }
  }

  if (file.size <= DATA_URL_PERSIST_LIMIT) {
    const dataUrl = await readFileAsDataUrl(file)
    if (dataUrl) {
      return { url: dataUrl }
    }
  }

  return {
    url: URL.createObjectURL(file),
  }
}
