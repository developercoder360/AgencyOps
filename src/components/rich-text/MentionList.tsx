"use client"

import * as React from "react"
import type { SuggestionKeyDownProps } from "@tiptap/suggestion"
import type { HashtagTaskItem, MentionUserItem } from "@/types/rich-text"
import type { EmojiEntry } from "./EmojiPicker"
import { cn } from "cn"

export interface SuggestionListRef {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean
}

interface MentionListProps {
  items: MentionUserItem[]
  command: (item: { id: string; label: string }) => void
}

export const MentionList = React.forwardRef<SuggestionListRef, MentionListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = React.useState(0)

    const safeIndex = items.length > 0 ? Math.min(selectedIndex, items.length - 1) : 0

    function selectItem(index: number) {
      const item = items[index]
      if (item) {
        command({ id: item.id, label: item.name })
      }
    }

    React.useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (event.key === "ArrowUp") {
          setSelectedIndex((prev) => (prev + items.length - 1) % Math.max(1, items.length))
          return true
        }
        if (event.key === "ArrowDown") {
          setSelectedIndex((prev) => (prev + 1) % Math.max(1, items.length))
          return true
        }
        if (event.key === "Enter") {
          selectItem(safeIndex)
          return true
        }
        return false
      },
    }))

    if (items.length === 0) {
      return (
        <div className="w-56 rounded-lg border border-border bg-popover p-2 text-xs text-muted-foreground shadow-md">
          No user matched
        </div>
      )
    }

    return (
      <div
        role="listbox"
        aria-label="Mention user"
        className="w-60 overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-lg"
      >
        <div className="max-h-52 space-y-0.5 overflow-y-auto">
          {items.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              role="option"
              aria-selected={idx === safeIndex}
              onClick={() => selectItem(idx)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                idx === safeIndex
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-muted"
              )}
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white",
                  item.avatarColor ?? "bg-primary"
                )}
              >
                {item.avatarInitials ?? item.name.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{item.name}</div>
                {item.subtitle ? (
                  <div className="truncate text-[10px] text-muted-foreground">
                    {item.subtitle}
                  </div>
                ) : null}
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }
)
MentionList.displayName = "MentionList"

interface TaskRefListProps {
  items: HashtagTaskItem[]
  command: (item: HashtagTaskItem) => void
}

export const TaskRefList = React.forwardRef<SuggestionListRef, TaskRefListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = React.useState(0)
    const safeIndex = items.length > 0 ? Math.min(selectedIndex, items.length - 1) : 0

    React.useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (event.key === "ArrowUp") {
          setSelectedIndex((prev) => (prev + items.length - 1) % Math.max(1, items.length))
          return true
        }
        if (event.key === "ArrowDown") {
          setSelectedIndex((prev) => (prev + 1) % Math.max(1, items.length))
          return true
        }
        if (event.key === "Enter") {
          const item = items[safeIndex]
          if (item) command(item)
          return true
        }
        return false
      },
    }))

    if (items.length === 0) {
      return (
        <div className="w-60 rounded-lg border border-border bg-popover p-2 text-xs text-muted-foreground shadow-md">
          No task matched
        </div>
      )
    }

    return (
      <div
        role="listbox"
        aria-label="Reference task"
        className="w-72 overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-lg"
      >
        <div className="max-h-52 space-y-0.5 overflow-y-auto">
          {items.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              role="option"
              aria-selected={idx === safeIndex}
              onClick={() => command(item)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                idx === safeIndex
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-muted"
              )}
            >
              <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] font-semibold">
                #{item.code}
              </span>
              <span className="truncate">{item.title}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }
)
TaskRefList.displayName = "TaskRefList"

interface EmojiSuggestionListProps {
  items: EmojiEntry[]
  command: (item: EmojiEntry) => void
}

export const EmojiSuggestionList = React.forwardRef<
  SuggestionListRef,
  EmojiSuggestionListProps
>(({ items, command }, ref) => {
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const safeIndex = items.length > 0 ? Math.min(selectedIndex, items.length - 1) : 0

  React.useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === "ArrowUp") {
        setSelectedIndex((prev) => (prev + items.length - 1) % Math.max(1, items.length))
        return true
      }
      if (event.key === "ArrowDown") {
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, items.length))
        return true
      }
      if (event.key === "Enter") {
        const item = items[safeIndex]
        if (item) command(item)
        return true
      }
      return false
    },
  }))

  if (items.length === 0) return null

  return (
    <div
      role="listbox"
      aria-label="Emoji shortcode"
      className="w-56 overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-lg"
    >
      <div className="max-h-48 space-y-0.5 overflow-y-auto">
        {items.map((item, idx) => (
          <button
            key={item.shortcode}
            type="button"
            role="option"
            aria-selected={idx === safeIndex}
            onClick={() => command(item)}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-xs transition-colors",
              idx === safeIndex
                ? "bg-accent text-accent-foreground"
                : "hover:bg-muted"
            )}
          >
            <span className="text-sm">{item.emoji}</span>
            <span className="font-mono text-[11px] text-muted-foreground">
              :{item.shortcode}:
            </span>
          </button>
        ))}
      </div>
    </div>
  )
})
EmojiSuggestionList.displayName = "EmojiSuggestionList"
