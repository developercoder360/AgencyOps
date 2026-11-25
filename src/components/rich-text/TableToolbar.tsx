"use client"

import * as React from "react"
import type { Editor } from "@tiptap/react"
import {
  Columns,
  Merge,
  Minus,
  PaintBucket,
  Plus,
  Rows,
  Split,
  TableProperties,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"

interface TableToolbarProps {
  editor: Editor
}

const CELL_COLORS = [
  { label: "Clear", value: null },
  { label: "Muted", value: "rgba(148, 163, 184, 0.16)" },
  { label: "Blue", value: "rgba(59, 130, 246, 0.14)" },
  { label: "Green", value: "rgba(34, 197, 94, 0.14)" },
  { label: "Amber", value: "rgba(245, 158, 11, 0.16)" },
  { label: "Red", value: "rgba(239, 68, 68, 0.14)" },
]

export function TableToolbar({ editor }: TableToolbarProps) {
  if (!editor.isActive("table")) return null

  return (
    <div
      role="toolbar"
      aria-label="Table controls"
      className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/40 px-2.5 py-1 text-xs"
    >
      <span className="mr-1 inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
        <TableProperties className="size-3.5" />
        Table:
      </span>

      <Button
        type="button"
        variant="ghost"
        size="xs"
        onClick={() => editor.chain().focus().addRowBefore().run()}
        title="Add row above"
        className="h-6 gap-1 px-1.5 text-[11px]"
      >
        <Plus className="size-3" />
        Row ↑
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="xs"
        onClick={() => editor.chain().focus().addRowAfter().run()}
        title="Add row below"
        className="h-6 gap-1 px-1.5 text-[11px]"
      >
        <Rows className="size-3" />
        Row ↓
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="xs"
        onClick={() => editor.chain().focus().deleteRow().run()}
        title="Delete row"
        className="h-6 gap-1 px-1.5 text-[11px]"
      >
        <Minus className="size-3" />
        Row
      </Button>

      <Separator orientation="vertical" className="mx-0.5 h-4" />

      <Button
        type="button"
        variant="ghost"
        size="xs"
        onClick={() => editor.chain().focus().addColumnBefore().run()}
        title="Add column left"
        className="h-6 gap-1 px-1.5 text-[11px]"
      >
        <Plus className="size-3" />
        Col ←
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="xs"
        onClick={() => editor.chain().focus().addColumnAfter().run()}
        title="Add column right"
        className="h-6 gap-1 px-1.5 text-[11px]"
      >
        <Columns className="size-3" />
        Col →
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="xs"
        onClick={() => editor.chain().focus().deleteColumn().run()}
        title="Delete column"
        className="h-6 gap-1 px-1.5 text-[11px]"
      >
        <Minus className="size-3" />
        Col
      </Button>

      <Separator orientation="vertical" className="mx-0.5 h-4" />

      <Button
        type="button"
        variant="ghost"
        size="xs"
        disabled={!editor.can().mergeCells()}
        onClick={() => editor.chain().focus().mergeCells().run()}
        title="Merge cells"
        className="h-6 gap-1 px-1.5 text-[11px]"
      >
        <Merge className="size-3" />
        Merge
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="xs"
        disabled={!editor.can().splitCell()}
        onClick={() => editor.chain().focus().splitCell().run()}
        title="Split cell"
        className="h-6 gap-1 px-1.5 text-[11px]"
      >
        <Split className="size-3" />
        Split
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="xs"
        onClick={() => editor.chain().focus().toggleHeaderRow().run()}
        title="Toggle header row"
        className="h-6 px-1.5 text-[11px]"
      >
        Header Row
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="xs"
        onClick={() => editor.chain().focus().toggleHeaderColumn().run()}
        title="Toggle header column"
        className="h-6 px-1.5 text-[11px]"
      >
        Header Col
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            title="Cell background"
            className="h-6 gap-1 px-1.5 text-[11px]"
          >
            <PaintBucket className="size-3" />
            Cell
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="flex w-auto gap-1.5 p-2">
          {CELL_COLORS.map((c) => (
            <button
              key={c.label}
              type="button"
              title={c.label}
              onClick={() =>
                editor.chain().focus().setCellAttribute("backgroundColor", c.value).run()
              }
              style={{ backgroundColor: c.value ?? "transparent" }}
              className="size-5 rounded border border-border text-[9px]"
            >
              {c.value === null ? "∅" : ""}
            </button>
          ))}
        </PopoverContent>
      </Popover>

      <Button
        type="button"
        variant="ghost"
        size="xs"
        onClick={() => editor.chain().focus().deleteTable().run()}
        title="Delete table"
        className="ml-auto h-6 gap-1 px-1.5 text-[11px] text-destructive hover:text-destructive"
      >
        <Trash2 className="size-3" />
        Delete
      </Button>
    </div>
  )
}
