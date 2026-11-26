"use client"

import type { Editor } from "@tiptap/react"
import { FloatingMenu } from "@tiptap/react/menus"
import {
  CheckSquare,
  ChevronRightSquare,
  Code2,
  Heading2,
  ImagePlus,
  Info,
  List,
  Minus,
  Plus,
  Sigma,
  Table,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface FloatingInsertMenuProps {
  editor: Editor
  onPickImage: () => void
}

export function FloatingInsertMenu({
  editor,
  onPickImage,
}: FloatingInsertMenuProps) {
  return (
    <FloatingMenu
      editor={editor}
      shouldShow={({ editor: ed, state }) => {
        if (!ed.isEditable || !ed.isFocused) return false
        const { $from, empty } = state.selection
        return (
          empty &&
          $from.parent.type.name === "paragraph" &&
          $from.parent.content.size === 0
        )
      }}
    >
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon-xs"
            aria-label="Insert block"
            title="Insert block"
            className="size-6 rounded-full bg-background/95 shadow-xs"
          >
            <Plus className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            <Heading2 className="size-3.5" />
            Heading 2
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="size-3.5" />
            Bullet List
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleTaskList().run()}
          >
            <CheckSquare className="size-3.5" />
            Checklist
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              editor
                .chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run()
            }
          >
            <Table className="size-3.5" />
            Table (3×3)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onPickImage}>
            <ImagePlus className="size-3.5" />
            Upload Image
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          >
            <Code2 className="size-3.5" />
            Code Block
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().setCallout("info").run()}
          >
            <Info className="size-3.5" />
            Info Callout
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().insertDetailsBlock().run()}
          >
            <ChevronRightSquare className="size-3.5" />
            Collapsible Toggle
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().insertMath("E = mc^2").run()}
          >
            <Sigma className="size-3.5" />
            Math Formula
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
          >
            <Minus className="size-3.5" />
            Divider
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </FloatingMenu>
  )
}
