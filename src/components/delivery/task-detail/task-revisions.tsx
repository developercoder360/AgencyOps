"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Flag,
  Paperclip,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar as CalendarPicker } from "@/components/ui/calendar"
import { AvatarGroup, ConfirmDeleteDialog, StatusBadge } from "@/components/shared"
import { RichTextEditorSkeleton, EMPTY_DOC } from "@/components/ui/rich-text-editor"
import { RevisionAssigneePicker } from "./revision-assignee-picker"
import { RevisionFlaggedUserPicker } from "./revision-flagged-user-picker"
import type { TaskRolePermissions } from "@/lib/permissions"
import type {
  Role,
  StaffUser,
  TaskFile,
  TaskRevision,
  TaskStatus,
  RevisionStatus,
  RevisionType,
  RevisionPriority,
} from "@/types"

const RichTextEditor = dynamic(
  () => import("@/components/ui/rich-text-editor").then((mod) => mod.RichTextEditor),
  {
    ssr: false,
    loading: () => <RichTextEditorSkeleton />,
  }
)

interface TaskRevisionsProps {
  taskId: string
  taskStatus: TaskStatus
  revisions: TaskRevision[]
  users: StaffUser[]
  taskAssigneeIds?: string[]
  currentUserRole?: Role
  currentUserId?: string
  permissions: TaskRolePermissions
  todayIso: string
  defaultDueDate?: string
  defaultAssigneeIds?: string[]
  nextRevisionNumber?: number
  nextRedrawNumber?: number
  onAddRevision: (data: {
    type: RevisionType
    title: string
    details?: Record<string, unknown>
    assigneeIds?: string[]
    priority?: RevisionPriority
    flaggedUserIds?: string[]
    dueDate?: string
    files?: TaskFile[]
  }) => TaskRevision | null | void
  onUpdateRevision: (
    revisionId: string,
    updates: Partial<Omit<TaskRevision, "id" | "number" | "createdAt">>
  ) => void
  onSetRevisionStatus: (revisionId: string, status: RevisionStatus) => void
  onRemoveRevision: (revisionId: string) => void
  onAddRevisionFiles: (revisionId: string, files: TaskFile[]) => void
  onMoveToReDraw?: () => void
}

