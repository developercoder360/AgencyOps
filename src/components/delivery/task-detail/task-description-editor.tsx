"use client"

import * as React from "react"
import {
  Bold,
  ChevronDown,
  ChevronRight,
  Code,
  Eye,
  Italic,
  Link2,
  List,
  ListOrdered,
  Pencil,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "cn"

interface TaskDescriptionEditorProps {
  value: string
  canEdit: boolean
  onSave: (nextValue: string) => void
}

/**
 * Renders lightweight inline markdown (bold, italic, inline code, links)
 * safely into React elements without dangerouslySetInnerHTML.
 */
function renderInlineMarkdown(line: string, keyPrefix: string): React.ReactNode[] {
  const tokenRegex =
    /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g
  const parts = line.split(tokenRegex)
  return parts.map((part, idx) => {
    const key = `${keyPrefix}-${idx}`
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={key} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return (
        <em key={key} className="italic">
          {part.slice(1, -1)}
        </em>
      )
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code
          key={key}
          className="rounded bg-muted px-1 py-0.5 font-mono text-[12px] text-foreground"
        >
          {part.slice(1, -1)}
        </code>
      )
    }
    const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part)
    if (linkMatch) {
      const [, label, rawHref] = linkMatch
      const safeHref =
        rawHref.startsWith("http://") ||
        rawHref.startsWith("https://") ||
        rawHref.startsWith("/")
          ? rawHref
          : "#"
      return (
        <a
          key={key}
          href={safeHref}
          target={safeHref.startsWith("http") ? "_blank" : undefined}
          rel={safeHref.startsWith("http") ? "noopener noreferrer" : undefined}
          className="font-medium text-primary underline underline-offset-2 hover:opacity-80"
        >
          {label}
        </a>
      )
    }
    return <React.Fragment key={key}>{part}</React.Fragment>
  })
}

function FormattedPreview({ text }: { text: string }) {
  const lines = text.split("\n")
  const blocks: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""))
        i++
      }
      blocks.push(
        <ul key={`ul-${i}`} className="list-disc space-y-1 pl-5">
          {items.map((item, idx) => (
            <li key={idx}>{renderInlineMarkdown(item, `uli-${i}-${idx}`)}</li>
          ))}
        </ul>
      )
      continue
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""))
        i++
      }
      blocks.push(
        <ol key={`ol-${i}`} className="list-decimal space-y-1 pl-5">
          {items.map((item, idx) => (
            <li key={idx}>{renderInlineMarkdown(item, `oli-${i}-${idx}`)}</li>
          ))}
        </ol>
      )
      continue
    }
    if (line.trim() === "") {
      i++
      continue
    }
    blocks.push(
      <p key={`p-${i}`} className="leading-relaxed">
        {renderInlineMarkdown(line, `pi-${i}`)}
      </p>
    )
    i++
  }

  return <div className="space-y-2 text-sm text-foreground/90">{blocks}</div>
}

export function TaskDescriptionEditor({
  value,
  canEdit,
  onSave,
}: TaskDescriptionEditorProps) {
  const [editing, setEditing] = React.useState(false)
  const [collapsed, setCollapsed] = React.useState(false)
  const [previewing, setPreviewing] = React.useState(false)
  const [draft, setDraft] = React.useState(value)
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null)

  function startEdit() {
    if (!canEdit) return
    setDraft(value)
    setPreviewing(false)
    setEditing(true)
    requestAnimationFrame(() => {
      textareaRef.current?.focus()
    })
  }

  function handleCancel() {
    setDraft(value)
    setEditing(false)
    setPreviewing(false)
  }

  function handleSave() {
    const trimmed = draft.trim()
    if (trimmed !== value.trim()) {
      onSave(trimmed)
    }
    setEditing(false)
    setPreviewing(false)
  }

  function applyWrap(prefix: string, suffix: string, placeholder: string) {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = draft.slice(start, end) || placeholder
    const next =
      draft.slice(0, start) + prefix + selected + suffix + draft.slice(end)
    setDraft(next)
    setPreviewing(false)
    requestAnimationFrame(() => {
      el.focus()
      const cursorStart = start + prefix.length
      el.setSelectionRange(cursorStart, cursorStart + selected.length)
    })
  }

  function applyLinePrefix(prefix: string) {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = draft.slice(start, end) || "List item"
    const prefixed = selected
      .split("\n")
      .map((line, i) =>
        prefix === "1. " ? `${i + 1}. ${line}` : `${prefix}${line}`
      )
      .join("\n")
    const needsLeadingNewline = start > 0 && draft[start - 1] !== "\n"
    const insertion = (needsLeadingNewline ? "\n" : "") + prefixed
    const next = draft.slice(0, start) + insertion + draft.slice(end)
    setDraft(next)
    setPreviewing(false)
    requestAnimationFrame(() => {
      el.focus()
      const pos = start + insertion.length
      el.setSelectionRange(pos, pos)
    })
  }

  if (!editing) {
    return (
      <section aria-label="Task description" className="space-y-2.5">
        <div className="flex items-center justify-between border-b border-border/60 pb-2">
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="flex items-center gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
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
        {!collapsed && (
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
              className={cn(
                "min-h-[56px] cursor-text rounded-lg border border-transparent p-2.5 transition-colors hover:border-border hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            >
              {value.trim() ? (
                <FormattedPreview text={value} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Add a description…
                </p>
              )}
            </div>
          ) : (
            <div className="min-h-[48px] rounded-lg border border-transparent p-2.5">
              {value.trim() ? (
                <FormattedPreview text={value} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  No description provided.
                </p>
              )}
            </div>
          )
        )}
      </section>
    )
  }

  return (
    <section aria-label="Edit task description" className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Description
        </h3>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={() => setPreviewing((v) => !v)}
          className="gap-1 text-xs"
        >
          <Eye className="size-3" />
          {previewing ? "Write" : "Preview"}
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-ring/60 bg-background shadow-2xs">
        {/* Compact Formatting Toolbar */}
        <div
          role="toolbar"
          aria-label="Description formatting"
          className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/40 px-2 py-1"
        >
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => applyWrap("**", "**", "bold text")}
            aria-label="Bold"
            title="Bold"
          >
            <Bold className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => applyWrap("*", "*", "italic text")}
            aria-label="Italic"
            title="Italic"
          >
            <Italic className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => applyLinePrefix("- ")}
            aria-label="Bullet list"
            title="Bullet list"
          >
            <List className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => applyLinePrefix("1. ")}
            aria-label="Numbered list"
            title="Numbered list"
          >
            <ListOrdered className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => applyWrap("[", "](https://)", "link label")}
            aria-label="Insert link"
            title="Insert link"
          >
            <Link2 className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => applyWrap("`", "`", "code")}
            aria-label="Inline code"
            title="Inline code"
          >
            <Code className="size-3.5" />
          </Button>
        </div>

        {previewing ? (
          <div className="min-h-[120px] p-3.5">
            {draft.trim() ? (
              <FormattedPreview text={draft} />
            ) : (
              <p className="text-sm text-muted-foreground">Nothing to preview.</p>
            )}
          </div>
        ) : (
          <Textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.stopPropagation()
                handleCancel()
              } else if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault()
                handleSave()
              }
            }}
            placeholder="Add a description…"
            rows={5}
            className="resize-y rounded-none border-0 bg-transparent text-sm shadow-none focus-visible:ring-0"
          />
        )}

        <div className="flex items-center justify-between gap-2 border-t border-border bg-muted/20 px-3 py-2">
          <span className="text-[11px] text-muted-foreground">
            Ctrl+Enter to save • Esc to cancel
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
