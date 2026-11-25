"use client"

import * as React from "react"
import type { Editor, Range } from "@tiptap/core"
import type { SuggestionKeyDownProps } from "@tiptap/suggestion"
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  CheckSquare,
  ChevronRightSquare,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  ImagePlus,
  Info,
  List,
  ListOrdered,
  Minus,
  Quote,
  Sigma,
  Smile,
  Table,
  AtSign,
} from "lucide-react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import type { SuggestionListRef } from "./MentionList"
import { cn } from "cn"

export interface SlashCommandItem {
  id: string
  title: string
  description: string
  keywords: string[]
  icon: React.ReactNode
  run: (ctx: { editor: Editor; range: Range }) => void
}

export function buildSlashCommands(handlers: {
  onPickImage: () => void
}): SlashCommandItem[] {
  return [
    {
      id: "h1",
      title: "Heading 1",
      description: "Large section heading",
      keywords: ["h1", "heading", "title"],
      icon: <Heading1 className="size-4" />,
      run: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run(),
    },
    {
      id: "h2",
      title: "Heading 2",
      description: "Medium section heading",
      keywords: ["h2", "heading", "subtitle"],
      icon: <Heading2 className="size-4" />,
      run: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run(),
    },
    {
      id: "h3",
      title: "Heading 3",
      description: "Small subsection heading",
      keywords: ["h3", "heading"],
      icon: <Heading3 className="size-4" />,
      run: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run(),
    },
    {
      id: "bulletList",
      title: "Bullet List",
      description: "Create a bulleted list",
      keywords: ["ul", "bullet", "list"],
      icon: <List className="size-4" />,
      run: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleBulletList().run(),
    },
    {
      id: "orderedList",
      title: "Numbered List",
      description: "Create a numbered list",
      keywords: ["ol", "numbered", "list"],
      icon: <ListOrdered className="size-4" />,
      run: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
    },
    {
      id: "taskList",
      title: "Checklist",
      description: "Track items with checkboxes",
      keywords: ["todo", "task", "checklist"],
      icon: <CheckSquare className="size-4" />,
      run: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleTaskList().run(),
    },
    {
      id: "table",
      title: "Table (3×3)",
      description: "Insert an editable table",
      keywords: ["table", "grid"],
      icon: <Table className="size-4" />,
      run: ({ editor, range }) =>
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run(),
    },
    {
      id: "image",
      title: "Image Upload",
      description: "Upload an image from disk",
      keywords: ["image", "photo", "upload"],
      icon: <ImagePlus className="size-4" />,
      run: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run()
        handlers.onPickImage()
      },
    },
    {
      id: "codeBlock",
      title: "Code Block",
      description: "Syntax highlighted code snippet",
      keywords: ["code", "pre", "snippet"],
      icon: <Code2 className="size-4" />,
      run: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
    },
    {
      id: "quote",
      title: "Blockquote",
      description: "Highlight a quote or callout",
      keywords: ["quote", "blockquote"],
      icon: <Quote className="size-4" />,
      run: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
    },
    {
      id: "divider",
      title: "Divider",
      description: "Insert a horizontal rule",
      keywords: ["hr", "divider", "line"],
      icon: <Minus className="size-4" />,
      run: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
    },
    {
      id: "callout-info",
      title: "Info Callout",
      description: "Informational callout banner",
      keywords: ["callout", "info", "note"],
      icon: <Info className="size-4 text-blue-500" />,
      run: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).setCallout("info").run(),
    },
    {
      id: "callout-success",
      title: "Success Callout",
      description: "Approval or success callout",
      keywords: ["callout", "success", "done"],
      icon: <CheckCircle2 className="size-4 text-emerald-500" />,
      run: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).setCallout("success").run(),
    },
    {
      id: "callout-warning",
      title: "Warning Callout",
      description: "Caution or review note",
      keywords: ["callout", "warning"],
      icon: <AlertTriangle className="size-4 text-amber-500" />,
      run: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).setCallout("warning").run(),
    },
    {
      id: "callout-danger",
      title: "Danger Callout",
      description: "Critical blocker or error note",
      keywords: ["callout", "danger", "error"],
      icon: <AlertCircle className="size-4 text-rose-500" />,
      run: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).setCallout("danger").run(),
    },
    {
      id: "details",
      title: "Collapsible Toggle",
      description: "Expandable details section",
      keywords: ["details", "toggle", "collapse", "accordion"],
      icon: <ChevronRightSquare className="size-4" />,
      run: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).insertDetailsBlock().run(),
    },
    {
      id: "math",
      title: "Math Formula (LaTeX)",
      description: "Insert KaTeX math expression",
      keywords: ["math", "latex", "formula"],
      icon: <Sigma className="size-4" />,
      run: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).insertMath("E = mc^2").run(),
    },
    {
      id: "date",
      title: "Date Chip",
      description: "Insert today's date badge",
      keywords: ["date", "today", "chip"],
      icon: <Calendar className="size-4" />,
      run: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).insertDateChip().run(),
    },
    {
      id: "emoji",
      title: "Emoji Shortcut",
      description: "Start typing :shortcode for emojis",
      keywords: ["emoji", "smile"],
      icon: <Smile className="size-4" />,
      run: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).insertContent(":").run(),
    },
    {
      id: "mention",
      title: "Mention Teammate",
      description: "Trigger @mention autocomplete",
      keywords: ["mention", "user", "@"],
      icon: <AtSign className="size-4" />,
      run: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).insertContent("@").run(),
    },
  ]
}

interface SlashCommandListProps {
  items: SlashCommandItem[]
  command: (item: SlashCommandItem) => void
}

export const SlashCommandList = React.forwardRef<
  SuggestionListRef,
  SlashCommandListProps
>(({ items, command }, ref) => {
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const safeIndex = items.length > 0 ? Math.min(selectedIndex, items.length - 1) : 0

  React.useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: SuggestionKeyDownProps) => {
      if (event.key === "ArrowUp") {
        setSelectedIndex((prev) => (prev + items.length - 1) % Math.max(1, items.length))
        return true
      }
      if (event.key === "ArrowDown") {
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, items.length))
        return true
      }
      if (event.key === "Enter") {
        const item = items[safeIndex]
        if (item) command(item)
        return true
      }
      return false
    },
  }))

  return (
    <Command className="w-72 rounded-xl border border-border bg-popover shadow-lg">
      <CommandList className="max-h-64">
        <CommandEmpty className="py-4 text-center text-xs text-muted-foreground">
          No command matched.
        </CommandEmpty>
        <CommandGroup heading="Insert Block">
          {items.map((item, idx) => (
            <CommandItem
              key={item.id}
              value={`${item.title} ${item.keywords.join(" ")}`}
              onSelect={() => command(item)}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-1.5 text-xs",
                idx === safeIndex && "bg-accent text-accent-foreground"
              )}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-background">
                {item.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-foreground">{item.title}</div>
                <div className="truncate text-[10px] text-muted-foreground">
                  {item.description}
                </div>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  )
})
SlashCommandList.displayName = "SlashCommandList"
