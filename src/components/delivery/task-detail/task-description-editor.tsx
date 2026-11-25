"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { ChevronDown, ChevronRight, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  RichTextEditorSkeleton,
  RichTextViewer,
  isEmpty,
} from "@/components/rich-text"

const RichTextEditor = dynamic(
  () => import("@/components/rich-text").then((m) => m.RichTextEditor),
  { ssr: false, loading: () => <RichTextEditorSkeleton /> }
)

interface TaskDescriptionEditorProps {
  value: string
  canEdit: boolean
  onSave: (nextValue: string) => void
}

export function TaskDescriptionEditor({
  value,
  canEdit,
  onSave,
}: TaskDescriptionEditorProps) {
  const [editing, setEditing] = React.useState(false)
  const [collapsed, setCollapsed] = React.useState(false)
  const [draft, setDraft] = React.useState(value)

  function startEdit() {
    if (!canEdit) return
    setDraft(value)
    setCollapsed(false)
    setEditing(true)
  }

  function handleSave() {
    onSave(draft)
    setEditing(false)
  }

  function handleCancel() {
    setDraft(value)
    setEditing(false)
  }

  if (!editing) {
    return (
      <section aria-label="Task description" className="space-y-2.5">
        <div className="flex items-center justify-between border-b border-border/60 pb-2">
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="flex items-center gap-2 rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {collapsed ? (
              <ChevronRight className="size-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-3.5 text-muted-foreground" />
            )}
            <h3 className="text-[13px] font-semibold text-foreground">
              Description
            </h3>
          </button>
          {canEdit && !collapsed ? (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={startEdit}
              className="gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <Pencil className="size-3" />
              Edit
            </Button>
          ) : null}
        </div>

        {!collapsed ? (
          canEdit ? (
            <div
              role="button"
              tabIndex={0}
              onClick={startEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  startEdit()
                }
              }}
              className="min-h-[56px] cursor-text rounded-lg border border-transparent p-2.5 transition-colors hover:border-border hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {isEmpty(value) ? (
                <p className="text-sm text-muted-foreground">
                  Add a description…
                </p>
              ) : (
                <RichTextViewer value={value} />
              )}
            </div>
          ) : (
            <div className="min-h-[48px] rounded-lg border border-transparent p-2.5">
              {isEmpty(value) ? (
                <p className="text-sm italic text-muted-foreground">
                  No description provided.
                </p>
              ) : (
                <RichTextViewer value={value} />
              )}
            </div>
          )
        ) : null}
      </section>
    )
  }

  return (
    <section aria-label="Edit task description" className="space-y-2.5">
      <div className="flex items-center justify-between border-b border-border/60 pb-2">
        <h3 className="text-[13px] font-semibold text-foreground">
          Description
        </h3>
      </div>

      <div className="space-y-2">
        <RichTextEditor
          value={draft}
          onChange={(output) => setDraft(String(output))}
          format="html"
          variant="full"
          minHeight="140px"
          maxHeight="340px"
          autofocus
          placeholder="Add task details, deliverables, or acceptance criteria…"
          onSubmit={handleSave}
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-muted-foreground">
            Ctrl+Enter to save
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button type="button" size="xs" onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
