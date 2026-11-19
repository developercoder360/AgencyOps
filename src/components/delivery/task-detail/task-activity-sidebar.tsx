"use client"

import * as React from "react"
import {
  Activity,
  AtSign,
  CheckCircle2,
  Circle,
  History,
  MessageSquare,
  Paperclip,
  Pencil,
  Send,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import type { TaskRolePermissions } from "@/lib/permissions"
import type {
  AttachmentFile,
  Role,
  StaffUser,
  Task,
  TaskActivityEvent,
  TaskComment,
} from "@/types"
import { cn } from "cn"
import { formatRelativeTimestamp, parseTimestampMs } from "./types"

type ActivityFilter = "all" | "comments" | "history"

interface TimelineItem {
  id: string
  kind: "comment" | "system" | "qa"
  timestamp: string
  sortMs: number
  comment?: TaskComment
  event?: TaskActivityEvent
}

interface TaskActivitySidebarProps {
  task: Task
  users: StaffUser[]
  currentActorName: string
  currentActorInitials: string
  currentRole: Role
  permissions: TaskRolePermissions
  nowMs: number | null
  onAddComment: (payload: {
    content: string
    mentions: string[]
    attachments: AttachmentFile[]
    isQaRelated: boolean
  }) => void
  onEditComment: (commentId: string, content: string) => void
  onDeleteComment: (commentId: string) => void
  onToggleResolved: (commentId: string) => void
}

function renderCommentWithMentions(content: string): React.ReactNode {
  const regex = /(@[A-Z][a-zA-Z'-]+(?:\s+[A-Z][a-zA-Z'-]+)?)/g
  const parts = content.split(regex)
  return parts.map((part, i) => {
    if (part.startsWith("@") && part.length > 1) {
      return (
        <span
          key={i}
          className="rounded bg-primary/15 px-1 py-0.5 font-medium text-primary"
        >
          {part}
        </span>
      )
    }
    return <React.Fragment key={i}>{part}</React.Fragment>
  })
}

