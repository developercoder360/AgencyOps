"use client"

import * as React from "react"
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
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
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
    requestedBy?: "client" | "internal"
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

  // Inline Add Form state
  const [isAdding, setIsAdding] = React.useState(false)
  const [newTitle, setNewTitle] = React.useState("")
  const [newDetails, setNewDetails] = React.useState("")
  const [newRequestedBy, setNewRequestedBy] = React.useState<"client" | "internal">("client")
  const [newAssigneeId, setNewAssigneeId] = React.useState<string>(
    defaultAssigneeId || users[0]?.id || ""
  )
  const [newDueDate, setNewDueDate] = React.useState(defaultDueDate || "")
  const [newFiles, setNewFiles] = React.useState<TaskFile[]>([])

  // Re-draw prompt dialog state
  const [showReDrawDialog, setShowReDrawDialog] = React.useState(false)

  // Delete confirm dialog state
  const [deleteTargetId, setDeleteTargetId] = React.useState<string | null>(null)

  // File input refs
  const addFileInputRef = React.useRef<HTMLInputElement | null>(null)
  const rowFileInputRefs = React.useRef<Record<string, HTMLInputElement | null>>({})

  // Sort revisions newest first (descending by number)
  const sortedRevisions = React.useMemo(() => {
    return [...(revisions || [])].sort((a, b) => (b.number || 0) - (a.number || 0))
  }, [revisions])

  const totalCount = sortedRevisions.length
  const approvedCount = sortedRevisions.filter((r) => r.status === "approved").length
  const allApproved = totalCount > 0 && approvedCount === totalCount

  // Reset form when closed
  function handleCancelAdd() {
    setIsAdding(false)
    setNewTitle("")
    setNewDetails("")
    setNewRequestedBy("client")
    setNewAssigneeId(defaultAssigneeId || users[0]?.id || "")
    setNewDueDate(defaultDueDate || "")
    setNewFiles([])
  }

  function handleSaveAdd() {
    const trimmedTitle = newTitle.trim()
    if (!trimmedTitle) {
      toast.error("Please provide a title for the revision")
      return
    }

    onAddRevision({
      title: trimmedTitle,
      details: newDetails.trim(),
      requestedBy: newRequestedBy,
      assigneeId: newAssigneeId || undefined,
      dueDate: newDueDate || undefined,
      files: newFiles,
    })

    toast.success("Revision added")
    handleCancelAdd()

    // If task is Complete or QA Review, prompt to move to Re-Draw
    if (taskStatus === "Complete" || taskStatus === "QA Review") {
      setShowReDrawDialog(true)
    }
  }

  function handleFileSelection(
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

  // Determine allowed statuses for a given revision based on role
  function getAllowedStatuses(rev: TaskRevision): { value: RevisionStatus; label: string }[] {
    if (permissions.canApproveRejectRevision && permissions.canEditRevision) {
      return ALL_REVISION_STATUSES
    }

    if (currentUserRole === "QA Reviewer") {
      // QA can approve or reject submitted revisions
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
      // Designer/Developer can update progress on assigned revisions: in_progress or submitted
      return [
        { value: "requested", label: "Requested" },
        { value: "in_progress", label: "In Progress" },
        { value: "submitted", label: "Submitted" },
      ]
    }

    // Read only
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
            type="button"
            size="xs"
            variant="outline"
            onClick={() => setIsAdding((prev) => !prev)}
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

      {/* Inline Add Revision Form (Top of list) */}
      {isAdding ? (
        <div className="space-y-3 rounded-lg border border-primary/30 bg-card p-3 shadow-2xs">
          <div className="flex items-center justify-between border-b border-border/50 pb-2">
            <span className="text-xs font-semibold text-foreground">
              New Revision (R{totalCount + 1})
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={handleCancelAdd}
              aria-label="Cancel adding revision"
            >
              <X className="size-3.5 text-muted-foreground" />
            </Button>
          </div>

          <div className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="rev-new-title" className="text-xs">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="rev-new-title"
                autoFocus
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSaveAdd()
                  } else if (e.key === "Escape") {
                    handleCancelAdd()
                  }
                }}
                placeholder="e.g. Logo colour tweak, Update hero image..."
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="rev-new-details" className="text-xs">
                Requested Changes (Details)
              </Label>
              <Textarea
                id="rev-new-details"
                rows={2}
                value={newDetails}
                onChange={(e) => setNewDetails(e.target.value)}
                placeholder="Describe what specific changes were requested..."
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Requested By</Label>
                <Select
                  value={newRequestedBy}
                  onValueChange={(val: "client" | "internal") => setNewRequestedBy(val)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="internal">Internal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Assignee</Label>
                <Select value={newAssigneeId} onValueChange={setNewAssigneeId}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Due Date</Label>
                <Input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            {/* Reference Files */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] text-muted-foreground">Reference Files</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => addFileInputRef.current?.click()}
                  className="h-6 gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  <Upload className="size-3" />
                  <span>Attach files</span>
                </Button>
                <input
                  ref={addFileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) =>
                    handleFileSelection(e, (files) =>
                      setNewFiles((prev) => [...prev, ...files])
                    )
                  }
                />
              </div>

              {newFiles.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {newFiles.map((file, idx) => (
                    <span
                      key={file.id || idx}
                      className="inline-flex items-center gap-1 rounded border border-border bg-muted/40 px-2 py-0.5 text-xs text-foreground"
                    >
                      <Paperclip className="size-3 text-muted-foreground" />
                      <span className="max-w-[150px] truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setNewFiles((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="ml-1 text-muted-foreground hover:text-destructive"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-border/50 pt-2">
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={handleCancelAdd}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="xs"
              onClick={handleSaveAdd}
              disabled={!newTitle.trim()}
            >
              Save Revision
            </Button>
          </div>
        </div>
      ) : null}

      {/* Revision Rows List */}
      {totalCount === 0 && !isAdding ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-6 text-center">
          <RotateCcw className="size-7 text-muted-foreground/40" />
          <p className="mt-1 text-xs text-muted-foreground">
            No revisions yet. Add one when the client or QA requests changes.
          </p>
          {permissions.canAddRevision ? (
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => setIsAdding(true)}
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
                        <Badge
                          variant="outline"
                          className="h-4 px-1.5 text-[10px] capitalize font-normal text-muted-foreground"
                        >
                          {rev.requestedBy}
                        </Badge>
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

                    {/* Metadata Row: Requested By, Assignee, Due Date */}
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">Requested By</Label>
                        <Select
                          value={rev.requestedBy}
                          disabled={!permissions.canEditRevision}
                          onValueChange={(val: "client" | "internal") =>
                            onUpdateRevision(rev.id, { requestedBy: val })
                          }
                        >
                          <SelectTrigger aria-label="Revision status" className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="client">Client</SelectItem>
                            <SelectItem value="internal">Internal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

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
                          <SelectTrigger aria-label="Revision status" className="h-8 text-xs">
                            <SelectValue placeholder="Unassigned" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {users.map((u) => (
                              <SelectItem key={u.id} value={u.id}>
                                {u.name}
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
                            onUpdateRevision(rev.id, {
                              dueDate: e.target.value || undefined,
                            })
                          }
                          className={cn(
                            "h-8 text-xs",
                            isOverdue && "border-rose-500 text-rose-600 dark:text-rose-400"
                          )}
                        />
                      </div>
                    </div>

                    {/* Reference Files Section */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-[11px] text-muted-foreground">
                          Reference Attachments ({rev.files?.length || 0})
                        </Label>
                        {permissions.canEditRevision ? (
                          <>
                            <Button
                              type="button"
                              variant="ghost"
                              size="xs"
                              onClick={() =>
                                rowFileInputRefs.current[rev.id]?.click()
                              }
                              className="h-6 gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                            >
                              <Upload className="size-3" />
                              <span>Upload file</span>
                            </Button>
                            <input
                              ref={(el) => {
                                rowFileInputRefs.current[rev.id] = el
                              }}
                              type="file"
                              multiple
                              className="hidden"
                              onChange={(e) =>
                                handleFileSelection(e, (files) =>
                                  onAddRevisionFiles(rev.id, files)
                                )
                              }
                            />
                          </>
                        ) : null}
                      </div>

                      {rev.files && rev.files.length > 0 ? (
                        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                          {rev.files.map((f) => (
                            <div
                              key={f.id}
                              className="flex items-center justify-between gap-2 rounded-md border border-border bg-card p-1.5 text-xs"
                            >
                              <div className="flex min-w-0 items-center gap-1.5">
                                <FileText className="size-3.5 shrink-0 text-muted-foreground" />
                                <div className="min-w-0">
                                  <a
                                    href={f.previewUrl || "#"}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="truncate font-medium text-foreground hover:underline"
                                  >
                                    {f.name}
                                  </a>
                                  <div className="text-[10px] text-muted-foreground">
                                    {f.size}
                                  </div>
                                </div>
                              </div>

                              {permissions.canEditRevision ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onUpdateRevision(rev.id, {
                                      files: rev.files.filter((x) => x.id !== f.id),
                                    })
                                  }
                                  className="text-muted-foreground hover:text-destructive"
                                  aria-label={`Remove file ${f.name}`}
                                >
                                  <X className="size-3.5" />
                                </button>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-muted-foreground/70">
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

      {/* Re-Draw Prompt Dialog */}
      <Dialog open={showReDrawDialog} onOpenChange={setShowReDrawDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="size-5 text-amber-500" />
              <span>Move this task to Re-Draw?</span>
            </DialogTitle>
            <DialogDescription>
              A revision was added to a task currently marked as{" "}
              <strong>{taskStatus}</strong>. Would you like to move this task status
              back to <strong>Re-Draw</strong> for team rework?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowReDrawDialog(false)}
            >
              Keep as {taskStatus}
            </Button>
            <Button
              type="button"
              variant="default"
              onClick={() => {
                setShowReDrawDialog(false)
                onMoveToReDraw?.()
                toast.success("Task moved to Re-Draw")
              }}
            >
              Move to Re-Draw
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
