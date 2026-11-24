import type { FileItem, FileTypeCategory } from "@/types/files"

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "gif", "svg"])
const DOCUMENT_EXTENSIONS = new Set([
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "txt",
  "csv",
])

export function getFileExtension(filename: string): string {
  const parts = filename.trim().toLowerCase().split(".")
  if (parts.length < 2) return ""
  return parts[parts.length - 1] ?? ""
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B"
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`
  const mb = kb / 1024
  if (mb < 1024) return `${mb.toFixed(mb < 10 ? 2 : 1)} MB`
  const gb = mb / 1024
  return `${gb.toFixed(2)} GB`
}

export function isImageFileItem(item: Pick<FileItem, "mimeType" | "name">): boolean {
  const ext = getFileExtension(item.name)
  return item.mimeType.startsWith("image/") || IMAGE_EXTENSIONS.has(ext)
}

export function isPdfFileItem(item: Pick<FileItem, "mimeType" | "name">): boolean {
  const ext = getFileExtension(item.name)
  return item.mimeType === "application/pdf" || ext === "pdf"
}

export function getFileCategory(
  mimeType: string,
  filename: string
): Exclude<FileTypeCategory, "all"> {
  const ext = getFileExtension(filename)
  if (mimeType.startsWith("image/") || IMAGE_EXTENSIONS.has(ext)) {
    return "images"
  }
  if (
    mimeType === "application/pdf" ||
    mimeType.startsWith("text/") ||
    mimeType.includes("word") ||
    mimeType.includes("document") ||
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType.includes("presentation") ||
    mimeType.includes("powerpoint") ||
    DOCUMENT_EXTENSIONS.has(ext)
  ) {
    return "documents"
  }
  return "other"
}

export function getFileTypeLabel(mimeType: string, filename: string): string {
  const ext = getFileExtension(filename).toUpperCase()
  if (ext === "PDF" || mimeType === "application/pdf") return "PDF Document"
  if (IMAGE_EXTENSIONS.has(ext.toLowerCase()) || mimeType.startsWith("image/")) {
    return ext ? `${ext} Image` : "Image"
  }
  if (ext === "DOC" || ext === "DOCX") return "Word Document"
  if (ext === "XLS" || ext === "XLSX") return "Spreadsheet"
  if (ext === "CSV") return "CSV Data"
  if (ext === "PPT" || ext === "PPTX") return "Presentation"
  if (ext === "TXT") return "Text File"
  if (ext === "ZIP") return "ZIP Archive"
  if (ext === "FIG") return "Figma Design"
  if (ext === "PSD") return "Photoshop"
  if (ext === "AI") return "Illustrator"
  if (ext === "EPS") return "EPS Vector"
  return ext ? `${ext} File` : "File"
}

export function formatFileDate(iso: string): string {
  if (!iso) return "—"
  const date = new Date(iso)
  if (isNaN(date.getTime())) return iso.slice(0, 10)
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

export function formatFileDateTime(iso: string): string {
  if (!iso) return "—"
  const date = new Date(iso)
  if (isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

function sanitizeDownloadFilename(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, "_") || "download"
}

export function downloadSingleFile(file: FileItem): void {
  if (typeof window === "undefined") return
  const filename = sanitizeDownloadFilename(file.name || file.originalName)

  if (file.url && (file.url.startsWith("data:") || file.url.startsWith("blob:"))) {
    const a = document.createElement("a")
    a.href = file.url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    return
  }

  // Fallback mock file payload when URL is unavailable (e.g. >2MB non-persistent file after reload)
  const content = [
    `File: ${file.name}`,
    `Original Name: ${file.originalName}`,
    `MIME Type: ${file.mimeType}`,
    `Size: ${formatFileSize(file.size)}`,
    `Scope: ${file.scope} (${file.scopeId})`,
    `Client Visible: ${file.clientVisible ? "Yes" : "No"}`,
    `Uploaded At: ${file.uploadedAt}`,
    file.note ? `Note: ${file.note}` : "",
  ]
    .filter(Boolean)
    .join("\n")

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = objectUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(objectUrl)
}

export function downloadFilesAsMockZip(
  files: FileItem[],
  archiveLabel = "files"
): void {
  if (typeof window === "undefined" || files.length === 0) return

  const manifestLines = [
    `AgencyOps Mock Archive Bundle (${files.length} file${files.length === 1 ? "" : "s"})`,
    `Generated: ${new Date().toISOString()}`,
    `Total Size: ${formatFileSize(files.reduce((sum, f) => sum + f.size, 0))}`,
    "",
    "Included Files:",
    ...files.map(
      (f, idx) =>
        `${idx + 1}. ${f.name} (${formatFileSize(f.size)}, ${f.mimeType || "unknown"}, ${f.clientVisible ? "Client visible" : "Internal"})`
    ),
  ]

  const blob = new Blob([manifestLines.join("\n")], {
    type: "application/zip",
  })
  const objectUrl = URL.createObjectURL(blob)
  const slug = archiveLabel.toLowerCase().replace(/[^a-z0-9-]+/g, "-") || "files"
  const a = document.createElement("a")
  a.href = objectUrl
  a.download = `${slug}-bundle-${new Date().toISOString().slice(0, 10)}.zip`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(objectUrl)
}
