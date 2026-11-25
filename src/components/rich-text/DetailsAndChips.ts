import { Node, mergeAttributes } from "@tiptap/core"

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    detailsBlock: {
      insertDetailsBlock: (summaryText?: string) => ReturnType
    }
    dateChip: {
      insertDateChip: (isoDate?: string) => ReturnType
    }
  }
}

export const DetailsSummaryNode = Node.create({
  name: "detailsSummary",
  content: "inline*",
  defining: true,
  selectable: false,

  parseHTML() {
    return [{ tag: "details[data-details] > summary" }]
  },

  renderHTML({ HTMLAttributes }) {
    return ["summary", mergeAttributes(HTMLAttributes), 0]
  },
})

export const DetailsNode = Node.create({
  name: "detailsBlock",
  group: "block",
  content: "detailsSummary block+",
  defining: true,

  addAttributes() {
    return {
      open: {
        default: true,
        parseHTML: (el) => el.hasAttribute("open"),
        renderHTML: (attrs) => (attrs.open ? { open: "true" } : {}),
      },
    }
  },

  parseHTML() {
    return [{ tag: "details[data-details]" }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "details",
      mergeAttributes({ "data-details": "true" }, HTMLAttributes),
      0,
    ]
  },

  addCommands() {
    return {
      insertDetailsBlock:
        (summaryText = "Toggle details") =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { open: true },
            content: [
              {
                type: "detailsSummary",
                content: [{ type: "text", text: summaryText }],
              },
              {
                type: "paragraph",
                content: [{ type: "text", text: "Collapsible content..." }],
              },
            ],
          })
        },
    }
  },
})

export const DateChipNode = Node.create({
  name: "dateChip",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      date: {
        default: "",
        parseHTML: (el) => el.getAttribute("data-date") ?? "",
        renderHTML: (attrs) => ({ "data-date": attrs.date }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-type="date-chip"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const dateVal = String(HTMLAttributes["data-date"] ?? HTMLAttributes.date ?? "")
    return [
      "span",
      mergeAttributes({ "data-type": "date-chip" }, HTMLAttributes),
      `📅 ${dateVal}`,
    ]
  },

  addCommands() {
    return {
      insertDateChip:
        (isoDate) =>
        ({ commands }) => {
          const val = isoDate || new Date().toISOString().slice(0, 10)
          return commands.insertContent({
            type: this.name,
            attrs: { date: val },
          })
        },
    }
  },
})

export const TaskRefNode = Node.create({
  name: "taskRef",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      id: { default: "" },
      code: { default: "" },
      title: { default: "" },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-type="task-ref"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const code = String(HTMLAttributes.code ?? "TSK")
    return [
      "span",
      mergeAttributes(
        {
          "data-type": "task-ref",
          "data-id": HTMLAttributes.id,
          "data-code": code,
          title: String(HTMLAttributes.title ?? ""),
        },
        HTMLAttributes
      ),
      `#${code}`,
    ]
  },
})
