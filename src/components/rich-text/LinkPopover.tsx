"use client"

import * as React from "react"
import type { Editor } from "@tiptap/react"
import { Unlink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { isValidUrl } from "./utils"

interface LinkPopoverProps {
  editor: Editor
  trigger: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function LinkPopover({
  editor,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: LinkPopoverProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen

  const [url, setUrl] = React.useState("")
  const [text, setText] = React.useState("")
  const [openInNewTab, setOpenInNewTab] = React.useState(true)
  const [error, setError] = React.useState("")

  const syncFromEditor = React.useCallback(() => {
    const attrs = editor.getAttributes("link")
    const currentHref = typeof attrs.href === "string" ? attrs.href : ""
    const { from, to } = editor.state.selection
    const selectedText = editor.state.doc.textBetween(from, to, " ")
    setUrl(currentHref)
    setText(selectedText)
    setOpenInNewTab(attrs.target !== "_self")
    setError("")
  }, [editor])

  function handleOpenChange(next: boolean) {
    if (next) syncFromEditor()
    setOpen(next)
  }

  function handleSave(e?: React.FormEvent) {
    e?.preventDefault()
    const raw = url.trim()
    if (!raw) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      setOpen(false)
      return
    }
    const normalized =
      /^(https?:\/\/|mailto:|\/|javascript:|vbscript:)/i.test(raw)
        ? raw
        : `https://${raw}`

    if (!isValidUrl(normalized)) {
      setError("Unsafe or invalid URL protocol.")
      return
    }

    const attrs = {
      href: normalized,
      target: openInNewTab ? "_blank" : "_self",
      rel: "noopener noreferrer nofollow",
    }

    const { from, to } = editor.state.selection
    if (from === to && text.trim()) {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "text",
          text: text.trim(),
          marks: [{ type: "link", attrs }],
        })
        .run()
    } else {
      editor.chain().focus().extendMarkRange("link").setLink(attrs).run()
    }
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-3">
        <form onSubmit={handleSave} className="space-y-2.5">
          <div className="space-y-1">
            <Label htmlFor="rt-link-url" className="text-xs">
              Link URL
            </Label>
            <Input
              id="rt-link-url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value)
                setError("")
              }}
              placeholder="https://example.com"
              className="h-8 text-xs"
            />
            {error ? (
              <p className="text-[11px] text-destructive">{error}</p>
            ) : null}
          </div>

          {editor.state.selection.empty ? (
            <div className="space-y-1">
              <Label htmlFor="rt-link-text" className="text-xs">
                Display Text (optional)
              </Label>
              <Input
                id="rt-link-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Link label"
                className="h-8 text-xs"
              />
            </div>
          ) : null}

          <div className="flex items-center justify-between pt-0.5">
            <Label htmlFor="rt-link-blank" className="text-xs font-normal">
              Open in new tab
            </Label>
            <Switch
              id="rt-link-blank"
              checked={openInNewTab}
              onCheckedChange={setOpenInNewTab}
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            {editor.isActive("link") ? (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => {
                  editor.chain().focus().extendMarkRange("link").unsetLink().run()
                  setOpen(false)
                }}
                className="gap-1 text-destructive hover:text-destructive"
              >
                <Unlink className="size-3" />
                Remove
              </Button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="xs">
                Apply
              </Button>
            </div>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  )
}
