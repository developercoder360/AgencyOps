export type RichTextFormat = "html" | "json"

export type RichTextVariant = "full" | "compact" | "comment" | "minimal"

export type RichTextValue = string | Record<string, unknown>

export type CalloutVariant = "info" | "success" | "warning" | "danger"

export interface MentionUserItem {
  id: string
  name: string
  avatarInitials?: string
  avatarColor?: string
  subtitle?: string
}

export interface HashtagTaskItem {
  id: string
  code: string
  title: string
}

export interface RichTextAttachment {
  id: string
  name: string
  size: string
  type: string
  url: string
}

export type ToolbarItemKey =
  | "undo"
  | "redo"
  | "heading"
  | "fontFamily"
  | "fontSize"
  | "lineHeight"
  | "bold"
  | "italic"
  | "underline"
  | "strike"
  | "code"
  | "highlight"
  | "subscript"
  | "superscript"
  | "clearFormat"
  | "textColor"
  | "textTransform"
  | "align"
  | "indent"
  | "bulletList"
  | "orderedList"
  | "taskList"
  | "blockquote"
  | "codeBlock"
  | "horizontalRule"
  | "link"
  | "image"
  | "attachment"
  | "youtube"
  | "table"
  | "callout"
  | "details"
  | "math"
  | "date"
  | "emoji"
  | "mention"
  | "findReplace"
  | "spellcheck"
  | "direction"
  | "fullscreen"
  | "shortcuts"

export interface RichTextEditorProps {
  value?: RichTextValue | null
  onChange?: (output: RichTextValue) => void
  format?: RichTextFormat
  variant?: RichTextVariant
  placeholder?: string
  readOnly?: boolean
  disabled?: boolean
  minHeight?: string
  maxHeight?: string
  autoGrow?: boolean
  autofocus?: boolean
  maxLength?: number
  mentionItems?: MentionUserItem[]
  taskItems?: HashtagTaskItem[]
  onUploadImage?: (file: File) => Promise<string>
  onAttachFiles?: (attachments: RichTextAttachment[]) => void
  onSubmit?: () => void
  toolbarItems?: ToolbarItemKey[]
  draftKey?: string
  "aria-label"?: string
  ariaLabel?: string
  id?: string
  className?: string
  editorClassName?: string
}

export interface RichTextViewerProps {
  value?: RichTextValue | null
  className?: string
  emptyFallback?: string
}
