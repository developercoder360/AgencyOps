"use client"

import * as React from "react"
import type { Editor } from "@tiptap/react"
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  AtSign,
  Bold,
  Calendar,
  CaseSensitive,
  CheckSquare,
  ChevronRightSquare,
  Code,
  Code2,
  Eraser,
  Heading,
  Highlighter,
  ImagePlus,
  IndentDecrease,
  IndentIncrease,
  Info,
  Italic,
  Keyboard,
  Languages,
  Link2,
  List,
  ListOrdered,
  Maximize2,
  Minimize2,
  Minus,
  MoreHorizontal,
  Palette,
  Paperclip,
  Quote,
  Redo,
  Search,
  Sigma,
  Smile,
  SpellCheck,
  Strikethrough,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Table,
  Underline as UnderlineIcon,
  Undo,
  Video,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { RichTextVariant, ToolbarItemKey } from "@/types/rich-text"
import { ColorPicker } from "./ColorPicker"
import { EmojiPicker } from "./EmojiPicker"
import { LinkPopover } from "./LinkPopover"
import { TablePicker } from "./TablePicker"
import { toYouTubeEmbedUrl } from "./utils"
import { cn } from "cn"

const FONT_FAMILIES = [
  { label: "Default", value: "" },
  { label: "Sans", value: "Inter, ui-sans-serif, system-ui, sans-serif" },
  { label: "Serif", value: "Georgia, Cambria, serif" },
  { label: "Mono", value: "ui-monospace, SFMono-Regular, monospace" },
]

const FONT_SIZES = ["12px", "14px", "16px", "18px", "22px", "28px"]
const LINE_HEIGHTS = ["1.25", "1.5", "1.75", "2.0"]
const CODE_LANGUAGES = [
  "plaintext",
  "typescript",
  "javascript",
  "tsx",
  "json",
  "css",
  "html",
  "bash",
  "sql",
  "python",
]

interface ToolbarProps {
  editor: Editor
  variant: RichTextVariant
  toolbarItems?: ToolbarItemKey[]
  disabled?: boolean
  onPickImage: () => void
  onPickAttachment: () => void
  onOpenFindReplace: () => void
  onOpenShortcuts: () => void
  spellCheck: boolean
  onToggleSpellCheck: () => void
  dir: "ltr" | "rtl"
  onToggleDir: () => void
  isFullscreen: boolean
  onToggleFullscreen: () => void
}

function getDefaultItems(variant: RichTextVariant): Set<ToolbarItemKey> {
  if (variant === "minimal") {
    return new Set(["bold", "italic", "link", "bulletList", "orderedList"])
  }
  if (variant === "compact" || variant === "comment") {
    return new Set([
      "undo",
      "redo",
      "bold",
      "italic",
      "underline",
      "strike",
      "code",
      "bulletList",
      "orderedList",
      "link",
      "emoji",
      "mention",
      ...(variant === "comment" ? (["attachment"] as const) : []),
    ])
  }
  // Full variant includes everything
  return new Set<ToolbarItemKey>([
    "undo",
    "redo",
    "heading",
    "fontFamily",
    "fontSize",
    "lineHeight",
    "bold",
    "italic",
    "underline",
    "strike",
    "code",
    "highlight",
    "subscript",
    "superscript",
    "textColor",
    "textTransform",
    "clearFormat",
    "align",
    "indent",
    "bulletList",
    "orderedList",
    "taskList",
    "blockquote",
    "codeBlock",
    "horizontalRule",
    "link",
    "image",
    "attachment",
    "youtube",
    "table",
    "callout",
    "details",
    "math",
    "date",
    "emoji",
    "mention",
    "findReplace",
    "spellcheck",
    "direction",
    "fullscreen",
    "shortcuts",
  ])
}

interface TBtnProps {
  active?: boolean
  disabled?: boolean
  onClick?: () => void
  label: string
  shortcut?: string
  children: React.ReactNode
}

function TBtn({
  active = false,
  disabled = false,
  onClick,
  label,
  shortcut,
  children,
}: TBtnProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          disabled={disabled}
          onClick={onClick}
          aria-label={label}
          aria-pressed={active}
          className={cn(
            "shrink-0",
            active && "bg-primary/15 text-primary hover:bg-primary/20"
          )}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-[11px]">
        <span>{label}</span>
        {shortcut ? (
          <span className="ml-1.5 font-mono text-[10px] opacity-75">
            {shortcut}
          </span>
        ) : null}
      </TooltipContent>
    </Tooltip>
  )
}

