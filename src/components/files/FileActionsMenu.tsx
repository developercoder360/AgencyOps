"use client"

import {
  Download,
  Eye,
  FolderInput,
  Lock,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { FileItem } from "@/types/files"

export interface FileActionsMenuProps {
  file: FileItem
  readOnly?: boolean
  canDownload: boolean
  canUpload: boolean
  canDelete: boolean
  canManageVisibility: boolean
  canMove?: boolean
  onPreview: (file: FileItem) => void
  onDownload: (file: FileItem) => void
  onRename: (file: FileItem) => void
  onMove: (file: FileItem) => void
  onToggleVisibility: (file: FileItem, nextVisible: boolean) => void
  onDelete: (file: FileItem) => void
}

export function FileActionsMenu({
  file,
  readOnly = false,
  canDownload,
  canUpload,
  canDelete,
  canManageVisibility,
  canMove = false,
  onPreview,
  onDownload,
  onRename,
  onMove,
  onToggleVisibility,
  onDelete,
}: FileActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={`Actions for ${file.name}`}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onSelect={() => onPreview(file)}>
          <Eye className="mr-2 size-3.5" />
          Preview
        </DropdownMenuItem>

        <DropdownMenuItem
          disabled={!canDownload}
          onSelect={() => canDownload && onDownload(file)}
        >
          <Download className="mr-2 size-3.5" />
          <span>Download</span>
          {!canDownload ? (
            <span className="ml-auto text-[10px] text-muted-foreground">No perm</span>
          ) : null}
        </DropdownMenuItem>

        {!readOnly && (
          <>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              disabled={!canUpload}
              onSelect={() => canUpload && onRename(file)}
            >
              <Pencil className="mr-2 size-3.5" />
              Rename
            </DropdownMenuItem>

            {canMove && (
              <DropdownMenuItem
                disabled={!canUpload}
                onSelect={() => canUpload && onMove(file)}
              >
                <FolderInput className="mr-2 size-3.5" />
                Move
              </DropdownMenuItem>
            )}

            <DropdownMenuItem
              disabled={!canManageVisibility}
              onSelect={() =>
                canManageVisibility &&
                onToggleVisibility(file, !file.clientVisible)
              }
            >
              {file.clientVisible ? (
                <Lock className="mr-2 size-3.5" />
              ) : (
                <Eye className="mr-2 size-3.5" />
              )}
              <span>
                {file.clientVisible ? "Make internal" : "Make client visible"}
              </span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              variant="destructive"
              disabled={!canDelete}
              onSelect={() => canDelete && onDelete(file)}
            >
              <Trash2 className="mr-2 size-3.5" />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
