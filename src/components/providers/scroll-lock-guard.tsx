"use client"

import * as React from "react"

const OPEN_MODAL_SELECTOR = [
  '[data-slot="sheet-content"][data-state="open"]',
  '[data-slot="dialog-content"][data-state="open"]',
  '[data-slot="select-content"][data-state="open"]',
  '[data-slot="dropdown-menu-content"][data-state="open"]',
].join(",")

function hasVisibleOpenOverlay(): boolean {
  const nodes = document.querySelectorAll(OPEN_MODAL_SELECTOR)
  for (const node of nodes) {
    if (getComputedStyle(node).display !== "none") {
      return true
    }
  }
  return false
}

function clearStuckScrollLocks() {
  if (hasVisibleOpenOverlay()) return

  const body = document.body
  const html = document.documentElement

  if (body.hasAttribute("data-scroll-locked")) {
    body.removeAttribute("data-scroll-locked")
  }
  if (body.style.pointerEvents === "none") {
    body.style.removeProperty("pointer-events")
  }
  if (body.style.overflow === "hidden" || body.style.overflowY === "hidden") {
    body.style.removeProperty("overflow")
    body.style.removeProperty("overflow-y")
  }
  if (body.style.marginRight) {
    body.style.removeProperty("margin-right")
  }
  if (body.style.paddingRight) {
    body.style.removeProperty("padding-right")
  }
  if (html.style.overflow === "hidden" || html.style.overflowY === "hidden") {
    html.style.removeProperty("overflow")
    html.style.removeProperty("overflow-y")
  }

  for (const child of Array.from(body.children)) {
    if (child.id === "recharts_measurement_span") continue
    if (child.getAttribute("aria-hidden") === "true") {
      child.removeAttribute("aria-hidden")
    }
    if (child.hasAttribute("inert")) {
      child.removeAttribute("inert")
    }
  }
}

/**
 * Event-driven safety net for stuck Radix / react-remove-scroll body locks.
 * Never polls on a timer; only runs on body mutations or route changes, and
 * strictly no-ops whenever any modal overlay is visibly open.
 */
export function ScrollLockGuard() {
  React.useEffect(() => {
    let rafId = 0

    const scheduleCheck = () => {
      if (rafId) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        rafId = 0
        clearStuckScrollLocks()
      })
    }

    const observer = new MutationObserver(scheduleCheck)
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["style", "data-scroll-locked"],
      childList: true,
    })

    window.addEventListener("agencyops:route-change", scheduleCheck)
    window.addEventListener("popstate", scheduleCheck)

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      observer.disconnect()
      window.removeEventListener("agencyops:route-change", scheduleCheck)
      window.removeEventListener("popstate", scheduleCheck)
    }
  }, [])

  return null
}
