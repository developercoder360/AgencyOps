"use client"

import * as React from "react"
import {
  Calendar as CalendarIcon,
  Check,
  CheckCircle2,
  FileEdit,
  Flag,
  Folder,
  ShieldCheck,
  Tag,
  User,
  Users,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
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
  formatDateRange,
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
  onDatesChange?: (startDate: string | undefined, dueDate: string) => void
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
  onStatusChange,
  onRequestOnHold,
  onAssigneesChange,
  onPriorityChange,
  creatorName: propCreatorName,
}: TaskPropertiesGridProps) {
  const [assigneeSearch, setAssigneeSearch] = React.useState("")
  const [assigneeOpen, setAssigneeOpen] = React.useState(false)

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

        {/* 2. Dates (READ-ONLY) with side-by-side Start -> End -> Complete and detailed Tooltip */}
        <div className="flex min-h-[32px] items-center gap-2 rounded-md px-1.5 transition-colors hover:bg-muted/40">
          <span className="flex w-[110px] shrink-0 items-center gap-2 text-xs font-normal text-muted-foreground">
            <CalendarIcon className="size-4 text-muted-foreground/80 shrink-0" />
            Dates
          </span>
          <div className="min-w-0 flex-1">
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    tabIndex={0}
                    role="button"
                    aria-label={`Dates: Start ${formatSingleDate(task.startDate) || "—"}, End ${formatSingleDate(task.dueDate) || "—"}, Complete ${task.status === "Complete" ? (completedDate ? formatSingleDate(completedDate) : formatSingleDate(task.dueDate)) : "—"}. Click or hover for full timeline.`}
                    className="inline-flex items-center gap-1.5 text-xs text-foreground/90 font-normal cursor-help hover:text-foreground transition-colors group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-xs whitespace-nowrap"
                  >
                    <CalendarIcon className="size-3.5 text-muted-foreground/70 shrink-0 group-hover:text-foreground" />
                    <div className="inline-flex items-center gap-1.5 border-b border-dotted border-muted-foreground/50 pb-0.5 whitespace-nowrap">
                      <span
                        className="font-medium text-foreground whitespace-nowrap"
                        title={`Start Date: ${task.startDate ? formatFullDate(task.startDate) : "Not specified"}`}
                      >
                        {formatSingleDate(task.startDate) || "—"}
                      </span>
                      <span className="text-muted-foreground/50">→</span>
                      <span
                        className="font-medium text-foreground whitespace-nowrap"
                        title={`End Date (Due Date): ${formatFullDate(task.dueDate)}`}
                      >
                        {formatSingleDate(task.dueDate) || "—"}
                      </span>
                      <span className="text-muted-foreground/50">→</span>
                      {task.status === "Complete" ? (
                        <span
                          className="inline-flex items-center gap-0.5 font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap"
                          title={`Complete Date: ${completedDate ? formatFullDate(completedDate) : formatFullDate(task.dueDate)}`}
                        >
                          <Check className="size-2.5" />
                          {completedDate ? formatSingleDate(completedDate) : formatSingleDate(task.dueDate)}
                        </span>
                      ) : (
                        <span
                          className="text-muted-foreground/50 font-medium whitespace-nowrap"
                          title="Complete Date: Not completed yet"
                        >
                          —
                        </span>
                      )}
                    </div>
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
                      {task.startDate ? formatFullDate(task.startDate) : "Not specified"}
                    </span>

                    <span className="text-muted-foreground">End Date:</span>
                    <span className="font-medium text-foreground">
                      {formatFullDate(task.dueDate)} (Due Date)
                    </span>

                    <span className="text-muted-foreground">Complete Date:</span>
                    <span
                      className={cn(
                        "font-medium",
                        task.status === "Complete"
                          ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                          : "text-muted-foreground"
                      )}
                    >
                      {task.status === "Complete"
                        ? completedDate
                          ? formatFullDate(completedDate)
                          : formatFullDate(task.dueDate)
                        : `Not completed (${task.status})`}
                    </span>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
            <span className="inline-flex items-center rounded bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              Empty
            </span>
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
