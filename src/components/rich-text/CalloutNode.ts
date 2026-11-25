import { Node, mergeAttributes } from "@tiptap/core"
import type { CalloutVariant } from "@/types/rich-text"

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (variant?: CalloutVariant) => ReturnType
      toggleCallout: (variant?: CalloutVariant) => ReturnType
    }
  }
}

export const CalloutNode = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,

  addAttributes() {
    return {
      variant: {
        default: "info" as CalloutVariant,
        parseHTML: (el) =>
          (el.getAttribute("data-variant") as CalloutVariant | null) ?? "info",
        renderHTML: (attrs) => ({
          "data-variant": attrs.variant,
        }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-callout="true"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes({ "data-callout": "true" }, HTMLAttributes),
      0,
    ]
  },

  addCommands() {
    return {
      setCallout:
        (variant = "info") =>
        ({ commands }) => {
          return commands.wrapIn(this.name, { variant })
        },
      toggleCallout:
        (variant = "info") =>
        ({ commands }) => {
          return commands.toggleWrap(this.name, { variant })
        },
    }
  },
})
