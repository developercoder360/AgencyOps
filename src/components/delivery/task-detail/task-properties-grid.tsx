"use client"

import * as React from "react"
import {
  Calendar as CalendarIcon,
  Check,
  CheckCircle2,
  FileEdit,
  Flag,
  Folder,
  Pencil,
  ShieldCheck,
  Tag,
  User,
  Users,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarPicker } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
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
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { TaskRolePermissions } from "@/lib/permissions"
import type {
  Lead,
  SignUp,
  StaffUser,
  Task,
  TaskPriority,
  TaskStatus,
} from "@/types"
import { cn } from "cn"
import {
  formatSingleDate,
  getEntityInitials,
  TASK_PRIORITIES,
  TASK_STATUSES,
} from "./types"

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

function formatFullDate(dateStr?: string): string {
  if (!dateStr) return "—"
  const clean = dateStr.slice(0, 10)
  const parts = clean.split("-")
  if (parts.length === 3) {
    const monthIdx = parseInt(parts[1], 10) - 1
    const day = parseInt(parts[2], 10)
    if (monthIdx >= 0 && monthIdx < 12 && !isNaN(day)) {
      return `${MONTH_NAMES[monthIdx]} ${day}, ${parts[0]}`
    }
  }
  return dateStr
}

function parseLocalDate(dateStr?: string | null): Date | undefined {
  if (!dateStr) return undefined
  const clean = dateStr.slice(0, 10)
  const parts = clean.split("-")
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10)
    const m = parseInt(parts[1], 10) - 1
    const d = parseInt(parts[2], 10)
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(y, m, d)
    }
  }
  const parsed = new Date(dateStr)
  return isNaN(parsed.getTime()) ? undefined : parsed
}

function toLocalDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

interface TaskPropertiesGridProps {
  task: Task
  users: StaffUser[]
  signups: SignUp[]
  leads: Lead[]
  permissions: TaskRolePermissions
  todayIso: string
  onStatusChange: (status: TaskStatus) => void
  onRequestOnHold: () => void
  onAssigneesChange: (assigneeIds: string[]) => void
  onMembersChange?: (memberIds: string[]) => void
  onDatesChange?: (startDate: string | undefined, dueDate: string) => void
  onCompletedDateChange?: (completedDate: string | undefined) => void
  onPriorityChange: (priority: TaskPriority) => void
  onClientChange?: (clientId: string | null) => void
  onLeadChange?: (leadId: string | null) => void
  onNavigateClose?: () => void
  creatorName?: string
}

