import { Extension } from "@tiptap/core"

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    indent: {
      indent: () => ReturnType
      outdent: () => ReturnType
    }
  }
}

export const IndentExtension = Extension.create({
  name: "indent",

  addOptions() {
    return {
      types: ["paragraph", "heading", "blockquote"],
      minLevel: 0,
      maxLevel: 6,
      stepPx: 24,
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element) => {
              const raw = element.getAttribute("data-indent")
              const parsed = raw ? Number(raw) : 0
              return Number.isFinite(parsed) ? parsed : 0
            },
            renderHTML: (attributes) => {
              const level = Number(attributes.indent ?? 0)
              if (!level || level <= 0) return {}
              return {
                "data-indent": String(level),
                style: `margin-left: ${level * this.options.stepPx}px`,
              }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      indent:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state
          let changed = false
          tr.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              const current = Number(node.attrs.indent ?? 0)
              if (current < this.options.maxLevel) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  indent: current + 1,
                })
                changed = true
              }
              return false
            }
            return true
          })
          if (changed && dispatch) dispatch(tr)
          return changed
        },
      outdent:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state
          let changed = false
          tr.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              const current = Number(node.attrs.indent ?? 0)
              if (current > this.options.minLevel) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  indent: current - 1,
                })
                changed = true
              }
              return false
            }
            return true
          })
          if (changed && dispatch) dispatch(tr)
          return changed
        },
    }
  },
})
