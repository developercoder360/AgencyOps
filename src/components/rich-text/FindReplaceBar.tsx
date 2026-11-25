"use client"

import * as React from "react"
import type { Editor } from "@tiptap/react"
import { ArrowDown, ArrowUp, CaseSensitive, Replace, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { FindReplaceStorage } from "./FindReplace"

interface FindReplaceBarProps {
  editor: Editor
  onClose: () => void
}

export function FindReplaceBar({ editor, onClose }: FindReplaceBarProps) {
  const [query, setQuery] = React.useState("")
  const [replacement, setReplacement] = React.useState("")
  const [caseSensitive, setCaseSensitive] = React.useState(false)
  const [tick, setTick] = React.useState(0)

  const inputRef = React.useRef<HTMLInputElement | null>(null)

  React.useEffect(() => {
    inputRef.current?.focus()
    return () => {
      editor.commands.setSearchQuery("", false)
    }
  }, [editor])

  function syncQuery(nextQuery: string, nextCase: boolean) {
    setQuery(nextQuery)
    setCaseSensitive(nextCase)
    editor.commands.setSearchQuery(nextQuery, nextCase)
    setTick((t) => t + 1)
  }

  // Read storage after state updates
  void tick
  const storage = (
    editor.storage as unknown as { findReplace?: FindReplaceStorage }
  )?.findReplace

  const matches = storage?.matches ?? []
  const activeIndex = storage?.activeIndex ?? 0

  return (
    <div
      role="region"
      aria-label="Find and replace"
      className="flex flex-wrap items-center gap-1.5 border-b border-border bg-muted/35 px-2.5 py-1.5 text-xs"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation()
          onClose()
        }
      }}
    >
      <div className="flex items-center gap-1">
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => syncQuery(e.target.value, caseSensitive)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              if (e.shiftKey) {
                editor.commands.findPrevMatch()
              } else {
                editor.commands.findNextMatch()
              }
              setTick((t) => t + 1)
            }
          }}
          placeholder="Find..."
          aria-label="Find text"
          className="h-7 w-36 text-xs"
        />
        <Button
          type="button"
          variant={caseSensitive ? "secondary" : "ghost"}
          size="icon-xs"
          onClick={() => syncQuery(query, !caseSensitive)}
          aria-label="Case sensitive"
          aria-pressed={caseSensitive}
          title="Case sensitive"
        >
          <CaseSensitive className="size-3.5" />
        </Button>
        <span className="min-w-12 text-center font-mono text-[10px] text-muted-foreground">
          {matches.length === 0 ? "0/0" : `${activeIndex + 1}/${matches.length}`}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          disabled={matches.length === 0}
          onClick={() => {
            editor.commands.findPrevMatch()
            setTick((t) => t + 1)
          }}
          aria-label="Previous match"
        >
          <ArrowUp className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          disabled={matches.length === 0}
          onClick={() => {
            editor.commands.findNextMatch()
            setTick((t) => t + 1)
          }}
          aria-label="Next match"
        >
          <ArrowDown className="size-3.5" />
        </Button>
      </div>

      <div className="flex items-center gap-1">
        <Input
          value={replacement}
          onChange={(e) => setReplacement(e.target.value)}
          placeholder="Replace with..."
          aria-label="Replace text"
          className="h-7 w-32 text-xs"
        />
        <Button
          type="button"
          variant="outline"
          size="xs"
          disabled={matches.length === 0}
          onClick={() => {
            editor.commands.replaceCurrentMatch(replacement)
            setTick((t) => t + 1)
          }}
          className="h-7 gap-1 px-2 text-[11px]"
        >
          <Replace className="size-3" />
          Replace
        </Button>
        <Button
          type="button"
          variant="outline"
          size="xs"
          disabled={matches.length === 0}
          onClick={() => {
            editor.commands.replaceAllMatches(replacement)
            setTick((t) => t + 1)
          }}
          className="h-7 px-2 text-[11px]"
        >
          All
        </Button>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={onClose}
        aria-label="Close find and replace"
        className="ml-auto"
      >
        <X className="size-3.5" />
      </Button>
    </div>
  )
}
