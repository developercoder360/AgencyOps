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
  getEntityInitials,
  TASK_PRIORITIES,
  TASK_STATUSES,
} from "./types"

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

  // Assigned team members
  const assignees = React.useMemo(
    () => users.filter((u) => task.assigneeIds.includes(u.id)),
    [users, task.assigneeIds]
  )

  const primaryAssignee = assignees[0]

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

  function toggleAssignee(userId: string) {
    const current = task.assigneeIds
    const next = current.includes(userId)
      ? current.filter((id) => id !== userId)
      : [...current, userId]
    onAssigneesChange(next)
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

        {/* 2. Dates (READ-ONLY) */}
        <div className="flex min-h-[32px] items-center gap-2 rounded-md px-1.5 transition-colors hover:bg-muted/40">
          <span className="flex w-[110px] shrink-0 items-center gap-2 text-xs font-normal text-muted-foreground">
            <CalendarIcon className="size-4 text-muted-foreground/80 shrink-0" />
            Dates
          </span>
          <div className="min-w-0 flex-1 flex items-center gap-1.5 text-xs text-foreground/90 font-normal">
            <CalendarIcon className="size-3.5 text-muted-foreground/70 shrink-0" />
            <span>{formatDateRange(task.startDate, task.dueDate)}</span>
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
                    aria-label="Edit assignees"
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
                        {assignees.length > 1 ? (
                          <span className="shrink-0 text-[11px] text-muted-foreground font-normal">
                            +{assignees.length - 1}
                          </span>
                        ) : null}
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
                    />
                  </div>
                  <div className="max-h-48 space-y-0.5 overflow-y-auto">
                    {filteredUsers.map((u) => {
                      const selected = task.assigneeIds.includes(u.id)
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => toggleAssignee(u.id)}
                          className={cn(
                            "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted",
                            selected && "bg-muted/70"
                          )}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium">{u.name}</div>
                            <div className="truncate text-[10px] text-muted-foreground">
                              {u.role}
                            </div>
                          </div>
                          {selected ? (
                            <Check className="size-3.5 shrink-0 text-primary" />
                          ) : null}
                        </button>
                      )
                    })}
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
                {assignees.length > 1 ? (
                  <span className="text-[11px] text-muted-foreground">
                    +{assignees.length - 1}
                  </span>
                ) : null}
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
