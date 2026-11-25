"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { toast } from "sonner"
import {
  ArrowLeft,
  AtSign,
  CheckCheck,
  CornerDownRight,
  Edit2,
  ExternalLink,
  MessageSquare,
  Paperclip,
  Pin,
  PinOff,
  Reply,
  Search,
  Send,
  SmilePlus,
  Trash2,
  X,
} from "lucide-react"
import { useAppState } from "@/components/providers/app-state-provider"
import {
  AvatarGroup,
  ConfirmDeleteDialog,
  PageHeader,
} from "@/components/shared"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  EMPTY_DOC,
  RichTextEditorSkeleton,
  appendMentionToDoc,
  docToPlainText,
} from "@/components/ui/rich-text-editor"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const RichTextEditor = dynamic(
  () =>
    import("@/components/ui/rich-text-editor").then((m) => m.RichTextEditor),
  { ssr: false, loading: () => <RichTextEditorSkeleton /> }
)
import { useStore } from "@/lib/store"
import type { ChatMessage, ChatMessageAttachment, ChatThread } from "@/types"
import { cn } from "cn"

const QUICK_EMOJIS = ["👍", "✅", "🔥", "❤️"] as const
const CURRENT_USER_ID = "usr-admin"

function renderMessageWithMentions(content: string): React.ReactNode {
  const regex = /(@[A-Z][a-zA-Z'-]+(?:\s+[A-Z][a-zA-Z'-]+)?)/g
  const parts = content.split(regex)
  return parts.map((part, idx) => {
    if (part.startsWith("@") && part.length > 1) {
      return (
        <span
          key={idx}
          className="rounded bg-primary/20 px-1 py-0.5 font-semibold underline decoration-primary/40"
        >
          {part}
        </span>
      )
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>
  })
}

