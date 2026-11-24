import { format } from "date-fns"
import type { Task } from "@/types"

export interface TaskTimelineSummary {
  start: string
  end: string
  complete: string
}

export function formatTimelineTimestamp(
  dateStr?: string,
  fallbackActivityIso?: string,
  defaultTime = "09:00 AM"
): string {
  if (!dateStr) return "—"

  if (dateStr.includes("T") || /\d{2}:\d{2}/.test(dateStr)) {
    const parsed = new Date(dateStr)
    if (!Number.isNaN(parsed.getTime())) {
      return format(parsed, "MMM d, yyyy · h:mm a")
    }
  }

  const parts = dateStr.split("-").map(Number)
  if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
    const [y, m, d] = parts
    const localDate = new Date(y, m - 1, d)
    let timePart = defaultTime
    if (fallbackActivityIso && fallbackActivityIso.includes("T")) {
      const actDate = new Date(fallbackActivityIso)
      if (!Number.isNaN(actDate.getTime())) {
        timePart = format(actDate, "h:mm a")
      }
    }
    return `${format(localDate, "MMM d, yyyy")} · ${timePart}`
  }

  return dateStr
}

export function resolveTaskTimeline(task: Task): TaskTimelineSummary {
  const activities = task.activity ?? []
  const createdActivity = activities.find((a) =>
    a.action.toLowerCase().includes("created")
  )
  const completedActivity = [...activities]
    .reverse()
    .find(
      (a) =>
        a.detail?.includes("Complete") ||
        a.action.toLowerCase().includes("complete")
    )

  return {
    start: formatTimelineTimestamp(
      task.startDate || task.createdAt,
      createdActivity?.timestamp,
      "09:00 AM"
    ),
    end: formatTimelineTimestamp(task.dueDate, undefined, "06:00 PM"),
    complete: task.completedAt
      ? formatTimelineTimestamp(
          task.completedAt,
          completedActivity?.timestamp,
          "05:00 PM"
        )
      : "—",
  }
}
