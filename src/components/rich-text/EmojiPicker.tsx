"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface EmojiEntry {
  emoji: string
  shortcode: string
  keywords: string
}

export const EMOJI_LIST: EmojiEntry[] = [
  { emoji: "👍", shortcode: "thumbsup", keywords: "thumbs up ok approve yes" },
  { emoji: "✅", shortcode: "check", keywords: "check done approved complete" },
  { emoji: "🔥", shortcode: "fire", keywords: "fire hot lit" },
  { emoji: "❤️", shortcode: "heart", keywords: "heart love red" },
  { emoji: "😄", shortcode: "smile", keywords: "smile happy grin" },
  { emoji: "🎉", shortcode: "tada", keywords: "party celebrate congrats" },
  { emoji: "🚀", shortcode: "rocket", keywords: "rocket launch ship deploy" },
  { emoji: "💡", shortcode: "bulb", keywords: "idea light tip" },
  { emoji: "⚠️", shortcode: "warning", keywords: "warning alert caution" },
  { emoji: "❌", shortcode: "x", keywords: "cross error fail reject" },
  { emoji: "👀", shortcode: "eyes", keywords: "eyes review looking" },
  { emoji: "🙌", shortcode: "raised_hands", keywords: "hands celebrate thanks" },
  { emoji: "🤔", shortcode: "thinking", keywords: "thinking hmm question" },
  { emoji: "👏", shortcode: "clap", keywords: "clap bravo applause" },
  { emoji: "📌", shortcode: "pin", keywords: "pin important note" },
  { emoji: "📝", shortcode: "memo", keywords: "note write doc" },
  { emoji: "🐛", shortcode: "bug", keywords: "bug issue defect" },
  { emoji: "🔒", shortcode: "lock", keywords: "lock security private" },
  { emoji: "⏳", shortcode: "hourglass", keywords: "wait pending time" },
  { emoji: "🎯", shortcode: "dart", keywords: "target goal focus" },
  { emoji: "⚡", shortcode: "zap", keywords: "fast quick lightning" },
  { emoji: "✨", shortcode: "sparkles", keywords: "magic new clean polish" },
  { emoji: "📎", shortcode: "paperclip", keywords: "file attach" },
  { emoji: "💬", shortcode: "speech_balloon", keywords: "comment chat reply" },
]

interface EmojiPickerProps {
  onSelect: (emoji: string) => void
  trigger: React.ReactNode
}

export function EmojiPicker({ onSelect, trigger }: EmojiPickerProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return EMOJI_LIST
    return EMOJI_LIST.filter(
      (e) =>
        e.shortcode.includes(q) ||
        e.keywords.includes(q) ||
        e.emoji.includes(q)
    )
  }, [query])

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setQuery("")
      }}
    >
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="start" className="w-64 space-y-2 p-2.5">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search emoji (:smile)..."
          aria-label="Search emoji"
          className="h-7 text-xs"
        />
        {filtered.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            No emoji found
          </p>
        ) : (
          <div className="grid max-h-44 grid-cols-6 gap-1 overflow-y-auto">
            {filtered.map((item) => (
              <button
                key={item.shortcode}
                type="button"
                title={`:${item.shortcode}:`}
                onClick={() => {
                  onSelect(item.emoji)
                  setOpen(false)
                }}
                className="flex size-8 items-center justify-center rounded-md text-base hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {item.emoji}
              </button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
