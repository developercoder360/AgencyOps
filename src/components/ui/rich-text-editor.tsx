"use client"

import * as React from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Unlink,
  Undo,
  Redo,
  Check,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export const MAX_DOC_SIZE_BYTES = 51200 // 50 KB

export const EMPTY_DOC: Record<string, unknown> = {
  type: "doc",
  content: [{ type: "paragraph" }],
}

/**
 * Validates protocol: only http, https, and mailto allowed.
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false
  const trimmed = url.trim()
  return /^https?:\/\/|^mailto:/i.test(trimmed)
}

/**
 * Converts ProseMirror / Tiptap doc JSON to a clean plain text preview.
 */
export function docToPlainText(doc: unknown): string {
  if (!doc) return ""
  if (typeof doc === "string") return doc.trim()
  if (typeof doc !== "object") return ""
  const d = doc as Record<string, unknown>

  if (d.type === "text" && typeof d.text === "string") {
    return d.text
  }

  if (Array.isArray(d.content)) {
    const pieces: string[] = []
    for (const child of d.content) {
      const text = docToPlainText(child)
      if (text) pieces.push(text)
    }

    if (d.type === "doc" || d.type === "bulletList" || d.type === "orderedList") {
      return pieces.join("\n")
    }
    if (d.type === "paragraph" || d.type === "heading" || d.type === "blockquote") {
      return pieces.join("")
    }
    return pieces.join(" ")
  }

  return ""
}

/**
 * Converts a plain-text multiline string into a valid Tiptap doc JSON.
 */
export function plainTextToDoc(text: string): Record<string, unknown> {
  if (!text || typeof text !== "string" || !text.trim()) {
    return { type: "doc", content: [{ type: "paragraph" }] }
  }

  const lines = text.split("\n")
  const content = lines.map((line) => {
    if (!line.trim()) {
      return { type: "paragraph" }
    }
    return {
      type: "paragraph",
      content: [{ type: "text", text: line }],
    }
  })

  return {
    type: "doc",
    content: content.length > 0 ? content : [{ type: "paragraph" }],
  }
}

/**
 * Sanitizes and validates a doc shape, stripping dangerous protocols (e.g. javascript:)
 * and rejecting documents that exceed the size limit (50 KB).
 */
export function sanitizeDoc(raw: unknown): Record<string, unknown> {
  if (!raw) return { ...EMPTY_DOC }

  // If passed a plain string, convert to doc
  if (typeof raw === "string") {
    if (raw.length > MAX_DOC_SIZE_BYTES) {
      return { ...EMPTY_DOC }
    }
    return plainTextToDoc(raw)
  }

  if (typeof raw !== "object" || Array.isArray(raw)) {
    return { ...EMPTY_DOC }
  }
  const rawObj = raw as Record<string, unknown>

  // Size limit check
  try {
    const serialized = JSON.stringify(rawObj)
    if (serialized.length > MAX_DOC_SIZE_BYTES) {
      return { ...EMPTY_DOC }
    }
  } catch {
    return { ...EMPTY_DOC }
  }

  if (rawObj.type !== "doc" || !Array.isArray(rawObj.content)) {
    return { ...EMPTY_DOC }
  }

  // Recursively sanitize nodes and marks
  function sanitizeNode(node: unknown): Record<string, unknown> | null {
    if (!node || typeof node !== "object") return null
    const n = node as Record<string, unknown>

    const sanitized: Record<string, unknown> = { type: String(n.type || "paragraph") }

    if (typeof n.text === "string") {
      sanitized.text = n.text
    }

    if (Array.isArray(n.marks)) {
      sanitized.marks = n.marks
        .map((m: unknown) => {
          if (!m || typeof m !== "object") return null
          const markObj = m as Record<string, unknown>
          const markType = String(markObj.type)
          if (markType === "link") {
            const attrs = markObj.attrs as Record<string, unknown> | undefined
            const href = attrs?.href
            if (typeof href !== "string" || !isValidUrl(href)) {
              return null // strip dangerous links
            }
            return {
              type: "link",
              attrs: {
                href: String(href).trim(),
                target: "_blank",
                rel: "noopener noreferrer",
              },
            }
          }
          if (["bold", "italic", "underline", "strike", "code"].includes(markType)) {
            return { type: markType }
          }
          return null
        })
        .filter(Boolean)
    }

    if (Array.isArray(n.content)) {
      sanitized.content = n.content.map(sanitizeNode).filter(Boolean)
    }

    return sanitized
  }

  const cleanContent = rawObj.content.map(sanitizeNode).filter(Boolean)
  return {
    type: "doc",
    content: cleanContent.length > 0 ? cleanContent : [{ type: "paragraph" }],
  }
}

export function isValidDoc(doc: unknown): boolean {
  if (!doc || typeof doc !== "object") return false
  const d = doc as Record<string, unknown>
  if (d.type !== "doc") return false
  if (!Array.isArray(d.content)) return false
  try {
    return JSON.stringify(d).length <= MAX_DOC_SIZE_BYTES
  } catch {
    return false
  }
}