export function Toolbar({
  editor,
  variant,
  toolbarItems,
  disabled = false,
  onPickImage,
  onPickAttachment,
  onOpenFindReplace,
  onOpenShortcuts,
  spellCheck,
  onToggleSpellCheck,
  dir,
  onToggleDir,
  isFullscreen,
  onToggleFullscreen,
}: ToolbarProps) {
  const [youtubeOpen, setYoutubeOpen] = React.useState(false)
  const [youtubeUrl, setYoutubeUrl] = React.useState("")
  const [youtubeError, setYoutubeError] = React.useState("")
  const toolbarRef = React.useRef<HTMLDivElement | null>(null)

  const enabled = React.useMemo(
    () =>
      toolbarItems
        ? new Set<ToolbarItemKey>(toolbarItems)
        : getDefaultItems(variant),
    [variant, toolbarItems]
  )

  const has = (key: ToolbarItemKey) => enabled.has(key)

  function transformSelectedText(mode: "upper" | "lower" | "cap") {
    const { from, to, empty } = editor.state.selection
    if (empty) return
    const text = editor.state.doc.textBetween(from, to, " ")
    const transformed =
      mode === "upper"
        ? text.toUpperCase()
        : mode === "lower"
          ? text.toLowerCase()
          : text.replace(/\b\w/g, (ch) => ch.toUpperCase())
    editor.chain().focus().insertContentAt({ from, to }, transformed).run()
  }

  function handleInsertYoutube(e: React.FormEvent) {
    e.preventDefault()
    const embed = toYouTubeEmbedUrl(youtubeUrl)
    if (!embed) {
      setYoutubeError("Enter a valid YouTube or Vimeo URL")
      return
    }
    editor.chain().focus().setYoutubeVideo({ src: embed }).run()
    setYoutubeUrl("")
    setYoutubeError("")
    setYoutubeOpen(false)
  }

  function handleToolbarKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return
    const buttons = Array.from(
      toolbarRef.current?.querySelectorAll<HTMLButtonElement>(
        "button:not([disabled])"
      ) ?? []
    )
    const idx = buttons.indexOf(document.activeElement as HTMLButtonElement)
    if (idx === -1) return
    e.preventDefault()
    const nextIdx =
      e.key === "ArrowRight"
        ? (idx + 1) % buttons.length
        : (idx - 1 + buttons.length) % buttons.length
    buttons[nextIdx]?.focus()
  }

  const activeHeading = [1, 2, 3, 4, 5, 6].find((lvl) =>
    editor.isActive("heading", { level: lvl })
  )

  const isCodeBlockActive = editor.isActive("codeBlock")
  const activeCodeLang = isCodeBlockActive
    ? String(editor.getAttributes("codeBlock").language ?? "plaintext")
    : "plaintext"

  return (
    <div
      ref={toolbarRef}
      role="toolbar"
      aria-label="Rich text formatting toolbar"
      onKeyDown={handleToolbarKeyDown}
      className={cn(
        "sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/35 px-2 py-1.5 backdrop-blur-xs",
        disabled && "pointer-events-none opacity-60"
      )}
    >
      {/* History */}
      {(has("undo") || has("redo")) ? (
        <>
          {has("undo") ? (
            <TBtn
              label="Undo"
              shortcut="Ctrl+Z"
              disabled={!editor.can().undo()}
              onClick={() => editor.chain().focus().undo().run()}
            >
              <Undo className="size-3.5" />
            </TBtn>
          ) : null}
          {has("redo") ? (
            <TBtn
              label="Redo"
              shortcut="Ctrl+Y"
              disabled={!editor.can().redo()}
              onClick={() => editor.chain().focus().redo().run()}
            >
              <Redo className="size-3.5" />
            </TBtn>
          ) : null}
          <Separator orientation="vertical" className="mx-1 h-4" />
        </>
      ) : null}

      {/* Block type + Font */}
      {has("heading") ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="h-7 gap-1 px-2 text-xs"
              aria-label="Block heading"
            >
              <Heading className="size-3.5" />
              <span>{activeHeading ? `H${activeHeading}` : "Text"}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            <DropdownMenuItem
              onClick={() => editor.chain().focus().setParagraph().run()}
            >
              Paragraph
            </DropdownMenuItem>
            {([1, 2, 3, 4, 5, 6] as const).map((lvl) => (
              <DropdownMenuItem
                key={lvl}
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: lvl }).run()
                }
              >
                Heading {lvl}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      {isCodeBlockActive ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="secondary"
              size="xs"
              className="h-7 gap-1 px-2 font-mono text-[11px]"
            >
              {activeCodeLang}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-56 overflow-y-auto">
            {CODE_LANGUAGES.map((lang) => (
              <DropdownMenuItem
                key={lang}
                onClick={() =>
                  editor
                    .chain()
                    .focus()
                    .updateAttributes("codeBlock", { language: lang })
                    .run()
                }
              >
                {lang}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      {(has("fontFamily") || has("fontSize") || has("lineHeight")) ? (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                className="hidden h-7 px-2 text-xs sm:inline-flex"
                aria-label="Typography options"
              >
                Font
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              {has("fontFamily") ? (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Font Family</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {FONT_FAMILIES.map((f) => (
                      <DropdownMenuItem
                        key={f.label}
                        onClick={() =>
                          f.value
                            ? editor.chain().focus().setFontFamily(f.value).run()
                            : editor.chain().focus().unsetFontFamily().run()
                        }
                      >
                        {f.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              ) : null}
              {has("fontSize") ? (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Font Size</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {FONT_SIZES.map((sz) => (
                      <DropdownMenuItem
                        key={sz}
                        onClick={() =>
                          editor.chain().focus().setFontSize(sz).run()
                        }
                      >
                        {sz}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => editor.chain().focus().unsetFontSize().run()}
                    >
                      Reset Size
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              ) : null}
              {has("lineHeight") ? (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Line Height</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {LINE_HEIGHTS.map((lh) => (
                      <DropdownMenuItem
                        key={lh}
                        onClick={() =>
                          editor.chain().focus().setLineHeight(lh).run()
                        }
                      >
                        {lh}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() =>
                        editor.chain().focus().unsetLineHeight().run()
                      }
                    >
                      Reset Line Height
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
          <Separator orientation="vertical" className="mx-1 h-4" />
        </>
      ) : null}

      {/* Inline Formatting */}
      {has("bold") ? (
        <TBtn
          label="Bold"
          shortcut="Ctrl+B"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="size-3.5" />
        </TBtn>
      ) : null}
      {has("italic") ? (
        <TBtn
          label="Italic"
          shortcut="Ctrl+I"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-3.5" />
        </TBtn>
      ) : null}
      {has("underline") ? (
        <TBtn
          label="Underline"
          shortcut="Ctrl+U"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="size-3.5" />
        </TBtn>
      ) : null}
      {has("strike") ? (
        <TBtn
          label="Strikethrough"
          shortcut="Ctrl+Shift+S"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="size-3.5" />
        </TBtn>
      ) : null}
      {has("code") ? (
        <TBtn
          label="Inline Code"
          shortcut="Ctrl+E"
          active={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code className="size-3.5" />
        </TBtn>
      ) : null}

      {has("textColor") ? (
        <ColorPicker
          mode="text"
          currentColor={
            typeof editor.getAttributes("textStyle").color === "string"
              ? editor.getAttributes("textStyle").color
              : undefined
          }
          onSelect={(color) =>
            color
              ? editor.chain().focus().setColor(color).run()
              : editor.chain().focus().unsetColor().run()
          }
          trigger={
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Text color"
              title="Text color"
            >
              <Palette className="size-3.5" />
            </Button>
          }
        />
      ) : null}

      {has("highlight") ? (
        <ColorPicker
          mode="highlight"
          currentColor={
            typeof editor.getAttributes("highlight").color === "string"
              ? editor.getAttributes("highlight").color
              : undefined
          }
          onSelect={(color) =>
            color
              ? editor.chain().focus().toggleHighlight({ color }).run()
              : editor.chain().focus().unsetHighlight().run()
          }
          trigger={
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Highlight color"
              title="Highlight color"
              className={cn(
                editor.isActive("highlight") && "bg-primary/15 text-primary"
              )}
            >
              <Highlighter className="size-3.5" />
            </Button>
          }
        />
      ) : null}

      <Separator orientation="vertical" className="mx-1 h-4" />

      {/* Lists & Blocks */}
      {has("bulletList") ? (
        <TBtn
          label="Bullet List"
          shortcut="Ctrl+Shift+8"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="size-3.5" />
        </TBtn>
      ) : null}
      {has("orderedList") ? (
        <TBtn
          label="Ordered List"
          shortcut="Ctrl+Shift+7"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="size-3.5" />
        </TBtn>
      ) : null}
      {has("taskList") ? (
        <TBtn
          label="Checklist"
          shortcut="Ctrl+Shift+9"
          active={editor.isActive("taskList")}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
        >
          <CheckSquare className="size-3.5" />
        </TBtn>
      ) : null}
      {has("blockquote") ? (
        <TBtn
          label="Blockquote"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="size-3.5" />
        </TBtn>
      ) : null}
      {has("codeBlock") ? (
        <TBtn
          label="Code Block"
          active={isCodeBlockActive}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <Code2 className="size-3.5" />
        </TBtn>
      ) : null}

      {/* Alignment (compact dropdown to save bar width) */}
      {has("align") ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Text alignment"
              title="Alignment"
            >
              <AlignLeft className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="flex w-auto gap-1 p-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              aria-label="Align left"
            >
              <AlignLeft className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => editor.chain().focus().setTextAlign("center").run()}
              aria-label="Align center"
            >
              <AlignCenter className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              aria-label="Align right"
            >
              <AlignRight className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => editor.chain().focus().setTextAlign("justify").run()}
              aria-label="Justify"
            >
              <AlignJustify className="size-3.5" />
            </Button>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      <Separator orientation="vertical" className="mx-1 h-4" />

      {/* Insert Tools */}
      {has("link") ? (
        <LinkPopover
          editor={editor}
          trigger={
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Insert Link"
              title="Insert Link (Ctrl+K)"
              className={cn(
                editor.isActive("link") && "bg-primary/15 text-primary"
              )}
            >
              <Link2 className="size-3.5" />
            </Button>
          }
        />
      ) : null}

      {has("image") ? (
        <TBtn label="Upload Image" onClick={onPickImage}>
          <ImagePlus className="size-3.5" />
        </TBtn>
      ) : null}

      {has("attachment") ? (
        <TBtn label="Attach File" onClick={onPickAttachment}>
          <Paperclip className="size-3.5" />
        </TBtn>
      ) : null}

      {has("table") ? (
        <TablePicker
          onSelect={(rows, cols) =>
            editor
              .chain()
              .focus()
              .insertTable({ rows, cols, withHeaderRow: true })
              .run()
          }
          trigger={
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Insert Table"
              title="Insert Table"
              className={cn(
                editor.isActive("table") && "bg-primary/15 text-primary"
              )}
            >
              <Table className="size-3.5" />
            </Button>
          }
        />
      ) : null}

      {has("emoji") ? (
        <EmojiPicker
          onSelect={(emoji) =>
            editor.chain().focus().insertContent(`${emoji} `).run()
          }
          trigger={
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Insert Emoji"
              title="Insert Emoji"
            >
              <Smile className="size-3.5" />
            </Button>
          }
        />
      ) : null}

      {has("mention") ? (
        <TBtn
          label="Mention (@)"
          onClick={() => editor.chain().focus().insertContent("@").run()}
        >
          <AtSign className="size-3.5" />
        </TBtn>
      ) : null}

      {has("youtube") ? (
        <Popover
          open={youtubeOpen}
          onOpenChange={(next) => {
            setYoutubeOpen(next)
            if (!next) setYoutubeError("")
          }}
        >
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Embed YouTube or Vimeo"
              title="Embed Video URL"
            >
              <Video className="size-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 p-2.5">
            <form onSubmit={handleInsertYoutube} className="space-y-2">
              <div className="text-xs font-medium">Embed YouTube / Vimeo</div>
              <Input
                value={youtubeUrl}
                onChange={(e) => {
                  setYoutubeUrl(e.target.value)
                  setYoutubeError("")
                }}
                placeholder="https://www.youtube.com/watch?v=..."
                className="h-8 text-xs"
              />
              {youtubeError ? (
                <p className="text-[11px] text-destructive">{youtubeError}</p>
              ) : null}
              <div className="flex justify-end gap-1.5">
                <Button type="submit" size="xs">
                  Embed
                </Button>
              </div>
            </form>
          </PopoverContent>
        </Popover>
      ) : null}

      {/* Overflow / More Menu (advanced inserts, utilities, shortcuts) */}
      {variant !== "minimal" ? (
        <div className="ml-auto flex items-center gap-0.5">
          {has("findReplace") ? (
            <TBtn
              label="Find & Replace"
              shortcut="Ctrl+F"
              onClick={onOpenFindReplace}
            >
              <Search className="size-3.5" />
            </TBtn>
          ) : null}

          {has("fullscreen") ? (
            <TBtn
              label={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              onClick={onToggleFullscreen}
            >
              {isFullscreen ? (
                <Minimize2 className="size-3.5" />
              ) : (
                <Maximize2 className="size-3.5" />
              )}
            </TBtn>
          ) : null}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="More formatting and tools"
                title="More tools"
              >
                <MoreHorizontal className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {has("subscript") ? (
                <DropdownMenuItem
                  onClick={() => editor.chain().focus().toggleSubscript().run()}
                >
                  <SubscriptIcon className="size-3.5" />
                  Subscript
                </DropdownMenuItem>
              ) : null}
              {has("superscript") ? (
                <DropdownMenuItem
                  onClick={() => editor.chain().focus().toggleSuperscript().run()}
                >
                  <SuperscriptIcon className="size-3.5" />
                  Superscript
                </DropdownMenuItem>
              ) : null}
              {has("indent") ? (
                <>
                  <DropdownMenuItem
                    onClick={() => editor.chain().focus().indent().run()}
                  >
                    <IndentIncrease className="size-3.5" />
                    Indent
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => editor.chain().focus().outdent().run()}
                  >
                    <IndentDecrease className="size-3.5" />
                    Outdent
                  </DropdownMenuItem>
                </>
              ) : null}
              {has("textTransform") ? (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <CaseSensitive className="size-3.5" />
                    Text Transform
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem
                      onClick={() => transformSelectedText("upper")}
                    >
                      UPPERCASE
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => transformSelectedText("lower")}
                    >
                      lowercase
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => transformSelectedText("cap")}
                    >
                      Capitalize Words
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              ) : null}
              {has("clearFormat") ? (
                <DropdownMenuItem
                  onClick={() =>
                    editor.chain().focus().unsetAllMarks().clearNodes().run()
                  }
                >
                  <Eraser className="size-3.5" />
                  Clear Formatting
                </DropdownMenuItem>
              ) : null}

              {(has("callout") ||
                has("details") ||
                has("math") ||
                has("date") ||
                has("horizontalRule")) ? (
                <>
                  <DropdownMenuSeparator />
                  {has("horizontalRule") ? (
                    <DropdownMenuItem
                      onClick={() =>
                        editor.chain().focus().setHorizontalRule().run()
                      }
                    >
                      <Minus className="size-3.5" />
                      Divider Line
                    </DropdownMenuItem>
                  ) : null}
                  {has("callout") ? (
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <Info className="size-3.5" />
                        Callout Block
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem
                          onClick={() =>
                            editor.chain().focus().setCallout("info").run()
                          }
                        >
                          Info Callout
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            editor.chain().focus().setCallout("success").run()
                          }
                        >
                          Success Callout
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            editor.chain().focus().setCallout("warning").run()
                          }
                        >
                          Warning Callout
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            editor.chain().focus().setCallout("danger").run()
                          }
                        >
                          Danger Callout
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  ) : null}
                  {has("details") ? (
                    <DropdownMenuItem
                      onClick={() =>
                        editor.chain().focus().insertDetailsBlock().run()
                      }
                    >
                      <ChevronRightSquare className="size-3.5" />
                      Collapsible Toggle
                    </DropdownMenuItem>
                  ) : null}
                  {has("math") ? (
                    <DropdownMenuItem
                      onClick={() =>
                        editor.chain().focus().insertMath("E = mc^2").run()
                      }
                    >
                      <Sigma className="size-3.5" />
                      Math Formula (LaTeX)
                    </DropdownMenuItem>
                  ) : null}
                  {has("date") ? (
                    <DropdownMenuItem
                      onClick={() =>
                        editor.chain().focus().insertDateChip().run()
                      }
                    >
                      <Calendar className="size-3.5" />
                      Insert Date Chip
                    </DropdownMenuItem>
                  ) : null}
                </>
              ) : null}

              <DropdownMenuSeparator />
              {has("spellcheck") ? (
                <DropdownMenuItem onClick={onToggleSpellCheck}>
                  <SpellCheck className="size-3.5" />
                  Spellcheck: {spellCheck ? "On" : "Off"}
                </DropdownMenuItem>
              ) : null}
              {has("direction") ? (
                <DropdownMenuItem onClick={onToggleDir}>
                  <Languages className="size-3.5" />
                  Direction: {dir.toUpperCase()}
                </DropdownMenuItem>
              ) : null}
              {has("shortcuts") ? (
                <DropdownMenuItem onClick={onOpenShortcuts}>
                  <Keyboard className="size-3.5" />
                  Keyboard Shortcuts
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : null}
    </div>
  )
}
