"use client"

import * as React from "react"
import Link from "next/link"
import type { DateRange } from "react-day-picker"
import {
  Building2,
  Calendar as CalendarIcon,
  Check,
  ExternalLink,
  Flag,
  FolderKanban,
  Search,
  UserCheck,
  Users,
  X,
} from "lucide-react"
import { AvatarGroup, StatusBadge } from "@/components/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
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
  PRIORITY_META,
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
  onDatesChange: (startDate: string | undefined, dueDate: string) => void
  onPriorityChange: (priority: TaskPriority) => void
  onClientChange: (clientId: string | null) => void
  onLeadChange: (leadId: string | null) => void
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
  signups,
  leads,
  permissions,
  todayIso,
  onStatusChange,
  onRequestOnHold,
  onAssigneesChange,
  onDatesChange,
  onPriorityChange,
  onClientChange,
  onLeadChange,
  onNavigateClose,
}: TaskPropertiesGridProps) {
  const [assigneeSearch, setAssigneeSearch] = React.useState("")
  const [assigneeOpen, setAssigneeOpen] = React.useState(false)
  const [datesOpen, setDatesOpen] = React.useState(false)
  const [clientOpen, setClientOpen] = React.useState(false)
  const [clientSearch, setClientSearch] = React.useState("")
  const [leadOpen, setLeadOpen] = React.useState(false)
  const [leadSearch, setLeadSearch] = React.useState("")

  const assignees = React.useMemo(
    () => users.filter((u) => task.assigneeIds.includes(u.id)),
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

  function toggleAssignee(userId: string) {
    const next = task.assigneeIds.includes(userId)
      ? task.assigneeIds.filter((id) => id !== userId)
      : [...task.assigneeIds, userId]
    if (next.length === 0) return
    onAssigneesChange(next)
  }

  // Client relations
  const currentClient = React.useMemo(
    () => (task.clientId ? signups.find((s) => s.id === task.clientId) : null),
    [signups, task.clientId]
  )
  const suggestedClient = React.useMemo(() => {
    if (!task.leadId || task.clientId) return null
    return signups.find((s) => s.leadId === task.leadId) ?? null
  }, [signups, task.leadId, task.clientId])

  const filteredSignups = React.useMemo(() => {
    const q = clientSearch.trim().toLowerCase()
    if (!q) return signups
    return signups.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q)
    )
  }, [signups, clientSearch])

  // Lead relations
  const currentLead = React.useMemo(
    () => (task.leadId ? leads.find((l) => l.id === task.leadId) : null),
    [leads, task.leadId]
  )
  const suggestedLead = React.useMemo(() => {
    if (!currentClient?.leadId || task.leadId) return null
    return leads.find((l) => l.id === currentClient.leadId) ?? null
  }, [leads, currentClient, task.leadId])

  const filteredLeads = React.useMemo(() => {
    const q = leadSearch.trim().toLowerCase()
    if (!q) return leads
    return leads.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.company.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q)
    )
  }, [leads, leadSearch])

  const initialRange: DateRange | undefined = React.useMemo(() => {
    const from = parseIso(task.startDate)
    const to = parseIso(task.dueDate)
    if (!from && !to) return undefined
    return { from: from ?? to, to: to ?? from }
  }, [task.startDate, task.dueDate])

  const [dateRangeDraft, setDateRangeDraft] = React.useState<DateRange | undefined>(
    initialRange
  )

  React.useEffect(() => {
    setDateRangeDraft(initialRange)
  }, [initialRange])

  function handleSaveDates() {
    if (!dateRangeDraft?.to && !dateRangeDraft?.from) return
    const nextDue = dateRangeDraft.to
      ? toIso(dateRangeDraft.to)
      : dateRangeDraft.from
      ? toIso(dateRangeDraft.from)
      : task.dueDate
    const nextStart = dateRangeDraft.from
      ? toIso(dateRangeDraft.from)
      : undefined
    onDatesChange(nextStart, nextDue)
    setDatesOpen(false)
  }

  const isOverdue =
    task.status !== "Complete" && task.dueDate < todayIso

  return (
    <div
      aria-label="Task properties"
      className="grid grid-cols-1 gap-x-6 gap-y-0.5 rounded-lg py-1 sm:grid-cols-2"
    >
      {/* 1. Status */}
      <div className="flex min-h-[36px] items-center gap-2 rounded-md px-2 transition-colors hover:bg-muted/40">
        <span className="flex w-[120px] shrink-0 items-center gap-1.5 text-xs font-medium text-muted-foreground">
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
                className="h-7 w-fit min-w-[120px] border-transparent bg-transparent px-1.5 text-xs shadow-none hover:border-border hover:bg-background"
              >
                <SelectValue>
                  <StatusBadge status={task.status} />
                </SelectValue>
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
      <div className="flex min-h-[36px] items-center gap-2 rounded-md px-2 transition-colors hover:bg-muted/40">
        <span className="flex w-[120px] shrink-0 items-center gap-1.5 text-xs font-medium text-muted-foreground">
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
                                u.avatarColor || "bg-primary"
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
                          <div className="flex items-center gap-1.5">
                            {redFlagged ? (
                              <Flag
                                className="size-3 text-destructive"
                                aria-label="Red flagged"
                              />
                            ) : null}
                            {selected ? (
                              <Check className="size-3.5 text-primary" />
                            ) : null}
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            <div className="inline-flex items-center gap-1.5 text-xs">
              <AvatarGroup people={assignees} max={3} />
              <span className="truncate text-foreground">
                {assignees.map((a) => a.name).join(", ") || "Unassigned"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Dates */}
      <div className="flex min-h-[36px] items-center gap-2 rounded-md px-2 transition-colors hover:bg-muted/40">
        <span className="flex w-[120px] shrink-0 items-center gap-1.5 text-xs font-medium text-muted-foreground">
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
                    "inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs tabular-nums transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isOverdue && "font-semibold text-rose-600 dark:text-rose-400"
                  )}
                >
                  <span>
                    {task.startDate ? `${task.startDate} → ` : ""}
                    {task.dueDate}
                  </span>
                  {isOverdue ? (
                    <Badge variant="destructive" className="h-4 px-1 text-[10px]">
                      Overdue
                    </Badge>
                  ) : null}
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto p-3">
                <div className="space-y-3">
                  <div className="text-xs font-medium">Select date range</div>
                  <Calendar
                    mode="range"
                    selected={dateRangeDraft}
                    onSelect={setDateRangeDraft}
                    numberOfMonths={1}
                  />
                  <div className="flex items-center justify-end gap-2 border-t border-border pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => setDatesOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="button" size="xs" onClick={handleSaveDates}>
                      Apply
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            <span
              className={cn(
                "text-xs tabular-nums",
                isOverdue && "font-semibold text-rose-600 dark:text-rose-400"
              )}
            >
              {task.startDate ? `${task.startDate} → ` : ""}
              {task.dueDate}
            </span>
          )}
        </div>
      </div>

      {/* 4. Priority */}
      <div className="flex min-h-[36px] items-center gap-2 rounded-md px-2 transition-colors hover:bg-muted/40">
        <span className="flex w-[120px] shrink-0 items-center gap-1.5 text-xs font-medium text-muted-foreground">
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
                className="h-7 w-fit min-w-[110px] border-transparent bg-transparent px-1.5 text-xs shadow-none hover:border-border hover:bg-background"
              >
                <SelectValue>
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <Flag
                      className={cn(
                        "size-3",
                        PRIORITY_META[task.priority].flagClass
                      )}
                    />
                    <span>{task.priority}</span>
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {TASK_PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <Flag
                        className={cn("size-3", PRIORITY_META[p].flagClass)}
                      />
                      <span>{p}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium">
              <Flag
                className={cn("size-3", PRIORITY_META[task.priority].flagClass)}
              />
              <span>{task.priority}</span>
            </span>
          )}
        </div>
      </div>

      {/* 5. Client */}
      <div className="flex min-h-[36px] items-center gap-2 rounded-md px-2 transition-colors hover:bg-muted/40">
        <span className="flex w-[120px] shrink-0 items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <UserCheck className="size-3.5" />
          Client
        </span>
        <div className="flex min-w-0 flex-1 items-center gap-1">
          {permissions.canEditDetails ? (
            <Popover open={clientOpen} onOpenChange={setClientOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label="Edit task client"
                  className="inline-flex max-w-[200px] items-center gap-1 rounded-md px-1.5 py-1 text-xs transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {currentClient ? (
                    <span className="truncate font-medium text-foreground">
                      {currentClient.name}
                    </span>
                  ) : (
                    <span className="text-muted-foreground hover:text-foreground">
                      + Add client
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-68 p-2">
                <div className="relative mb-2">
                  <Search className="pointer-events-none absolute top-2 left-2.5 size-3.5 text-muted-foreground" />
                  <Input
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    placeholder="Search client sign-ups…"
                    aria-label="Search clients"
                    className="h-7 pl-8 text-xs"
                  />
                </div>
                {suggestedClient && (
                  <div className="mb-2 rounded border border-primary/20 bg-primary/5 p-1.5 text-[11px]">
                    <div className="font-semibold text-primary">
                      Suggested from Lead:
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClientChange(suggestedClient.id)
                        setClientOpen(false)
                      }}
                      className="mt-1 flex w-full items-center justify-between rounded px-1.5 py-1 text-left text-xs hover:bg-primary/10"
                    >
                      <span className="truncate font-medium">
                        {suggestedClient.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {suggestedClient.code}
                      </span>
                    </button>
                  </div>
                )}
                <div className="max-h-52 space-y-0.5 overflow-y-auto">
                  {filteredSignups.length === 0 ? (
                    <p className="py-3 text-center text-xs text-muted-foreground">
                      No client sign-ups matched.
                    </p>
                  ) : (
                    filteredSignups.map((su) => {
                      const selected = task.clientId === su.id
                      return (
                        <button
                          key={su.id}
                          type="button"
                          onClick={() => {
                            onClientChange(su.id)
                            setClientOpen(false)
                          }}
                          className={cn(
                            "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            selected && "bg-muted/70"
                          )}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium">{su.name}</div>
                            <div className="truncate text-[10px] text-muted-foreground">
                              {su.email} · {su.code}
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
            <span className="truncate text-xs font-medium text-foreground">
              {currentClient ? currentClient.name : "None"}
            </span>
          )}

          {currentClient && (
            <div className="flex shrink-0 items-center">
              {permissions.canEditDetails && (
                <button
                  type="button"
                  onClick={() => onClientChange(null)}
                  title="Unlink client"
                  aria-label="Unlink client"
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              )}
              <Link
                href="/sign-ups"
                onClick={onNavigateClose}
                title="Open client sign-ups"
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <ExternalLink className="size-3" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 6. Lead */}
      <div className="flex min-h-[36px] items-center gap-2 rounded-md px-2 transition-colors hover:bg-muted/40">
        <span className="flex w-[120px] shrink-0 items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <FolderKanban className="size-3.5" />
          Lead
        </span>
        <div className="flex min-w-0 flex-1 items-center gap-1">
          {permissions.canEditDetails ? (
            <Popover open={leadOpen} onOpenChange={setLeadOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label="Edit task lead"
                  className="inline-flex max-w-[200px] items-center gap-1 rounded-md px-1.5 py-1 text-xs transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {currentLead ? (
                    <span className="truncate font-medium text-foreground">
                      {currentLead.name}
                    </span>
                  ) : (
                    <span className="text-muted-foreground hover:text-foreground">
                      + Add lead
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-68 p-2">
                <div className="relative mb-2">
                  <Search className="pointer-events-none absolute top-2 left-2.5 size-3.5 text-muted-foreground" />
                  <Input
                    value={leadSearch}
                    onChange={(e) => setLeadSearch(e.target.value)}
                    placeholder="Search leads…"
                    aria-label="Search leads"
                    className="h-7 pl-8 text-xs"
                  />
                </div>
                {suggestedLead && (
                  <div className="mb-2 rounded border border-primary/20 bg-primary/5 p-1.5 text-[11px]">
                    <div className="font-semibold text-primary">
                      Suggested from Client:
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onLeadChange(suggestedLead.id)
                        setLeadOpen(false)
                      }}
                      className="mt-1 flex w-full items-center justify-between rounded px-1.5 py-1 text-left text-xs hover:bg-primary/10"
                    >
                      <span className="truncate font-medium">
                        {suggestedLead.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {suggestedLead.code}
                      </span>
                    </button>
                  </div>
                )}
                <div className="max-h-52 space-y-0.5 overflow-y-auto">
                  {filteredLeads.length === 0 ? (
                    <p className="py-3 text-center text-xs text-muted-foreground">
                      No leads matched.
                    </p>
                  ) : (
                    filteredLeads.map((ld) => {
                      const selected = task.leadId === ld.id
                      return (
                        <button
                          key={ld.id}
                          type="button"
                          onClick={() => {
                            onLeadChange(ld.id)
                            setLeadOpen(false)
                          }}
                          className={cn(
                            "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            selected && "bg-muted/70"
                          )}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium">{ld.name}</div>
                            <div className="truncate text-[10px] text-muted-foreground">
                              {ld.company} · {ld.code}
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
            <span className="truncate text-xs font-medium text-foreground">
              {currentLead ? currentLead.name : "None"}
            </span>
          )}

          {currentLead && (
            <div className="flex shrink-0 items-center">
              {permissions.canEditDetails && (
                <button
                  type="button"
                  onClick={() => onLeadChange(null)}
                  title="Unlink lead"
                  aria-label="Unlink lead"
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              )}
              <Link
                href="/leads"
                onClick={onNavigateClose}
                title="Open leads pipeline"
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <ExternalLink className="size-3" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 7. Project */}
      <div className="flex min-h-[36px] items-center gap-2 rounded-md px-2 transition-colors hover:bg-muted/40">
        <span className="flex w-[120px] shrink-0 items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <FolderKanban className="size-3.5" />
          Project
        </span>
        <div className="min-w-0 flex-1 truncate text-xs">
          <Link
            href={`/projects/${task.projectId}`}
            onClick={onNavigateClose}
            className="truncate font-medium text-foreground hover:text-primary hover:underline"
          >
            {task.projectName}
          </Link>
        </div>
      </div>

      {/* 8. Brand */}
      <div className="flex min-h-[36px] items-center gap-2 rounded-md px-2 transition-colors hover:bg-muted/40">
        <span className="flex w-[120px] shrink-0 items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Building2 className="size-3.5" />
          Brand
        </span>
        <div className="min-w-0 flex-1 truncate text-xs">
          <Link
            href="/brands"
            onClick={onNavigateClose}
            className="inline-flex items-center gap-1 font-medium text-foreground hover:text-primary hover:underline"
          >
            <Badge variant="outline" className="font-normal text-[11px]">
              {task.brandName}
            </Badge>
          </Link>
        </div>
      </div>
    </div>
  )
}
