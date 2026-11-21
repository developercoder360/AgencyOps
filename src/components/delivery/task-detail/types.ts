"use client"

import * as React from "react"
import type { TaskPriority, TaskStatus } from "@/types"

export const TASK_STATUSES: TaskStatus[] = [
  "Open",
  "Progress",
  "QA Review",
  "On Hold",
  "Re-Draw",
  "Complete",
]

export const TASK_PRIORITIES: TaskPriority[] = ["Regular", "High", "Urgent"]

export const QA_FAIL_CATEGORIES = [
  "Responsive / Layout",
  "Brand & Copy",
  "Accessibility / Contrast",
  "Functional Bug",
  "Missing Asset",
]

export const PRIORITY_META: Record<
  TaskPriority,
  { label: string; flagClass: string; badgeClass: string }
> = {
  Regular: {
    label: "Regular",
    flagClass: "text-muted-foreground",
    badgeClass:
      "bg-muted text-muted-foreground border-border",
  },
  High: {
    label: "High",
    flagClass: "text-amber-600 dark:text-amber-400",
    badgeClass:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
  },
  Urgent: {
    label: "Urgent",
    flagClass: "text-rose-600 dark:text-rose-400",
    badgeClass:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30",
  },
}

/**
 * External clock store for client-only "now" without calling Date.now() during SSR
 * or calling setState synchronously inside useEffect.
 */
let currentNowMs: number | null = null
const clockListeners = new Set<() => void>()
let clockInterval: ReturnType<typeof setInterval> | null = null

function subscribeClock(listener: () => void) {
  clockListeners.add(listener)
  if (typeof window !== "undefined" && currentNowMs === null) {
    currentNowMs = Date.now()
  }
  if (typeof window !== "undefined" && !clockInterval) {
    clockInterval = setInterval(() => {
      currentNowMs = Date.now()
      clockListeners.forEach((cb) => cb())
    }, 30000)
  }
  return () => {
    clockListeners.delete(listener)
    if (clockListeners.size === 0 && clockInterval) {
      clearInterval(clockInterval)
      clockInterval = null
    }
  }
}

function getClientClockSnapshot(): number | null {
  if (typeof window === "undefined") return null
  if (currentNowMs === null) {
    currentNowMs = Date.now()
  }
  return currentNowMs
}

function getServerClockSnapshot(): number | null {
  return null
}

export function useClientNow(): number | null {
  return React.useSyncExternalStore(
    subscribeClock,
    getClientClockSnapshot,
    getServerClockSnapshot
  )
}

export function getTodayIsoFromNow(nowMs: number | null): string {
  if (nowMs === null) return "2026-11-11"
  return new Date(nowMs).toISOString().slice(0, 10)
}

export function parseTimestampMs(ts: string): number {
  if (!ts) return 0
  const normalized = ts.includes("T") ? ts : ts.replace(" ", "T") + ":00Z"
  const parsed = Date.parse(normalized)
  return Number.isNaN(parsed) ? 0 : parsed
}

export function formatRelativeTimestamp(ts: string, nowMs: number | null): string {
  const shortFallback = ts.slice(0, 16).replace("T", " ")
  if (nowMs === null) return shortFallback
  const ms = parseTimestampMs(ts)
  if (!ms) return shortFallback
  const diffSec = Math.floor((nowMs - ms) / 1000)
  if (diffSec < 0) return shortFallback
  if (diffSec < 45) return "Just now"
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDays = Math.floor(diffHr / 24)
  if (diffDays < 30) return `${diffDays}d ago`
  return ts.slice(0, 10)
}

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

export function formatSingleDate(dateStr?: string): string {
  if (!dateStr) return ""
  const clean = dateStr.slice(0, 10)
  const parts = clean.split("-")
  if (parts.length === 3) {
    const monthIdx = parseInt(parts[1], 10) - 1
    const day = parseInt(parts[2], 10)
    if (monthIdx >= 0 && monthIdx < 12 && !isNaN(day)) {
      return `${MONTH_NAMES[monthIdx]} ${day}`
    }
  }
  return dateStr
}

export function formatDateRange(
  startDate?: string,
  dueDate?: string,
  completedDate?: string
): string {
  const start = formatSingleDate(startDate) || "—"
  const due = formatSingleDate(dueDate) || "—"
  if (completedDate !== undefined) {
    const comp = completedDate ? formatSingleDate(completedDate) : "—"
    return `${start} → ${due} → ${comp}`
  }
  if (start !== "—" && due !== "—") return `${start} → ${due}`
  if (due !== "—") return due
  if (start !== "—") return start
  return "—"
}

export function getEntityInitials(name?: string, maxChars = 3): string {
  if (!name) return ""
  const words = name.trim().split(/\s+/)
  if (words.length === 1) return words[0].slice(0, maxChars).toUpperCase()
  return words
    .slice(0, maxChars)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
}