const ALL_REVISION_STATUSES: { value: RevisionStatus; label: string }[] = [
  { value: "requested", label: "Requested" },
  { value: "in_progress", label: "In Progress" },
  { value: "submitted", label: "Submitted" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
]

const addRevisionSchema = z.object({
  type: z.enum(["revision", "redraw"]),
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(140, "Title must be 140 characters or less"),
  details: z.record(z.string(), z.unknown()).optional(),
  assigneeIds: z.array(z.string()),
  priority: z.enum(["regular", "high", "urgent"]),
  flaggedUserIds: z.array(z.string()),
  dueDate: z.string().optional(),
  moveToReDraw: z.boolean(),
})

type AddRevisionFormValues = z.infer<typeof addRevisionSchema>

export function TaskRevisions({
  taskStatus,
  revisions = [],
  users,
  taskAssigneeIds = [],
  currentUserRole = "Super Admin",
  currentUserId = "usr-admin",
  permissions,
  todayIso,
  defaultDueDate,
  defaultAssigneeIds = [],
  nextRevisionNumber,
  nextRedrawNumber,
  onAddRevision,
  onUpdateRevision,
  onSetRevisionStatus,
  onRemoveRevision,
  onAddRevisionFiles,
  onMoveToReDraw,
}: TaskRevisionsProps) {
  const canFlagUsers = Boolean(permissions.canEditRevision || permissions.canApproveRejectRevision)
  // Accordion expanded state (single expanded row)
  const [expandedId, setExpandedId] = React.useState<string | null>(null)
  const [collapsed, setCollapsed] = React.useState(false)

  // Add Revision Modal state
  const [addModalOpen, setAddModalOpen] = React.useState(false)
  const [modalFiles, setModalFiles] = React.useState<TaskFile[]>([])
  const [isDragging, setIsDragging] = React.useState(false)
  const [datePopoverOpen, setDatePopoverOpen] = React.useState(false)

  // Trigger button ref to restore focus cleanly with preventScroll
  const addBtnRef = React.useRef<HTMLButtonElement | null>(null)
  const modalFileInputRef = React.useRef<HTMLInputElement | null>(null)
  const rowFileInputRefs = React.useRef<Record<string, HTMLInputElement | null>>({})

  // Delete confirm dialog state
  const [deleteTargetId, setDeleteTargetId] = React.useState<string | null>(null)

  // Sort revisions newest first (descending by number within each type, or global order)
  const sortedRevisions = React.useMemo(() => {
    return [...(revisions || [])].sort((a, b) => {
      // Sort newest created first, fallback to number
      const timeDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (!Number.isNaN(timeDiff) && timeDiff !== 0) return timeDiff
      return (b.number || 0) - (a.number || 0)
    })
  }, [revisions])

  const totalCount = sortedRevisions.length
  const approvedCount = sortedRevisions.filter((r) => r.status === "approved").length
  const allApproved = totalCount > 0 && approvedCount === totalCount

  // Next numbers per type
  const nextRevNum = React.useMemo(() => {
    if (typeof nextRevisionNumber === "number" && nextRevisionNumber > 0) {
      return nextRevisionNumber
    }
    const max = (revisions || [])
      .filter((r) => r.type !== "redraw")
      .reduce((m, r) => Math.max(m, r.number || 0), 0)
    return max + 1
  }, [revisions, nextRevisionNumber])

  const nextRdNum = React.useMemo(() => {
    if (typeof nextRedrawNumber === "number" && nextRedrawNumber > 0) {
      return nextRedrawNumber
    }
    const max = (revisions || [])
      .filter((r) => r.type === "redraw")
      .reduce((m, r) => Math.max(m, r.number || 0), 0)
    return max + 1
  }, [revisions, nextRedrawNumber])

  const isCompleteOrQa = taskStatus === "Complete" || taskStatus === "QA Review"

  const form = useForm<AddRevisionFormValues>({
    resolver: zodResolver(addRevisionSchema),
    defaultValues: {
      type: "revision",
      title: "",
      details: EMPTY_DOC,
      assigneeIds: defaultAssigneeIds.length > 0 ? defaultAssigneeIds : (users[0]?.id ? [users[0].id] : []),
      priority: "regular",
      flaggedUserIds: [],
      dueDate: defaultDueDate || todayIso,
      moveToReDraw: isCompleteOrQa,
    },
  })

  const selectedType = form.watch("type")

  // Clean up any stray Radix body styles when modal closes
  React.useEffect(() => {
    if (!addModalOpen) {
      requestAnimationFrame(() => {
        document.body.removeAttribute("data-scroll-locked")
        if (document.body.style.pointerEvents === "none") {
          document.body.style.pointerEvents = ""
        }
      })
    }
  }, [addModalOpen])

  function handleOpenModal() {
    form.reset({
      type: "revision",
      title: "",
      details: EMPTY_DOC,
      assigneeIds: defaultAssigneeIds.length > 0 ? defaultAssigneeIds : (users[0]?.id ? [users[0].id] : []),
      priority: "regular",
      flaggedUserIds: [],
      dueDate: defaultDueDate || todayIso,
      moveToReDraw: isCompleteOrQa,
    })
    setModalFiles([])
    setDatePopoverOpen(false)
    setIsDragging(false)
    setAddModalOpen(true)
  }

  function handleFilesAdded(fileList: FileList | File[]) {
    const uploadedList: TaskFile[] = []
    const nowIso = new Date().toISOString()

    for (let i = 0; i < fileList.length; i++) {
      const f = fileList[i]
      const sizeKb = Math.round(f.size / 1024)
      const sizeStr = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`

      uploadedList.push({
        id: `att-${crypto.randomUUID().slice(0, 8)}`,
        name: f.name,
        previewUrl: URL.createObjectURL(f),
        size: sizeStr,
        type: f.type || "application/octet-stream",
        uploadedAt: nowIso,
        uploadedBy: "Current User",
      })
    }

    setModalFiles((prev) => [...prev, ...uploadedList])
  }

  function onSubmit(values: AddRevisionFormValues) {
    const created = onAddRevision({
      type: values.type,
      title: values.title.trim(),
      details: values.details || EMPTY_DOC,
      assigneeIds: values.assigneeIds || [],
      priority: values.priority || "regular",
      flaggedUserIds: values.flaggedUserIds || [],
      dueDate: values.dueDate || undefined,
      files: modalFiles,
    })

    // If task was Complete/QA, revision type is redraw, and checkbox was checked, trigger Re-Draw flow
    if (isCompleteOrQa && values.type === "redraw" && values.moveToReDraw) {
      onMoveToReDraw?.()
    }

    toast.success(values.type === "redraw" ? "Re-Draw added" : "Revision added")
    setAddModalOpen(false)

    // Expand the new revision and keep it visible
    if (created && created.id) {
      setExpandedId(created.id)
      requestAnimationFrame(() => {
        const rowEl = document.getElementById(`rev-row-${created.id}`)
        rowEl?.scrollIntoView({ behavior: "smooth", block: "nearest" })
      })
    }
  }

  function handleRowFileSelection(
    e: React.ChangeEvent<HTMLInputElement>,
    onAdd: (files: TaskFile[]) => void
  ) {
    const fileList = e.target.files
    if (!fileList || fileList.length === 0) return

    const uploadedList: TaskFile[] = []
    const nowIso = new Date().toISOString()

    for (let i = 0; i < fileList.length; i++) {
      const f = fileList[i]
      const sizeKb = Math.round(f.size / 1024)
      const sizeStr = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`

      uploadedList.push({
        id: `att-${crypto.randomUUID().slice(0, 8)}`,
        name: f.name,
        previewUrl: URL.createObjectURL(f),
        size: sizeStr,
        type: f.type || "application/octet-stream",
        uploadedAt: nowIso,
        uploadedBy: "Current User",
      })
    }

    onAdd(uploadedList)
    e.target.value = ""
  }

  // Allowed statuses based on role
  function getAllowedStatuses(rev: TaskRevision): { value: RevisionStatus; label: string }[] {
    if (permissions.canApproveRejectRevision && permissions.canEditRevision) {
      return ALL_REVISION_STATUSES
    }

    if (currentUserRole === "QA Reviewer") {
      if (rev.status === "submitted") {
        return [
          { value: "submitted", label: "Submitted" },
          { value: "approved", label: "Approved" },
          { value: "rejected", label: "Rejected" },
        ]
      }
      return ALL_REVISION_STATUSES.filter((s) => s.value === rev.status)
    }

    if (
      permissions.canUpdateAssignedRevisionProgress &&
      (rev.assigneeIds?.includes(currentUserId) ||
        currentUserRole === "Super Admin" ||
        currentUserRole === "Project Admin")
    ) {
      return [
        { value: "requested", label: "Requested" },
        { value: "in_progress", label: "In Progress" },
        { value: "submitted", label: "Submitted" },
      ]
    }

    return ALL_REVISION_STATUSES.filter((s) => s.value === rev.status)
  }

  function canChangeStatus(rev: TaskRevision): boolean {
    if (permissions.canApproveRejectRevision) return true
    if (currentUserRole === "QA Reviewer" && rev.status === "submitted") return true
    if (
      permissions.canUpdateAssignedRevisionProgress &&
      (rev.assigneeIds?.includes(currentUserId) ||
        currentUserRole === "Super Admin" ||
        currentUserRole === "Project Admin")
    ) {
      return true
    }
    return false
  }

  const deleteTargetRevision = sortedRevisions.find((r) => r.id === deleteTargetId)

  return (
    <section aria-label="Revisions" className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2">
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="flex items-center gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          {collapsed ? (
            <ChevronRight className="size-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-3.5 text-muted-foreground" />
          )}
          <div className="flex items-center gap-1.5 font-semibold text-foreground text-[13px]">
            <RotateCcw className="size-3.5 text-primary" />
            <span>Revisions</span>
          </div>
          <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[11px] font-semibold text-muted-foreground">
            {totalCount}
          </span>
          {totalCount > 0 ? (
            <span className="text-xs text-muted-foreground">
              ({approvedCount} of {totalCount} approved)
            </span>
          ) : null}
        </button>

        {permissions.canAddRevision ? (
          <Button
            ref={addBtnRef}
            type="button"
            size="xs"
            variant="outline"
            onClick={handleOpenModal}
            className="gap-1 text-xs"
          >
            <Plus className="size-3.5" />
            <span>Add revision</span>
          </Button>
        ) : null}
      </div>

      {!collapsed && (
        <>
          {/* All Revisions Approved Hint */}
      {allApproved ? (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>All revisions for this deliverable have been approved.</span>
        </div>
      ) : null}

      {/* Revision Rows List */}
      {totalCount === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-6 text-center">
          <RotateCcw className="size-7 text-muted-foreground/40" />
          <p className="mt-1 text-xs text-muted-foreground">
            No revisions yet. Add one when rework is requested.
          </p>
          {permissions.canAddRevision ? (
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={handleOpenModal}
              className="mt-2.5 gap-1 text-xs"
            >
              <Plus className="size-3.5" />
              <span>Add first revision</span>
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-2">
          {sortedRevisions.map((rev) => {
            const isExpanded = expandedId === rev.id
            const isRedraw = rev.type === "redraw"
            const revPrefix = isRedraw ? "RD" : "R"
            const revAssignees = users.filter((u) => rev.assigneeIds?.includes(u.id))
            const revFlaggedUsers = users.filter((u) => rev.flaggedUserIds?.includes(u.id))
            const isOverdue =
              rev.dueDate &&
              rev.dueDate < todayIso &&
              rev.status !== "approved"

            const allowedStatuses = getAllowedStatuses(rev)
            const userCanChangeStatus = canChangeStatus(rev)

            return (
              <div
                key={rev.id}
                id={`rev-row-${rev.id}`}
                className={cn(
                  "overflow-hidden rounded-lg border transition-all",
                  isExpanded
                    ? "border-primary/50 bg-card shadow-2xs"
                    : "border-border bg-card/60 hover:border-border hover:bg-card"
                )}
              >
                {/* Collapsed Header / Click-to-Expand Row */}
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : rev.id)}
                  aria-expanded={isExpanded}
                  className="flex min-h-[44px] w-full items-center justify-between gap-2 p-2.5 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    {/* Chevron */}
                    {isExpanded ? (
                      <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
                    )}

                    {/* Type badge + Number */}
                    <span
                      className={cn(
                        "flex shrink-0 items-center justify-center rounded-full px-2 py-0.5 font-mono text-[10px] font-bold border",
                        isRedraw
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
                          : "bg-muted text-foreground border-border"
                      )}
                    >
                      {revPrefix}{rev.number}
                    </span>

                    {/* Title */}
                    <span className="truncate text-xs font-semibold text-foreground flex-1 min-w-0">
                      {rev.title}
                    </span>
                  </div>

                  {/* Metadata columns aligned */}
                  <div className="flex shrink-0 items-center gap-2.5 text-xs">
                    {/* Priority Flag Icon */}
                    <span
                      title={`Priority: ${rev.priority || "regular"}`}
                      className="inline-flex items-center"
                    >
                      <Flag
                        className={cn(
                          "size-3 shrink-0",
                          rev.priority === "urgent"
                            ? "text-rose-600 dark:text-rose-400 fill-rose-600/30"
                            : rev.priority === "high"
                            ? "text-amber-600 dark:text-amber-400 fill-amber-600/30"
                            : "text-muted-foreground/40"
                        )}
                      />
                    </span>

                    {/* Assignee avatars */}
                    {revAssignees.length > 0 ? (
                      <div className="hidden sm:flex items-center">
                        <AvatarGroup people={revAssignees} max={2} />
                      </div>
                    ) : null}

                    {/* Flagged Staff */}
                    {revFlaggedUsers.length > 0 ? (
                      <div
                        title={`Flagged: ${revFlaggedUsers.map((u) => u.name).join(", ")}`}
                        className="flex items-center gap-1 text-[11px] text-destructive font-medium shrink-0"
                      >
                        <Flag className="size-3 shrink-0 text-destructive fill-destructive" />
                        <div className="flex -space-x-1.5 overflow-hidden">
                          {revFlaggedUsers.slice(0, 2).map((u) => (
                            <span
                              key={u.id}
                              className={cn(
                                "flex size-4 shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-white ring-1 ring-background",
                                u.avatarColor || "bg-destructive"
                              )}
                            >
                              {u.avatarInitials}
                            </span>
                          ))}
                        </div>
                        {revFlaggedUsers.length > 2 && (
                          <span className="text-[10px] text-destructive font-mono font-bold">
                            +{revFlaggedUsers.length - 2}
                          </span>
                        )}
                      </div>
                    ) : null}

                    {/* Files count */}
                    {rev.files && rev.files.length > 0 ? (
                      <span
                        title={`${rev.files.length} reference file(s)`}
                        className="hidden sm:flex items-center gap-0.5 text-[11px] text-muted-foreground"
                      >
                        <Paperclip className="size-3" />
                        <span>{rev.files.length}</span>
                      </span>
                    ) : null}

                    {/* Due Date */}
                    {rev.dueDate ? (
                      <span
                        title={`Due ${rev.dueDate}`}
                        className={cn(
                          "hidden sm:flex items-center gap-1 text-[11px] tabular-nums",
                          isOverdue
                            ? "font-semibold text-rose-600 dark:text-rose-400"
                            : "text-muted-foreground"
                        )}
                      >
                        <Calendar className="size-3" />
                        <span>{rev.dueDate.slice(5)}</span>
                      </span>
                    ) : null}

                    {/* Status badge */}
                    <StatusBadge status={rev.status} />
                  </div>
                </button>

                {/* Expanded Inline Accordion */}
                {isExpanded ? (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="space-y-3.5 border-t border-border/60 border-l-2 border-l-primary/40 bg-muted/10 p-3.5 pl-4 ml-2 mr-2 mb-2 rounded-r-md"
                  >
                    {/* Type, Title & Status */}
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-4">
                      {/* Type select */}
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">Type</Label>
                        <Select
                          value={rev.type}
                          disabled={!permissions.canEditRevision}
                          onValueChange={(val: RevisionType) =>
                            onUpdateRevision(rev.id, { type: val })
                          }
                        >
                          <SelectTrigger aria-label="Revision type" className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="revision">Revision</SelectItem>
                            <SelectItem value="redraw">Re-Draw</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Title */}
                      <div className="space-y-1 sm:col-span-2">
                        <Label className="text-[11px] text-muted-foreground">Title</Label>
                        <Input
                          value={rev.title}
                          disabled={!permissions.canEditRevision}
                          onChange={(e) =>
                            onUpdateRevision(rev.id, { title: e.target.value })
                          }
                          className="h-8 text-xs"
                        />
                      </div>

                      {/* Status */}
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">Status</Label>
                        <Select
                          value={rev.status}
                          disabled={!userCanChangeStatus}
                          onValueChange={(val: RevisionStatus) =>
                            onSetRevisionStatus(rev.id, val)
                          }
                        >
                          <SelectTrigger aria-label="Revision status" className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {allowedStatuses.map((st) => (
                              <SelectItem key={st.value} value={st.value}>
                                {st.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Details Rich Text Editor */}
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">
                        Change Details
                      </Label>
                      <RichTextEditor
                        value={rev.details}
                        readOnly={!permissions.canEditRevision}
                        placeholder="Specific feedback or rework instructions..."
                        onChange={(doc) => onUpdateRevision(rev.id, { details: doc })}
                        minHeight="80px"
                      />
                    </div>

                    {/* Assignees, Priority, Flags Grid */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {/* Multiple Assignees */}
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">Assignees</Label>
                        <RevisionAssigneePicker
                          value={rev.assigneeIds || []}
                          users={users}
                          disabled={!permissions.canEditRevision}
                          onChange={(ids) => onUpdateRevision(rev.id, { assigneeIds: ids })}
                        />
                      </div>

                      {/* Priority Select */}
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">Priority</Label>
                        <Select
                          value={rev.priority || "regular"}
                          disabled={!permissions.canEditRevision}
                          onValueChange={(val: RevisionPriority) =>
                            onUpdateRevision(rev.id, { priority: val })
                          }
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <div className="flex items-center gap-1.5">
                              <Flag
                                className={cn(
                                  "size-3",
                                  rev.priority === "urgent"
                                    ? "text-rose-600 dark:text-rose-400 fill-rose-600/30"
                                    : rev.priority === "high"
                                    ? "text-amber-600 dark:text-amber-400 fill-amber-600/30"
                                    : "text-muted-foreground/50"
                                )}
                              />
                              <SelectValue />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="regular">
                              <div className="flex items-center gap-1.5">
                                <Flag className="size-3 text-muted-foreground/50" />
                                <span>Regular</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="high">
                              <div className="flex items-center gap-1.5">
                                <Flag className="size-3 text-amber-600 dark:text-amber-400 fill-amber-600/30" />
                                <span>High</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="urgent">
                              <div className="flex items-center gap-1.5">
                                <Flag className="size-3 text-rose-600 dark:text-rose-400 fill-rose-600/30" />
                                <span>Urgent</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Flagged Staff Picker */}
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Flag className="size-3 text-destructive fill-destructive" />
                          <span>Flag staff</span>
                        </Label>
                        <RevisionFlaggedUserPicker
                          value={rev.flaggedUserIds || []}
                          users={users}
                          suggestedUserIds={taskAssigneeIds}
                          disabled={!canFlagUsers}
                          onChange={(flaggedUserIds) => onUpdateRevision(rev.id, { flaggedUserIds })}
                        />
                      </div>
                    </div>

                    {/* Due Date & Attachments */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">Due Date</Label>
                        <Input
                          type="date"
                          value={rev.dueDate || ""}
                          disabled={!permissions.canEditRevision}
                          onChange={(e) =>
                            onUpdateRevision(rev.id, { dueDate: e.target.value || undefined })
                          }
                          className="h-8 text-xs"
                        />
                      </div>

                      {/* Reference Attachments header and trigger */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-[11px] text-muted-foreground">
                            Reference Attachments ({rev.files?.length || 0})
                          </Label>
                          {permissions.canEditRevision ? (
                            <>
                              <input
                                type="file"
                                multiple
                                ref={(el) => {
                                  rowFileInputRefs.current[rev.id] = el
                                }}
                                className="hidden"
                                onChange={(e) =>
                                  handleRowFileSelection(e, (files) =>
                                    onAddRevisionFiles(rev.id, files)
                                  )
                                }
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="xs"
                                onClick={() => rowFileInputRefs.current[rev.id]?.click()}
                                className="h-6 gap-1 text-[11px] text-primary"
                              >
                                <Upload className="size-3" />
                                <span>Attach file</span>
                              </Button>
                            </>
                          ) : null}
                        </div>
                        {rev.files && rev.files.length > 0 ? (
                          <div className="grid grid-cols-1 gap-1 max-h-24 overflow-y-auto pr-1">
                            {rev.files.map((file) => (
                              <div
                                key={file.id}
                                className="flex items-center justify-between gap-1.5 rounded border border-border/60 bg-background/80 p-1.5 text-xs"
                              >
                                <div className="flex min-w-0 items-center gap-1.5">
                                  <Paperclip className="size-3 shrink-0 text-muted-foreground" />
                                  <span className="truncate text-[11px]">{file.name}</span>
                                </div>
                                <span className="shrink-0 text-[10px] text-muted-foreground">
                                  {file.size}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-muted-foreground/70 italic pt-1">
                            No reference files attached.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Delete Revision Action */}
                    {permissions.canDeleteRevision ? (
                      <div className="flex justify-end border-t border-border/50 pt-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          onClick={() => setDeleteTargetId(rev.id)}
                          className="gap-1 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="size-3" />
                          <span>
                            Delete {isRedraw ? "re-draw" : "revision"} {revPrefix}{rev.number}
                          </span>
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
        </>
      )}

      {/* Delete Revision Confirm Dialog */}
      <ConfirmDeleteDialog
        open={Boolean(deleteTargetId)}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetId(null)
        }}
        title={`Delete ${deleteTargetRevision?.type === "redraw" ? "Re-Draw" : "Revision"} ${
          deleteTargetRevision ? (deleteTargetRevision.type === "redraw" ? "RD" : "R") + deleteTargetRevision.number : ""
        }?`}
        description={`Are you sure you want to delete ${
          deleteTargetRevision?.type === "redraw" ? "re-draw" : "revision"
        } "${deleteTargetRevision?.title}"? This action cannot be undone.`}
        onConfirm={() => {
          if (deleteTargetId) {
            onRemoveRevision(deleteTargetId)
            setDeleteTargetId(null)
            toast.success("Revision removed")
          }
        }}
      />

      {/* Centered Add Revision Modal Dialog */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent
          onCloseAutoFocus={(e) => {
            e.preventDefault()
            addBtnRef.current?.focus({ preventScroll: true })
          }}
          className="w-full sm:max-w-lg max-h-[90dvh] flex flex-col p-4 sm:p-6 overflow-hidden"
        >
          <DialogHeader className="pr-6 shrink-0">
            <div className="flex items-center justify-between gap-2">
              <DialogTitle className="flex items-center gap-2 text-base font-semibold">
                <RotateCcw className="size-4 text-primary" />
                <span>{selectedType === "redraw" ? "Add Re-Draw" : "Add revision"}</span>
              </DialogTitle>
              <span className="rounded-full bg-muted px-2.5 py-0.5 font-mono text-xs font-semibold text-muted-foreground ring-1 ring-border">
                {selectedType === "redraw" ? `Re-Draw #${nextRdNum}` : `Revision #${nextRevNum}`}
              </span>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Log rework or changes for this deliverable.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex-1 flex flex-col min-h-0 overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 py-1">
              {/* 1. Revision Type Segmented Control */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Type</Label>
                <div className="grid grid-cols-2 rounded-lg bg-muted p-1 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => form.setValue("type", "revision")}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-md py-1.5 transition-colors",
                      selectedType === "revision"
                        ? "bg-background text-foreground shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <RotateCcw className="size-3.5" />
                    <span>Revision</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      form.setValue("type", "redraw")
                      if (isCompleteOrQa) {
                        form.setValue("moveToReDraw", true)
                      }
                    }}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-md py-1.5 transition-colors",
                      selectedType === "redraw"
                        ? "bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <RotateCcw className="size-3.5" />
                    <span>Re-Draw</span>
                  </button>
                </div>
              </div>

              {/* 2. Title (Required, autoFocus) */}
              <div className="space-y-1.5">
                <Label htmlFor="rev-modal-title" className="text-xs font-medium">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="rev-modal-title"
                  autoFocus
                  placeholder="e.g. Logo colour tweak"
                  {...form.register("title")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      form.handleSubmit(onSubmit)()
                    }
                  }}
                  aria-label="Revision title"
                  className={cn("h-9 text-xs", form.formState.errors.title && "border-destructive")}
                />
                {form.formState.errors.title && (
                  <p className="text-[11px] font-medium text-destructive">
                    {form.formState.errors.title.message}
                  </p>
                )}
              </div>

              {/* 3. Details (Rich text editor) */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Details</Label>
                <Controller
                  control={form.control}
                  name="details"
                  render={({ field }) => (
                    <RichTextEditor
                      value={field.value}
                      placeholder="Describe what needs to change..."
                      onChange={field.onChange}
                      onSubmit={() => form.handleSubmit(onSubmit)()}
                      minHeight="110px"
                    />
                  )}
                />
                <p className="text-[10px] text-muted-foreground">
                  Press Enter in Title or Ctrl+Enter / Cmd+Enter in Details to submit.
                </p>
              </div>

              {/* 4. Multiple Assignees */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Assignees</Label>
                <Controller
                  control={form.control}
                  name="assigneeIds"
                  render={({ field }) => (
                    <RevisionAssigneePicker
                      value={field.value}
                      users={users}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>

              {/* 5. Priority & 6. Flags Grid */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Priority */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Priority</Label>
                  <Controller
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger aria-label="Priority" className="h-9 text-xs">
                          <div className="flex items-center gap-1.5">
                            <Flag
                              className={cn(
                                "size-3.5",
                                field.value === "urgent"
                                  ? "text-rose-600 dark:text-rose-400 fill-rose-600/30"
                                  : field.value === "high"
                                  ? "text-amber-600 dark:text-amber-400 fill-amber-600/30"
                                  : "text-muted-foreground/50"
                              )}
                            />
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="z-[60]">
                          <SelectItem value="regular">
                            <div className="flex items-center gap-1.5">
                              <Flag className="size-3.5 text-muted-foreground/50" />
                              <span>Regular</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="high">
                            <div className="flex items-center gap-1.5">
                              <Flag className="size-3.5 text-amber-600 dark:text-amber-400 fill-amber-600/30" />
                              <span>High</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="urgent">
                            <div className="flex items-center gap-1.5">
                              <Flag className="size-3.5 text-rose-600 dark:text-rose-400 fill-rose-600/30" />
                              <span>Urgent</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                {/* Flag Staff */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium flex items-center gap-1">
                    <Flag className="size-3 text-destructive fill-destructive" />
                    <span>Flag staff</span>
                  </Label>
                  <Controller
                    control={form.control}
                    name="flaggedUserIds"
                    render={({ field }) => (
                      <RevisionFlaggedUserPicker
                        value={field.value}
                        users={users}
                        suggestedUserIds={taskAssigneeIds}
                        disabled={!canFlagUsers}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </div>
              </div>

              {/* 7. Due Date Picker */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Due Date</Label>
                <Controller
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          aria-label="Due date"
                          className={cn(
                            "h-9 w-full justify-start text-left text-xs font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <Calendar className="mr-2 size-3.5" />
                          {field.value ? field.value : <span>Pick due date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 z-[60]" align="start">
                        <CalendarPicker
                          mode="single"
                          selected={
                            field.value ? new Date(field.value + "T00:00:00") : undefined
                          }
                          onSelect={(date) => {
                            if (date) {
                              const year = date.getFullYear()
                              const month = String(date.getMonth() + 1).padStart(2, "0")
                              const day = String(date.getDate()).padStart(2, "0")
                              field.onChange(`${year}-${month}-${day}`)
                            } else {
                              field.onChange("")
                            }
                            setDatePopoverOpen(false)
                          }}
                          defaultMonth={
                            field.value ? new Date(field.value + "T00:00:00") : new Date()
                          }
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
              </div>

              {/* 8. Reference Files Drag & Drop Zone */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Reference Files</Label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIsDragging(true)
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIsDragging(false)
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIsDragging(false)
                    if (e.dataTransfer.files) {
                      handleFilesAdded(e.dataTransfer.files)
                    }
                  }}
                  onClick={() => modalFileInputRef.current?.click()}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-3.5 text-center cursor-pointer transition-colors",
                    isDragging
                      ? "border-primary bg-primary/5"
                      : "border-border/80 hover:border-primary/50 hover:bg-muted/30"
                  )}
                >
                  <Upload className="size-5 text-muted-foreground/60 mb-1" />
                  <p className="text-xs font-medium text-foreground">
                    Drop files here or click to browse
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Upload screenshots, mockups, or PDF specs
                  </p>
                  <input
                    ref={modalFileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) {
                        handleFilesAdded(e.target.files)
                      }
                      e.target.value = ""
                    }}
                  />
                </div>

                {/* Attached Files List */}
                {modalFiles.length > 0 ? (
                  <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1 pt-1">
                    {modalFiles.map((f) => (
                      <div
                        key={f.id}
                        className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-muted/40 px-2.5 py-1 text-xs"
                      >
                        <div className="flex min-w-0 items-center gap-1.5">
                          <Paperclip className="size-3 shrink-0 text-muted-foreground" />
                          <span className="truncate font-medium">{f.name}</span>
                          <span className="shrink-0 text-[10px] text-muted-foreground">
                            ({f.size})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setModalFiles((prev) => prev.filter((item) => item.id !== f.id))
                          }}
                          className="rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          aria-label={`Remove file ${f.name}`}
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* 9. Move to Re-Draw Checkbox: ONLY for redraw type on Complete/QA Tasks */}
              {selectedType === "redraw" && isCompleteOrQa && (
                <Controller
                  control={form.control}
                  name="moveToReDraw"
                  render={({ field }) => (
                    <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                      <Checkbox
                        id="rev-move-redraw"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="mt-0.5"
                      />
                      <div className="space-y-0.5 leading-none">
                        <label
                          htmlFor="rev-move-redraw"
                          className="text-xs font-semibold text-foreground cursor-pointer"
                        >
                          Move task to Re-Draw
                        </label>
                        <p className="text-[11px] text-muted-foreground">
                          Task is currently marked as <strong>{taskStatus}</strong>. Adding this Re-Draw will move the deliverable back into Re-Draw for rework.
                        </p>
                      </div>
                    </div>
                  )}
                />
              )}
            </div>

            {/* Footer */}
            <DialogFooter className="gap-2 sm:gap-0 border-t border-border/50 pt-3 mt-3 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAddModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="gap-1.5">
                <Plus className="size-3.5" />
                <span>{selectedType === "redraw" ? "Add Re-Draw" : "Add revision"}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  )
}
