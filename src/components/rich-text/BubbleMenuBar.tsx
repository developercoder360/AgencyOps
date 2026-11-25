"use client"

import * as React from "react"
import type { Editor } from "@tiptap/react"
import { BubbleMenu } from "@tiptap/react/menus"
import {
  Bold,
  Code,
  ExternalLink,
  Heading2,
  Highlighter,
  Italic,
  Link2,
  Underline as UnderlineIcon,
  Unlink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { LinkPopover } from "./LinkPopover"
import { cn } from "cn"

interface BubbleMenuBarProps {
  editor: Editor
  allowUnderline?: boolean
  allowHighlight?: boolean
  allowHeading?: boolean
}

export function BubbleMenuBar({
  editor,
  allowUnderline = true,
  allowHighlight = true,
  allowHeading = true,
}: BubbleMenuBarProps) {
  const [linkOpen, setLinkOpen] = React.useState(false)
  const isLinkActive = editor.isActive("link")
  const href = isLinkActive ? String(editor.getAttributes("link").href ?? "") : ""

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor: ed, state }) => {
        if (!ed.isEditable) return false
        if (ed.isActive("image") || ed.isActive("codeBlock")) return false
        if (ed.isActive("link")) return true
        return !state.selection.empty
      }}
    >
      <div className="flex items-center gap-0.5 rounded-lg border border-border bg-popover p-1 shadow-lg">
        {isLinkActive && editor.state.selection.empty ? (
          <>
            <span className="max-w-44 truncate px-1.5 text-[11px] text-muted-foreground">
              {href}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => {
                if (href) window.open(href, "_blank", "noopener,noreferrer")
              }}
              aria-label="Open link"
              title="Open link"
            >
              <ExternalLink className="size-3.5" />
            </Button>
            <LinkPopover
              editor={editor}
              open={linkOpen}
              onOpenChange={setLinkOpen}
              trigger={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Edit link"
                  title="Edit link"
                >
                  <Link2 className="size-3.5" />
                </Button>
              }
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() =>
                editor.chain().focus().extendMarkRange("link").unsetLink().run()
              }
              aria-label="Unlink"
              title="Unlink"
              className="text-destructive hover:text-destructive"
            >
              <Unlink className="size-3.5" />
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => editor.chain().focus().toggleBold().run()}
              aria-label="Bold"
              className={cn(editor.isActive("bold") && "bg-primary/15 text-primary")}
            >
              <Bold className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              aria-label="Italic"
              className={cn(editor.isActive("italic") && "bg-primary/15 text-primary")}
            >
              <Italic className="size-3.5" />
            </Button>
            {allowUnderline ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                aria-label="Underline"
                className={cn(
                  editor.isActive("underline") && "bg-primary/15 text-primary"
                )}
              >
                <UnderlineIcon className="size-3.5" />
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => editor.chain().focus().toggleCode().run()}
              aria-label="Inline code"
              className={cn(editor.isActive("code") && "bg-primary/15 text-primary")}
            >
              <Code className="size-3.5" />
            </Button>
            {allowHighlight ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => editor.chain().focus().toggleHighlight().run()}
                aria-label="Highlight"
                className={cn(
                  editor.isActive("highlight") && "bg-primary/15 text-primary"
                )}
              >
                <Highlighter className="size-3.5" />
              </Button>
            ) : null}
            <LinkPopover
              editor={editor}
              open={linkOpen}
              onOpenChange={setLinkOpen}
              trigger={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Insert or edit link"
                  className={cn(isLinkActive && "bg-primary/15 text-primary")}
                >
                  <Link2 className="size-3.5" />
                </Button>
              }
            />
            {allowHeading ? (
              <>
                <Separator orientation="vertical" className="mx-0.5 h-4" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() =>
                    editor.chain().focus().toggleHeading({ level: 2 }).run()
                  }
                  aria-label="Toggle Heading 2"
                  className={cn(
                    editor.isActive("heading", { level: 2 }) &&
                      "bg-primary/15 text-primary"
                  )}
                >
                  <Heading2 className="size-3.5" />
                </Button>
              </>
            ) : null}
          </>
        )}
      </div>
    </BubbleMenu>
  )
}
