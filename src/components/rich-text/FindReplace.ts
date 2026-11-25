import { Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "@tiptap/pm/state"
import { Decoration, DecorationSet } from "@tiptap/pm/view"

export interface FindReplaceStorage {
  searchTerm: string
  caseSensitive: boolean
  matches: Array<{ from: number; to: number }>
  activeIndex: number
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    findReplace: {
      setSearchQuery: (query: string, caseSensitive?: boolean) => ReturnType
      findNextMatch: () => ReturnType
      findPrevMatch: () => ReturnType
      replaceCurrentMatch: (replacement: string) => ReturnType
      replaceAllMatches: (replacement: string) => ReturnType
    }
  }
}

export const findReplacePluginKey = new PluginKey("findReplacePlugin")

function findMatchesInDoc(
  doc: Parameters<typeof DecorationSet.create>[0],
  query: string,
  caseSensitive: boolean
): Array<{ from: number; to: number }> {
  if (!query) return []
  const results: Array<{ from: number; to: number }> = []
  const needle = caseSensitive ? query : query.toLowerCase()

  doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return
    const haystack = caseSensitive ? node.text : node.text.toLowerCase()
    let index = haystack.indexOf(needle)
    while (index !== -1) {
      results.push({
        from: pos + index,
        to: pos + index + needle.length,
      })
      index = haystack.indexOf(needle, index + needle.length)
    }
  })

  return results
}

export const FindReplaceExtension = Extension.create<
  Record<string, never>,
  FindReplaceStorage
>({
  name: "findReplace",

  addStorage() {
    return {
      searchTerm: "",
      caseSensitive: false,
      matches: [],
      activeIndex: 0,
    }
  },

  addCommands() {
    const storage = this.storage
    return {
      setSearchQuery:
        (query, caseSensitive = storage.caseSensitive) =>
        ({ editor, tr, dispatch }) => {
          storage.searchTerm = query
          storage.caseSensitive = caseSensitive
          storage.matches = findMatchesInDoc(
            editor.state.doc,
            query,
            caseSensitive
          )
          storage.activeIndex = 0
          if (dispatch) dispatch(tr.setMeta(findReplacePluginKey, true))
          return true
        },
      findNextMatch:
        () =>
        ({ tr, dispatch }) => {
          const total = storage.matches.length
          if (total === 0) return false
          storage.activeIndex = (storage.activeIndex + 1) % total
          if (dispatch) dispatch(tr.setMeta(findReplacePluginKey, true))
          return true
        },
      findPrevMatch:
        () =>
        ({ tr, dispatch }) => {
          const total = storage.matches.length
          if (total === 0) return false
          storage.activeIndex = (storage.activeIndex - 1 + total) % total
          if (dispatch) dispatch(tr.setMeta(findReplacePluginKey, true))
          return true
        },
      replaceCurrentMatch:
        (replacement) =>
        ({ editor, tr, dispatch }) => {
          const match = storage.matches[storage.activeIndex]
          if (!match) return false
          tr.insertText(replacement, match.from, match.to)
          if (dispatch) dispatch(tr)
          const updatedMatches = findMatchesInDoc(
            editor.state.doc,
            storage.searchTerm,
            storage.caseSensitive
          )
          storage.matches = updatedMatches
          if (storage.activeIndex >= updatedMatches.length) {
            storage.activeIndex = 0
          }
          return true
        },
      replaceAllMatches:
        (replacement) =>
        ({ tr, dispatch }) => {
          const matches = [...storage.matches].sort((a, b) => b.from - a.from)
          if (matches.length === 0) return false
          for (const m of matches) {
            tr.insertText(replacement, m.from, m.to)
          }
          storage.matches = []
          storage.activeIndex = 0
          if (dispatch) dispatch(tr)
          return true
        },
    }
  },

  addProseMirrorPlugins() {
    const extensionStorage = this.storage
    return [
      new Plugin({
        key: findReplacePluginKey,
        state: {
          init: () => DecorationSet.empty,
          apply: (_tr, _old, _oldState, newState) => {
            if (!extensionStorage.searchTerm) return DecorationSet.empty
            const matches = findMatchesInDoc(
              newState.doc,
              extensionStorage.searchTerm,
              extensionStorage.caseSensitive
            )
            extensionStorage.matches = matches
            const decorations = matches.map((m, idx) =>
              Decoration.inline(m.from, m.to, {
                class:
                  idx === extensionStorage.activeIndex
                    ? "search-match-active"
                    : "search-match",
              })
            )
            return DecorationSet.create(newState.doc, decorations)
          },
        },
        props: {
          decorations(state) {
            return findReplacePluginKey.getState(state) as DecorationSet
          },
        },
      }),
    ]
  },
})
