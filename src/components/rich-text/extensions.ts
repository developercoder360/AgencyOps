"use client"

import { Extension, type AnyExtension } from "@tiptap/core"
import { PluginKey } from "@tiptap/pm/state"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import Highlight from "@tiptap/extension-highlight"
import {
  Color,
  FontFamily,
  FontSize,
  LineHeight,
  TextStyle,
} from "@tiptap/extension-text-style"
import TextAlign from "@tiptap/extension-text-align"
import Subscript from "@tiptap/extension-subscript"
import Superscript from "@tiptap/extension-superscript"
import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"
import {
  Table,
  TableCell,
  TableHeader,
  TableRow,
} from "@tiptap/extension-table"
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight"
import CharacterCount from "@tiptap/extension-character-count"
import Mention from "@tiptap/extension-mention"
import Youtube from "@tiptap/extension-youtube"
import Suggestion from "@tiptap/suggestion"
import { common, createLowlight } from "lowlight"
import type {
  HashtagTaskItem,
  MentionUserItem,
  RichTextVariant,
} from "@/types/rich-text"
import { AttachmentNode } from "./AttachmentNode"
import { CalloutNode } from "./CalloutNode"
import {
  DateChipNode,
  DetailsNode,
  DetailsSummaryNode,
  TaskRefNode,
} from "./DetailsAndChips"
import { EMOJI_LIST, type EmojiEntry } from "./EmojiPicker"
import { FindReplaceExtension } from "./FindReplace"
import { CustomImageExtension } from "./ImageNodeView"
import { IndentExtension } from "./IndentExtension"
import { MathNode } from "./MathNode"
import {
  EmojiSuggestionList,
  MentionList,
  TaskRefList,
} from "./MentionList"
import {
  SlashCommandList,
  buildSlashCommands,
  type SlashCommandItem,
} from "./SlashCommand"
import { cleanPastedHtml } from "./sanitize"
import { createFloatingSuggestionRenderer } from "./suggestion-renderer"
import { isValidUrl } from "./utils"

const lowlight = createLowlight(common)

const CustomTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: {
        default: null,
        parseHTML: (el) => el.style.backgroundColor || null,
        renderHTML: (attrs) =>
          attrs.backgroundColor
            ? { style: `background-color: ${String(attrs.backgroundColor)}` }
            : {},
      },
    }
  },
})

export interface CustomBehaviorStorage {
  mentionItems: MentionUserItem[]
  taskItems: HashtagTaskItem[]
  onSubmit?: () => void
  onOpenFind?: () => void
  onPickImage?: () => void
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    customBehavior: {
      updateCustomBehavior: (next: Partial<CustomBehaviorStorage>) => ReturnType
    }
  }
}

export interface BuildExtensionsOptions {
  variant: RichTextVariant
  placeholder: string
  maxLength?: number
}