export function TaskActivitySidebar({
  task,
  users,
  currentActorName,
  currentActorInitials,
  currentRole,
  permissions,
  nowMs,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onToggleResolved,
}: TaskActivitySidebarProps) {
  const [filter, setFilter] = React.useState<ActivityFilter>("all")
  const [draft, setDraft] = React.useState("")
  const [pendingAttachments, setPendingAttachments] = React.useState<
    AttachmentFile[]
  >([])
  const [pendingMentions, setPendingMentions] = React.useState<string[]>([])
  const [mentionOpen, setMentionOpen] = React.useState(false)
  const [mentionQuery, setMentionQuery] = React.useState("")
  const [isQaNote, setIsQaNote] = React.useState(false)
  const [editingCommentId, setEditingCommentId] = React.useState<string | null>(
    null
  )
  const [editDraft, setEditDraft] = React.useState("")

  const feedScrollRef = React.useRef<HTMLDivElement | null>(null)
  const isNearBottomRef = React.useRef(true)
  const composerRef = React.useRef<HTMLTextAreaElement | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  // Build unified chronological timeline (oldest → newest at bottom)
  const allItems = React.useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = []
    for (const ev of task.activity ?? []) {
      items.push({
        id: ev.id,
        kind: ev.type === "qa" ? "qa" : "system",
        timestamp: ev.timestamp,
        sortMs: parseTimestampMs(ev.timestamp),
        event: ev,
      })
    }
    for (const c of task.comments) {
      items.push({
        id: c.id,
        kind: "comment",
        timestamp: c.createdAt,
        sortMs: parseTimestampMs(c.createdAt),
        comment: c,
      })
    }
    return items.sort((a, b) => a.sortMs - b.sortMs)
  }, [task.activity, task.comments])

  const visibleItems = React.useMemo(() => {
    if (filter === "comments") return allItems.filter((i) => i.kind === "comment")
    if (filter === "history") return allItems.filter((i) => i.kind !== "comment")
    return allItems
  }, [allItems, filter])

  const historyCount = (task.activity ?? []).length
  const commentCount = task.comments.length

  const prevFeedRef = React.useRef({
    taskId: task.id,
    count: allItems.length,
  })
  React.useEffect(() => {
    const prev = prevFeedRef.current
    const appendedOnSameTask =
      prev.taskId === task.id && allItems.length > prev.count
    prevFeedRef.current = { taskId: task.id, count: allItems.length }

    if (!appendedOnSameTask) return
    const container = feedScrollRef.current
    if (!container || container.clientHeight === 0) return
    if (!isNearBottomRef.current) return
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" })
  }, [task.id, allItems.length])

  function handleFeedScroll() {
    const container = feedScrollRef.current
    if (!container) return
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight
    isNearBottomRef.current = distanceFromBottom <= 80
  }

  const filteredStaff = React.useMemo(() => {
    const q = mentionQuery.trim().toLowerCase()
    if (!q) return users
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) || u.role.toLowerCase().includes(q)
    )
  }, [users, mentionQuery])

  function handleDraftChange(next: string) {
    setDraft(next)
    // Detect trailing @query for live mention popup
    const match = /(?:^|\s)@([a-zA-Z0-9_-]*)$/.exec(next)
    if (match) {
      setMentionQuery(match[1])
      setMentionOpen(true)
    } else if (mentionOpen && !next.endsWith("@")) {
      setMentionOpen(false)
      setMentionQuery("")
    }
    // Auto-grow textarea height
    const el = composerRef.current
    if (el) {
      el.style.height = "auto"
      el.style.height = `${Math.min(el.scrollHeight, 140)}px`
    }
  }

  function insertMention(user: StaffUser) {
    const replaced = draft.replace(/(?:^|\s)@[a-zA-Z0-9_-]*$/, (match) =>
      match.startsWith(" ") ? ` @${user.name} ` : `@${user.name} `
    )
    const next = replaced === draft ? `${draft}@${user.name} ` : replaced
    setDraft(next)
    setPendingMentions((prev) =>
      prev.includes(user.id) ? prev : [...prev, user.id]
    )
    setMentionOpen(false)
    setMentionQuery("")
    requestAnimationFrame(() => {
      composerRef.current?.focus({ preventScroll: true })
    })
  }

  function handleAttachCommentFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const nowDate = new Date().toISOString().slice(0, 10)
    const attached: AttachmentFile = {
      id: `ca-${crypto.randomUUID().slice(0, 8)}`,
      name: file.name,
      size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
      type: file.type || "application/octet-stream",
      uploadedBy: currentActorName,
      uploadedAt: nowDate,
    }
    setPendingAttachments((prev) => [...prev, attached])
    e.target.value = ""
  }

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    const trimmed = draft.trim()
    if (!trimmed && pendingAttachments.length === 0) return
    onAddComment({
      content: trimmed || `Attached ${pendingAttachments.map((a) => a.name).join(", ")}`,
      mentions: pendingMentions,
      attachments: pendingAttachments,
      isQaRelated:
        isQaNote ||
        currentRole === "QA Reviewer" ||
        task.status === "QA Review" ||
        task.status === "Re-Draw",
    })
    setDraft("")
    setPendingAttachments([])
    setPendingMentions([])
    if (composerRef.current) {
      composerRef.current.style.height = "auto"
    }
  }

  function startEditComment(c: TaskComment) {
    setEditingCommentId(c.id)
    setEditDraft(c.content)
  }

  function commitEditComment(commentId: string) {
    const trimmed = editDraft.trim()
    if (trimmed) {
      onEditComment(commentId, trimmed)
    }
    setEditingCommentId(null)
  }

  function getInitials(name: string): string {
    const found = users.find((u) => u.name === name)
    if (found) return found.avatarInitials
    return name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
  }

  function getAvatarColor(name: string): string {
    const found = users.find((u) => u.name === name)
    return found?.avatarColor ?? "bg-primary"
  }

  return (
    <aside
      aria-label="Task activity and comments"
      className="flex h-full min-h-0 flex-col bg-muted/15"
    >
      {/* Header & filter tabs */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-card px-3.5 py-2.5">
        <span className="text-xs font-semibold text-foreground">Activity</span>
        <div
          role="tablist"
          aria-label="Activity filter"
          className="inline-flex items-center rounded-md border border-border bg-muted/40 p-0.5 text-[11px]"
        >
          {(
            [
              { id: "all", label: "All", count: allItems.length },
              { id: "comments", label: "Comments", count: commentCount },
              { id: "history", label: "History", count: historyCount },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={filter === tab.id}
              onClick={() => setFilter(tab.id)}
              className={cn(
                "inline-flex items-center gap-1 rounded px-2 py-0.5 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                filter === tab.id
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span>{tab.label}</span>
              <span className="font-mono text-[10px] opacity-75">
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Timeline feed (own scroll) */}
      <div
        ref={feedScrollRef}
        onScroll={handleFeedScroll}
        className="min-h-0 flex-1 overflow-y-auto px-3.5 py-3"
      >
        {visibleItems.length === 0 ? (
          <div className="flex h-full min-h-[180px] flex-col items-center justify-center gap-2 text-center">
            {filter === "comments" ? (
              <MessageSquare className="size-6 text-muted-foreground/50" />
            ) : (
              <History className="size-6 text-muted-foreground/50" />
            )}
            <p className="text-xs text-muted-foreground">
              {filter === "comments"
                ? "No comments yet. Start the conversation below."
                : "No activity recorded yet."}
            </p>
            {filter === "comments" && permissions.canComment ? (
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => composerRef.current?.focus({ preventScroll: true })}
              >
                Write first comment
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="space-y-3">
            {visibleItems.map((item) => {
              if (item.kind === "comment" && item.comment) {
                const c = item.comment
                const isOwn =
                  c.authorName === currentActorName ||
                  currentRole === "Super Admin"
                const isEditing = editingCommentId === c.id

                return (
                  <div
                    key={c.id}
                    className={cn(
                      "rounded-lg border p-2.5 text-xs transition-colors",
                      c.resolved
                        ? "border-emerald-500/30 bg-emerald-500/5"
                        : "border-border bg-card"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className={cn(
                            "flex size-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white",
                            getAvatarColor(c.authorName)
                          )}
                        >
                          {getInitials(c.authorName)}
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="truncate font-semibold text-foreground">
                              {c.authorName}
                            </span>
                            {c.isQaRelated ? (
                              <Badge
                                variant={c.resolved ? "secondary" : "outline"}
                                className="h-4 px-1 text-[9px]"
                              >
                                QA
                              </Badge>
                            ) : null}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {formatRelativeTimestamp(c.createdAt, nowMs)}
                            {c.editedAt ? " (edited)" : ""}
                          </div>
                        </div>
                      </div>

                      {/* Comment actions */}
                      <div className="flex shrink-0 items-center gap-0.5">
                        {c.isQaRelated && permissions.canResolveQaComment ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => onToggleResolved(c.id)}
                            aria-label={
                              c.resolved
                                ? "Reopen QA comment"
                                : "Mark QA comment resolved"
                            }
                            title={
                              c.resolved
                                ? "Resolved (click to reopen)"
                                : "Mark as resolved"
                            }
                          >
                            {c.resolved ? (
                              <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Circle className="size-3.5 text-muted-foreground" />
                            )}
                          </Button>
                        ) : null}
                        {isOwn && permissions.canComment ? (
                          <>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => startEditComment(c)}
                              aria-label="Edit comment"
                            >
                              <Pencil className="size-3 text-muted-foreground" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => onDeleteComment(c.id)}
                              aria-label="Delete comment"
                            >
                              <Trash2 className="size-3 text-muted-foreground hover:text-destructive" />
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="mt-2 space-y-1.5">
                        <Textarea
                          autoFocus
                          value={editDraft}
                          onChange={(e) => setEditDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") {
                              e.stopPropagation()
                              setEditingCommentId(null)
                            } else if (
                              (e.metaKey || e.ctrlKey) &&
                              e.key === "Enter"
                            ) {
                              e.preventDefault()
                              commitEditComment(c.id)
                            }
                          }}
                          rows={2}
                          className="text-xs"
                        />
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="xs"
                            onClick={() => setEditingCommentId(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            size="xs"
                            onClick={() => commitEditComment(c.id)}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p
                        className={cn(
                          "mt-2 whitespace-pre-wrap leading-relaxed text-foreground/90",
                          c.resolved && "text-muted-foreground line-through"
                        )}
                      >
                        {renderCommentWithMentions(c.content)}
                      </p>
                    )}

                    {c.attachments && c.attachments.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {c.attachments.map((att) => (
                          <span
                            key={att.id}
                            className="inline-flex items-center gap-1 rounded border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                          >
                            <Paperclip className="size-2.5" />
                            <span className="max-w-[140px] truncate">
                              {att.name}
                            </span>
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )
              }

              // System or QA event
              const ev = item.event!
              const isQa = ev.type === "qa"
              return (
                <div
                  key={ev.id}
                  className="flex items-start gap-2 px-1 text-[11px] leading-snug text-muted-foreground"
                >
                  <div
                    className={cn(
                      "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border",
                      isQa
                        ? "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        : "border-border bg-background text-muted-foreground"
                    )}
                  >
                    {isQa ? (
                      <ShieldAlert className="size-3" />
                    ) : (
                      <Activity className="size-3" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div>
                      <span className="font-medium text-foreground">
                        {ev.actorName}
                      </span>{" "}
                      <span>{ev.action}</span>
                      {ev.fromValue && ev.toValue ? (
                        <span className="ml-1 inline-flex flex-wrap items-center gap-1">
                          <span className="rounded bg-muted px-1 py-0.5 text-[10px] text-muted-foreground">
                            {ev.fromValue}
                          </span>
                          <span>→</span>
                          <span className="rounded bg-primary/10 px-1 py-0.5 text-[10px] font-medium text-primary">
                            {ev.toValue}
                          </span>
                        </span>
                      ) : ev.toValue ? (
                        <span className="ml-1 rounded bg-muted px-1 py-0.5 text-[10px] font-medium text-foreground">
                          {ev.toValue}
                        </span>
                      ) : null}
                    </div>
                    {ev.detail ? (
                      <p className="mt-0.5 rounded border border-border/60 bg-background/70 px-2 py-1 text-[11px] text-foreground/80">
                        {ev.detail}
                      </p>
                    ) : null}
                    <div className="mt-0.5 text-[10px] text-muted-foreground/80">
                      {formatRelativeTimestamp(ev.timestamp, nowMs)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Pinned Comment Composer */}
      <form
        onSubmit={handleSubmit}
        className="shrink-0 border-t border-border bg-card p-3"
      >
          {pendingAttachments.length > 0 ? (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {pendingAttachments.map((att) => (
                <span
                  key={att.id}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px]"
                >
                  <Paperclip className="size-3 text-primary" />
                  <span className="max-w-[140px] truncate">{att.name}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setPendingAttachments((prev) =>
                        prev.filter((a) => a.id !== att.id)
                      )
                    }
                    aria-label={`Remove attachment ${att.name}`}
                    className="hover:text-destructive"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : null}

          <div className="rounded-lg border border-border bg-background focus-within:border-ring focus-within:ring-1 focus-within:ring-ring">
            <Textarea
              ref={composerRef}
              value={draft}
              onChange={(e) => handleDraftChange(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault()
                  handleSubmit()
                } else if (e.key === "Escape" && mentionOpen) {
                  e.stopPropagation()
                  setMentionOpen(false)
                }
              }}
              placeholder="Write a comment… Use @ to mention"
              aria-label="Add comment"
              rows={2}
              className="min-h-[54px] resize-none border-0 bg-transparent px-2.5 py-2 text-xs shadow-none focus-visible:ring-0"
            />

            <div className="flex items-center justify-between gap-1 border-t border-border/60 px-2 py-1.5">
              <div className="flex items-center gap-1">
                {/* @mention picker */}
                <Popover open={mentionOpen} onOpenChange={setMentionOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label="Mention teammate"
                      title="Mention teammate (@)"
                    >
                      <AtSign className="size-3.5 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    side="top"
                    className="w-56 p-1.5"
                  >
                    <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Mention Staff
                    </div>
                    <div className="max-h-44 space-y-0.5 overflow-y-auto">
                      {filteredStaff.length === 0 ? (
                        <p className="py-2 text-center text-xs text-muted-foreground">
                          No staff matched
                        </p>
                      ) : (
                        filteredStaff.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => insertMention(u)}
                            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <span
                              className={cn(
                                "flex size-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white",
                                u.avatarColor
                              )}
                            >
                              {u.avatarInitials}
                            </span>
                            <div className="min-w-0">
                              <div className="truncate font-medium">
                                {u.name}
                              </div>
                              <div className="truncate text-[10px] text-muted-foreground">
                                {u.role}
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Attach file */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Attach file to comment"
                  title="Attach file"
                >
                  <Paperclip className="size-3.5 text-muted-foreground" />
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="sr-only"
                  onChange={handleAttachCommentFile}
                />

                {/* QA comment toggle */}
                <button
                  type="button"
                  onClick={() => setIsQaNote((v) => !v)}
                  aria-pressed={isQaNote}
                  title="Tag as QA comment (supports Resolved toggle)"
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isQaNote
                      ? "bg-violet-500/15 text-violet-700 dark:text-violet-300"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  QA Note
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="hidden text-[10px] text-muted-foreground sm:inline">
                  {currentActorInitials}
                </span>
                <Button
                  type="submit"
                  size="xs"
                  disabled={!draft.trim() && pendingAttachments.length === 0}
                  className="gap-1"
                >
                  <Send className="size-3" />
                  Send
                </Button>
              </div>
            </div>
          </div>
        </form>
    </aside>
  )
}
