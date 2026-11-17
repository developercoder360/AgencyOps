"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

/**
 * Synchronizes the currently open task ID with `?task=<id>` in the URL.
 * - Loading a URL with `?task=<id>` opens the panel automatically.
 * - Opening a task sets `?task=<id>` without scrolling the page.
 * - Closing removes the `task` query param.
 */
export function useTaskDeepLink() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const activeTaskId = searchParams.get("task")

  const setTaskId = React.useCallback(
    (nextId: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (nextId) {
        params.set("task", nextId)
      } else {
        params.delete("task")
      }
      const qs = params.toString()
      const targetUrl = qs ? `${pathname}?${qs}` : pathname
      router.replace(targetUrl, { scroll: false })
    },
    [pathname, router, searchParams]
  )

  const openTask = React.useCallback(
    (taskId: string) => {
      setTaskId(taskId)
    },
    [setTaskId]
  )

  const closeTask = React.useCallback(() => {
    setTaskId(null)
  }, [setTaskId])

  return {
    activeTaskId,
    openTask,
    closeTask,
    setTaskId,
  }
}
