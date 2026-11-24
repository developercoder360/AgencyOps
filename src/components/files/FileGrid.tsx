"use client"

import Link from "next/link"
import { ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { formatFileDate, formatFileSize, isImageFileItem } from "@/lib/files/format"
import type { FileItem } from "@/types/files"
import type { StaffUser } from "@/types"
import { cn } from "cn"
import { FileActionsMenu } from "./FileActionsMenu"
import { FileTypeIcon } from "./FileTypeIcon"
import { FileVisibilityBadge } from "./FileVisibilityBadge"

export interface FileDisplayEntry {
  file: FileItem
  readOnly: boolean
  sourceBadge: string
  sourceTitle?: string
  sourceHref?: string
  sourceTaskId?: string
}

export interface FileGridProps {
  entries: FileDisplayEntry[]
  users: StaffUser[]
  selectedIds: Set<string>
  compact?: boolean
  canDownload: boolean
  canUpload: boolean
  canDelete: boolean
  canManageVisibility: boolean
  hasMoveTargets: (entry: FileDisplayEntry) => boolean
  onToggleSelect: (fileId: string, checked: boolean) => void
  onPreview: (file: FileItem) => void
  onDownload: (file: FileItem) => void
  onRename: (file: FileItem) => void
  onMove: (file: FileItem) => void
  onToggleVisibility: (file: FileItem, nextVisible: boolean) => void
  onDelete: (file: FileItem) => void
  onOpenTask?: (taskId: string) => void
}

export function FileGrid({
  entries,
  users,
  selectedIds,
  compact = false,
  canDownload,
  canUpload,
  canDelete,
  canManageVisibility,
  hasMoveTargets,
  onToggleSelect,
  onPreview,
  onDownload,
  onRename,
  onMove,
  onToggleVisibility,
  onDelete,
  onOpenTask,
}: FileGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3",
        compact ? "sm:grid-cols-3" : "sm:grid-cols-3 lg:grid-cols-4"
      )}
    >
      {entries.map((entry) => {
        const { file, readOnly, sourceBadge, sourceTitle, sourceHref, sourceTaskId } =
          entry
        const isImg = isImageFileItem(file)
        const previewSrc = file.thumbnailUrl || file.url
        const isSelected = selectedIds.has(file.id)
        const uploader = users.find((u) => u.id === file.uploadedBy)

        return (
          <div
            key={file.id}
            className={cn(
              "group relative flex flex-col overflow-hidden rounded-xl border bg-card transition-all hover:border-primary/40 hover:shadow-xs",
              isSelected && "border-primary ring-1 ring-primary/50 bg-primary/5"
            )}
          >
            {/* Top Selection Checkbox & Actions Overlay */}
            <div className="flex items-center justify-between gap-2 px-2.5 pt-2.5">
              <Checkbox
                checked={isSelected}
                onCheckedChange={(v) => onToggleSelect(file.id, Boolean(v))}
                aria-label={`Select ${file.name}`}
              />
              <FileActionsMenu
                file={file}
                readOnly={readOnly}
                canDownload={canDownload}
                canUpload={canUpload}
                canDelete={canDelete}
                canManageVisibility={canManageVisibility}
                canMove={hasMoveTargets(entry)}
                onPreview={onPreview}
                onDownload={onDownload}
                onRename={onRename}
                onMove={onMove}
                onToggleVisibility={onToggleVisibility}
                onDelete={onDelete}
              />
            </div>

            {/* Thumbnail / Preview Trigger */}
            <button
              type="button"
              onClick={() => onPreview(file)}
              aria-label={`Preview ${file.name}`}
              className="mx-2.5 mt-2 flex h-28 items-center justify-center overflow-hidden rounded-lg border border-border/70 bg-muted/35 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            >
              {isImg && previewSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewSrc}
                  alt={file.name}
                  className="size-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                  <FileTypeIcon
                    name={file.name}
                    mimeType={file.mimeType}
                    className="size-8"
                  />
                </div>
              )}
            </button>

            {/* File Metadata */}
            <div className="flex flex-1 flex-col justify-between gap-2 p-2.5">
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => onPreview(file)}
                  title={file.name}
                  className="block w-full truncate text-left text-xs font-semibold text-foreground hover:text-primary focus-visible:outline-none"
                >
                  {file.name}
                </button>
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-muted-foreground">
                  <span className="font-mono tabular-nums">
                    {formatFileSize(file.size)}
                  </span>
                  <span>•</span>
                  <span className="truncate">
                    {uploader?.name ?? file.uploadedBy}
                  </span>
                </div>
                <div className="text-[10px] tabular-nums text-muted-foreground">
                  {formatFileDate(file.uploadedAt)}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-1.5 border-t border-border/60 pt-2">
                {sourceTaskId && onOpenTask ? (
                  <button
                    type="button"
                    onClick={() => onOpenTask(sourceTaskId)}
                    title={sourceTitle || sourceBadge}
                    className="inline-flex max-w-full items-center gap-1 text-left"
                  >
                    <Badge
                      variant="outline"
                      className="max-w-full truncate text-[10px] hover:border-primary/60 hover:text-primary"
                    >
                      {sourceBadge}
                      <ExternalLink className="ml-1 size-2.5 shrink-0" />
                    </Badge>
                  </button>
                ) : sourceHref ? (
                  <Link
                    href={sourceHref}
                    title={sourceTitle || sourceBadge}
                    className="inline-flex max-w-full items-center gap-1"
                  >
                    <Badge
                      variant="outline"
                      className="max-w-full truncate text-[10px] hover:border-primary/60 hover:text-primary"
                    >
                      {sourceBadge}
                      <ExternalLink className="ml-1 size-2.5 shrink-0" />
                    </Badge>
                  </Link>
                ) : (
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {sourceBadge}
                  </Badge>
                )}

                <FileVisibilityBadge
                  clientVisible={file.clientVisible}
                  canManageVisibility={canManageVisibility}
                  showSwitch={!readOnly}
                  readOnly={readOnly}
                  compact
                  onToggle={(next) => onToggleVisibility(file, next)}
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
