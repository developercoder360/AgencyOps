export type FileScope = "task" | "project" | "client"

export interface FileItem {
  id: string
  name: string
  originalName: string
  mimeType: string
  size: number // bytes
  scope: FileScope
  scopeId: string
  taskId?: string
  projectId?: string
  clientId?: string
  clientVisible: boolean
  note?: string
  url: string // object URL / data URL / mock URL
  thumbnailUrl?: string
  width?: number
  height?: number
  uploadedBy: string // userId
  uploadedAt: string // ISO
}

export type FileTypeCategory = "all" | "images" | "documents" | "other"
export type FileViewMode = "grid" | "list"
export type FileSortField = "name" | "date" | "size" | "type"
export type FileSortDirection = "asc" | "desc"

export type FilePermissionKey =
  | "files.view"
  | "files.upload"
  | "files.download"
  | "files.delete"
  | "files.manage_visibility"

export type UserFilePermissions = Record<FilePermissionKey, boolean>
