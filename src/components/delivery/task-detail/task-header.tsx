"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  Check,
  ChevronRight,
  Copy,
  FolderInput,
  Link2,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  Trash2,
  X,
} from "lucide-react"
import type { TaskRolePermissions } from "@/lib/permissions"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { Task } from "@/types"

interface TaskHeaderProps {
  task: Task
  permissions: TaskRolePermissions
  isWatching: boolean
  watcherCount: number
  isExpanded: boolean
  hasPrev: boolean
  hasNext: boolean
  onPrev: () => void
  onNext: () => void
  onToggleWatch: () => void
  onDuplicate: () => void
  onOpenMoveProject: () => void
  onRequestDelete: () => void
  onToggleExpand: () => void
  onClose: () => void
}

export function TaskHeader({
  task,
  permissions,
  isWatching: _isWatching,
  watcherCount: _watcherCount,
  isExpanded,
  hasPrev: _hasPrev,
  hasNext: _hasNext,
  onPrev: _onPrev,
  onNext: _onNext,
  onToggleWatch: _onToggleWatch,
  onDuplicate,
  onOpenMoveProject,
  onRequestDelete,
  onToggleExpand,
  onClose,
}: TaskHeaderProps) {
  const [copiedLink, setCopiedLink] = React.useState(false)

  function handleCopyLink() {
    try {
      const url = new URL(window.location.href)
      url.searchParams.set("task", task.id)
      navigator.clipboard.writeText(url.toString())
      setCopiedLink(true)
      toast.success("Task link copied to clipboard")
      setTimeout(() => setCopiedLink(false), 1800)
    } catch {
      toast.error("Could not copy link")
    }
  }

  function handleCopyCode() {
    try {
      navigator.clipboard.writeText(task.code)
      toast.success(`Copied ${task.code}`)
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-card px-4 py-2.5">
      {/* Breadcrumb: Brand › Project › TASK-ID */}
      <nav
        aria-label="Task breadcrumb"
        className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground"
      >
        <Link
          href="/brands"
          className="hidden max-w-[130px] truncate rounded px-1.5 py-0.5 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:inline-block"
        >
          {task.brandName}
        </Link>
        <ChevronRight className="hidden size-3.5 shrink-0 opacity-60 sm:inline-block" />
        <Link
          href={`/projects/${task.projectId}`}
          className="max-w-[140px] truncate rounded px-1.5 py-0.5 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:max-w-[180px]"
        >
          {task.projectName}
        </Link>
        <ChevronRight className="size-3.5 shrink-0 opacity-60" />
        <button
          type="button"
          onClick={handleCopyCode}
          title="Click to copy task ID"
          className="inline-flex shrink-0 items-center gap-1 rounded border border-border bg-muted/50 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {task.code}
        </button>
      </nav>

      {/* Right actions */}
      <div className="flex shrink-0 items-center gap-1">
        {/* Copy link */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="size-8 p-0 text-muted-foreground hover:text-foreground"
              onClick={handleCopyLink}
              aria-label="Copy task link"
            >
              {copiedLink ? (
                <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Link2 className="size-3.5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent className="text-xs">Copy deep link</TooltipContent>
        </Tooltip>

        {/* More actions menu */}
        {permissions.canDuplicate || permissions.canDeleteOrMove ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="size-8 p-0 text-muted-foreground hover:text-foreground"
                aria-label="More task actions"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {permissions.canDuplicate ? (
                <DropdownMenuItem onClick={onDuplicate}>
                  <Copy className="mr-2 size-3.5" />
                  Duplicate task
                </DropdownMenuItem>
              ) : null}
              {permissions.canDeleteOrMove ? (
                <DropdownMenuItem onClick={onOpenMoveProject}>
                  <FolderInput className="mr-2 size-3.5" />
                  Move to project…
                </DropdownMenuItem>
              ) : null}
              {permissions.canDeleteOrMove ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={onRequestDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 size-3.5" />
                    Delete task
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}

        {/* Expand to centered modal (desktop only) */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="hidden size-8 p-0 text-muted-foreground hover:text-foreground md:inline-flex"
              onClick={onToggleExpand}
              aria-label={
                isExpanded
                  ? "Dock panel to right side"
                  : "Expand to centered modal"
              }
            >
              {isExpanded ? (
                <Minimize2 className="size-3.5" />
              ) : (
                <Maximize2 className="size-3.5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent className="text-xs">
            {isExpanded ? "Dock to side panel" : "Expand to centered modal"}
          </TooltipContent>
        </Tooltip>

        {/* Close */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="size-8 p-0 text-muted-foreground hover:text-foreground"
              onClick={onClose}
              aria-label="Close task panel"
            >
              <X className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="text-xs">Close (Esc)</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
