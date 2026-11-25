"use client"

import * as React from "react"
import Image from "@tiptap/extension-image"
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react"
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Captions,
  Loader2,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "cn"

type ImageAlign = "left" | "center" | "right"

function ImageNodeComponent({
  node,
  updateAttributes,
  deleteNode,
  selected,
  editor,
}: NodeViewProps) {
  const src = String(node.attrs.src ?? "")
  const alt = String(node.attrs.alt ?? "")
  const caption = String(node.attrs.caption ?? "")
  const width = String(node.attrs.width ?? "100%")
  const align = (node.attrs.align as ImageAlign | undefined) ?? "left"
  const loading = Boolean(node.attrs.loading)

  const [metaOpen, setMetaOpen] = React.useState(false)
  const [altDraft, setAltDraft] = React.useState(alt)
  const [captionDraft, setCaptionDraft] = React.useState(caption)
  const containerRef = React.useRef<HTMLDivElement | null>(null)

  function handleResizeMouseDown(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startWidth =
      containerRef.current?.getBoundingClientRect().width ?? 320

    function onMouseMove(moveEvent: MouseEvent) {
      const nextPx = Math.max(120, Math.min(900, startWidth + (moveEvent.clientX - startX)))
      updateAttributes({ width: `${Math.round(nextPx)}px` })
    }

    function onMouseUp() {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
    }

    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)
  }

  return (
    <NodeViewWrapper
      as="figure"
      className={cn(
        "my-3 flex flex-col",
        align === "center" && "items-center",
        align === "right" && "items-end",
        align === "left" && "items-start"
      )}
    >
      <div
        ref={containerRef}
        style={{ width, maxWidth: "100%" }}
        className={cn(
          "group/img relative overflow-hidden rounded-lg border border-border bg-muted/20",
          selected && editor.isEditable && "ring-2 ring-primary"
        )}
      >
        {loading ? (
          <div className="flex h-36 w-full items-center justify-center gap-2 bg-muted/40 text-xs text-muted-foreground">
            <Loader2 className="size-4 animate-spin text-primary" />
            <span>Uploading image...</span>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            className="block h-auto w-full object-contain"
          />
        )}

        {editor.isEditable && !loading ? (
          <>
            <div className="absolute top-2 right-2 flex items-center gap-1 rounded-md border border-border bg-popover/95 p-0.5 opacity-0 shadow-sm backdrop-blur-xs transition-opacity group-hover/img:opacity-100">
              <Button
                type="button"
                size="icon-xs"
                variant={align === "left" ? "secondary" : "ghost"}
                onClick={() => updateAttributes({ align: "left" })}
                aria-label="Align left"
              >
                <AlignLeft className="size-3" />
              </Button>
              <Button
                type="button"
                size="icon-xs"
                variant={align === "center" ? "secondary" : "ghost"}
                onClick={() => updateAttributes({ align: "center" })}
                aria-label="Align center"
              >
                <AlignCenter className="size-3" />
              </Button>
              <Button
                type="button"
                size="icon-xs"
                variant={align === "right" ? "secondary" : "ghost"}
                onClick={() => updateAttributes({ align: "right" })}
                aria-label="Align right"
              >
                <AlignRight className="size-3" />
              </Button>

              <Popover
                open={metaOpen}
                onOpenChange={(next) => {
                  setMetaOpen(next)
                  if (next) {
                    setAltDraft(alt)
                    setCaptionDraft(caption)
                  }
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    size="icon-xs"
                    variant="ghost"
                    aria-label="Edit alt text and caption"
                  >
                    <Captions className="size-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 space-y-2 p-2.5" align="end">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium">Alt text</label>
                    <Input
                      value={altDraft}
                      onChange={(e) => setAltDraft(e.target.value)}
                      placeholder="Describe image..."
                      className="h-7 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium">Caption</label>
                    <Input
                      value={captionDraft}
                      onChange={(e) => setCaptionDraft(e.target.value)}
                      placeholder="Optional caption..."
                      className="h-7 text-xs"
                    />
                  </div>
                  <div className="flex justify-end gap-1.5">
                    <Button
                      type="button"
                      size="xs"
                      onClick={() => {
                        updateAttributes({
                          alt: altDraft.trim(),
                          caption: captionDraft.trim(),
                        })
                        setMetaOpen(false)
                      }}
                    >
                      Save
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              <Button
                type="button"
                size="icon-xs"
                variant="ghost"
                onClick={deleteNode}
                aria-label="Delete image"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="size-3" />
              </Button>
            </div>

            <button
              type="button"
              onMouseDown={handleResizeMouseDown}
              aria-label="Resize image"
              title="Drag to resize"
              className="absolute right-1 bottom-1 size-3.5 cursor-ew-resize rounded-xs border border-border bg-background/90 opacity-0 shadow-xs transition-opacity group-hover/img:opacity-100"
            />
          </>
        ) : null}
      </div>

      {caption ? (
        <figcaption className="mt-1 text-center text-xs text-muted-foreground">
          {caption}
        </figcaption>
      ) : null}
    </NodeViewWrapper>
  )
}

export const CustomImageExtension = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: "100%",
        parseHTML: (el) => el.getAttribute("data-width") ?? el.getAttribute("width") ?? "100%",
        renderHTML: (attrs) => ({ "data-width": attrs.width, width: attrs.width }),
      },
      align: {
        default: "left",
        parseHTML: (el) => el.getAttribute("data-align") ?? "left",
        renderHTML: (attrs) => ({ "data-align": attrs.align }),
      },
      caption: {
        default: "",
        parseHTML: (el) => el.getAttribute("data-caption") ?? "",
        renderHTML: (attrs) =>
          attrs.caption ? { "data-caption": attrs.caption } : {},
      },
      loading: {
        default: false,
      },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeComponent)
  },
})
