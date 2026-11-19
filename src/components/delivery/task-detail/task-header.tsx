"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  Bell,
  BellRing,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Copy,
  FolderInput,
  Link2,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  Square,
  Trash2,
  X,
} from "lucide-react"
import type { TaskRolePermissions } from "@/lib/permissions"
import { Badge } from "@/components/ui/badge"
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
import { formatTimerClock } from "./types"

interface TaskHeaderProps {
  task: Task
  permissions: TaskRolePermissions
  isWatching: boolean
  watcherCount: number
  isExpanded: boolean
  timerRunning: boolean
  timerSeconds: number
  hasPrev: boolean
  hasNext: boolean
  onPrev: () => void
  onNext: () => void
  onToggleWatch: () => void
  onDuplicate: () => void
  onOpenMoveProject: () => void
  onRequestDelete: () => void
  onToggleExpand: () => void
  onStopTimer: () => void
  onClose: () => void
}

export function TaskHeader({
  task,
  permissions,
  isWatching,
  watcherCount,
  isExpanded,
  timerRunning,
  timerSeconds,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  onToggleWatch,
  onDuplicate,
  onOpenMoveProject,
  onRequestDelete,
  onToggleExpand,
  onStopTimer,
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
        {/* Live timer pill when active */}
        {timerRunning ? (
          <div className="mr-1 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
            <span className="font-mono tabular-nums">
              {formatTimerClock(timerSeconds)}
            </span>
            <button
              type="button"
              onClick={onStopTimer}
              aria-label="Stop running timer"
              className="ml-0.5 inline-flex size-4 items-center justify-center rounded-full bg-emerald-600 text-white transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Square className="size-2 fill-current" />
            </button>
          </div>
        ) : null}

        {/* Prev / Next navigation */}
        {(hasPrev || hasNext) ? (
          <div className="mr-1 hidden items-center rounded-md border border-border bg-background p-0.5 sm:flex">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={onPrev}
                  disabled={!hasPrev}
                  aria-label="Previous task (Alt+K)"
                >
                  <ChevronUp className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">
                Previous task (Alt+K or Alt+↑)
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={onNext}
                  disabled={!hasNext}
                  aria-label="Next task (Alt+J)"
                >
                  <ChevronDown className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">
                Next task (Alt+J or Alt+↓)
              </TooltipContent>
            </Tooltip>
          </div>
        ) : null}

        {/* Copy link */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
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

        {/* Watch / Follow toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant={isWatching ? "secondary" : "ghost"}
              size="xs"
              onClick={onToggleWatch}
              aria-label={isWatching ? "Stop watching task" : "Watch task"}
              aria-pressed={isWatching}
              className="gap-1 px-2"
            >
              {isWatching ? (
                <BellRing className="size-3.5 text-primary" />
              ) : (
                <Bell className="size-3.5" />
              )}
              <span className="text-[11px] tabular-nums">{watcherCount}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent className="text-xs">
            {isWatching ? "Following updates" : "Follow this task"}
          </TooltipContent>
        </Tooltip>

        {/* More actions menu */}
        {permissions.canDuplicate || permissions.canDeleteOrMove ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
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
              size="icon-xs"
              onClick={onToggleExpand}
              aria-label={
                isExpanded
                  ? "Dock panel to right side"
                  : "Expand to centered modal"
              }
              className="hidden md:inline-flex"
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
              size="icon-xs"
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
