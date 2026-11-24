"use client"

import * as React from "react"
import { toast } from "sonner"
import { Check, Flag } from "lucide-react"
import {
  PRIORITY_META,
  TASK_PRIORITIES,
  TASK_STATUSES,
  getTodayIsoFromNow,
  useClientNow,
} from "@/components/delivery/task-detail"
import { useAppState } from "@/components/providers/app-state-provider"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { resolveClientProfile } from "@/lib/files/client-resolver"
import { useStore } from "@/lib/store"
import type { Task, TaskPriority, TaskScope, TaskStatus } from "@/types"
import { cn } from "cn"

interface TaskFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  task?: Task | null
  scope: TaskScope
  scopeId?: string
  defaultStatus?: TaskStatus
}

export function TaskFormDialog(props: TaskFormDialogProps) {
  const key =
    props.mode === "edit"
      ? `edit:${props.task?.id ?? "none"}:${props.open}`
      : `create:${props.scope}:${props.scopeId ?? "all"}:${props.defaultStatus ?? "Open"}:${props.open}`

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <TaskFormDialogInner key={key} {...props} />
      </DialogContent>
    </Dialog>
  )
}

function TaskFormDialogInner({
  onOpenChange,
  mode,
  task,
  scope,
  scopeId,
  defaultStatus = "Open",
}: TaskFormDialogProps) {
  const { projects, users, signups, leads, tasks, createTask, updateTask } =
    useStore()
  const { activeUserId, activeUser, hasTaskPermission } = useAppState()

  const canAssign = hasTaskPermission("tasks.assign")
  const canManageStatus = hasTaskPermission("tasks.manage_status")

  const nowMs = useClientNow()
  const todayIso = getTodayIsoFromNow(nowMs)

  const clientProfile = React.useMemo(() => {
    if (scope !== "client" || !scopeId) return null
    return resolveClientProfile(scopeId, { signups, leads, projects, tasks })
  }, [scope, scopeId, signups, leads, projects, tasks])

  const availableProjects = React.useMemo(() => {
    if (scope === "client" && clientProfile && clientProfile.projects.length > 0) {
      return clientProfile.projects
    }
    return projects
  }, [scope, clientProfile, projects])

  const defaultProjectId = React.useMemo(() => {
    if (mode === "edit" && task) return task.projectId
    if (scope === "project" && scopeId) return scopeId
    return availableProjects[0]?.id ?? projects[0]?.id ?? ""
  }, [mode, task, scope, scopeId, availableProjects, projects])

  const [title, setTitle] = React.useState(mode === "edit" && task ? task.title : "")
  const [projectId, setProjectId] = React.useState(defaultProjectId)
  const [status, setStatus] = React.useState<TaskStatus>(
    mode === "edit" && task ? task.status : defaultStatus
  )
  const [priority, setPriority] = React.useState<TaskPriority>(
    mode === "edit" && task ? task.priority : "High"
  )
  const [assigneeIds, setAssigneeIds] = React.useState<string[]>(() => {
    if (mode === "edit" && task) return [...(task.assigneeIds ?? [])]
    return activeUserId ? [activeUserId] : users[0] ? [users[0].id] : []
  })
  const [startDate, setStartDate] = React.useState(
    mode === "edit" && task ? task.startDate || todayIso : todayIso
  )
  const [dueDate, setDueDate] = React.useState(
    mode === "edit" && task ? task.dueDate : "2026-12-15"
  )
  const [description, setDescription] = React.useState(
    mode === "edit" && task ? task.description : ""
  )
  const [error, setError] = React.useState<string | null>(null)

  function toggleAssignee(userId: string) {
    if (!canAssign) return
    setAssigneeIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmedTitle = title.trim()
    if (trimmedTitle.length < 3) {
      setError("Task title must be at least 3 characters.")
      return
    }
    const chosenProject = projects.find((p) => p.id === projectId)
    if (!chosenProject) {
      setError("Please select a project.")
      return
    }
    if (!dueDate) {
      setError("Please select a due date.")
      return
    }

    const finalAssignees =
      assigneeIds.length > 0
        ? assigneeIds
        : [activeUserId || users[0]?.id || "usr-admin"]

    if (mode === "edit" && task) {
      updateTask(
        task.id,
        {
          title: trimmedTitle,
          projectId: chosenProject.id,
          projectName: chosenProject.name,
          brandId: chosenProject.brandId,
          brandName: chosenProject.brandName,
          status: canManageStatus ? status : task.status,
          priority,
          assigneeIds: canAssign ? finalAssignees : task.assigneeIds,
          startDate,
          dueDate,
          description: description.trim(),
        },
        {
          type: "system",
          actorId: activeUserId || "usr-admin",
          actorName: activeUser?.name ?? "Current User",
          action: "updated task details",
          detail: trimmedTitle,
        }
      )
      toast.success(`Updated task ${task.code}`)
      onOpenChange(false)
      return
    }

    const nextNumber = tasks.length + 161
    const code = `TSK-${String(nextNumber).padStart(4, "0")}`
    const clientMatch =
      scope === "client" && clientProfile
        ? clientProfile.signupId ?? null
        : null
    const leadMatch =
      scope === "client" && clientProfile
        ? clientProfile.leadId ?? null
        : null

    const created = createTask({
      code,
      title: trimmedTitle,
      description:
        description.trim() ||
        `Deliverable task for ${chosenProject.name}.`,
      projectId: chosenProject.id,
      projectName: chosenProject.name,
      brandId: chosenProject.brandId,
      brandName: chosenProject.brandName,
      status: canManageStatus ? status : "Open",
      priority,
      assigneeIds: finalAssignees,
      memberIds: finalAssignees,
      reviewerId: chosenProject.managerId || users[0]?.id || "usr-admin",
      startDate,
      dueDate,
      clientId: clientMatch,
      leadId: leadMatch,
    })

    toast.success(`Created task ${created.code}`)
    onOpenChange(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>
          {mode === "edit" && task ? `Edit ${task.code}` : "Create Task"}
        </DialogTitle>
        <DialogDescription>
          {mode === "edit"
            ? "Update task metadata, schedule, priority, and team assignments."
            : "Add a deliverable task linked to a project and team members."}
        </DialogDescription>
      </DialogHeader>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="task-form-title">Task Title</Label>
          <Input
            id="task-form-title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              if (error) setError(null)
            }}
            placeholder="e.g. Finalize responsive pricing grid and QA states"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="task-form-project">Project</Label>
            <Select
              value={projectId}
              onValueChange={setProjectId}
              disabled={scope === "project" && mode === "create"}
            >
              <SelectTrigger id="task-form-project" className="w-full">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {availableProjects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.code} — {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-form-priority">Priority</Label>
            <Select
              value={priority}
              onValueChange={(v) => setPriority(v as TaskPriority)}
            >
              <SelectTrigger id="task-form-priority" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    <span className="inline-flex items-center gap-1.5">
                      <Flag className={cn("size-3", PRIORITY_META[p].flagClass)} />
                      {p}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="task-form-status">Status</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as TaskStatus)}
              disabled={!canManageStatus}
            >
              <SelectTrigger id="task-form-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-form-start">Start Date</Label>
            <Input
              id="task-form-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-form-due">Due Date</Label>
            <Input
              id="task-form-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label>Assignees</Label>
            {!canAssign && (
              <span className="text-[11px] text-muted-foreground">
                Requires tasks.assign
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 rounded-lg border border-border bg-muted/20 p-2">
            {users.slice(0, 12).map((u) => {
              const selected = assigneeIds.includes(u.id)
              return (
                <button
                  key={u.id}
                  type="button"
                  disabled={!canAssign}
                  onClick={() => toggleAssignee(u.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-colors",
                    selected
                      ? "border-primary/40 bg-primary/10 font-medium text-primary"
                      : "border-border bg-background text-muted-foreground hover:text-foreground",
                    !canAssign && "cursor-not-allowed opacity-60"
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex size-4 items-center justify-center rounded-full text-[9px] font-semibold text-white",
                      u.avatarColor
                    )}
                  >
                    {u.avatarInitials}
                  </span>
                  <span>{u.name}</span>
                  {selected && <Check className="size-3" />}
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="task-form-desc">Description</Label>
          <Textarea
            id="task-form-desc"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Outline acceptance criteria, deliverable assets, or QA notes..."
          />
        </div>
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button type="submit">
          {mode === "edit" ? "Save Changes" : "Create Task"}
        </Button>
      </DialogFooter>
    </form>
  )
}
