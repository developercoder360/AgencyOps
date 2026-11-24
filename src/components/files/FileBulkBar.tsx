"use client"

import { Download, Eye, Lock, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export interface FileBulkBarProps {
  selectedCount: number
  writableSelectedCount: number
  canDownload: boolean
  canDelete: boolean
  canManageVisibility: boolean
  onClearSelection: () => void
  onBulkDownload: () => void
  onBulkSetVisibility: (clientVisible: boolean) => void
  onBulkDelete: () => void
}

export function FileBulkBar({
  selectedCount,
  writableSelectedCount,
  canDownload,
  canDelete,
  canManageVisibility,
  onClearSelection,
  onBulkDownload,
  onBulkSetVisibility,
  onBulkDelete,
}: FileBulkBarProps) {
  if (selectedCount === 0) return null

  const hasWritable = writableSelectedCount > 0

  return (
    <div
      role="region"
      aria-label="Bulk file actions"
      className="sticky bottom-3 z-20 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/30 bg-background/95 px-3.5 py-2.5 shadow-lg backdrop-blur-sm"
    >
      <div className="flex items-center gap-2 text-xs">
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 font-mono text-[11px] font-bold text-primary-foreground">
          {selectedCount}
        </span>
        <span className="font-medium text-foreground">
          file{selectedCount === 1 ? "" : "s"} selected
        </span>
        {writableSelectedCount < selectedCount && (
          <span className="text-[11px] text-muted-foreground">
            ({writableSelectedCount} editable in current scope)
          </span>
        )}
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={onClearSelection}
          className="h-6 gap-1 text-[11px] text-muted-foreground hover:text-foreground"
        >
          <X className="size-3" />
          Clear
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {/* Download as mock ZIP */}
        {canDownload ? (
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={onBulkDownload}
            className="h-7 gap-1.5 text-xs"
          >
            <Download className="size-3.5" />
            Download ZIP
          </Button>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex cursor-not-allowed">
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  disabled
                  className="h-7 gap-1.5 text-xs"
                >
                  <Download className="size-3.5" />
                  Download ZIP
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent className="text-xs">
              Requires <code>files.download</code> permission
            </TooltipContent>
          </Tooltip>
        )}

        {/* Make Client Visible / Make Internal */}
        {canManageVisibility ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="xs"
              disabled={!hasWritable}
              onClick={() => onBulkSetVisibility(true)}
              className="h-7 gap-1.5 text-xs"
            >
              <Eye className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              Make client visible
            </Button>
            <Button
              type="button"
              variant="outline"
              size="xs"
              disabled={!hasWritable}
              onClick={() => onBulkSetVisibility(false)}
              className="h-7 gap-1.5 text-xs"
            >
              <Lock className="size-3.5" />
              Make internal
            </Button>
          </>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex cursor-not-allowed">
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  disabled
                  className="h-7 gap-1.5 text-xs"
                >
                  <Eye className="size-3.5" />
                  Client visibility
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent className="text-xs">
              Requires <code>files.manage_visibility</code> permission
            </TooltipContent>
          </Tooltip>
        )}

        {/* Delete */}
        {canDelete ? (
          <Button
            type="button"
            variant="destructive"
            size="xs"
            disabled={!hasWritable}
            onClick={onBulkDelete}
            className="h-7 gap-1.5 text-xs"
          >
            <Trash2 className="size-3.5" />
            Delete
          </Button>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex cursor-not-allowed">
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  disabled
                  className="h-7 gap-1.5 text-xs text-muted-foreground"
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent className="text-xs">
              Requires <code>files.delete</code> permission
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  )
}
