"use client"

import * as React from "react"
import { Node, mergeAttributes } from "@tiptap/core"
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react"
import katex from "katex"
import "katex/dist/katex.min.css"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mathNode: {
      insertMath: (formula?: string) => ReturnType
    }
  }
}

function MathNodeComponent({ node, updateAttributes, editor }: NodeViewProps) {
  const formula = String(node.attrs.formula ?? "E = mc^2")
  const [open, setOpen] = React.useState(false)
  const [draft, setDraft] = React.useState(formula)

  const renderedHtml = React.useMemo(() => {
    try {
      return katex.renderToString(formula, {
        throwOnError: false,
        displayMode: false,
        strict: false,
      })
    } catch {
      return formula
    }
  }, [formula])

  if (!editor.isEditable) {
    return (
      <NodeViewWrapper
        as="span"
        data-type="math"
        data-formula={formula}
        className="inline-block rounded bg-muted/50 px-1 py-0.5 align-middle"
      >
        <span dangerouslySetInnerHTML={{ __html: renderedHtml }} />
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper as="span" className="inline-block align-middle">
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (next) setDraft(formula)
        }}
      >
        <PopoverTrigger asChild>
          <span
            role="button"
            tabIndex={0}
            data-type="math"
            data-formula={formula}
            className="cursor-pointer rounded bg-muted/60 px-1.5 py-0.5 transition-colors hover:bg-primary/15"
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        </PopoverTrigger>
        <PopoverContent className="w-64 space-y-2 p-2.5" align="start">
          <div className="text-xs font-medium">LaTeX Formula</div>
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                updateAttributes({ formula: draft.trim() || "x^2" })
                setOpen(false)
              }
            }}
            placeholder="e.g. \sum_{i=1}^n x_i"
            className="h-8 font-mono text-xs"
          />
          <div className="flex justify-end gap-1.5">
            <Button
              type="button"
              size="xs"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="xs"
              onClick={() => {
                updateAttributes({ formula: draft.trim() || "x^2" })
                setOpen(false)
              }}
            >
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </NodeViewWrapper>
  )
}

export const MathNode = Node.create({
  name: "mathNode",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      formula: {
        default: "E = mc^2",
        parseHTML: (el) =>
          el.getAttribute("data-formula") ?? el.textContent ?? "E = mc^2",
        renderHTML: (attrs) => ({
          "data-formula": attrs.formula,
        }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-type="math"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const formula = String(
      HTMLAttributes["data-formula"] ?? HTMLAttributes.formula ?? ""
    )
    return [
      "span",
      mergeAttributes({ "data-type": "math" }, HTMLAttributes),
      formula,
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathNodeComponent)
  },

  addCommands() {
    return {
      insertMath:
        (formula = "E = mc^2") =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { formula },
          })
        },
    }
  },
})