export function buildRichTextExtensions({
  variant,
  placeholder,
  maxLength,
}: BuildExtensionsOptions): AnyExtension[] {
  const isFull = variant === "full"
  const isMinimal = variant === "minimal"

  const KeyboardAndPasteExtension = Extension.create<
    Record<string, never>,
    CustomBehaviorStorage
  >({
    name: "customBehavior",
    addStorage() {
      return {
        mentionItems: [],
        taskItems: [],
        onSubmit: undefined,
        onOpenFind: undefined,
        onPickImage: undefined,
      }
    },
    addCommands() {
      const storage = this.storage
      return {
        updateCustomBehavior: (next) => () => {
          Object.assign(storage, next)
          return true
        },
      }
    },
    addKeyboardShortcuts() {
      const storage = this.storage
      return {
        "Mod-Enter": () => {
          if (storage.onSubmit) {
            storage.onSubmit()
            return true
          }
          return false
        },
        "Mod-f": () => {
          storage.onOpenFind?.()
          return true
        },
        Tab: () => {
          if (
            this.editor.isActive("bulletList") ||
            this.editor.isActive("orderedList")
          ) {
            return this.editor.commands.sinkListItem("listItem")
          }
          if (this.editor.isActive("taskList")) {
            return this.editor.commands.sinkListItem("taskItem")
          }
          return this.editor.commands.indent()
        },
        "Shift-Tab": () => {
          if (
            this.editor.isActive("bulletList") ||
            this.editor.isActive("orderedList")
          ) {
            return this.editor.commands.liftListItem("listItem")
          }
          if (this.editor.isActive("taskList")) {
            return this.editor.commands.liftListItem("taskItem")
          }
          return this.editor.commands.outdent()
        },
      }
    },
    addProseMirrorPlugins() {
      return []
    },
    transformPastedHTML(html: string) {
      return cleanPastedHtml(html)
    },
  })

  const baseExtensions: AnyExtension[] = [
    StarterKit.configure({
      link: false,
      underline: false,
      codeBlock: isFull ? false : undefined,
      heading: isMinimal ? false : { levels: [1, 2, 3, 4, 5, 6] },
    }),
    Link.configure({
      openOnClick: false,
      autolink: true,
      defaultProtocol: "https",
      validate: (href) => isValidUrl(href),
      HTMLAttributes: {
        target: "_blank",
        rel: "noopener noreferrer nofollow",
      },
    }),
    Placeholder.configure({
      placeholder,
      emptyEditorClass: "is-editor-empty",
    }),
    CharacterCount.configure({
      limit: maxLength ?? null,
    }),
    KeyboardAndPasteExtension,
  ]

  if (isMinimal) {
    return baseExtensions
  }

  // Compact, Comment, and Full share Underline, Mentions, Emoji shortcode & FindReplace
  const sharedRichExtensions: AnyExtension[] = [
    Underline,
    TextStyle,
    Color,
    Highlight.configure({ multicolor: true }),
    FindReplaceExtension,
    AttachmentNode,
    Mention.configure({
      HTMLAttributes: {
        "data-type": "mention",
      },
      suggestion: {
        pluginKey: new PluginKey("mentionSuggestion"),
        items: ({ query, editor }) => {
          const q = query.trim().toLowerCase()
          const storage = (
            editor.storage as unknown as {
              customBehavior?: CustomBehaviorStorage
            }
          ).customBehavior
          const list = storage?.mentionItems ?? []
          if (!q) return list.slice(0, 8)
          return list
            .filter(
              (u) =>
                u.name.toLowerCase().includes(q) ||
                (u.subtitle?.toLowerCase().includes(q) ?? false)
            )
            .slice(0, 8)
        },
        render: createFloatingSuggestionRenderer(MentionList),
      },
    }),
    Extension.create({
      name: "emojiSuggestion",
      addProseMirrorPlugins() {
        return [
          Suggestion<EmojiEntry>({
            pluginKey: new PluginKey("emojiSuggestion"),
            editor: this.editor,
            char: ":",
            items: ({ query }) => {
              const q = query.trim().toLowerCase()
              if (!q) return EMOJI_LIST.slice(0, 8)
              return EMOJI_LIST.filter(
                (e) => e.shortcode.includes(q) || e.keywords.includes(q)
              ).slice(0, 8)
            },
            command: ({ editor, range, props }) => {
              editor
                .chain()
                .focus()
                .deleteRange(range)
                .insertContent(`${props.emoji} `)
                .run()
            },
            render: createFloatingSuggestionRenderer<EmojiEntry>(EmojiSuggestionList),
          }),
        ]
      },
    }),
  ]

  if (variant === "compact" || variant === "comment") {
    return [...baseExtensions, ...sharedRichExtensions]
  }

  // Full variant adds all remaining blocks, media, tables, typography, math, slash menu & #task refs
  const slashCommands = buildSlashCommands({
    onPickImage: () => {
      const el = document.querySelector<HTMLInputElement>(
        'input[data-rt-image-input="true"]'
      )
      el?.click()
    },
  })

  return [
    ...baseExtensions,
    ...sharedRichExtensions,
    Subscript,
    Superscript,
    FontFamily,
    FontSize,
    LineHeight,
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    IndentExtension,
    TaskList,
    TaskItem.configure({ nested: true }),
    CodeBlockLowlight.configure({ lowlight }),
    Table.configure({ resizable: true }),
    TableRow,
    TableHeader,
    CustomTableCell,
    CustomImageExtension.configure({ allowBase64: true }),
    Youtube.configure({ nocookie: true, controls: true }),
    CalloutNode,
    DetailsSummaryNode,
    DetailsNode,
    DateChipNode,
    MathNode,
    TaskRefNode,
    Extension.create({
      name: "taskRefSuggestion",
      addProseMirrorPlugins() {
        const ed = this.editor
        return [
          Suggestion<HashtagTaskItem>({
            pluginKey: new PluginKey("taskRefSuggestion"),
            editor: ed,
            char: "#",
            items: ({ query }) => {
              const q = query.trim().toLowerCase()
              const storage = (
                ed.storage as unknown as {
                  customBehavior?: CustomBehaviorStorage
                }
              ).customBehavior
              const list = storage?.taskItems ?? []
              if (!q) return list.slice(0, 8)
              return list
                .filter(
                  (t) =>
                    t.code.toLowerCase().includes(q) ||
                    t.title.toLowerCase().includes(q)
                )
                .slice(0, 8)
            },
            command: ({ editor, range, props }) => {
              editor
                .chain()
                .focus()
                .deleteRange(range)
                .insertContent([
                  {
                    type: "taskRef",
                    attrs: { id: props.id, code: props.code, title: props.title },
                  },
                  { type: "text", text: " " },
                ])
                .run()
            },
            render: createFloatingSuggestionRenderer<HashtagTaskItem>(TaskRefList),
          }),
        ]
      },
    }),
    Extension.create({
      name: "slashCommand",
      addProseMirrorPlugins() {
        return [
          Suggestion<SlashCommandItem>({
            pluginKey: new PluginKey("slashCommandSuggestion"),
            editor: this.editor,
            char: "/",
            startOfLine: false,
            items: ({ query }) => {
              const q = query.trim().toLowerCase()
              if (!q) return slashCommands
              return slashCommands.filter(
                (item) =>
                  item.title.toLowerCase().includes(q) ||
                  item.keywords.some((kw) => kw.includes(q))
              )
            },
            command: ({ editor, range, props }) => {
              props.run({ editor, range })
            },
            render: createFloatingSuggestionRenderer<SlashCommandItem>(SlashCommandList),
          }),
        ]
      },
    }),
  ]
}
