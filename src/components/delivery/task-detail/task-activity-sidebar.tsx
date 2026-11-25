"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import {
  Activity,
  AtSign,
  Check,
  ChevronDown,
  ChevronRight,
  CornerDownRight,
  History,
  MessageSquare,
  Paperclip,
  Pencil,
  Reply,
  Send,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  EMPTY_DOC,
  RichTextEditorSkeleton,
  RichTextViewer,
  appendMentionToDoc,
  docToPlainText,
} from "@/components/ui/rich-text-editor"

const RichTextEditor = dynamic(
  () =>
    import("@/components/ui/rich-text-editor").then((m) => m.RichTextEditor),
  { ssr: false, loading: () => <RichTextEditorSkeleton /> }
)
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

type ActivityFilter = "all" | "comments" | "status"

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
    richContent?: Record<string, unknown>
    parentId?: string
    mentions: string[]
    attachments: AttachmentFile[]
  }) => void
  onEditComment: (
    commentId: string,
    content: string,
    richContent?: Record<string, unknown>
  ) => void
  onDeleteComment: (commentId: string) => void
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
}: TaskActivitySidebarProps) {
  const [filter, setFilter] = React.useState<ActivityFilter>("all")
  const [draftDoc, setDraftDoc] =
    React.useState<Record<string, unknown>>(EMPTY_DOC)
  const [pendingAttachments, setPendingAttachments] = React.useState<
    AttachmentFile[]
  >([])
  const [pendingMentions, setPendingMentions] = React.useState<string[]>([])
  const [mentionOpen, setMentionOpen] = React.useState(false)
  const [mentionQuery, setMentionQuery] = React.useState("")
  const [editingCommentId, setEditingCommentId] = React.useState<string | null>(
    null
  )
  const [editDoc, setEditDoc] =
    React.useState<Record<string, unknown>>(EMPTY_DOC)
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(
    null
  )
  const [replyingTo, setReplyingTo] = React.useState<{
    parentId: string
    authorName: string
    preview: string
  } | null>(null)
  const [collapsedThreads, setCollapsedThreads] = React.useState<
    Record<string, boolean>
  >({})

  const feedScrollRef = React.useRef<HTMLDivElement | null>(null)
  const isNearBottomRef = React.useRef(true)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  const { topLevelComments, repliesByParentId } = React.useMemo(() => {
    const commentIds = new Set(task.comments.map((c) => c.id))
    const roots: TaskComment[] = []
    const replyMap = new Map<string, TaskComment[]>()

    for (const c of task.comments) {
      if (c.parentId && commentIds.has(c.parentId)) {
        const list = replyMap.get(c.parentId) ?? []
        list.push(c)
        replyMap.set(c.parentId, list)
      } else {
        roots.push(c)
      }
    }

    for (const [parentId, list] of replyMap) {
      replyMap.set(
        parentId,
        [...list].sort(
          (a, b) => parseTimestampMs(a.createdAt) - parseTimestampMs(b.createdAt)
        )
      )
    }

    return { topLevelComments: roots, repliesByParentId: replyMap }
  }, [task.comments])

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
    for (const c of topLevelComments) {
      items.push({
        id: c.id,
        kind: "comment",
        timestamp: c.createdAt,
        sortMs: parseTimestampMs(c.createdAt),
        comment: c,
      })
    }
    return items.sort((a, b) => a.sortMs - b.sortMs)
  }, [task.activity, topLevelComments])

  const visibleItems = React.useMemo(() => {
    if (filter === "comments") return allItems.filter((i) => i.kind === "comment")
    if (filter === "status")
      return allItems.filter((i) => i.kind === "system" || i.kind === "qa")
    return allItems
  }, [allItems, filter])

  const commentCount = task.comments.length
  const statusHistoryCount = React.useMemo(
    () => allItems.filter((i) => i.kind === "system" || i.kind === "qa").length,
    [allItems]
  )

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

  function insertMention(user: StaffUser) {
    setDraftDoc((prev) => appendMentionToDoc(prev, user.name))
    setPendingMentions((prev) =>
      prev.includes(user.id) ? prev : [...prev, user.id]
    )
    setMentionOpen(false)
    setMentionQuery("")
  }

  function handleAttachCommentFile(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    const nowDate = new Date().toISOString().slice(0, 10)
    const attached: AttachmentFile[] = files.map((file) => ({
      id: `ca-${crypto.randomUUID().slice(0, 8)}`,
      name: file.name,
      size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
      type: file.type || "application/octet-stream",
      uploadedBy: currentActorName,
      uploadedAt: nowDate,
    }))
    setPendingAttachments((prev) => [...prev, ...attached])
    e.target.value = ""
  }

  function startReply(c: TaskComment, rootParentId: string) {
    setReplyingTo({
      parentId: rootParentId,
      authorName: c.authorName,
      preview: c.content.replace(/\s+/g, " ").trim().slice(0, 72),
    })
    setCollapsedThreads((prev) => ({ ...prev, [rootParentId]: false }))
  }

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    const plain = docToPlainText(draftDoc).trim()
    if (!plain && pendingAttachments.length === 0) return
    onAddComment({
      content: plain || `Attached ${pendingAttachments.map((a) => a.name).join(", ")}`,
      richContent: plain ? draftDoc : undefined,
      parentId: replyingTo?.parentId,
      mentions: pendingMentions,
      attachments: pendingAttachments,
    })
    setDraftDoc(EMPTY_DOC)
    setReplyingTo(null)
    setPendingAttachments([])
    setPendingMentions([])
  }

  function startEditComment(c: TaskComment) {
    setEditingCommentId(c.id)
    setEditDoc(
      c.richContent ?? {
        type: "doc",
        content: [
          { type: "paragraph", content: [{ type: "text", text: c.content }] },
        ],
      }
    )
  }

  function commitEditComment(commentId: string) {
    const plain = docToPlainText(editDoc).trim()
    if (plain) {
      onEditComment(commentId, plain, editDoc)
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

  function renderCommentNode(
    c: TaskComment,
    rootParentId: string,
    isReply = false
  ) {
    const isOwn =
      c.authorName === currentActorName || currentRole === "Super Admin"
    const isEditing = editingCommentId === c.id
    const isConfirmingDelete = confirmDeleteId === c.id

    return (
      <div
        key={c.id}
        className={cn(
          "group/comment transition-colors",
          isReply
            ? "rounded-lg border border-border/70 bg-muted/25 p-2.5 text-xs hover:border-border"
            : ""
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={cn(
                "flex shrink-0 items-center justify-center rounded-full font-bold text-white ring-1 ring-black/5",
                isReply ? "size-5 text-[9px]" : "size-6 text-[10px]",
                getAvatarColor(c.authorName)
              )}
            >
              {getInitials(c.authorName)}
            </span>
            <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
              <span className="truncate font-semibold text-foreground">
                {c.authorName}
              </span>
              <span className="text-[11px] text-muted-foreground">
                · {formatRelativeTimestamp(c.createdAt, nowMs)}
                {c.editedAt ? " (edited)" : ""}
              </span>
            </div>
          </div>

          {/* Comment actions */}
          <div
            className={cn(
              "flex shrink-0 items-center gap-0.5 transition-opacity",
              isConfirmingDelete
                ? "opacity-100"
                : "opacity-0 group-hover/comment:opacity-100 focus-within:opacity-100"
            )}
          >
            {permissions.canComment ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => startReply(c, rootParentId)}
                aria-label={`Reply to ${c.authorName}`}
                title="Reply"
              >
                <Reply className="size-3 text-muted-foreground hover:text-foreground" />
              </Button>
            ) : null}

            {isOwn && permissions.canComment ? (
              isConfirmingDelete ? (
                <div className="flex items-center gap-1 rounded-md border border-destructive/30 bg-destructive/10 px-1.5 py-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteComment(c.id)
                      setConfirmDeleteId(null)
                    }}
                    className="text-[10px] font-semibold text-destructive hover:underline"
                  >
                    Delete
                  </button>
                  <span className="text-muted-foreground/50">/</span>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(null)}
                    className="text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => startEditComment(c)}
                    aria-label="Edit comment"
                    title="Edit"
                  >
                    <Pencil className="size-3 text-muted-foreground" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setConfirmDeleteId(c.id)}
                    aria-label="Delete comment"
                    title="Delete"
                  >
                    <Trash2 className="size-3 text-muted-foreground hover:text-destructive" />
                  </Button>
                </>
              )
            ) : null}
          </div>
        </div>

        {isEditing ? (
          <div className="mt-2.5 space-y-2">
            <RichTextEditor
              value={editDoc}
              format="json"
              variant="compact"
              onChange={(out) => setEditDoc(out as Record<string, unknown>)}
              onSubmit={() => commitEditComment(c.id)}
              placeholder="Update comment..."
              ariaLabel="Edit comment"
              editorClassName="min-h-[60px] max-h-[160px] text-xs"
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">
                Ctrl+Enter to save
              </span>
              <div className="flex items-center gap-1">
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
                  className="gap-1"
                >
                  <Check className="size-3" />
                  Save
                </Button>
              </div>
            </div>
          </div>
        ) : c.richContent ? (
          <div className={cn("mt-1.5", isReply ? "pl-7" : "pl-8")}>
            <RichTextViewer value={c.richContent} className="text-xs" />
          </div>
        ) : (
          <p
            className={cn(
              "mt-1.5 whitespace-pre-wrap leading-relaxed text-foreground/90",
              isReply ? "pl-7" : "pl-8"
            )}
          >
            {renderCommentWithMentions(c.content)}
          </p>
        )}

        {c.attachments && c.attachments.length > 0 ? (
          <div
            className={cn(
              "mt-2 flex flex-wrap gap-1.5",
              isReply ? "pl-7" : "pl-8"
            )}
          >
            {c.attachments.map((att) => (
              <span
                key={att.id}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2 py-1 text-[11px] text-foreground/85"
              >
                <Paperclip className="size-3 text-primary" />
                <span className="max-w-[150px] truncate font-medium">
                  {att.name}
                </span>
                {att.size ? (
                  <span className="text-[10px] text-muted-foreground">
                    {att.size}
                  </span>
                ) : null}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <aside
      aria-label="Task activity and comments"
      className="flex h-full min-h-0 flex-col bg-muted/20"
    >
      {/* Header & segmented filter */}
      <div className="shrink-0 border-b border-border bg-card px-4 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold tracking-tight text-foreground">
            Activity
          </span>

          <div
            role="tablist"
            aria-label="Activity filter"
            className="inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5 text-[11px]"
          >
            {(
              [
                { id: "all", label: "All", count: allItems.length },
                { id: "comments", label: "Comments", count: commentCount },
                { id: "status", label: "History", count: statusHistoryCount },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={filter === tab.id}
                onClick={() => setFilter(tab.id)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  filter === tab.id
                    ? "bg-background text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span>{tab.label}</span>
                <span className="font-mono text-[10px] opacity-65">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline feed (own scroll) */}
      <div
        ref={feedScrollRef}
        onScroll={handleFeedScroll}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-3.5"
      >
        {visibleItems.length === 0 ? (
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2.5 text-center">
            <div className="flex size-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground/70 shadow-2xs">
              {filter === "comments" ? (
                <MessageSquare className="size-4" />
              ) : (
                <History className="size-4" />
              )}
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-foreground">
                {filter === "comments"
                  ? "No comments yet"
                  : filter === "status"
                    ? "No status history yet"
                    : "No activity yet"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {filter === "comments"
                  ? "Leave a note or @mention a teammate below."
                  : "Updates and comments will appear here."}
              </p>
            </div>
            {filter === "comments" && permissions.canComment ? (
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => setFilter("all")}
              >
                View all activity
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="space-y-3">
            {visibleItems.map((item) => {
              if (item.kind === "comment" && item.comment) {
                const c = item.comment
                const replies = repliesByParentId.get(c.id) ?? []
                const isCollapsed = Boolean(collapsedThreads[c.id])

                return (
                  <article
                    key={c.id}
                    className="rounded-xl border border-border bg-card p-3 text-xs shadow-2xs transition-colors hover:border-border/90"
                  >
                    {renderCommentNode(c, c.id, false)}

                    {replies.length > 0 ? (
                      <div className="mt-2.5 ml-3 border-l-2 border-border/70 pl-3">
                        <button
                          type="button"
                          onClick={() =>
                            setCollapsedThreads((prev) => ({
                              ...prev,
                              [c.id]: !prev[c.id],
                            }))
                          }
                          className="mb-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                        >
                          {isCollapsed ? (
                            <ChevronRight className="size-3" />
                          ) : (
                            <ChevronDown className="size-3" />
                          )}
                          <span>
                            {replies.length}{" "}
                            {replies.length === 1 ? "reply" : "replies"}
                          </span>
                        </button>
                        {!isCollapsed ? (
                          <div className="space-y-2">
                            {replies.map((reply) =>
                              renderCommentNode(reply, c.id, true)
                            )}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </article>
                )
              }

              // System or QA event
              const ev = item.event!
              const isQa = ev.type === "qa"
              return (
                <div
                  key={ev.id}
                  className="flex items-start gap-2.5 px-1.5 py-0.5 text-[11px] leading-snug text-muted-foreground"
                >
                  <div
                    className={cn(
                      "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border",
                      isQa
                        ? "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        : "border-border bg-card text-muted-foreground"
                    )}
                  >
                    {isQa ? (
                      <ShieldAlert className="size-3" />
                    ) : (
                      <Activity className="size-3" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-1">
                      <span className="font-medium text-foreground">
                        {ev.actorName}
                      </span>
                      <span>{ev.action}</span>
                      {ev.fromValue && ev.toValue ? (
                        <span className="inline-flex flex-wrap items-center gap-1">
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            {ev.fromValue}
                          </span>
                          <span>→</span>
                          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                            {ev.toValue}
                          </span>
                        </span>
                      ) : ev.toValue ? (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-foreground">
                          {ev.toValue}
                        </span>
                      ) : null}
                      <span className="text-[10px] text-muted-foreground/75">
                        · {formatRelativeTimestamp(ev.timestamp, nowMs)}
                      </span>
                    </div>
                    {ev.detail ? (
                      <p className="mt-1 rounded-md border border-border/60 bg-card/80 px-2.5 py-1.5 text-[11px] text-foreground/80">
                        {ev.detail}
                      </p>
                    ) : null}
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
        className="relative shrink-0 border-t border-border bg-card p-3.5"
      >
        {!permissions.canComment ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2.5 text-center text-[11px] text-muted-foreground">
            You have read-only access to comments on this task.
          </div>
        ) : (
          <>
            {replyingTo ? (
              <div className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-primary/25 bg-primary/5 px-2.5 py-1.5 text-[11px]">
                <div className="flex min-w-0 items-center gap-1.5">
                  <CornerDownRight className="size-3 shrink-0 text-primary" />
                  <span className="shrink-0 font-semibold text-foreground">
                    Replying to {replyingTo.authorName}
                  </span>
                  {replyingTo.preview ? (
                    <span className="truncate text-muted-foreground">
                      “{replyingTo.preview}”
                    </span>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  aria-label="Cancel reply"
                  className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-background hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              </div>
            ) : null}

            {pendingAttachments.length > 0 ? (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {pendingAttachments.map((att) => (
                  <span
                    key={att.id}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/60 px-2 py-1 text-[11px]"
                  >
                    <Paperclip className="size-3 text-primary" />
                    <span className="max-w-[140px] truncate font-medium">
                      {att.name}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setPendingAttachments((prev) =>
                          prev.filter((a) => a.id !== att.id)
                        )
                      }
                      aria-label={`Remove attachment ${att.name}`}
                      className="rounded p-0.5 text-muted-foreground hover:bg-background hover:text-destructive"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : null}

            <RichTextEditor
              value={draftDoc}
              format="json"
              variant="compact"
              onChange={(out) => setDraftDoc(out as Record<string, unknown>)}
              onSubmit={() => handleSubmit()}
              mentionItems={users.map((u) => ({
                id: u.id,
                name: u.name,
                avatarInitials: u.avatarInitials,
                avatarColor: u.avatarColor,
              }))}
              placeholder={
                replyingTo
                  ? `Reply to ${replyingTo.authorName}… (Ctrl+Enter to send)`
                  : "Write a comment… (Ctrl+Enter to send)"
              }
              ariaLabel="Add comment"
              editorClassName="min-h-[64px] max-h-[150px] text-xs"
            />

            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <Popover open={mentionOpen} onOpenChange={setMentionOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      className="gap-1 text-muted-foreground"
                      aria-label="Mention teammate"
                      title="Mention teammate"
                    >
                      <AtSign className="size-3.5" />
                      Mention
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    side="top"
                    align="start"
                    className="w-60 p-1.5"
                  >
                    <Input
                      value={mentionQuery}
                      onChange={(e) => setMentionQuery(e.target.value)}
                      placeholder="Filter teammates..."
                      className="mb-1.5 h-7 text-xs"
                    />
                    <div className="max-h-40 space-y-0.5 overflow-y-auto">
                      {filteredStaff.length === 0 ? (
                        <p className="py-2 text-center text-xs text-muted-foreground">
                          No teammate matched
                        </p>
                      ) : (
                        filteredStaff.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => insertMention(u)}
                            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted"
                          >
                            <span
                              className={cn(
                                "flex size-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white",
                                u.avatarColor
                              )}
                            >
                              {u.avatarInitials}
                            </span>
                            <span className="truncate font-medium">
                              {u.name}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </PopoverContent>
                </Popover>

                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-1 text-muted-foreground"
                  aria-label="Attach file to comment"
                  title="Attach files"
                >
                  <Paperclip className="size-3.5" />
                  Attach
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="sr-only"
                  onChange={handleAttachCommentFile}
                />
              </div>

              <div className="flex items-center gap-2">
                <span
                  title={`Commenting as ${currentActorName}`}
                  className={cn(
                    "hidden size-5 items-center justify-center rounded-full text-[9px] font-bold text-white sm:inline-flex",
                    getAvatarColor(currentActorName)
                  )}
                >
                  {currentActorInitials}
                </span>
                <span className="hidden text-[10px] text-muted-foreground/80 sm:inline">
                  Ctrl+Enter
                </span>
                <Button
                  type="submit"
                  size="xs"
                  disabled={
                    !docToPlainText(draftDoc).trim() &&
                    pendingAttachments.length === 0
                  }
                  className="gap-1 px-2.5"
                >
                  <Send className="size-3" />
                  Send
                </Button>
              </div>
            </div>
          </>
        )}
      </form>
    </aside>
  )
}