export function TaskPropertiesGrid({
  task,
  users,
  signups,
  permissions,
  todayIso,
  onStatusChange,
  onRequestOnHold,
  onAssigneesChange,
  onMembersChange,
  onDatesChange,
  onCompletedDateChange,
  onPriorityChange,
  creatorName: propCreatorName,
}: TaskPropertiesGridProps) {
  const [assigneeSearch, setAssigneeSearch] = React.useState("")
  const [assigneeOpen, setAssigneeOpen] = React.useState(false)
  const [memberSearch, setMemberSearch] = React.useState("")
  const [memberOpen, setMemberOpen] = React.useState(false)
  const [endDateOpen, setEndDateOpen] = React.useState(false)
  const [completeDateOpen, setCompleteDateOpen] = React.useState(false)

  const canEditMembers = permissions.canEditAssignees || permissions.canEditDetails

  // Members (multiple)
  const selectedMemberIds = React.useMemo(
    () => task.memberIds ?? [],
    [task.memberIds]
  )

  const selectedMembers = React.useMemo(
    () => users.filter((u) => selectedMemberIds.includes(u.id)),
    [users, selectedMemberIds]
  )

  const filteredMemberUsers = React.useMemo(() => {
    const q = memberSearch.trim().toLowerCase()
    if (!q) return users
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    )
  }, [users, memberSearch])

  function toggleMember(userId: string) {
    if (!onMembersChange) return
    const next = selectedMemberIds.includes(userId)
      ? selectedMemberIds.filter((id) => id !== userId)
      : [...selectedMemberIds, userId]
    onMembersChange(next)
  }

  const membersDisplayText = React.useMemo(() => {
    if (selectedMembers.length === 0) return "Empty"
    if (selectedMembers.length === 1) return selectedMembers[0].name
    if (selectedMembers.length === 2)
      return `${selectedMembers[0].name.split(" ")[0]}, ${selectedMembers[1].name.split(" ")[0]}`
    return `${selectedMembers.length} members`
  }, [selectedMembers])

  // Assigned team member (single)
  const primaryAssignee = React.useMemo(
    () => users.find((u) => task.assigneeIds.includes(u.id)) || null,
    [users, task.assigneeIds]
  )

  const filteredUsers = React.useMemo(() => {
    const q = assigneeSearch.trim().toLowerCase()
    if (!q) return users
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    )
  }, [users, assigneeSearch])

  // Client resolution
  const currentClient = React.useMemo(
    () => (task.clientId ? signups.find((s) => s.id === task.clientId) : null),
    [task.clientId, signups]
  )
  const clientName =
    currentClient?.name ||
    task.brandName ||
    "MagnaCharm Creations"

  // Completed date resolution
  const completedDate = React.useMemo(() => {
    if (task.completedAt) return task.completedAt
    const passQa = task.qaHistory?.find((q) => q.outcome === "Pass")
    if (passQa?.timestamp) return passQa.timestamp
    const completeActivity = (task.activity ?? []).find(
      (a) =>
        a.field?.toLowerCase() === "status" &&
        (a.toValue === "Complete" || a.toValue?.toLowerCase() === "complete")
    )
    if (completeActivity?.timestamp) return completeActivity.timestamp
    if (task.status === "Complete") {
      return task.dueDate || task.createdAt
    }
    return null
  }, [task])

  // Creator resolution
  const creatorName = React.useMemo(() => {
    if (propCreatorName) return propCreatorName
    if ((task as unknown as { createdByName?: string }).createdByName) {
      return (task as unknown as { createdByName?: string }).createdByName!
    }
    const createdById = (task as unknown as { createdById?: string }).createdById
    if (createdById) {
      const u = users.find((user) => user.id === createdById)
      if (u) return u.name
    }
    const creationEvent = (task.activity ?? []).find((a) =>
      a.action?.toLowerCase().includes("created")
    )
    if (creationEvent?.actorName) return creationEvent.actorName
    const reviewer = users.find((u) => u.id === task.reviewerId)
    if (reviewer) return reviewer.name
    const admin = users.find(
      (u) => u.role === "Project Admin" || u.role === "Super Admin"
    )
    return admin?.name ?? "Kevin Marshall"
  }, [propCreatorName, task, users])

  // Project Admin / Reviewer resolution
  const projectAdmin = React.useMemo(() => {
    const reviewer = users.find((u) => u.id === task.reviewerId)
    if (reviewer) return reviewer
    const admin = users.find(
      (u) => u.role === "Project Admin" || u.role === "Super Admin"
    )
    return admin ?? users[0]
  }, [task.reviewerId, users])

  function selectAssignee(userId: string) {
    if (task.assigneeIds.includes(userId)) {
      onAssigneesChange([])
    } else {
      onAssigneesChange([userId])
    }
    setAssigneeOpen(false)
    setAssigneeSearch("")
  }

  return (
    <div
      role="region"
      aria-label="Task Information"
      className="grid grid-cols-1 md:grid-cols-2 gap-x-10 lg:gap-x-14 gap-y-2.5 py-1 text-xs"
    >
      {/* ================= LEFT COLUMN ================= */}
      <div className="space-y-2.5">
        {/* 1. Status */}
        <div className="flex min-h-[32px] items-center gap-2 rounded-md px-1.5 transition-colors hover:bg-muted/40">
          <span className="flex w-[110px] shrink-0 items-center gap-2 text-xs font-normal text-muted-foreground">
            <CheckCircle2 className="size-4 text-muted-foreground/80 shrink-0" />
            Status
          </span>
          <div className="min-w-0 flex-1">
            {permissions.canEditStatus ? (
              <Select
                value={task.status}
                onValueChange={(v) => {
                  if (v === "On Hold") {
                    onRequestOnHold()
                  } else {
                    onStatusChange(v as TaskStatus)
                  }
                }}
              >
                <SelectTrigger
                  aria-label="Task status"
                  className="h-auto w-fit border-0 bg-transparent p-0 shadow-none hover:opacity-85 focus:ring-0 focus:outline-none"
                >
                  <SelectValue>
                    <Badge
                      variant="secondary"
                      className="h-6 px-2.5 text-[11px] font-semibold tracking-wider uppercase bg-muted/80 text-foreground/85 border border-border/50"
                    >
                      {task.status.toUpperCase()}
                    </Badge>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((st) => (
                    <SelectItem key={st} value={st}>
                      {st}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Badge
                variant="secondary"
                className="h-6 px-2.5 text-[11px] font-semibold tracking-wider uppercase bg-muted/80 text-foreground/85 border border-border/50"
              >
                {task.status.toUpperCase()}
              </Badge>
            )}
          </div>
        </div>

        {/* 2. Dates with side-by-side Start -> End -> Complete and interactive editing */}
        <div className="flex min-h-[32px] items-center gap-2 rounded-md px-1.5 transition-colors hover:bg-muted/40">
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  tabIndex={0}
                  role="button"
                  aria-label="Task dates timeline"
                  className="flex w-[110px] shrink-0 items-center gap-2 text-xs font-normal text-muted-foreground cursor-help hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-xs"
                >
                  <CalendarIcon className="size-4 text-muted-foreground/80 shrink-0" />
                  <span>Dates</span>
                </div>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                align="start"
                className="z-[80] rounded-lg border bg-popover p-2.5 text-xs text-popover-foreground shadow-md"
              >
                <div className="mb-2 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">
                  Task Timeline
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-x-2.5 gap-y-1.5 text-xs">
                  <span className="text-muted-foreground">Start Date:</span>
                  <span className="font-medium text-foreground">
                    {task.startDate ? formatFullDate(task.startDate) : "Not specified"} (Read-only)
                  </span>

                  <span className="text-muted-foreground">End Date:</span>
                  <span className="font-medium text-foreground">
                    {formatFullDate(task.dueDate)} (Due Date)
                  </span>

                  <span className="text-muted-foreground">Complete Date:</span>
                  <span
                    className={cn(
                      "font-medium",
                      task.status === "Complete" || completedDate
                        ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                        : "text-muted-foreground"
                    )}
                  >
                    {task.status === "Complete" || completedDate
                      ? completedDate
                        ? formatFullDate(completedDate)
                        : formatFullDate(task.dueDate)
                      : `Not completed (${task.status})`}
                  </span>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-1.5 text-xs text-foreground/90 font-normal whitespace-nowrap">
              {/* Start Date (Read-only) */}
              <TooltipProvider delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className="font-medium text-foreground whitespace-nowrap px-1 py-0.5 rounded cursor-default hover:bg-muted/50 transition-colors"
                    >
                      {formatSingleDate(task.startDate) || "—"}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    Start Date: {task.startDate ? formatFullDate(task.startDate) : "Not specified"} (Read-only)
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <span className="text-muted-foreground/50">→</span>

              {/* End Date (Editable) */}
              {permissions.canEditDetails && onDatesChange ? (
                <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                  <TooltipProvider delayDuration={150}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            aria-label="Edit end date"
                            className="group inline-flex items-center gap-1 rounded border border-transparent px-1.5 py-0.5 font-medium text-foreground transition-colors hover:border-border/70 hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring whitespace-nowrap cursor-pointer"
                          >
                            <span>{formatSingleDate(task.dueDate) || "—"}</span>
                            <Pencil className="size-2.5 text-muted-foreground/60 transition-opacity opacity-0 group-hover:opacity-100" />
                          </button>
                        </PopoverTrigger>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        End Date (Due Date): {formatFullDate(task.dueDate)} — Click to edit
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <PopoverContent className="w-auto p-2 z-[70]" align="start">
                    <div className="flex items-center justify-between border-b pb-1.5 mb-2 px-1 text-xs">
                      <span className="font-semibold text-foreground">Edit End Date</span>
                      <span className="text-[10px] text-muted-foreground">Due Date</span>
                    </div>
                    <CalendarPicker
                      mode="single"
                      selected={parseLocalDate(task.dueDate)}
                      onSelect={(date) => {
                        if (date) {
                          onDatesChange(task.startDate, toLocalDateString(date))
                        }
                        setEndDateOpen(false)
                      }}
                      defaultMonth={parseLocalDate(task.dueDate) ?? new Date()}
                    />
                  </PopoverContent>
                </Popover>
              ) : (
                <span className="font-medium text-foreground whitespace-nowrap px-1 py-0.5">
                  {formatSingleDate(task.dueDate) || "—"}
                </span>
              )}

              <span className="text-muted-foreground/50">→</span>

              {/* Complete Date (Editable) */}
              {permissions.canEditStatus && onCompletedDateChange ? (
                <Popover open={completeDateOpen} onOpenChange={setCompleteDateOpen}>
                  <TooltipProvider delayDuration={150}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            aria-label="Edit complete date"
                            className={cn(
                              "group inline-flex items-center gap-1 rounded border border-transparent px-1.5 py-0.5 font-medium transition-colors hover:border-border/70 hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring whitespace-nowrap cursor-pointer",
                              task.status === "Complete" || completedDate
                                ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                                : "text-muted-foreground/60 hover:text-foreground"
                            )}
                          >
                            {task.status === "Complete" || completedDate ? (
                              <>
                                <Check className="size-2.5 shrink-0" />
                                <span>{completedDate ? formatSingleDate(completedDate) : formatSingleDate(task.dueDate)}</span>
                              </>
                            ) : (
                              <span>—</span>
                            )}
                            <Pencil className="size-2.5 text-muted-foreground/60 transition-opacity opacity-0 group-hover:opacity-100" />
                          </button>
                        </PopoverTrigger>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        Complete Date: {task.status === "Complete" || completedDate ? formatFullDate(completedDate || task.dueDate) : "Not completed"} — Click to edit
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <PopoverContent className="w-auto p-2 z-[70] space-y-2" align="start">
                    <div className="flex items-center justify-between border-b pb-1.5 px-1 text-xs">
                      <span className="font-semibold text-foreground">Edit Complete Date</span>
                      <span className="text-[10px] text-muted-foreground">Completion</span>
                    </div>

                    <div className="flex items-center gap-1.5 px-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs flex-1"
                        onClick={() => {
                          onCompletedDateChange(todayIso)
                          setCompleteDateOpen(false)
                        }}
                      >
                        <Check className="mr-1 size-3 text-emerald-600" />
                        Mark Today ({formatSingleDate(todayIso)})
                      </Button>
                      {(task.status === "Complete" || completedDate) && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            onCompletedDateChange(undefined)
                            setCompleteDateOpen(false)
                          }}
                        >
                          Clear
                        </Button>
                      )}
                    </div>

                    <CalendarPicker
                      mode="single"
                      selected={parseLocalDate(completedDate)}
                      onSelect={(date) => {
                        if (date) {
                          onCompletedDateChange(toLocalDateString(date))
                        }
                        setCompleteDateOpen(false)
                      }}
                      defaultMonth={parseLocalDate(completedDate) ?? new Date()}
                    />
                  </PopoverContent>
                </Popover>
              ) : (
                <span className="font-medium text-foreground whitespace-nowrap px-1 py-0.5">
                  {task.status === "Complete" || completedDate ? (
                    <span className="inline-flex items-center gap-0.5 font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      <Check className="size-2.5" />
                      {completedDate ? formatSingleDate(completedDate) : formatSingleDate(task.dueDate)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/50 font-medium whitespace-nowrap">—</span>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 3. Project (READ-ONLY) */}
        <div className="flex min-h-[32px] items-center gap-2 rounded-md px-1.5 transition-colors hover:bg-muted/40">
          <span className="flex w-[110px] shrink-0 items-center gap-2 text-xs font-normal text-muted-foreground">
            <Folder className="size-4 text-muted-foreground/80 shrink-0" />
            Project
          </span>
          <div className="min-w-0 flex-1 flex items-center gap-1.5 text-xs">
            <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-[9px] font-bold text-cyan-700 dark:bg-cyan-950/80 dark:text-cyan-300">
              {getEntityInitials(task.projectName, 3) || "TDA"}
            </span>
            <span className="truncate text-foreground/90 font-normal">
              {task.projectName}
            </span>
          </div>
        </div>

        {/* 4. Created By (READ-ONLY) */}
        <div className="flex min-h-[32px] items-center gap-2 rounded-md px-1.5 transition-colors hover:bg-muted/40">
          <span className="flex w-[110px] shrink-0 items-center gap-2 text-xs font-normal text-muted-foreground">
            <FileEdit className="size-4 text-muted-foreground/80 shrink-0" />
            Created By
          </span>
          <div className="min-w-0 flex-1 flex items-center gap-1.5 text-xs">
            <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-pink-100 text-[9px] font-bold text-pink-700 dark:bg-pink-950/80 dark:text-pink-300">
              {getEntityInitials(creatorName, 2)}
            </span>
            <span className="truncate text-foreground/90 font-normal">
              {creatorName}
            </span>
          </div>
        </div>

        {/* 5. Members */}
        <div className="flex min-h-[32px] items-center gap-2 rounded-md px-1.5 transition-colors hover:bg-muted/40">
          <span className="flex w-[110px] shrink-0 items-center gap-2 text-xs font-normal text-muted-foreground">
            <Users className="size-4 text-muted-foreground/80 shrink-0" />
            Members
          </span>
          <div className="min-w-0 flex-1">
            {canEditMembers && onMembersChange ? (
              <Popover open={memberOpen} onOpenChange={setMemberOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    aria-label="Edit members"
                    className="flex min-w-0 items-center gap-1.5 rounded-md px-1 py-0.5 text-left text-xs transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer group"
                  >
                    {selectedMembers.length === 0 ? (
                      <span className="inline-flex items-center rounded bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground group-hover:text-foreground group-hover:bg-muted">
                        Empty
                      </span>
                    ) : selectedMembers.length === 1 ? (
                      <div className="flex min-w-0 items-center gap-1.5">
                        <span
                          className={cn(
                            "flex size-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white",
                            selectedMembers[0].avatarColor || "bg-indigo-600"
                          )}
                        >
                          {selectedMembers[0].avatarInitials}
                        </span>
                        <span className="truncate font-medium text-foreground">
                          {selectedMembers[0].name}
                        </span>
                      </div>
                    ) : (
                      <div
                        className="flex min-w-0 items-center gap-1.5"
                        title={selectedMembers.map((m) => m.name).join(", ")}
                      >
                        <div className="flex items-center -space-x-1.5 shrink-0">
                          {selectedMembers.slice(0, 3).map((m) => (
                            <span
                              key={m.id}
                              className={cn(
                                "flex size-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white ring-2 ring-background",
                                m.avatarColor || "bg-indigo-600"
                              )}
                              title={m.name}
                            >
                              {m.avatarInitials}
                            </span>
                          ))}
                          {selectedMembers.length > 3 ? (
                            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[8px] font-semibold text-muted-foreground ring-2 ring-background">
                              +{selectedMembers.length - 3}
                            </span>
                          ) : null}
                        </div>
                        <span className="truncate font-medium text-foreground">
                          {membersDisplayText}
                        </span>
                      </div>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-68 p-2 z-[70]">
                  <div className="mb-2 flex items-center justify-between gap-1 px-1">
                    <span className="text-xs font-semibold text-foreground">
                      Task Members
                    </span>
                    {selectedMemberIds.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => onMembersChange([])}
                        className="text-[11px] text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                      >
                        Clear all
                      </button>
                    ) : null}
                  </div>
                  <div className="mb-2">
                    <Input
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      placeholder="Search members to add…"
                      className="h-7 text-xs"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-48 space-y-0.5 overflow-y-auto">
                    {filteredMemberUsers.length === 0 ? (
                      <p className="py-2 text-center text-xs text-muted-foreground">
                        No staff matched.
                      </p>
                    ) : (
                      filteredMemberUsers.map((u) => {
                        const isSelected = selectedMemberIds.includes(u.id)
                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => toggleMember(u.id)}
                            className={cn(
                              "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted cursor-pointer",
                              isSelected && "bg-muted/70 font-medium"
                            )}
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              <span
                                className={cn(
                                  "flex size-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white",
                                  u.avatarColor || "bg-indigo-600"
                                )}
                              >
                                {u.avatarInitials}
                              </span>
                              <div className="min-w-0">
                                <div className="truncate font-medium">{u.name}</div>
                                <div className="truncate text-[10px] text-muted-foreground">
                                  {u.role}
                                </div>
                              </div>
                            </div>
                            {isSelected ? (
                              <Check className="size-3.5 shrink-0 text-primary" />
                            ) : null}
                          </button>
                        )
                      })
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            ) : selectedMembers.length === 0 ? (
              <span className="inline-flex items-center rounded bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                Empty
              </span>
            ) : selectedMembers.length === 1 ? (
              <div className="flex min-w-0 items-center gap-1.5 text-xs">
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white",
                    selectedMembers[0].avatarColor || "bg-indigo-600"
                  )}
                >
                  {selectedMembers[0].avatarInitials}
                </span>
                <span className="truncate font-medium text-foreground">
                  {selectedMembers[0].name}
                </span>
              </div>
            ) : (
              <div
                className="flex min-w-0 items-center gap-1.5 text-xs"
                title={selectedMembers.map((m) => m.name).join(", ")}
              >
                <div className="flex items-center -space-x-1.5 shrink-0">
                  {selectedMembers.slice(0, 3).map((m) => (
                    <span
                      key={m.id}
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white ring-2 ring-background",
                        m.avatarColor || "bg-indigo-600"
                      )}
                    >
                      {m.avatarInitials}
                    </span>
                  ))}
                  {selectedMembers.length > 3 ? (
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[8px] font-semibold text-muted-foreground ring-2 ring-background">
                      +{selectedMembers.length - 3}
                    </span>
                  ) : null}
                </div>
                <span className="truncate font-medium text-foreground">
                  {membersDisplayText}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= RIGHT COLUMN ================= */}
      <div className="space-y-2.5">
        {/* 1. Assignees */}
        <div className="flex min-h-[32px] items-center gap-2 rounded-md px-1.5 transition-colors hover:bg-muted/40">
          <span className="flex w-[110px] shrink-0 items-center gap-2 text-xs font-normal text-muted-foreground">
            <User className="size-4 text-muted-foreground/80 shrink-0" />
            Assignees
          </span>
          <div className="min-w-0 flex-1">
            {permissions.canEditAssignees ? (
              <Popover open={assigneeOpen} onOpenChange={setAssigneeOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    aria-label="Edit assignee"
                    className="flex min-w-0 items-center gap-1.5 rounded-md px-1 py-0.5 text-left text-xs transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {primaryAssignee ? (
                      <div className="flex min-w-0 items-center gap-1.5">
                        <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[9px] font-bold text-sky-700 dark:bg-sky-950/80 dark:text-sky-300">
                          {getEntityInitials(primaryAssignee.name, 2)}
                        </span>
                        <span className="truncate font-medium text-foreground">
                          {primaryAssignee.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-64 p-2">
                  <div className="mb-2">
                    <Input
                      value={assigneeSearch}
                      onChange={(e) => setAssigneeSearch(e.target.value)}
                      placeholder="Search assignees…"
                      className="h-7 text-xs"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-48 space-y-0.5 overflow-y-auto">
                    {primaryAssignee && (
                      <button
                        type="button"
                        onClick={() => {
                          onAssigneesChange([])
                          setAssigneeOpen(false)
                          setAssigneeSearch("")
                        }}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <span>Unassign (no assignee)</span>
                      </button>
                    )}
                    {filteredUsers.length === 0 ? (
                      <p className="py-2 text-center text-xs text-muted-foreground">
                        No staff matched.
                      </p>
                    ) : (
                      filteredUsers.map((u) => {
                        const selected = task.assigneeIds.includes(u.id)
                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => selectAssignee(u.id)}
                            className={cn(
                              "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted",
                              selected && "bg-muted/70 font-medium"
                            )}
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              <span
                                className={cn(
                                  "flex size-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white",
                                  u.avatarColor || "bg-blue-600"
                                )}
                              >
                                {u.avatarInitials}
                              </span>
                              <div className="min-w-0">
                                <div className="truncate font-medium">{u.name}</div>
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
            ) : primaryAssignee ? (
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[9px] font-bold text-sky-700 dark:bg-sky-950/80 dark:text-sky-300">
                  {getEntityInitials(primaryAssignee.name, 2)}
                </span>
                <span className="truncate font-medium text-foreground">
                  {primaryAssignee.name}
                </span>
              </div>
            ) : (
              <span className="text-muted-foreground">Unassigned</span>
            )}
          </div>
        </div>

        {/* 2. Priority */}
        <div className="flex min-h-[32px] items-center gap-2 rounded-md px-1.5 transition-colors hover:bg-muted/40">
          <span className="flex w-[110px] shrink-0 items-center gap-2 text-xs font-normal text-muted-foreground">
            <Flag className="size-4 text-muted-foreground/80 shrink-0" />
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
                  className="h-auto w-fit border-0 bg-transparent p-0 shadow-none hover:opacity-85 focus:ring-0 focus:outline-none"
                >
                  <SelectValue>
                    <Badge
                      variant="outline"
                      className={cn(
                        "h-6 gap-1 px-2.5 text-xs font-medium rounded-full border transition-colors",
                        task.priority === "Urgent"
                          ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300"
                          : task.priority === "High"
                            ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300"
                            : "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-500/30 dark:bg-purple-500/15 dark:text-purple-300"
                      )}
                    >
                      <Flag className="size-3 shrink-0" />
                      <span>{task.priority}</span>
                    </Badge>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      <span className="inline-flex items-center gap-1.5 font-medium">
                        <Flag
                          className={cn(
                            "size-3",
                            p === "Urgent"
                              ? "text-rose-600"
                              : p === "High"
                                ? "text-amber-600"
                                : "text-purple-600"
                          )}
                        />
                        <span>{p}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Badge
                variant="outline"
                className={cn(
                  "h-6 gap-1 px-2.5 text-xs font-medium rounded-full border",
                  task.priority === "Urgent"
                    ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300"
                    : task.priority === "High"
                      ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300"
                      : "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-500/30 dark:bg-purple-500/15 dark:text-purple-300"
                )}
              >
                <Flag className="size-3 shrink-0" />
                <span>{task.priority}</span>
              </Badge>
            )}
          </div>
        </div>

        {/* 3. Client (READ-ONLY) */}
        <div className="flex min-h-[32px] items-center gap-2 rounded-md px-1.5 transition-colors hover:bg-muted/40">
          <span className="flex w-[110px] shrink-0 items-center gap-2 text-xs font-normal text-muted-foreground">
            <Tag className="size-4 text-muted-foreground/80 shrink-0" />
            Client
          </span>
          <div className="min-w-0 flex-1 flex items-center gap-1.5 text-xs">
            <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-[9px] font-bold text-cyan-700 dark:bg-cyan-950/80 dark:text-cyan-300">
              {getEntityInitials(clientName, 3) || "TDA"}
            </span>
            <span className="truncate text-foreground/90 font-normal">
              {clientName}
            </span>
          </div>
        </div>

        {/* 4. Project Admin */}
        <div className="flex min-h-[32px] items-center gap-2 rounded-md px-1.5 transition-colors hover:bg-muted/40">
          <span className="flex w-[110px] shrink-0 items-center gap-2 text-xs font-normal text-muted-foreground">
            <ShieldCheck className="size-4 text-muted-foreground/80 shrink-0" />
            Project Admin
          </span>
          <div className="min-w-0 flex-1 flex items-center gap-1.5 text-xs">
            <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-pink-100 text-[9px] font-bold text-pink-700 dark:bg-pink-950/80 dark:text-pink-300">
              {getEntityInitials(projectAdmin?.name, 2)}
            </span>
            <span className="truncate text-foreground/90 font-normal">
              {projectAdmin?.name || "Kevin Marshall"}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