export interface RichTextEditorProps {
  value?: Record<string, unknown> | string
  onChange?: (doc: Record<string, unknown>) => void
  readOnly?: boolean
  placeholder?: string
  minHeight?: string
  maxHeight?: string
  className?: string
  editorClassName?: string
  ariaLabel?: string
  onSubmit?: () => void
}

export function RichTextEditor({
  value,
  onChange,
  readOnly = false,
  placeholder = "Describe what needs to change...",
  className,
  editorClassName,
  ariaLabel = "Revision details",
  onSubmit,
}: RichTextEditorProps) {
  const [linkPopoverOpen, setLinkPopoverOpen] = React.useState(false)
  const [linkUrl, setLinkUrl] = React.useState("")

  const safeContent = React.useMemo(() => {
    return sanitizeDoc(value)
  }, [value])

  const editor = useEditor({
    immediatelyRender: false,
    editable: !readOnly,
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        dropcursor: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
        HTMLAttributes: {
          target: "_blank",
          rel: "noopener noreferrer",
          class: "text-primary underline font-medium hover:opacity-80 transition-opacity",
        },
        validate: (href) => isValidUrl(href),
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass:
          "is-editor-empty before:text-muted-foreground/50 before:content-[attr(data-placeholder)] before:pointer-events-none before:float-left before:h-0",
      }),
    ],
    content: safeContent,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[160px] max-h-[320px] overflow-y-auto px-3 py-2 text-xs leading-relaxed text-foreground",
          editorClassName
        ),
        "aria-label": ariaLabel,
      },
      handleKeyDown: (_view, event) => {
        if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
          if (onSubmit) {
            event.preventDefault()
            onSubmit()
            return true
          }
        }
        // Do not trap Tab - allows moving focus out of the editor to next form element
        if (event.key === "Tab") {
          return false
        }
        return false
      },
    },
    onUpdate: ({ editor: ed }) => {
      if (onChange) {
        onChange(ed.getJSON())
      }
    },
  })

  // Synchronize external value updates when safeContent changes significantly
  React.useEffect(() => {
    if (!editor || editor.isDestroyed) return
    const currentJson = JSON.stringify(editor.getJSON())
    const nextJson = JSON.stringify(safeContent)
    if (currentJson !== nextJson && !editor.isFocused) {
      editor.commands.setContent(safeContent, { emitUpdate: false })
    }
  }, [editor, safeContent])

  function handleSetLink() {
    if (!editor) return
    const url = linkUrl.trim()
    if (!url) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      setLinkPopoverOpen(false)
      return
    }

    const normalized =
      /^https?:\/\/|^mailto:/i.test(url) ? url : `https://${url}`

    if (isValidUrl(normalized)) {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: normalized })
        .run()
    }
    setLinkPopoverOpen(false)
    setLinkUrl("")
  }

  function handleRemoveLink() {
    if (!editor) return
    editor.chain().focus().extendMarkRange("link").unsetLink().run()
    setLinkPopoverOpen(false)
    setLinkUrl("")
  }

  if (readOnly) {
    return (
      <div
        className={cn(
          "rounded-md border border-border/40 bg-muted/20 px-3 py-2 text-xs leading-relaxed text-foreground overflow-y-auto max-h-[320px]",
          className
        )}
      >
        <EditorContent editor={editor} />
      </div>
    )
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-input bg-background transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent flex flex-col overflow-hidden",
        className
      )}
    >
      {/* Toolbar */}
      {editor && (
        <div
          role="toolbar"
          aria-label="Rich text editor toolbar"
          className="flex flex-wrap items-center gap-0.5 border-b border-border/70 bg-muted/30 px-2 py-1 text-muted-foreground select-none"
        >
          {/* Bold */}
          <Button
            type="button"
            variant="ghost"
            size="xs"
            aria-label="Bold"
            aria-pressed={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(
              "size-7 p-0",
              editor.isActive("bold") && "bg-muted text-foreground font-bold shadow-2xs"
            )}
          >
            <Bold className="size-3.5" />
          </Button>

          {/* Italic */}
          <Button
            type="button"
            variant="ghost"
            size="xs"
            aria-label="Italic"
            aria-pressed={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(
              "size-7 p-0",
              editor.isActive("italic") && "bg-muted text-foreground font-bold shadow-2xs"
            )}
          >
            <Italic className="size-3.5" />
          </Button>

          {/* Underline */}
          <Button
            type="button"
            variant="ghost"
            size="xs"
            aria-label="Underline"
            aria-pressed={editor.isActive("underline")}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={cn(
              "size-7 p-0",
              editor.isActive("underline") && "bg-muted text-foreground font-bold shadow-2xs"
            )}
          >
            <UnderlineIcon className="size-3.5" />
          </Button>

          {/* Strikethrough */}
          <Button
            type="button"
            variant="ghost"
            size="xs"
            aria-label="Strikethrough"
            aria-pressed={editor.isActive("strike")}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={cn(
              "size-7 p-0",
              editor.isActive("strike") && "bg-muted text-foreground font-bold shadow-2xs"
            )}
          >
            <Strikethrough className="size-3.5" />
          </Button>

          <div className="mx-1 h-3.5 w-px bg-border/60" />

          {/* Bullet List */}
          <Button
            type="button"
            variant="ghost"
            size="xs"
            aria-label="Bullet list"
            aria-pressed={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(
              "size-7 p-0",
              editor.isActive("bulletList") && "bg-muted text-foreground font-bold shadow-2xs"
            )}
          >
            <List className="size-3.5" />
          </Button>

          {/* Numbered List */}
          <Button
            type="button"
            variant="ghost"
            size="xs"
            aria-label="Numbered list"
            aria-pressed={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn(
              "size-7 p-0",
              editor.isActive("orderedList") && "bg-muted text-foreground font-bold shadow-2xs"
            )}
          >
            <ListOrdered className="size-3.5" />
          </Button>

          {/* Blockquote */}
          <Button
            type="button"
            variant="ghost"
            size="xs"
            aria-label="Blockquote"
            aria-pressed={editor.isActive("blockquote")}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={cn(
              "size-7 p-0",
              editor.isActive("blockquote") && "bg-muted text-foreground font-bold shadow-2xs"
            )}
          >
            <Quote className="size-3.5" />
          </Button>

          {/* Inline Code */}
          <Button
            type="button"
            variant="ghost"
            size="xs"
            aria-label="Inline code"
            aria-pressed={editor.isActive("code")}
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={cn(
              "size-7 p-0",
              editor.isActive("code") && "bg-muted text-foreground font-mono shadow-2xs"
            )}
          >
            <Code className="size-3.5" />
          </Button>

          <div className="mx-1 h-3.5 w-px bg-border/60" />

          {/* Link Popover */}
          <Popover
            open={linkPopoverOpen}
            onOpenChange={(open) => {
              setLinkPopoverOpen(open)
              if (open && editor) {
                const prev = editor.getAttributes("link").href || ""
                setLinkUrl(prev)
              }
            }}
          >
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                aria-label="Insert or edit link"
                aria-pressed={editor.isActive("link")}
                className={cn(
                  "size-7 p-0",
                  editor.isActive("link") && "bg-muted text-primary font-bold shadow-2xs"
                )}
              >
                <LinkIcon className="size-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 p-2.5 z-[70] space-y-2">
              <div className="text-[11px] font-semibold text-foreground">
                {editor.isActive("link") ? "Edit Link" : "Insert Link"}
              </div>
              <div className="flex gap-1.5">
                <Input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  aria-label="Link URL"
                  className="h-7 text-xs"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleSetLink()
                    }
                  }}
                />
                <Button
                  type="button"
                  size="xs"
                  onClick={handleSetLink}
                  className="h-7 px-2 text-xs"
                >
                  <Check className="size-3 mr-1" />
                  Save
                </Button>
              </div>
              {editor.isActive("link") && (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={handleRemoveLink}
                  className="h-6 w-full text-destructive text-[11px] hover:bg-destructive/10"
                >
                  <Unlink className="size-3 mr-1" />
                  Remove Link
                </Button>
              )}
            </PopoverContent>
          </Popover>

          <div className="mx-1 h-3.5 w-px bg-border/60" />

          {/* Undo */}
          <Button
            type="button"
            variant="ghost"
            size="xs"
            aria-label="Undo"
            disabled={!editor.can().undo()}
            onClick={() => editor.chain().focus().undo().run()}
            className="size-7 p-0 disabled:opacity-40"
          >
            <Undo className="size-3.5" />
          </Button>

          {/* Redo */}
          <Button
            type="button"
            variant="ghost"
            size="xs"
            aria-label="Redo"
            disabled={!editor.can().redo()}
            onClick={() => editor.chain().focus().redo().run()}
            className="size-7 p-0 disabled:opacity-40"
          >
            <Redo className="size-3.5" />
          </Button>
        </div>
      )}

      {/* Content Area */}
      <EditorContent editor={editor} />
    </div>
  )
}

export function RichTextEditorSkeleton() {
  return (
    <div className="flex flex-col rounded-lg border border-input bg-muted/10 overflow-hidden">
      <div className="h-9 border-b border-border/60 bg-muted/30 px-3 flex items-center gap-2">
        <div className="size-4 bg-muted animate-pulse rounded" />
        <div className="size-4 bg-muted animate-pulse rounded" />
        <div className="size-4 bg-muted animate-pulse rounded" />
        <div className="h-4 w-px bg-border/60" />
        <div className="size-4 bg-muted animate-pulse rounded" />
        <div className="size-4 bg-muted animate-pulse rounded" />
      </div>
      <div className="h-40 p-3 space-y-2">
        <div className="h-3 w-3/4 bg-muted/60 animate-pulse rounded" />
        <div className="h-3 w-1/2 bg-muted/60 animate-pulse rounded" />
        <div className="h-3 w-2/3 bg-muted/60 animate-pulse rounded" />
      </div>
    </div>
  )
}
