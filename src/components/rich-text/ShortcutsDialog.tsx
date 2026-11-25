"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ShortcutsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SHORTCUT_GROUPS = [
  {
    title: "Text Formatting",
    items: [
      { label: "Bold", keys: "Ctrl / Cmd + B" },
      { label: "Italic", keys: "Ctrl / Cmd + I" },
      { label: "Underline", keys: "Ctrl / Cmd + U" },
      { label: "Strikethrough", keys: "Ctrl / Cmd + Shift + S" },
      { label: "Inline Code", keys: "Ctrl / Cmd + E" },
      { label: "Subscript / Superscript", keys: "Ctrl + , / Ctrl + ." },
    ],
  },
  {
    title: "Blocks & Lists",
    items: [
      { label: "Headings 1–6", keys: "Ctrl / Cmd + Alt + 1..6" },
      { label: "Bullet List", keys: "Ctrl / Cmd + Shift + 8" },
      { label: "Ordered List", keys: "Ctrl / Cmd + Shift + 7" },
      { label: "Task Checklist", keys: "Ctrl / Cmd + Shift + 9" },
      { label: "Blockquote", keys: "Ctrl / Cmd + Shift + B" },
      { label: "Indent / Outdent", keys: "Tab / Shift + Tab" },
      { label: "Hard Break", keys: "Shift + Enter" },
    ],
  },
  {
    title: "Commands & Editor",
    items: [
      { label: "Slash Insert Menu", keys: "/" },
      { label: "Mention Teammate", keys: "@" },
      { label: "Task Reference", keys: "#" },
      { label: "Emoji Shortcode", keys: ":smile" },
      { label: "Find & Replace", keys: "Ctrl / Cmd + F" },
      { label: "Paste Plain Text", keys: "Ctrl / Cmd + Shift + V" },
      { label: "Undo / Redo", keys: "Ctrl + Z / Ctrl + Y" },
      { label: "Submit Form / Comment", keys: "Ctrl / Cmd + Enter" },
    ],
  },
]

export function ShortcutsDialog({
  open,
  onOpenChange,
}: ShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Speed up editing with keyboard shortcuts and Markdown triggers.
          </DialogDescription>
        </DialogHeader>
        <div className="grid max-h-[60vh] gap-4 overflow-y-auto py-1 sm:grid-cols-2">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title} className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.title}
              </h4>
              <div className="space-y-1.5 rounded-lg border border-border bg-muted/20 p-2.5">
                {group.items.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="text-foreground">{item.label}</span>
                    <kbd className="shrink-0 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                      {item.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
