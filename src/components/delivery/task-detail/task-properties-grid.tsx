"use client"

import * as React from "react"
import Link from "next/link"
import type { DateRange } from "react-day-picker"
import {
  Building2,
  Calendar as CalendarIcon,
  Check,
  Clock,
  Flag,
  FolderKanban,
  Hourglass,
  Play,
  Plus,
  Search,
  Square,
  Tag,
  Users,
  X,
} from "lucide-react"
import { AvatarGroup, StatusBadge } from "@/components/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import type { TaskRolePermissions } from "@/lib/permissions"
import type {
  StaffUser,
  Task,
  TaskPriority,
  TaskStatus,
  TaskTag,
  TaskTagColor,
} from "@/types"
import { cn } from "cn"
import {
  formatHoursMinutes,
  formatTimerClock,
  getTagChipClass,
  PRIORITY_META,
  TAG_COLOR_OPTIONS,
  TASK_PRIORITIES,
  TASK_STATUSES,
} from "./types"

interface TaskPropertiesGridProps {
  task: Task
  users: StaffUser[]
  allTags: TaskTag[]
  permissions: TaskRolePermissions
  todayIso: string
  timerRunning: boolean
  timerSeconds: number
  onStatusChange: (status: TaskStatus) => void
  onRequestOnHold: () => void
  onAssigneesChange: (assigneeIds: string[]) => void
  onDatesChange: (startDate: string | undefined, dueDate: string) => void
  onPriorityChange: (priority: TaskPriority) => void
  onEstimateChange: (estimatedHours: number) => void
  onToggleTimer: () => void
  onLogManualTime: (minutesToAdd: number) => void
  onTagsChange: (tags: TaskTag[]) => void
  onNavigateClose: () => void
}

function parseIso(iso?: string): Date | undefined {
  if (!iso) return undefined
  const parts = iso.slice(0, 10).split("-").map(Number)
  if (parts.length !== 3 || parts.some(Number.isNaN)) return undefined
  return new Date(parts[0], parts[1] - 1, parts[2])
}

