"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  ArrowLeft,
  CheckCheck,
  Edit2,
  MessageSquare,
  Search,
  Send,
  Trash2,
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
import { useStore } from "@/lib/store"
import type { ChatMessage, ChatThread } from "@/types"
import { cn } from "cn"

export default function ChatsPage() {
  const { setUnreadMessagesCount } = useAppState()
  const {
    chatThreads,
    users,
    sendMessage,
    editMessage,
    deleteChatThread,
  } = useStore()

  const [activeId, setActiveId] = React.useState<string>("")
  const [search, setSearch] = React.useState("")
  const [draft, setDraft] = React.useState("")
  const [mobileShowThread, setMobileShowThread] = React.useState(false)
  const [editingMsg, setEditingMsg] = React.useState<ChatMessage | null>(null)
  const [editContent, setEditContent] = React.useState("")

  const filteredThreads = React.useMemo(
    () =>
      chatThreads.filter(
        (t) =>
          t.projectName.toLowerCase().includes(search.toLowerCase()) ||
          t.brandName.toLowerCase().includes(search.toLowerCase())
      ),
    [chatThreads, search]
  )

  const activeThread = React.useMemo(
    () => chatThreads.find((t) => t.id === activeId) ?? chatThreads[0],
    [chatThreads, activeId]
  )

  function selectThread(threadId: string) {
    setActiveId(threadId)
    setMobileShowThread(true)
    const totalUnread = chatThreads
      .filter((t) => t.id !== threadId)
      .reduce((acc, t) => acc + t.unreadCount, 0)
    setUnreadMessagesCount(totalUnread)
  }

  function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.trim() || !activeThread) return

    sendMessage(activeThread.id, draft.trim(), "usr-admin")
    setDraft("")
  }

  function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingMsg || !editContent.trim() || !activeThread) return

    editMessage(activeThread.id, editingMsg.id, editContent.trim())
    setEditingMsg(null)
    toast.success("Message updated")
  }

  function handleDeleteThread(thread: ChatThread) {
    deleteChatThread(thread.id)
    toast.success(`Removed chat thread for ${thread.projectName}`)
    if (activeId === thread.id) {
      setActiveId(chatThreads.find((t) => t.id !== thread.id)?.id ?? "")
    }
  }

  const activeParticipants = React.useMemo(
    () =>
      users.filter((u) =>
        activeThread?.participantIds.includes(u.id)
      ),
    [users, activeThread]
  )

  return (
    <div className="space-y-4">
      <PageHeader
        title="Project Chats"
        description="Real-time internal project channels with read receipts and deliverable attachments."
        badge={<Badge variant="secondary">{chatThreads.length} channels</Badge>}
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
            Create a delivery project in{" "}
            <Link href="/projects" className="text-primary underline">
              Projects
            </Link>{" "}
            to automatically initiate a dedicated team messaging channel.
          </p>
        </div>
      ) : (
        <div className="grid min-h-[480px] grid-cols-1 overflow-hidden rounded-xl border border-border bg-card lg:h-[calc(100vh-220px)] lg:grid-cols-12">
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
                  <div className="flex items-center gap-2">
                    <AvatarGroup people={activeParticipants} max={4} />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleDeleteThread(activeThread)}
                      title="Delete thread"
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 min-h-0 p-4">
                  <div className="space-y-4">
                    {activeThread.messages.length === 0 ? (
                      <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">
                        No messages in this project channel yet. Send the first update below.
                      </div>
                    ) : (
                      activeThread.messages.map((msg) => {
                        const isSelf = msg.senderId === "usr-admin"
                        const readers = users.filter((u) =>
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
                            <Avatar className="size-7 shrink-0">
                              <AvatarFallback
                                className={cn(
                                  "text-[10px] font-bold text-white",
                                  isSelf ? "bg-primary" : "bg-muted-foreground"
                                )}
                              >
                                {msg.senderInitials}
                              </AvatarFallback>
                            </Avatar>
                            <div
                              className={cn(
                                "group max-w-[75%] space-y-1",
                                isSelf && "items-end text-right"
                              )}
                            >
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="font-medium text-foreground">
                                  {msg.senderName}
                                </span>
                                <span>{msg.timestamp}</span>
                                {msg.edited ? (
                                  <span className="italic">(edited)</span>
                                ) : null}
                                {isSelf ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingMsg(msg)
                                      setEditContent(msg.content)
                                    }}
                                    className="opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground"
                                    aria-label="Edit message"
                                  >
                                    <Edit2 className="size-3" />
                                  </button>
                                ) : null}
                              </div>

                              <div
                                className={cn(
                                  "inline-block rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                                  isSelf
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-foreground"
                                )}
                              >
                                {msg.content}
                              </div>

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
                                    Read by: {readers.map((r) => r.name).join(", ")}
                                  </TooltipContent>
                                </Tooltip>
                              ) : null}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </ScrollArea>

                {/* Message input */}
                <form
                  onSubmit={handleSendMessage}
                  className="border-t border-border p-3"
                >
                  <div className="flex items-center gap-2">
                    <Input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder={`Message ${activeThread.projectName}...`}
                      aria-label="Message text"
                      className="h-9 flex-1"
                    />
                    <Button type="submit" size="sm" className="gap-1.5">
                      <Send className="size-3.5" />
                      Send
                    </Button>
                  </div>
                </form>
              </>
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
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={4}
              className="text-sm"
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
    </div>
  )
}
