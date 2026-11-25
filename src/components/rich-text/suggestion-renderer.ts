import type * as React from "react"
import { ReactRenderer } from "@tiptap/react"
import type { SuggestionOptions, SuggestionProps } from "@tiptap/suggestion"
import type { SuggestionListRef } from "./MentionList"

function positionFloatingBox(
  el: HTMLElement,
  clientRect?: (() => DOMRect | null) | null
) {
  const rect = clientRect?.()
  if (!rect) return
  const top = Math.min(window.innerHeight - 280, rect.bottom + 6)
  const left = Math.min(window.innerWidth - 300, Math.max(8, rect.left))
  el.style.top = `${top}px`
  el.style.left = `${left}px`
}

export function createFloatingSuggestionRenderer<
  TItem,
  TSelected = TItem,
>(
  Component: React.ForwardRefExoticComponent<
    { items: TItem[]; command: (item: TSelected) => void } & React.RefAttributes<SuggestionListRef>
  >
): SuggestionOptions<TItem, TSelected>["render"] {
  return () => {
    let component: ReactRenderer<SuggestionListRef> | null = null
    let container: HTMLDivElement | null = null

    return {
      onStart: (props: SuggestionProps<TItem, TSelected>) => {
        component = new ReactRenderer(
          Component as unknown as React.ComponentType<Record<string, unknown>>,
          {
            props: props as unknown as Record<string, unknown>,
            editor: props.editor,
          }
        )
        container = document.createElement("div")
        container.style.position = "fixed"
        container.style.zIndex = "9999"
        container.appendChild(component.element)
        document.body.appendChild(container)
        positionFloatingBox(container, props.clientRect)
      },
      onUpdate: (props: SuggestionProps<TItem, TSelected>) => {
        if (!component || !container) return
        component.updateProps(props as unknown as Record<string, unknown>)
        positionFloatingBox(container, props.clientRect)
      },
      onKeyDown: (props) => {
        if (props.event.key === "Escape") {
          container?.remove()
          container = null
          component?.destroy()
          component = null
          return true
        }
        return component?.ref?.onKeyDown(props) ?? false
      },
      onExit: () => {
        container?.remove()
        container = null
        component?.destroy()
        component = null
      },
    }
  }
}