export default function ChatsPage() {
  const { setUnreadMessagesCount } = useAppState()
  const {
    chatThreads,
    projects,
    users,
    sendMessage,
    editMessage,
    deleteMessage,
    toggleMessageReaction,
    togglePinMessage,
    deleteChatThread,
    markThreadRead,
  } = useStore()

  // Thread list state
  const [activeId, setActiveId] = React.useState<string>("")
  const [search, setSearch] = React.useState("")
  const [mobileShowThread, setMobileShowThread] = React.useState(false)

  // Active thread UI state
  const [msgSearchOpen, setMsgSearchOpen] = React.useState(false)
  const [msgSearch, setMsgSearch] = React.useState("")
  const [deleteThreadTarget, setDeleteThreadTarget] =
    React.useState<ChatThread | null>(null)

  // Composer state
  const [draftDoc, setDraftDoc] = React.useState<Record<string, unknown>>(EMPTY_DOC)
  const [pendingAttachments, setPendingAttachments] = React.useState<
    ChatMessageAttachment[]
  >([])
  const [replyingTo, setReplyingTo] = React.useState<{
    id: string
    author: string
    preview: string
  } | null>(null)
  const [mentionOpen, setMentionOpen] = React.useState(false)
  const [mentionQuery, setMentionQuery] = React.useState("")

  // Edit / delete message state
  const [editingMsg, setEditingMsg] = React.useState<ChatMessage | null>(null)
  const [editDoc, setEditDoc] = React.useState<Record<string, unknown>>(EMPTY_DOC)
  const [confirmDeleteMsgId, setConfirmDeleteMsgId] = React.useState<
    string | null
  >(null)

  const feedEndRef = React.useRef<HTMLDivElement | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  const filteredThreads = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return chatThreads
    return chatThreads.filter(
      (t) =>
        t.projectName.toLowerCase().includes(q) ||
        t.brandName.toLowerCase().includes(q) ||
        t.lastMessagePreview.toLowerCase().includes(q)
    )
  }, [chatThreads, search])

  const activeThread = React.useMemo(
    () => chatThreads.find((t) => t.id === activeId) ?? chatThreads[0],
    [chatThreads, activeId]
  )

  const activeProjectExists = React.useMemo(
    () => Boolean(projects.find((p) => p.id === activeThread?.projectId)),
    [projects, activeThread?.projectId]
  )

  const activeParticipants = React.useMemo(
    () =>
      users.filter((u) => activeThread?.participantIds.includes(u.id)),
    [users, activeThread]
  )

  const filteredMessages = React.useMemo(() => {
    if (!activeThread) return []
    const q = msgSearch.trim().toLowerCase()
    if (!q) return activeThread.messages
    return activeThread.messages.filter(
      (m) =>
        m.content.toLowerCase().includes(q) ||
        m.senderName.toLowerCase().includes(q) ||
        (m.attachment && m.attachment.toLowerCase().includes(q)) ||
        m.attachments?.some((a) => a.name.toLowerCase().includes(q))
    )
  }, [activeThread, msgSearch])

  const pinnedMessages = React.useMemo(
    () => activeThread?.messages.filter((m) => m.pinned) ?? [],
    [activeThread]
  )

  const mentionCandidates = React.useMemo(() => {
    const pool = activeParticipants.length > 0 ? activeParticipants : users
    const q = mentionQuery.trim().toLowerCase()
    if (!q) return pool
    return pool.filter(
      (u) =>
        u.name.toLowerCase().includes(q) || u.role.toLowerCase().includes(q)
    )
  }, [activeParticipants, users, mentionQuery])

  React.useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [activeThread?.id, activeThread?.messages.length])

  function selectThread(threadId: string) {
    setActiveId(threadId)
    setMobileShowThread(true)
    setReplyingTo(null)
    setMsgSearch("")
    setMsgSearchOpen(false)
    markThreadRead(threadId)
    const totalUnread = chatThreads
      .filter((t) => t.id !== threadId)
      .reduce((acc, t) => acc + t.unreadCount, 0)
    setUnreadMessagesCount(totalUnread)
  }

  function insertMention(name: string) {
    setDraftDoc((prev) => appendMentionToDoc(prev, name))
    setMentionOpen(false)
    setMentionQuery("")
  }

  function handleAttachFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    const next: ChatMessageAttachment[] = files.map((file) => ({
      id: `chat-att-${crypto.randomUUID().slice(0, 8)}`,
      name: file.name,
      size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
    }))
    setPendingAttachments((prev) => [...prev, ...next])
    e.target.value = ""
  }

  function handleSendMessage(e?: React.FormEvent) {
    e?.preventDefault()
    if (!activeThread) return
    const plain = docToPlainText(draftDoc).trim()
    if (!plain && pendingAttachments.length === 0) return

    const content =
      plain || `Shared ${pendingAttachments.map((a) => a.name).join(", ")}`

    sendMessage(activeThread.id, content, CURRENT_USER_ID, undefined, {
      richContent: plain ? draftDoc : undefined,
      replyToId: replyingTo?.id,
      replyToAuthor: replyingTo?.author,
      replyToPreview: replyingTo?.preview,
      attachments:
        pendingAttachments.length > 0 ? pendingAttachments : undefined,
    })

    setDraftDoc(EMPTY_DOC)
    setPendingAttachments([])
    setReplyingTo(null)
    setMentionOpen(false)
  }

  function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingMsg || !activeThread) return
    const plain = docToPlainText(editDoc).trim()
    if (!plain) return
    editMessage(activeThread.id, editingMsg.id, plain, editDoc)
    setEditingMsg(null)
    toast.success("Message updated")
  }

  function handleConfirmDeleteThread() {
    if (!deleteThreadTarget) return
    const targetId = deleteThreadTarget.id
    deleteChatThread(targetId)
    toast.success(`Removed chat thread for ${deleteThreadTarget.projectName}`)
    if (activeId === targetId) {
      setActiveId(chatThreads.find((t) => t.id !== targetId)?.id ?? "")
    }
    setDeleteThreadTarget(null)
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Project Chats"
        description="Real-time internal project threads with replies, @mentions, reactions, and deliverable attachments."
        badge={<Badge variant="secondary">{chatThreads.length} threads</Badge>}
      />

      {chatThreads.length === 0 ? (
        <div className="flex h-96 flex-col items-center justify-center rounded-xl border border-dashed border-border p-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MessageSquare className="size-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-foreground">
            No Project Chat Threads Yet
          </h3>
          <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
            Start a new channel above or create a delivery project in{" "}
            <Link href="/projects" className="text-primary underline">
              Projects
            </Link>{" "}
            to initiate team messaging.
          </p>
        </div>
      ) : (
        <div className="grid min-h-[540px] grid-cols-1 overflow-hidden rounded-xl border border-border bg-card lg:h-[calc(100vh-210px)] lg:grid-cols-12">
          {/* Left Pane: Conversation List */}
          <div
            className={cn(
              "flex min-h-0 flex-col border-r border-border lg:col-span-4",
              mobileShowThread ? "hidden lg:flex" : "flex"
            )}
          >
            <div className="border-b border-border p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search project threads..."
                  aria-label="Search project threads"
                  className="h-8 pl-8 text-sm"
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="divide-y divide-border">
                {filteredThreads.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    No matching project channels found.
                  </div>
                ) : (
                  filteredThreads.map((thread) => {
                    const isSelected = thread.id === activeThread?.id
                    return (
                      <button
                        key={thread.id}
                        type="button"
                        onClick={() => selectThread(thread.id)}
                        className={cn(
                          "flex w-full min-w-0 flex-col gap-1 p-3.5 text-left transition-colors hover:bg-muted/50",
                          isSelected && "bg-primary/5"
                        )}
                      >
                        <div className="flex w-full min-w-0 items-start justify-between gap-2">
                          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                            {thread.projectName}
                          </span>
                          <span className="shrink-0 whitespace-nowrap text-[11px] text-muted-foreground">
                            {thread.lastMessageAt}
                          </span>
                        </div>
                        <div className="flex w-full min-w-0 items-center justify-between gap-2">
                          <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                            {thread.lastMessagePreview}
                          </span>
                          {thread.unreadCount > 0 ? (
                            <Badge className="h-5 min-w-5 shrink-0 justify-center rounded-full px-1.5 text-[10px]">
                              {thread.unreadCount}
                            </Badge>
                          ) : null}
                        </div>
                        <div className="pt-0.5">
                          <Badge
                            variant="outline"
                            className="text-[10px] font-normal"
                          >
                            {thread.brandName}
                          </Badge>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Pane: Active Message Thread (+ optional Info drawer) */}
          <div
            className={cn(
              "flex min-h-0 flex-col lg:col-span-8",
              mobileShowThread ? "flex" : "hidden lg:flex"
            )}
          >
            {activeThread ? (
              <div className="flex min-h-0 flex-1 overflow-hidden">
                {/* Main Thread Column */}
                <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                  {/* Thread header */}
                  <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setMobileShowThread(false)}
                        className="lg:hidden"
                        aria-label="Back to threads"
                      >
                        <ArrowLeft className="size-4" />
                      </Button>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          {activeProjectExists ? (
                            <Link
                              href={`/projects/${activeThread.projectId}`}
                              className="inline-flex min-w-0 items-center gap-1 truncate text-sm font-semibold text-foreground hover:text-primary"
                            >
                              <span className="truncate">
                                {activeThread.projectName}
                              </span>
                              <ExternalLink className="size-3 shrink-0 opacity-60" />
                            </Link>
                          ) : (
                            <h2 className="truncate text-sm font-semibold text-foreground">
                              {activeThread.projectName}
                            </h2>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {activeThread.brandName} • {activeParticipants.length}{" "}
                          participants
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <div className="hidden sm:block">
                        <AvatarGroup people={activeParticipants} max={4} />
                      </div>
                      <Button
                        type="button"
                        variant={msgSearchOpen ? "secondary" : "ghost"}
                        size="icon-xs"
                        onClick={() => {
                          setMsgSearchOpen((v) => !v)
                          if (msgSearchOpen) setMsgSearch("")
                        }}
                        title="Search in thread"
                        aria-label="Search in thread"
                      >
                        <Search className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => setDeleteThreadTarget(activeThread)}
                        title="Delete thread"
                        aria-label="Delete thread"
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* In-thread search bar */}
                  {msgSearchOpen ? (
                    <div className="flex shrink-0 items-center gap-2 border-b border-border bg-muted/30 px-4 py-2">
                      <Search className="size-3.5 text-muted-foreground" />
                      <Input
                        autoFocus
                        value={msgSearch}
                        onChange={(e) => setMsgSearch(e.target.value)}
                        placeholder="Search messages or attachments..."
                        className="h-7 flex-1 border-0 bg-transparent px-0 text-xs shadow-none focus-visible:ring-0"
                      />
                      {msgSearch ? (
                        <span className="text-[11px] text-muted-foreground">
                          {filteredMessages.length}{" "}
                          {filteredMessages.length === 1 ? "match" : "matches"}
                        </span>
                      ) : null}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => {
                          setMsgSearch("")
                          setMsgSearchOpen(false)
                        }}
                        aria-label="Close message search"
                      >
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  ) : null}

                  {/* Pinned message banner */}
                  {pinnedMessages.length > 0 ? (
                    <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-amber-500/5 px-4 py-2 text-xs">
                      <div className="flex min-w-0 items-center gap-2">
                        <Pin className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                        <span className="shrink-0 font-semibold text-foreground">
                          Pinned ({pinnedMessages.length}):
                        </span>
                        <span className="truncate text-muted-foreground">
                          {pinnedMessages[pinnedMessages.length - 1].senderName}
                          : {pinnedMessages[pinnedMessages.length - 1].content}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() =>
                          togglePinMessage(
                            activeThread.id,
                            pinnedMessages[pinnedMessages.length - 1].id
                          )
                        }
                        className="h-6 shrink-0 text-[11px]"
                      >
                        Unpin
                      </Button>
                    </div>
                  ) : null}

                  {/* Messages */}
                  <div className="min-h-0 flex-1 overflow-y-auto p-4">
                    <div className="space-y-4">
                      {filteredMessages.length === 0 ? (
                        <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">
                          {msgSearch
                            ? "No messages match your search."
                            : "No messages in this project channel yet. Send the first update below."}
                        </div>
                      ) : (
                        filteredMessages.map((msg) => {
                          const isSelf = msg.senderId === CURRENT_USER_ID
                          const readers = users.filter((u) =>
                            msg.readByIds.includes(u.id)
                          )
                          const msgAttachments: ChatMessageAttachment[] = [
                            ...(msg.attachment
                              ? [{ id: `${msg.id}-att`, name: msg.attachment }]
                              : []),
                            ...(msg.attachments ?? []),
                          ]
                          const reactionEntries = Object.entries(
                            msg.reactions ?? {}
                          ).filter(([, userIds]) => userIds.length > 0)
                          const isConfirmingDelete =
                            confirmDeleteMsgId === msg.id

                          return (
                            <div
                              key={msg.id}
                              className={cn(
                                "group flex items-start gap-2.5",
                                isSelf && "flex-row-reverse"
                              )}
                            >
                              <Avatar className="size-7 shrink-0">
                                <AvatarFallback
                                  className={cn(
                                    "text-[10px] font-bold text-white",
                                    isSelf
                                      ? "bg-primary"
                                      : "bg-muted-foreground"
                                  )}
                                >
                                  {msg.senderInitials}
                                </AvatarFallback>
                              </Avatar>

                              <div
                                className={cn(
                                  "flex max-w-[78%] flex-col space-y-1",
                                  isSelf ? "items-end text-right" : "items-start"
                                )}
                              >
                                <div
                                  className={cn(
                                    "flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground",
                                    isSelf && "flex-row-reverse"
                                  )}
                                >
                                  <span className="font-medium text-foreground">
                                    {msg.senderName}
                                  </span>
                                  <span>{msg.timestamp}</span>
                                  {msg.edited ? (
                                    <span className="italic">(edited)</span>
                                  ) : null}
                                  {msg.pinned ? (
                                    <Badge
                                      variant="outline"
                                      className="h-4 gap-0.5 border-amber-500/40 bg-amber-500/10 px-1 text-[9px] text-amber-700 dark:text-amber-300"
                                    >
                                      <Pin className="size-2.5" />
                                      Pinned
                                    </Badge>
                                  ) : null}

                                  {/* Hover actions */}
                                  <div
                                    className={cn(
                                      "flex items-center gap-0.5 transition-opacity",
                                      isConfirmingDelete
                                        ? "opacity-100"
                                        : "opacity-0 group-hover:opacity-100 focus-within:opacity-100"
                                    )}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setReplyingTo({
                                          id: msg.id,
                                          author: msg.senderName,
                                          preview: msg.content.slice(0, 80),
                                        })
                                      }}
                                      title="Reply"
                                      aria-label="Reply to message"
                                      className="rounded p-1 hover:bg-muted hover:text-foreground"
                                    >
                                      <Reply className="size-3" />
                                    </button>

                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <button
                                          type="button"
                                          title="Add reaction"
                                          aria-label="Add reaction"
                                          className="rounded p-1 hover:bg-muted hover:text-foreground"
                                        >
                                          <SmilePlus className="size-3" />
                                        </button>
                                      </PopoverTrigger>
                                      <PopoverContent
                                        side="top"
                                        align="center"
                                        className="flex w-auto gap-1 p-1"
                                      >
                                        {QUICK_EMOJIS.map((emoji) => (
                                          <button
                                            key={emoji}
                                            type="button"
                                            onClick={() =>
                                              toggleMessageReaction(
                                                activeThread.id,
                                                msg.id,
                                                emoji,
                                                CURRENT_USER_ID
                                              )
                                            }
                                            className="rounded px-1.5 py-0.5 text-sm hover:bg-muted"
                                          >
                                            {emoji}
                                          </button>
                                        ))}
                                      </PopoverContent>
                                    </Popover>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        togglePinMessage(
                                          activeThread.id,
                                          msg.id
                                        )
                                      }
                                      title={
                                        msg.pinned
                                          ? "Unpin message"
                                          : "Pin message"
                                      }
                                      aria-label={
                                        msg.pinned
                                          ? "Unpin message"
                                          : "Pin message"
                                      }
                                      className="rounded p-1 hover:bg-muted hover:text-foreground"
                                    >
                                      {msg.pinned ? (
                                        <PinOff className="size-3" />
                                      ) : (
                                        <Pin className="size-3" />
                                      )}
                                    </button>

                                    {isSelf ? (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingMsg(msg)
                                            setEditDoc(
                                              msg.richContent ?? {
                                                type: "doc",
                                                content: [
                                                  {
                                                    type: "paragraph",
                                                    content: [
                                                      {
                                                        type: "text",
                                                        text: msg.content,
                                                      },
                                                    ],
                                                  },
                                                ],
                                              }
                                            )
                                          }}
                                          title="Edit"
                                          aria-label="Edit message"
                                          className="rounded p-1 hover:bg-muted hover:text-foreground"
                                        >
                                          <Edit2 className="size-3" />
                                        </button>
                                        {isConfirmingDelete ? (
                                          <span className="inline-flex items-center gap-1 rounded border border-destructive/30 bg-destructive/10 px-1.5 py-0.5 text-[10px]">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                deleteMessage(
                                                  activeThread.id,
                                                  msg.id
                                                )
                                                setConfirmDeleteMsgId(null)
                                                toast.success("Message deleted")
                                              }}
                                              className="font-semibold text-destructive hover:underline"
                                            >
                                              Delete
                                            </button>
                                            <span>/</span>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                setConfirmDeleteMsgId(null)
                                              }
                                              className="hover:text-foreground"
                                            >
                                              Cancel
                                            </button>
                                          </span>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setConfirmDeleteMsgId(msg.id)
                                            }
                                            title="Delete"
                                            aria-label="Delete message"
                                            className="rounded p-1 hover:bg-muted hover:text-destructive"
                                          >
                                            <Trash2 className="size-3" />
                                          </button>
                                        )}
                                      </>
                                    ) : null}
                                  </div>
                                </div>

                                {/* Quoted reply preview */}
                                {msg.replyToAuthor ? (
                                  <div
                                    className={cn(
                                      "flex max-w-full items-center gap-1.5 rounded-lg border border-border/70 bg-muted/40 px-2.5 py-1 text-[11px] text-muted-foreground",
                                      isSelf && "flex-row-reverse"
                                    )}
                                  >
                                    <CornerDownRight className="size-3 shrink-0 text-primary" />
                                    <span className="shrink-0 font-medium text-foreground">
                                      {msg.replyToAuthor}:
                                    </span>
                                    <span className="truncate">
                                      {msg.replyToPreview}
                                    </span>
                                  </div>
                                ) : null}

                                {/* Message bubble */}
                                <div
                                  className={cn(
                                    "inline-block rounded-2xl px-3.5 py-2 text-left text-sm leading-relaxed",
                                    isSelf
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-muted text-foreground"
                                  )}
                                >
                                  {msg.richContent ? (
                                    <RichTextEditor
                                      value={msg.richContent}
                                      readOnly
                                      className="border-0 bg-transparent shadow-none"
                                      editorClassName={cn(
                                        "min-h-0 max-h-none overflow-visible p-0 text-sm leading-relaxed",
                                        isSelf
                                          ? "text-primary-foreground prose-invert"
                                          : "text-foreground"
                                      )}
                                    />
                                  ) : (
                                    <span className="whitespace-pre-wrap">
                                      {renderMessageWithMentions(msg.content)}
                                    </span>
                                  )}
                                </div>

                                {/* Attachments */}
                                {msgAttachments.length > 0 ? (
                                  <div className="flex flex-wrap gap-1.5">
                                    {msgAttachments.map((att) => (
                                      <span
                                        key={att.id}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground shadow-2xs"
                                      >
                                        <Paperclip className="size-3 text-primary" />
                                        <span className="max-w-[180px] truncate font-medium">
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

                                {/* Reaction pills */}
                                {reactionEntries.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {reactionEntries.map(([emoji, userIds]) => {
                                      const reactedByMe =
                                        userIds.includes(CURRENT_USER_ID)
                                      return (
                                        <button
                                          key={emoji}
                                          type="button"
                                          onClick={() =>
                                            toggleMessageReaction(
                                              activeThread.id,
                                              msg.id,
                                              emoji,
                                              CURRENT_USER_ID
                                            )
                                          }
                                          className={cn(
                                            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] transition-colors",
                                            reactedByMe
                                              ? "border-primary/40 bg-primary/10 text-primary"
                                              : "border-border bg-background text-muted-foreground hover:bg-muted"
                                          )}
                                        >
                                          <span>{emoji}</span>
                                          <span className="font-mono text-[10px]">
                                            {userIds.length}
                                          </span>
                                        </button>
                                      )
                                    })}
                                  </div>
                                ) : null}

                                {/* Read Receipts */}
                                {isSelf && readers.length > 0 ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
                                        <CheckCheck className="size-3.5 text-primary" />
                                        <span>Read by {readers.length}</span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="left">
                                      Read by:{" "}
                                      {readers.map((r) => r.name).join(", ")}
                                    </TooltipContent>
                                  </Tooltip>
                                ) : null}
                              </div>
                            </div>
                          )
                        })
                      )}
                      <div ref={feedEndRef} />
                    </div>
                  </div>

                  {/* Message Composer (Rich Text) */}
                  <form
                    onSubmit={handleSendMessage}
                    className="relative shrink-0 border-t border-border bg-card p-3"
                  >
                    {/* Replying to banner */}
                    {replyingTo ? (
                      <div className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-primary/25 bg-primary/5 px-2.5 py-1.5 text-xs">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <CornerDownRight className="size-3.5 shrink-0 text-primary" />
                          <span className="shrink-0 font-semibold">
                            Replying to {replyingTo.author}
                          </span>
                          <span className="truncate text-muted-foreground">
                            “{replyingTo.preview}”
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setReplyingTo(null)}
                          aria-label="Cancel reply"
                          className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ) : null}

                    {/* Pending attachments */}
                    {pendingAttachments.length > 0 ? (
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        {pendingAttachments.map((att) => (
                          <span
                            key={att.id}
                            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/60 px-2 py-1 text-xs"
                          >
                            <Paperclip className="size-3 text-primary" />
                            <span className="max-w-[160px] truncate font-medium">
                              {att.name}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setPendingAttachments((prev) =>
                                  prev.filter((a) => a.id !== att.id)
                                )
                              }
                              aria-label={`Remove ${att.name}`}
                              className="text-muted-foreground hover:text-destructive"
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
                      onChange={(out) =>
                        setDraftDoc(out as Record<string, unknown>)
                      }
                      onSubmit={() => handleSendMessage()}
                      mentionItems={users.map((u) => ({
                        id: u.id,
                        name: u.name,
                        avatarInitials: u.avatarInitials,
                        avatarColor: u.avatarColor,
                      }))}
                      placeholder={`Message ${activeThread.projectName}… (Ctrl+Enter to send)`}
                      ariaLabel="Message text"
                      editorClassName="min-h-[68px] max-h-[160px] text-sm"
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
                              {mentionCandidates.length === 0 ? (
                                <p className="py-2 text-center text-xs text-muted-foreground">
                                  No match
                                </p>
                              ) : (
                                mentionCandidates.map((u) => (
                                  <button
                                    key={u.id}
                                    type="button"
                                    onClick={() => insertMention(u.name)}
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
                          title="Attach deliverable files"
                        >
                          <Paperclip className="size-3.5" />
                          Attach
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          className="sr-only"
                          onChange={handleAttachFiles}
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="hidden text-[11px] text-muted-foreground sm:inline">
                          Ctrl+Enter to send
                        </span>
                        <Button
                          type="submit"
                          size="xs"
                          disabled={
                            !docToPlainText(draftDoc).trim() &&
                            pendingAttachments.length === 0
                          }
                          className="gap-1.5 px-3"
                        >
                          <Send className="size-3" />
                          Send
                        </Button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Edit Message Modal */}
      <Dialog
        open={Boolean(editingMsg)}
        onOpenChange={(open) => !open && setEditingMsg(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Message</DialogTitle>
            <DialogDescription>
              Update your message content in {activeThread?.projectName}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <RichTextEditor
              value={editDoc}
              format="json"
              variant="compact"
              onChange={(out) => setEditDoc(out as Record<string, unknown>)}
              onSubmit={() => handleSaveEdit({ preventDefault: () => {} } as React.FormEvent)}
              placeholder="Update message..."
              ariaLabel="Edit message"
              editorClassName="min-h-[100px] max-h-[220px] text-sm"
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingMsg(null)}
              >
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Thread Dialog */}
      <ConfirmDeleteDialog
        open={Boolean(deleteThreadTarget)}
        onOpenChange={(open: boolean) => !open && setDeleteThreadTarget(null)}
        title={`Delete Channel "${deleteThreadTarget?.projectName}"`}
        description={`Are you sure you want to delete the chat thread for ${deleteThreadTarget?.projectName}? This removes all messages in the channel.`}
        onConfirm={handleConfirmDeleteThread}
      />
    </div>
  )
}
