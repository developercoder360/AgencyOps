"use client"

import * as React from "react"
import { CheckSquare, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import type { ChecklistItem } from "@/types"
import { cn } from "cn"

interface TaskChecklistProps {
  items: ChecklistItem[]
  canEdit: boolean
  onAdd: (title: string) => void
  onToggle: (itemId: string, completed: boolean) => void
  onDelete: (itemId: string) => void
}

export function TaskChecklist({
  items,
  canEdit,
  onAdd,
  onToggle,
  onDelete,
}: TaskChecklistProps) {
  const [newTitle, setNewTitle] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement | null>(null)

  const doneCount = items.filter((i) => i.completed).length
  const pct = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0

  function handleAdd(e?: React.FormEvent) {
    e?.preventDefault()
    const trimmed = newTitle.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setNewTitle("")
  }

  return (
    <section aria-label="Checklist" className="space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Checklist
          </h3>
          <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[11px] font-medium tabular-nums text-muted-foreground">
            {doneCount}/{items.length}
          </span>
        </div>
        {items.length > 0 ? (
          <div className="flex w-28 items-center gap-2">
            <Progress value={pct} className="h-1.5" />
            <span className="text-[11px] tabular-nums text-muted-foreground">
              {pct}%
            </span>
          </div>
        ) : null}
      </div>

      <div className="rounded-lg border border-border bg-card">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1.5 px-4 py-5 text-center">
            <CheckSquare className="size-5 text-muted-foreground/60" />
            <p className="text-xs text-muted-foreground">
              No checklist items yet.
            </p>
            {canEdit ? (
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => inputRef.current?.focus()}
                className="mt-1 gap-1"
              >
                <Plus className="size-3" />
                Add checklist item
              </Button>
            ) : null}
          </div>
        ) : (
          <ul className="divide-y divide-border/70">
            {items.map((item) => (
              <li
                key={item.id}
                className="group flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-muted/30"
              >
                <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5">
                  <Checkbox
                    checked={item.completed}
                    disabled={!canEdit}
                    onCheckedChange={(checked) =>
                      onToggle(item.id, Boolean(checked))
                    }
                    aria-label={`Mark "${item.title}" ${
                      item.completed ? "incomplete" : "complete"
                    }`}
                  />
                  <span
                    className={cn(
                      "truncate text-xs sm:text-sm",
                      item.completed && "text-muted-foreground line-through"
                    )}
                  >
                    {item.title}
                  </span>
                </label>
                {canEdit ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => onDelete(item.id)}
                    aria-label={`Delete checklist item ${item.title}`}
                    className="opacity-60 transition-opacity hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {canEdit ? (
          <form
            onSubmit={handleAdd}
            className="flex items-center gap-2 border-t border-border bg-muted/20 px-3 py-2"
          >
            <Plus className="size-3.5 shrink-0 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.stopPropagation()
                  setNewTitle("")
                  inputRef.current?.blur()
                }
              }}
              placeholder="Add checklist item… (Enter to add)"
              aria-label="Add checklist item"
              className="h-7 border-0 bg-transparent px-1 text-xs shadow-none focus-visible:ring-0"
            />
            {newTitle.trim() ? (
              <Button type="submit" size="xs" variant="secondary">
                Add
              </Button>
            ) : null}
          </form>
        ) : null}
      </div>
    </section>
  )
}
