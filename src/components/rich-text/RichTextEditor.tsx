"use client"

import * as React from "react"
import { EditorContent, useEditor } from "@tiptap/react"
import { History, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import type {
  RichTextAttachment,
  RichTextEditorProps,
  RichTextValue,
} from "@/types/rich-text"
import { BubbleMenuBar } from "./BubbleMenuBar"
import { FindReplaceBar } from "./FindReplaceBar"
import { FloatingInsertMenu } from "./FloatingInsertMenu"
import { ShortcutsDialog } from "./ShortcutsDialog"
import { TableToolbar } from "./TableToolbar"
import { Toolbar } from "./Toolbar"
import { buildRichTextExtensions } from "./extensions"
import { sanitizeHtml } from "./sanitize"
import {
  EMPTY_DOC,
  formatFileSize,
  getPlainText,
  getWordCount,
} from "./utils"
import { cn } from "cn"
import "./editor.css"

function normalizeInitialContent(value: RichTextValue | null | undefined): string | Record<string, unknown> {
  if (!value) return ""
  if (typeof value === "string") return sanitizeHtml(value)
  if (typeof value === "object" && (value as Record<string, unknown>).type === "doc") {
    return value
  }
  return EMPTY_DOC
}

function extractCharacterCount(editor: ReturnType<typeof useEditor> | null): number {
  if (!editor) return 0
  const storage = editor.storage as unknown as {
    characterCount?: { characters?: () => number }
  }
  if (typeof storage.characterCount?.characters === "function") {
    return storage.characterCount.characters()
  }
  return getPlainText(editor.getHTML()).length
}

export function RichTextEditor({
  value,
  onChange,
  format = "html",
  variant = "full",
  placeholder = "Write something...",
  readOnly = false,
  disabled = false,
  minHeight,
  maxHeight,
  autoGrow = false,
  autofocus = false,
  maxLength,
  mentionItems = [],
  taskItems = [],
  onUploadImage,
  onAttachFiles,
  onSubmit,
  toolbarItems,
  draftKey,
  "aria-label": ariaLabelProp,
  ariaLabel,
  id,
  className,
  editorClassName,
}: RichTextEditorProps) {
  const effectiveAriaLabel = ariaLabelProp ?? ariaLabel ?? "Rich text editor"
  const isEditable = !readOnly && !disabled

  const [findOpen, setFindOpen] = React.useState(false)
  const [shortcutsOpen, setShortcutsOpen] = React.useState(false)
  const [spellCheck, setSpellCheck] = React.useState(true)
  const [dir, setDir] = React.useState<"ltr" | "rtl">("ltr")
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [savedDraftAt, setSavedDraftAt] = React.useState<string | null>(null)
  const [restorableDraft, setRestorableDraft] = React.useState<string | null>(
    () => {
      if (!draftKey || typeof window === "undefined") return null
      try {
        const existing = window.localStorage.getItem(draftKey)
        return existing && getPlainText(existing).length > 0 ? existing : null
      } catch {
        return null
      }
    }
  )

  const imageInputRef = React.useRef<HTMLInputElement | null>(null)
  const attachmentInputRef = React.useRef<HTMLInputElement | null>(null)

  const extensions = React.useMemo(
    () =>
      buildRichTextExtensions({
        variant,
        placeholder,
        maxLength,
      }),
    [variant, placeholder, maxLength]
  )

  const initialContent = React.useMemo(
    () => normalizeInitialContent(value),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )
  const lastEmittedRef = React.useRef<string>(
    typeof initialContent === "string"
      ? initialContent
      : JSON.stringify(initialContent)
  )

  const handleUploadFiles = React.useCallback(
    async (files: File[], targetEditor: NonNullable<ReturnType<typeof useEditor>>) => {
      const imageFiles = files.filter((f) => f.type.startsWith("image/"))
      const otherFiles = files.filter((f) => !f.type.startsWith("image/"))

      for (const imgFile of imageFiles) {
        const placeholderId = `img-${crypto.randomUUID().slice(0, 8)}`
        targetEditor
          .chain()
          .focus()
          .insertContent({
            type: "image",
            attrs: {
              src: "",
              alt: imgFile.name,
              title: placeholderId,
              loading: true,
            },
          })
          .run()

        let resolvedUrl = ""
        try {
          resolvedUrl = onUploadImage
            ? await onUploadImage(imgFile)
            : URL.createObjectURL(imgFile)
        } catch {
          resolvedUrl = URL.createObjectURL(imgFile)
        }

        const { state, view } = targetEditor
        let foundPos: number | null = null
        state.doc.descendants((node, pos) => {
          if (
            node.type.name === "image" &&
            node.attrs.title === placeholderId
          ) {
            foundPos = pos
            return false
          }
          return true
        })
        if (foundPos !== null) {
          const targetNode = state.doc.nodeAt(foundPos)
          if (targetNode) {
            const tr = state.tr.setNodeMarkup(foundPos, undefined, {
              ...targetNode.attrs,
              src: resolvedUrl,
              title: imgFile.name,
              loading: false,
            })
            view.dispatch(tr)
          }
        }
      }

      if (otherFiles.length > 0) {
        const uploaded: RichTextAttachment[] = otherFiles.map((file) => ({
          id: `att-${crypto.randomUUID().slice(0, 8)}`,
          name: file.name,
          size: formatFileSize(file.size),
          type: file.type || "application/octet-stream",
          url: URL.createObjectURL(file),
        }))

        for (const att of uploaded) {
          targetEditor.chain().focus().insertAttachment(att).run()
        }
        onAttachFiles?.(uploaded)
      }
    },
    [onUploadImage, onAttachFiles]
  )

  const handleUploadFilesRef = React.useRef(handleUploadFiles)
  React.useEffect(() => {
    handleUploadFilesRef.current = handleUploadFiles
  }, [handleUploadFiles])

  const editor = useEditor({
    immediatelyRender: false,
    editable: isEditable,
    autofocus,
    extensions,
    content: initialContent,
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": effectiveAriaLabel,
        spellcheck: String(spellCheck),
        dir,
        class: cn(
          "rich-text-prose focus:outline-none px-3 py-2.5",
          !autoGrow && "overflow-y-auto",
          readOnly && "px-0 py-0 overflow-visible",
          editorClassName
        ),
        style: [
          minHeight ? `min-height: ${minHeight}` : "",
          maxHeight && !autoGrow ? `max-height: ${maxHeight}` : "",
        ]
          .filter(Boolean)
          .join("; "),
      },
      handleDrop: (_view, event, _slice, moved) => {
        if (moved || !event.dataTransfer?.files?.length) return false
        event.preventDefault()
        if (editor) {
          void handleUploadFilesRef.current(
            Array.from(event.dataTransfer.files),
            editor
          )
        }
        return true
      },
      handlePaste: (_view, event) => {
        const items = Array.from(event.clipboardData?.items ?? [])
        const imageFiles = items
          .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
          .map((item) => item.getAsFile())
          .filter((f): f is File => Boolean(f))
        if (imageFiles.length > 0 && editor) {
          event.preventDefault()
          void handleUploadFilesRef.current(imageFiles, editor)
          return true
        }
        return false
      },
    },
    onUpdate: ({ editor: ed }) => {
      const output: RichTextValue =
        format === "json"
          ? (ed.getJSON() as Record<string, unknown>)
          : sanitizeHtml(ed.getHTML())
      const serialized =
        typeof output === "string" ? output : JSON.stringify(output)
      if (serialized === lastEmittedRef.current) return
      lastEmittedRef.current = serialized
      onChange?.(output)

      if (draftKey && typeof window !== "undefined") {
        try {
          const htmlSnapshot = sanitizeHtml(ed.getHTML())
          window.localStorage.setItem(draftKey, htmlSnapshot)
          setSavedDraftAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))
        } catch {
          // Ignore storage errors
        }
      }
    },
  })

  // Sync dynamic callbacks & items via command without recreating editor
  React.useEffect(() => {
    if (!editor || editor.isDestroyed) return
    editor.commands.updateCustomBehavior({
      mentionItems,
      taskItems,
      onSubmit,
      onOpenFind: () => setFindOpen(true),
      onPickImage: () => imageInputRef.current?.click(),
    })
  }, [editor, mentionItems, taskItems, onSubmit])

  // Sync editable state dynamically
  React.useEffect(() => {
    if (!editor || editor.isDestroyed) return
    editor.setEditable(isEditable)
  }, [editor, isEditable])

  // Sync spellcheck & dir attributes on DOM without recreating editor
  React.useEffect(() => {
    if (!editor || editor.isDestroyed) return
    editor.view.dom.setAttribute("spellcheck", String(spellCheck))
    editor.view.dom.setAttribute("dir", dir)
  }, [editor, spellCheck, dir])

  // Sync controlled value changes safely without jumping cursor
  React.useEffect(() => {
    if (!editor || editor.isDestroyed || value === undefined) return
    const normalized = normalizeInitialContent(value)
    const serialized =
      typeof normalized === "string" ? normalized : JSON.stringify(normalized)

    if (serialized === lastEmittedRef.current) return
    const currentSerialized =
      format === "json"
        ? JSON.stringify(editor.getJSON())
        : sanitizeHtml(editor.getHTML())

    if (serialized !== currentSerialized && (!editor.isFocused || serialized === "" || serialized === JSON.stringify(EMPTY_DOC))) {
      lastEmittedRef.current = serialized
      editor.commands.setContent(normalized || "<p></p>", { emitUpdate: false })
    }
  }, [editor, value, format])

  // Close fullscreen with Escape
  React.useEffect(() => {
    if (!isFullscreen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setIsFullscreen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isFullscreen])

  if (!editor) {
    return (
      <div
        className={cn(
          "h-[140px] w-full animate-pulse rounded-lg border border-border bg-muted/30",
          className
        )}
      />
    )
  }

  const charCount = extractCharacterCount(editor)
  const wordCount = getWordCount(editor.getHTML())
  const limitRatio = maxLength ? charCount / maxLength : 0

  return (
    <div
      id={id}
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border border-border bg-background transition-shadow",
        isEditable &&
          "focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15",
        disabled && "cursor-not-allowed bg-muted/30 opacity-60",
        readOnly && "border-0 bg-transparent",
        isFullscreen &&
          "fixed inset-3 z-50 rounded-xl border border-border bg-background shadow-2xl",
        className
      )}
    >
      {/* Hidden file inputs for image & attachment uploads */}
      <input
        ref={imageInputRef}
        type="file"
        data-rt-image-input="true"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? [])
          if (files.length > 0) void handleUploadFiles(files, editor)
          e.target.value = ""
        }}
      />
      <input
        ref={attachmentInputRef}
        type="file"
        multiple
        className="sr-only"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? [])
          if (files.length > 0) void handleUploadFiles(files, editor)
          e.target.value = ""
        }}
      />

      {/* Restore draft banner */}
      {isEditable && restorableDraft ? (
        <div className="flex items-center justify-between gap-2 border-b border-border bg-amber-500/10 px-3 py-1.5 text-xs">
          <span className="inline-flex items-center gap-1.5 text-foreground">
            <History className="size-3.5 text-amber-600 dark:text-amber-400" />
            Saved draft found. Restore previous content?
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => {
                setRestorableDraft(null)
                if (draftKey && typeof window !== "undefined") {
                  window.localStorage.removeItem(draftKey)
                }
              }}
              className="h-6 text-[11px]"
            >
              Discard
            </Button>
            <Button
              type="button"
              size="xs"
              onClick={() => {
                editor.commands.setContent(sanitizeHtml(restorableDraft), {
                  emitUpdate: true,
                })
                setRestorableDraft(null)
              }}
              className="h-6 text-[11px]"
            >
              Restore
            </Button>
          </div>
        </div>
      ) : null}

      {/* Main Sticky Toolbar */}
      {isEditable ? (
        <Toolbar
          editor={editor}
          variant={variant}
          toolbarItems={toolbarItems}
          disabled={disabled}
          onPickImage={() => imageInputRef.current?.click()}
          onPickAttachment={() => attachmentInputRef.current?.click()}
          onOpenFindReplace={() => setFindOpen((v) => !v)}
          onOpenShortcuts={() => setShortcutsOpen(true)}
          spellCheck={spellCheck}
          onToggleSpellCheck={() => setSpellCheck((v) => !v)}
          dir={dir}
          onToggleDir={() => setDir((d) => (d === "ltr" ? "rtl" : "ltr"))}
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => setIsFullscreen((v) => !v)}
        />
      ) : null}

      {/* Contextual Table Toolbar */}
      {isEditable && variant === "full" ? (
        <TableToolbar editor={editor} />
      ) : null}

      {/* Find & Replace Bar */}
      {isEditable && findOpen ? (
        <FindReplaceBar editor={editor} onClose={() => setFindOpen(false)} />
      ) : null}

      {/* Bubble & Floating Menus */}
      {isEditable ? (
        <BubbleMenuBar
          editor={editor}
          allowUnderline={variant !== "minimal"}
          allowHighlight={variant === "full"}
          allowHeading={variant === "full"}
        />
      ) : null}
      {isEditable && variant === "full" ? (
        <FloatingInsertMenu
          editor={editor}
          onPickImage={() => imageInputRef.current?.click()}
        />
      ) : null}

      {/* Editor Content Area */}
      <div
        className={cn(
          "relative min-h-0 flex-1",
          isFullscreen && "overflow-y-auto"
        )}
      >
        <EditorContent editor={editor} />
      </div>

      {/* Footer: Word / Character Count, Draft indicator, Comment Submit */}
      {isEditable &&
      (maxLength !== undefined ||
        variant === "full" ||
        variant === "comment" ||
        savedDraftAt) ? (
        <div className="flex items-center justify-between gap-2 border-t border-border/70 bg-muted/20 px-3 py-1.5 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>{wordCount} words</span>
            {maxLength !== undefined ? (
              <span
                className={cn(
                  "font-mono tabular-nums",
                  limitRatio >= 1
                    ? "font-semibold text-destructive"
                    : limitRatio >= 0.85
                      ? "font-medium text-amber-600 dark:text-amber-400"
                      : ""
                )}
              >
                {charCount} / {maxLength}
              </span>
            ) : (
              <span className="font-mono tabular-nums">{charCount} chars</span>
            )}
            {savedDraftAt ? (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                Draft saved at {savedDraftAt}
              </span>
            ) : null}
          </div>

          {variant === "comment" && onSubmit ? (
            <div className="flex items-center gap-2">
              <span className="hidden text-[10px] sm:inline">Ctrl+Enter</span>
              <Button
                type="button"
                size="xs"
                onClick={onSubmit}
                disabled={charCount === 0}
                className="gap-1 px-2.5"
              >
                <Send className="size-3" />
                Send
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      <ShortcutsDialog
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
      />
    </div>
  )
}

export function RichTextEditorSkeleton() {
  return (
    <div className="h-[140px] w-full animate-pulse rounded-lg border border-border bg-muted/30" />
  )
}
