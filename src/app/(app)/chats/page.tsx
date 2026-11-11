"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  ArrowLeft,
  CheckCheck,
  Edit2,
  Paperclip,
  Search,
  Send,
} from "lucide-react"
import { useAppState } from "@/components/providers/app-state-provider"
import { AvatarGroup, PageHeader } from "@/components/shared"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { MOCK_CHAT_THREADS } from "@/mocks/chats"
import { MOCK_USERS } from "@/mocks/users"
import type { ChatMessage, ChatThread } from "@/types"
import { cn } from "cn"

export default function ChatsPage() {
  const { setUnreadMessagesCount } = useAppState()
  const [threads, setThreads] = React.useState<ChatThread[]>(MOCK_CHAT_THREADS)
  const [activeId, setActiveId] = React.useState<string>(MOCK_CHAT_THREADS[0].id)
  const [search, setSearch] = React.useState("")
  const [draft, setDraft] = React.useState("")
  const [mobileShowThread, setMobileShowThread] = React.useState(false)
  const [editingMsg, setEditingMsg] = React.useState<ChatMessage | null>(null)
  const [editContent, setEditContent] = React.useState("")

  const filteredThreads = React.useMemo(
    () =>
      threads.filter(
        (t) =>
          t.projectName.toLowerCase().includes(search.toLowerCase()) ||
          t.brandName.toLowerCase().includes(search.toLowerCase())
      ),
    [threads, search]
  )

  const activeThread = React.useMemo(
    () => threads.find((t) => t.id === activeId) ?? threads[0],
    [threads, activeId]
  )

  function selectThread(threadId: string) {
    setActiveId(threadId)
    setMobileShowThread(true)
    setThreads((prev) => {
      const next = prev.map((t) =>
        t.id === threadId ? { ...t, unreadCount: 0 } : t
      )
      const totalUnread = next.reduce((acc, t) => acc + t.unreadCount, 0)
      setUnreadMessagesCount(totalUnread)
      return next
    })
  }

  function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.trim() || !activeThread) return
    const msg: ChatMessage = {
      id: `msg-new-${Date.now()}`,
      senderId: "usr-1",
      senderName: "Marcus Vance",
      senderInitials: "MV",
      content: draft.trim(),
      timestamp: "Just now",
      readByIds: ["usr-3", "usr-4"],
    }
    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThread.id
          ? {
              ...t,
              lastMessageAt: "Just now",
              lastMessagePreview: msg.content,
              messages: [...t.messages, msg],
            }
          : t
      )
    )
    setDraft("")
  }

  function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingMsg || !editContent.trim() || !activeThread) return
    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThread.id
          ? {
              ...t,
              messages: t.messages.map((m) =>
                m.id === editingMsg.id
                  ? { ...m, content: editContent.trim(), edited: true }
                  : m
              ),
            }
          : t
      )
    )
    setEditingMsg(null)
    toast.success("Message updated")
  }

  const activeParticipants = React.useMemo(
    () =>
      MOCK_USERS.filter((u) =>
        activeThread?.participantIds.includes(u.id)
      ),
    [activeThread]
  )

  return (
    <div className="space-y-4">
      <PageHeader
        title="Project Chats"
        description="Real-time internal project channels with read receipts and deliverable attachments."
      />

      <div className="grid min-h-[480px] grid-cols-1 overflow-hidden rounded-(--radius-surface) border border-border bg-card lg:h-[calc(100vh-220px)] lg:grid-cols-12">
        {/* Left Pane: Conversation List */}
        <div
          className={cn(
            "flex flex-col border-r border-border lg:col-span-4",
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

          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="divide-y divide-border">
              {filteredThreads.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No matching project threads found.
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
                      "flex w-full min-w-0 flex-col gap-1 p-3.5 text-left transition-colors duration-150 hover:bg-muted/50",
                      isSelected && "bg-(--chat-thread-active)"
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
                      <Badge variant="outline" className="text-[10px] font-normal">
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

        {/* Right Pane: Active Message Thread */}
        <div
          className={cn(
            "flex min-h-0 flex-col lg:col-span-8",
            mobileShowThread ? "flex" : "hidden lg:flex"
          )}
        >
          {activeThread ? (
            <>
              {/* Thread header */}
              <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                <div className="flex items-center gap-2.5 min-w-0">
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
                    <h2 className="truncate text-sm font-semibold text-foreground">
                      {activeThread.projectName}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {activeThread.brandName} • {activeParticipants.length}{" "}
                      participants
                    </p>
                  </div>
                </div>
                <AvatarGroup people={activeParticipants} max={4} />
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 min-h-0 p-4">
                <div className="space-y-4">
                  {activeThread.messages.map((msg) => {
                    const isSelf = msg.senderId === "usr-1"
                    const readers = MOCK_USERS.filter((u) =>
                      msg.readByIds.includes(u.id)
                    )
                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex items-start gap-2.5",
                          isSelf && "flex-row-reverse"
                        )}
                      >
                        <Avatar className="size-8 shrink-0">
                          <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                            {msg.senderInitials}
                          </AvatarFallback>
                        </Avatar>

                        <div
                          className={cn(
                            "group max-w-[78%] space-y-1",
                            isSelf && "items-end text-right"
                          )}
                        >
                          <div
                            className={cn(
                              "flex items-center gap-2 text-xs",
                              isSelf && "flex-row-reverse"
                            )}
                          >
                            <span className="font-medium text-foreground">
                              {msg.senderName}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {msg.timestamp}
                            </span>
                            {msg.edited ? (
                              <span className="text-[10px] italic text-muted-foreground">
                                (edited)
                              </span>
                            ) : null}
                          </div>

                          <div className="relative flex items-center gap-1.5">
                            <div
                              className={cn(
                                "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                                isSelf
                                  ? "bg-(--chat-bubble-out-bg) text-(--chat-bubble-out-fg)"
                                  : "border border-(--chat-bubble-in-border) bg-(--chat-bubble-in-bg) text-foreground"
                              )}
                            >
                              <p>{msg.content}</p>
                              {msg.attachment ? (
                                <div
                                  className={cn(
                                    "mt-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs",
                                    isSelf
                                      ? "bg-(--chat-bubble-out-chip-bg) text-(--chat-bubble-out-chip-fg)"
                                      : "border border-border bg-background text-foreground"
                                  )}
                                >
                                  <Paperclip className="size-3" />
                                  {msg.attachment}
                                </div>
                              ) : null}
                            </div>

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => {
                                setEditingMsg(msg)
                                setEditContent(msg.content)
                              }}
                              aria-label="Edit message"
                              className="opacity-60 transition-opacity hover:opacity-100"
                            >
                              <Edit2 className="size-3" />
                            </Button>
                          </div>

                          {/* Read receipt */}
                          <div
                            className={cn(
                              "flex items-center gap-1 text-[11px] text-muted-foreground",
                              isSelf && "justify-end"
                            )}
                          >
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex cursor-default items-center gap-1">
                                  <CheckCheck className="size-3.5 text-primary" />
                                  Read by {readers.length}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="text-xs">
                                {readers.map((r) => r.name).join(", ") ||
                                  "Delivered"}
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>

              {/* Message Composer */}
              <form
                onSubmit={handleSendMessage}
                className="flex items-center gap-2 border-t border-border p-3"
              >
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={`Message ${activeThread.projectName.split("—")[0].trim()}...`}
                  aria-label="Message input"
                  className="flex-1"
                />
                <Button type="submit" size="sm" className="gap-1.5">
                  <Send className="size-4" />
                  Send
                </Button>
              </form>
            </>
          ) : null}
        </div>
      </div>

      {/* Edit Message Dialog */}
      <Dialog
        open={Boolean(editingMsg)}
        onOpenChange={(open) => !open && setEditingMsg(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Message</DialogTitle>
            <DialogDescription>
              Update the message content in this project thread.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <Textarea
              rows={3}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingMsg(null)}
              >
                Cancel
              </Button>
              <Button type="submit">Save Message</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