function toIso(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function TaskPropertiesGrid({
  task,
  users,
  allTags,
  permissions,
  todayIso,
  timerRunning,
  timerSeconds,
  onStatusChange,
  onRequestOnHold,
  onAssigneesChange,
  onDatesChange,
  onPriorityChange,
  onEstimateChange,
  onToggleTimer,
  onLogManualTime,
  onTagsChange,
  onNavigateClose,
}: TaskPropertiesGridProps) {
  const [assigneeSearch, setAssigneeSearch] = React.useState("")
  const [assigneeOpen, setAssigneeOpen] = React.useState(false)
  const [datesOpen, setDatesOpen] = React.useState(false)
  const [estimateOpen, setEstimateOpen] = React.useState(false)
  const [estimateDraft, setEstimateDraft] = React.useState(
    String(task.estimatedHours)
  )
  const [manualTimeOpen, setManualTimeOpen] = React.useState(false)
  const [manualHours, setManualHours] = React.useState("0")
  const [manualMinutes, setManualMinutes] = React.useState("30")
  const [tagsOpen, setTagsOpen] = React.useState(false)
  const [newTagLabel, setNewTagLabel] = React.useState("")
  const [newTagColor, setNewTagColor] = React.useState<TaskTagColor>("blue")

  const assignees = React.useMemo(
    () => users.filter((u) => task.assigneeIds.includes(u.id)),
    [users, task.assigneeIds]
  )

  const filteredUsers = React.useMemo(() => {
    const q = assigneeSearch.trim().toLowerCase()
    if (!q) return users
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) || u.role.toLowerCase().includes(q)
    )
  }, [users, assigneeSearch])

  const overdue = task.status !== "Complete" && task.dueDate < todayIso
  const taskTags = React.useMemo(() => task.tags ?? [], [task.tags])

  const availableTags = React.useMemo(() => {
    const map = new Map<string, TaskTag>()
    for (const t of allTags) map.set(t.label.toLowerCase(), t)
    for (const t of taskTags) map.set(t.label.toLowerCase(), t)
    return Array.from(map.values())
  }, [allTags, taskTags])

  const dateRange: DateRange = {
    from: parseIso(task.startDate ?? task.createdAt),
    to: parseIso(task.dueDate),
  }

  function toggleAssignee(userId: string) {
    const exists = task.assigneeIds.includes(userId)
    const next = exists
      ? task.assigneeIds.filter((id) => id !== userId)
      : [...task.assigneeIds, userId]
    onAssigneesChange(next)
  }

  function handleSaveEstimate(e: React.FormEvent) {
    e.preventDefault()
    const num = Number(estimateDraft)
    if (!Number.isNaN(num) && num >= 0 && num <= 500) {
      onEstimateChange(num)
    }
    setEstimateOpen(false)
  }

  function handleManualTimeSubmit(e: React.FormEvent) {
    e.preventDefault()
    const h = Math.max(0, Number(manualHours) || 0)
    const m = Math.max(0, Number(manualMinutes) || 0)
    const totalMins = h * 60 + m
    if (totalMins > 0) {
      onLogManualTime(totalMins)
    }
    setManualHours("0")
    setManualMinutes("30")
    setManualTimeOpen(false)
  }

  function toggleTag(tag: TaskTag) {
    const exists = taskTags.some(
      (t) => t.label.toLowerCase() === tag.label.toLowerCase()
    )
    const next = exists
      ? taskTags.filter(
          (t) => t.label.toLowerCase() !== tag.label.toLowerCase()
        )
      : [...taskTags, tag]
    onTagsChange(next)
  }

  function handleCreateTag(e: React.FormEvent) {
    e.preventDefault()
    const label = newTagLabel.trim()
    if (!label) return
    const existing = taskTags.find(
      (t) => t.label.toLowerCase() === label.toLowerCase()
    )
    if (existing) {
      setNewTagLabel("")
      return
    }
    const created: TaskTag = {
      id: `tag-${crypto.randomUUID().slice(0, 6)}`,
      label,
      color: newTagColor,
    }
    onTagsChange([...taskTags, created])
    setNewTagLabel("")
  }

  return (
    <div
      aria-label="Task properties"
      className="grid grid-cols-1 gap-x-6 gap-y-2.5 rounded-xl border border-border bg-muted/20 p-3.5 lg:grid-cols-2"
    >
      {/* 1. Status */}
      <div className="flex items-center justify-between gap-2 sm:justify-start">
        <span className="flex w-28 shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
          <span className="size-2 rounded-full bg-primary/60" />
          Status
        </span>
        <div className="min-w-0 flex-1">
          {permissions.canEditStatus ? (
            <Select
              value={task.status}
              onValueChange={(v) => {
                const next = v as TaskStatus
                if (next === "On Hold") {
                  onRequestOnHold()
                } else {
                  onStatusChange(next)
                }
              }}
            >
              <SelectTrigger
                aria-label="Task status"
                className="h-7 w-fit min-w-[130px] border-transparent bg-transparent px-1.5 text-xs shadow-none hover:border-border hover:bg-background"
              >
                <StatusBadge status={task.status} />
              </SelectTrigger>
              <SelectContent>
                {TASK_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    <StatusBadge status={s} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <StatusBadge status={task.status} />
          )}
        </div>
      </div>

      {/* 2. Assignees */}
      <div className="flex items-center justify-between gap-2 sm:justify-start">
        <span className="flex w-28 shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="size-3.5" />
          Assignees
        </span>
        <div className="min-w-0 flex-1">
          {permissions.canEditAssignees ? (
            <Popover open={assigneeOpen} onOpenChange={setAssigneeOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label="Edit assignees"
                  className="inline-flex max-w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-xs transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {assignees.length > 0 ? (
                    <>
                      <AvatarGroup people={assignees} max={3} />
                      <span className="truncate text-foreground">
                        {assignees.length === 1
                          ? assignees[0].name
                          : `${assignees.length} people`}
                      </span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">Unassigned</span>
                  )}
                  {task.redFlaggedUserIds.length > 0 ? (
                    <Badge
                      variant="destructive"
                      className="h-4 px-1 text-[10px]"
                      title="QA Red Flagged"
                    >
                      <Flag className="size-2.5" />
                    </Badge>
                  ) : null}
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-64 p-2">
                <div className="relative mb-2">
                  <Search className="pointer-events-none absolute top-2 left-2.5 size-3.5 text-muted-foreground" />
                  <Input
                    value={assigneeSearch}
                    onChange={(e) => setAssigneeSearch(e.target.value)}
                    placeholder="Search staff…"
                    aria-label="Search assignees"
                    className="h-7 pl-8 text-xs"
                  />
                </div>
                <div className="max-h-52 space-y-0.5 overflow-y-auto">
                  {filteredUsers.length === 0 ? (
                    <p className="py-3 text-center text-xs text-muted-foreground">
                      No staff matched.
                    </p>
                  ) : (
                    filteredUsers.map((u) => {
                      const selected = task.assigneeIds.includes(u.id)
                      const redFlagged = task.redFlaggedUserIds.includes(u.id)
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => toggleAssignee(u.id)}
                          className={cn(
                            "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            selected && "bg-muted/70"
                          )}
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <span
                              className={cn(
                                "flex size-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white",
                                u.avatarColor
                              )}
                            >
                              {u.avatarInitials}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1 truncate font-medium text-foreground">
                                <span className="truncate">{u.name}</span>
                                {redFlagged ? (
                                  <Flag className="size-2.5 shrink-0 text-rose-600 dark:text-rose-400" />
                                ) : null}
                              </div>
                              <div className="truncate text-[10px] text-muted-foreground">
                                {u.role}
                              </div>
                            </div>
                          </div>
                          {selected ? (
                            <Check className="size-3.5 shrink-0 text-primary" />
                          ) : null}
                        </button>
                      )
                    })
                  )}
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            <div className="inline-flex items-center gap-1.5 text-xs">
              {assignees.length > 0 ? (
                <>
                  <AvatarGroup people={assignees} max={3} />
                  <span className="truncate text-foreground">
                    {assignees.map((a) => a.name).join(", ")}
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground">Unassigned</span>
              )}
              {task.redFlaggedUserIds.length > 0 ? (
                <Badge variant="destructive" className="h-4 px-1 text-[10px]">
                  <Flag className="size-2.5" />
                </Badge>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* 3. Dates (Start → Due) */}
      <div className="flex items-center justify-between gap-2 sm:justify-start">
        <span className="flex w-28 shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarIcon className="size-3.5" />
          Dates
        </span>
        <div className="min-w-0 flex-1">
          {permissions.canEditDetails ? (
            <Popover open={datesOpen} onOpenChange={setDatesOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label="Edit start and due dates"
                  className={cn(
                    "inline-flex flex-wrap items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-xs tabular-nums transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    overdue
                      ? "font-semibold text-rose-600 dark:text-rose-400"
                      : "text-foreground"
                  )}
                >
                  <span>{task.startDate ?? task.createdAt}</span>
                  <span className="text-muted-foreground">→</span>
                  <span>{task.dueDate}</span>
                  {overdue ? (
                    <Badge
                      variant="destructive"
                      className="h-4 px-1.5 text-[10px]"
                    >
                      Overdue
                    </Badge>
                  ) : null}
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto p-3">
                <div className="mb-2.5 grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="td-start-date" className="text-[11px]">
                      Start date
                    </Label>
                    <Input
                      id="td-start-date"
                      type="date"
                      value={task.startDate ?? task.createdAt}
                      onChange={(e) => {
                        if (e.target.value) {
                          onDatesChange(e.target.value, task.dueDate)
                        }
                      }}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="td-due-date" className="text-[11px]">
                      Due date
                    </Label>
                    <Input
                      id="td-due-date"
                      type="date"
                      value={task.dueDate}
                      onChange={(e) => {
                        if (e.target.value) {
                          onDatesChange(
                            task.startDate ?? task.createdAt,
                            e.target.value
                          )
                        }
                      }}
                      className="h-7 text-xs"
                    />
                  </div>
                </div>
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      onDatesChange(toIso(range.from), toIso(range.to))
                    } else if (range?.from) {
                      onDatesChange(
                        toIso(range.from),
                        task.dueDate >= toIso(range.from)
                          ? task.dueDate
                          : toIso(range.from)
                      )
                    }
                  }}
                  defaultMonth={parseIso(task.dueDate)}
                  numberOfMonths={1}
                />
              </PopoverContent>
            </Popover>
          ) : (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 text-xs tabular-nums",
                overdue
                  ? "font-semibold text-rose-600 dark:text-rose-400"
                  : "text-foreground"
              )}
            >
              <span>{task.startDate ?? task.createdAt}</span>
              <span className="text-muted-foreground">→</span>
              <span>{task.dueDate}</span>
            </span>
          )}
        </div>
      </div>

      {/* 4. Priority */}
      <div className="flex items-center justify-between gap-2 sm:justify-start">
        <span className="flex w-28 shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
          <Flag className="size-3.5" />
          Priority
        </span>
        <div className="min-w-0 flex-1">
          {permissions.canEditDetails ? (
            <Select
              value={task.priority}
              onValueChange={(v) => onPriorityChange(v as TaskPriority)}
            >
              <SelectTrigger
                aria-label="Task priority"
                className="h-7 w-fit min-w-[116px] border-transparent bg-transparent px-1.5 text-xs shadow-none hover:border-border hover:bg-background"
              >
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <Flag
                    className={cn("size-3.5", PRIORITY_META[task.priority].flagClass)}
                  />
                  <span>{task.priority}</span>
                </span>
              </SelectTrigger>
              <SelectContent>
                {TASK_PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    <span className="inline-flex items-center gap-1.5">
                      <Flag className={cn("size-3.5", PRIORITY_META[p].flagClass)} />
                      <span>{p}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium">
              <Flag
                className={cn("size-3.5", PRIORITY_META[task.priority].flagClass)}
              />
              <span>{task.priority}</span>
            </span>
          )}
        </div>
      </div>

      {/* 5. Time Estimate */}
      <div className="flex items-center justify-between gap-2 sm:justify-start">
        <span className="flex w-28 shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
          <Hourglass className="size-3.5" />
          Estimate
        </span>
        <div className="min-w-0 flex-1">
          {permissions.canEditDetails ? (
            <Popover
              open={estimateOpen}
              onOpenChange={(open) => {
                setEstimateOpen(open)
                if (open) setEstimateDraft(String(task.estimatedHours))
              }}
            >
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label="Edit time estimate"
                  className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs tabular-nums text-foreground transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {task.estimatedHours > 0
                    ? formatHoursMinutes(task.estimatedHours)
                    : "Set estimate"}
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-52 p-3">
                <form onSubmit={handleSaveEstimate} className="space-y-2.5">
                  <Label htmlFor="td-estimate-hrs" className="text-xs">
                    Estimated hours
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="td-estimate-hrs"
                      type="number"
                      step="0.5"
                      min="0"
                      max="500"
                      value={estimateDraft}
                      onChange={(e) => setEstimateDraft(e.target.value)}
                      className="h-8 text-xs"
                    />
                    <Button type="submit" size="xs">
                      Save
                    </Button>
                  </div>
                </form>
              </PopoverContent>
            </Popover>
          ) : (
            <span className="text-xs tabular-nums text-foreground">
              {formatHoursMinutes(task.estimatedHours)}
            </span>
          )}
        </div>
      </div>

      {/* 6. Time Tracked (Timer + Manual Entry) */}
      <div className="flex items-center justify-between gap-2 sm:justify-start">
        <span className="flex w-28 shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3.5" />
          Tracked
        </span>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          {permissions.canEditDetails ? (
            <>
              <Button
                type="button"
                size="icon-xs"
                variant={timerRunning ? "destructive" : "outline"}
                onClick={onToggleTimer}
                aria-label={timerRunning ? "Stop time tracker" : "Start time tracker"}
                className="size-6 rounded-full"
              >
                {timerRunning ? (
                  <Square className="size-2.5 fill-current" />
                ) : (
                  <Play className="size-2.5 fill-current" />
                )}
              </Button>
              <Popover open={manualTimeOpen} onOpenChange={setManualTimeOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    aria-label="Log time manually"
                    className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs tabular-nums text-foreground transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span>
                      {formatHoursMinutes(task.loggedHours, task.trackedSeconds ?? 0)}
                    </span>
                    {timerRunning ? (
                      <span className="font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        +{formatTimerClock(timerSeconds)}
                      </span>
                    ) : null}
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-60 p-3">
                  <form onSubmit={handleManualTimeSubmit} className="space-y-2.5">
                    <div className="text-xs font-medium text-foreground">
                      Log manual time
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="td-log-h" className="text-[11px]">
                          Hours
                        </Label>
                        <Input
                          id="td-log-h"
                          type="number"
                          min="0"
                          max="100"
                          value={manualHours}
                          onChange={(e) => setManualHours(e.target.value)}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="td-log-m" className="text-[11px]">
                          Minutes
                        </Label>
                        <Input
                          id="td-log-m"
                          type="number"
                          min="0"
                          max="59"
                          value={manualMinutes}
                          onChange={(e) => setManualMinutes(e.target.value)}
                          className="h-7 text-xs"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => setManualTimeOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" size="xs">
                        Add time
                      </Button>
                    </div>
                  </form>
                </PopoverContent>
              </Popover>
            </>
          ) : (
            <span className="text-xs tabular-nums text-foreground">
              {formatHoursMinutes(task.loggedHours, task.trackedSeconds ?? 0)}
            </span>
          )}
        </div>
      </div>

      {/* 7. Project (read-only link) */}
      <div className="flex items-center justify-between gap-2 sm:justify-start">
        <span className="flex w-28 shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
          <FolderKanban className="size-3.5" />
          Project
        </span>
        <div className="min-w-0 flex-1">
          <Link
            href={`/projects/${task.projectId}`}
            onClick={onNavigateClose}
            className="inline-block max-w-full truncate rounded px-1.5 py-0.5 text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {task.projectName}
          </Link>
        </div>
      </div>

      {/* 8. Brand (read-only link) */}
      <div className="flex items-center justify-between gap-2 sm:justify-start">
        <span className="flex w-28 shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
          <Building2 className="size-3.5" />
          Brand
        </span>
        <div className="min-w-0 flex-1">
          <Link
            href="/brands"
            onClick={onNavigateClose}
            className="inline-block max-w-full truncate rounded px-1.5 py-0.5 text-xs font-medium text-foreground hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {task.brandName}
          </Link>
        </div>
      </div>

      {/* 9. Tags (full width across both columns) */}
      <div className="flex items-start gap-2 pt-1 lg:col-span-2">
        <span className="mt-1 flex w-28 shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
          <Tag className="size-3.5" />
          Tags
        </span>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          {taskTags.map((tag) => (
            <span
              key={tag.id}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                getTagChipClass(tag.color)
              )}
            >
              <span>{tag.label}</span>
              {permissions.canEditDetails ? (
                <button
                  type="button"
                  onClick={() => toggleTag(tag)}
                  aria-label={`Remove tag ${tag.label}`}
                  className="rounded-full p-0.5 transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <X className="size-2.5" />
                </button>
              ) : null}
            </span>
          ))}

          {permissions.canEditDetails ? (
            <Popover open={tagsOpen} onOpenChange={setTagsOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className="h-6 gap-1 rounded-full border border-dashed border-border px-2 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  <Plus className="size-3" />
                  Add tag
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-64 space-y-3 p-3">
                {availableTags.length > 0 ? (
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-medium text-muted-foreground">
                      Existing tags
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {availableTags.map((tag) => {
                        const active = taskTags.some(
                          (t) =>
                            t.label.toLowerCase() === tag.label.toLowerCase()
                        )
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => toggleTag(tag)}
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                              getTagChipClass(tag.color),
                              active ? "ring-1 ring-ring" : "opacity-75 hover:opacity-100"
                            )}
                          >
                            {active ? <Check className="size-2.5" /> : null}
                            {tag.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ) : null}

                <form onSubmit={handleCreateTag} className="space-y-2 border-t border-border pt-2.5">
                  <Label htmlFor="td-new-tag" className="text-[11px]">
                    Create new tag
                  </Label>
                  <div className="flex gap-1.5">
                    <Input
                      id="td-new-tag"
                      value={newTagLabel}
                      onChange={(e) => setNewTagLabel(e.target.value)}
                      placeholder="Tag name…"
                      className="h-7 text-xs"
                    />
                    <Button
                      type="submit"
                      size="xs"
                      disabled={!newTagLabel.trim()}
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    {TAG_COLOR_OPTIONS.map((opt) => (
                      <button
                        key={opt.color}
                        type="button"
                        onClick={() => setNewTagColor(opt.color)}
                        aria-label={`Color ${opt.label}`}
                        aria-pressed={newTagColor === opt.color}
                        className={cn(
                          "size-4 rounded-full transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          opt.swatchClass,
                          newTagColor === opt.color
                            ? "scale-110 ring-2 ring-foreground ring-offset-2 ring-offset-popover"
                            : "opacity-70 hover:opacity-100"
                        )}
                      />
                    ))}
                  </div>
                </form>
              </PopoverContent>
            </Popover>
          ) : taskTags.length === 0 ? (
            <span className="text-xs text-muted-foreground">No tags</span>
          ) : null}
        </div>
      </div>
    </div>
  )
}
