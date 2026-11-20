"use client"

import * as React from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Paperclip,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
  User,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { ConfirmDeleteDialog, StatusBadge } from "@/components/shared"
import type { TaskRolePermissions } from "@/lib/permissions"
import type {
  Role,
  StaffUser,
  TaskFile,
  TaskRevision,
  TaskStatus,
  RevisionStatus,
} from "@/types"

interface TaskRevisionsProps {
  taskId: string
  taskStatus: TaskStatus
  revisions: TaskRevision[]
  users: StaffUser[]
  currentUserRole?: Role
  currentUserId?: string
  permissions: TaskRolePermissions
  todayIso: string
  defaultDueDate?: string
  defaultAssigneeId?: string
  onAddRevision: (data: {
    title: string
    details?: string
    assigneeId?: string
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
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(140, "Title must be 140 characters or less"),
  details: z.string().optional(),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
  moveToReDraw: z.boolean(),
})

type AddRevisionFormValues = z.infer<typeof addRevisionSchema>

export function TaskRevisions({
  taskStatus,
  revisions,
  users,
  currentUserRole = "Super Admin",
  currentUserId = "usr-admin",
  permissions,
  todayIso,
  defaultDueDate,
  defaultAssigneeId,
  onAddRevision,
  onUpdateRevision,
  onSetRevisionStatus,
  onRemoveRevision,
  onAddRevisionFiles,
  onMoveToReDraw,
}: TaskRevisionsProps) {
  // Accordion expanded state (single expanded row)
  const [expandedId, setExpandedId] = React.useState<string | null>(null)

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

  // Sort revisions newest first (descending by number)
  const sortedRevisions = React.useMemo(() => {
    return [...(revisions || [])].sort((a, b) => (b.number || 0) - (a.number || 0))
  }, [revisions])

  const totalCount = sortedRevisions.length
  const approvedCount = sortedRevisions.filter((r) => r.status === "approved").length
  const allApproved = totalCount > 0 && approvedCount === totalCount

  // Next revision number for header badge
  const nextRevNumber = React.useMemo(() => {
    return (revisions || []).reduce((max, r) => Math.max(max, r.number || 0), 0) + 1
  }, [revisions])

  const isCompleteOrQa = taskStatus === "Complete" || taskStatus === "QA Review"

  const form = useForm<AddRevisionFormValues>({
    resolver: zodResolver(addRevisionSchema),
    defaultValues: {
      title: "",
      details: "",
      assigneeId: defaultAssigneeId || users[0]?.id || "",
      dueDate: defaultDueDate || todayIso,
      moveToReDraw: isCompleteOrQa,
    },
  })

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
      title: "",
      details: "",
      assigneeId: defaultAssigneeId || users[0]?.id || "",
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
      title: values.title.trim(),
      details: values.details?.trim() || undefined,
      assigneeId: values.assigneeId || undefined,
      dueDate: values.dueDate || undefined,
      files: modalFiles,
    })

    // If task was Complete/QA and checkbox was checked, trigger Re-Draw flow
    if (isCompleteOrQa && values.moveToReDraw) {
      onMoveToReDraw?.()
    }

    toast.success("Revision added")
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

    if (permissions.canUpdateAssignedRevisionProgress) {
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
      (rev.assigneeId === currentUserId || !rev.assigneeId || currentUserRole === "Designer/Developer")
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
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-semibold text-foreground text-sm">
            <RotateCcw className="size-4 text-primary" />
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
        </div>

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
            const assignee = users.find((u) => u.id === rev.assigneeId)
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
                  className="flex w-full items-center justify-between gap-2 p-2.5 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    {/* Badge R1, R2 ... */}
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-foreground ring-1 ring-border">
                      R{rev.number}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="truncate text-xs font-semibold text-foreground">
                          {rev.title}
                        </span>
                        <StatusBadge status={rev.status} />
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2.5">
                    {/* Files count */}
                    {rev.files && rev.files.length > 0 ? (
                      <span
                        title={`${rev.files.length} reference file(s)`}
                        className="flex items-center gap-0.5 text-[11px] text-muted-foreground"
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
                          "flex items-center gap-1 text-[11px] tabular-nums",
                          isOverdue
                            ? "font-semibold text-rose-600 dark:text-rose-400"
                            : "text-muted-foreground"
                        )}
                      >
                        <Calendar className="size-3" />
                        <span>{rev.dueDate.slice(5)}</span>
                      </span>
                    ) : null}

                    {/* Assignee Avatar */}
                    {assignee ? (
                      <Avatar className="size-5 shrink-0 ring-1 ring-border" title={assignee.name}>
                        <AvatarFallback className="text-[9px] font-medium">
                          {assignee.avatarInitials ||
                            assignee.name
                              .split(" ")
                              .map((p) => p[0])
                              .slice(0, 2)
                              .join("")}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <span title="Unassigned" className="text-muted-foreground/50">
                        <User className="size-3.5" />
                      </span>
                    )}

                    {/* Accordion icon */}
                    {isExpanded ? (
                      <ChevronUp className="size-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="size-3.5 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Expanded Inline Accordion */}
                {isExpanded ? (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="space-y-3 border-t border-border/60 bg-muted/20 p-3 pt-2.5"
                  >
                    {/* Title & Status */}
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
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

                    {/* Details Textarea */}
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">
                        Change Details
                      </Label>
                      <Textarea
                        rows={2}
                        value={rev.details}
                        disabled={!permissions.canEditRevision}
                        onChange={(e) =>
                          onUpdateRevision(rev.id, { details: e.target.value })
                        }
                        placeholder="Specific feedback or rework instructions..."
                        className="text-xs"
                      />
                    </div>

                    {/* Metadata Row: Assignee & Due Date */}
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">Assignee</Label>
                        <Select
                          value={rev.assigneeId || "unassigned"}
                          disabled={!permissions.canEditRevision}
                          onValueChange={(val) =>
                            onUpdateRevision(rev.id, {
                              assigneeId: val === "unassigned" ? undefined : val,
                            })
                          }
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Unassigned" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {users.map((u) => (
                              <SelectItem key={u.id} value={u.id}>
                                <div className="flex items-center gap-1.5">
                                  <Avatar className="size-4 shrink-0">
                                    <AvatarFallback className="text-[8px]">
                                      {u.avatarInitials}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>{u.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

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
                    </div>

                    {/* Reference Files List & Upload */}
                    <div className="space-y-1.5 border-t border-border/50 pt-2">
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
                        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
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
                        <p className="text-[11px] text-muted-foreground/70 italic">
                          No reference files attached to this revision.
                        </p>
                      )}
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
                          <span>Delete revision R{rev.number}</span>
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

      {/* Delete Revision Confirm Dialog */}
      <ConfirmDeleteDialog
        open={Boolean(deleteTargetId)}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetId(null)
        }}
        title={`Delete Revision R${deleteTargetRevision?.number ?? ""}?`}
        description={`Are you sure you want to delete revision "${deleteTargetRevision?.title}"? This action cannot be undone.`}
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
          className="w-[calc(100vw-2rem)] sm:max-w-lg max-h-[90vh] flex flex-col p-4 sm:p-6 overflow-hidden"
        >
          <DialogHeader className="pr-6">
            <div className="flex items-center justify-between gap-2">
              <DialogTitle className="flex items-center gap-2 text-base font-semibold">
                <RotateCcw className="size-4 text-primary" />
                <span>Add revision</span>
              </DialogTitle>
              <span className="rounded-full bg-muted px-2.5 py-0.5 font-mono text-xs font-semibold text-muted-foreground ring-1 ring-border">
                Revision #{nextRevNumber}
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
              {/* Title (Required, autoFocus) */}
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

              {/* Details (Textarea, Ctrl/Cmd+Enter submits) */}
              <div className="space-y-1.5">
                <Label htmlFor="rev-modal-details" className="text-xs font-medium">
                  Details
                </Label>
                <Textarea
                  id="rev-modal-details"
                  placeholder="Specific feedback or rework instructions..."
                  rows={3}
                  {...form.register("details")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault()
                      form.handleSubmit(onSubmit)()
                    }
                  }}
                  aria-label="Revision details"
                  className="text-xs"
                />
                <p className="text-[10px] text-muted-foreground">
                  Press Enter to submit from Title, or Ctrl+Enter / Cmd+Enter from Details.
                </p>
              </div>

              {/* Assignee & Due Date Grid */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Assignee Select */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Assignee</Label>
                  <Controller
                    control={form.control}
                    name="assigneeId"
                    render={({ field }) => (
                      <Select
                        value={field.value || "unassigned"}
                        onValueChange={(val) =>
                          field.onChange(val === "unassigned" ? "" : val)
                        }
                      >
                        <SelectTrigger aria-label="Assignee" className="h-9 text-xs">
                          <SelectValue placeholder="Select assignee" />
                        </SelectTrigger>
                        <SelectContent className="z-[60]">
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {users.map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              <div className="flex items-center gap-2">
                                <Avatar className="size-4 shrink-0">
                                  <AvatarFallback className="text-[8px]">
                                    {u.avatarInitials}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{u.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                {/* Due Date Picker Popover */}
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
              </div>

              {/* Reference Files Drag & Drop Zone */}
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

              {/* Move to Re-Draw Checkbox for Complete/QA Tasks */}
              {isCompleteOrQa && (
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
                          Task is currently marked as <strong>{taskStatus}</strong>. Re-opening work will move the deliverable back into Re-Draw for rework.
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
                <span>Add revision</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  )
}
