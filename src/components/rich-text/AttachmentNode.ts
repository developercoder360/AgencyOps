import { Node, mergeAttributes } from "@tiptap/core"
import type { RichTextAttachment } from "@/types/rich-text"

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    attachment: {
      insertAttachment: (attrs: RichTextAttachment) => ReturnType
    }
  }
}

export const AttachmentNode = Node.create({
  name: "attachment",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      id: { default: "" },
      name: { default: "attachment" },
      size: { default: "" },
      mime: { default: "" },
      url: { default: "#" },
    }
  },

  parseHTML() {
    return [{ tag: 'a[data-type="attachment"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const name = String(HTMLAttributes.name ?? "File")
    const size = String(HTMLAttributes.size ?? "")
    const url = String(HTMLAttributes.url ?? "#")
    return [
      "a",
      mergeAttributes(
        {
          "data-type": "attachment",
          "data-id": HTMLAttributes.id,
          "data-name": name,
          "data-size": size,
          "data-mime": HTMLAttributes.mime,
          "data-url": url,
          href: url,
          download: name,
          target: "_blank",
          rel: "noopener noreferrer nofollow",
        },
        HTMLAttributes
      ),
      `📎 ${name}${size ? ` (${size})` : ""}`,
    ]
  },

  addCommands() {
    return {
      insertAttachment:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              id: attrs.id,
              name: attrs.name,
              size: attrs.size,
              mime: attrs.type,
              url: attrs.url,
            },
          })
        },
    }
  },
})
