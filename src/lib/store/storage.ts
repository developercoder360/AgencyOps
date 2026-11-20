import type { Task, TaskRevision } from "@/types"
import {
  createInitialEmptyData,
  STORE_STORAGE_KEY,
  STORE_VERSION,
  type StoreData,
} from "./types"

export interface StorageEstimate {
  usedBytes: number
  usedKb: number
  percent: number // % of 5MB
}

interface LegacyTaskRaw {
  subtasks?: unknown[]
  checklist?: unknown[]
  revisions?: TaskRevision[]
  legacy?: {
    subtasks?: unknown[]
    checklist?: unknown[]
  }
  [key: string]: unknown
}

export function migrateTask(rawTask: unknown): Task {
  if (!rawTask || typeof rawTask !== "object") {
    return rawTask as Task
  }
  const task = { ...(rawTask as LegacyTaskRaw) }

  // Ensure revisions array is present and strip legacy requestedBy from revisions
  if (!Array.isArray(task.revisions)) {
    task.revisions = []
  } else {
    task.revisions = task.revisions.map((rev) => {
      if (rev && typeof rev === "object") {
        const rawRev = { ...(rev as unknown as Record<string, unknown>) }
        if ("requestedBy" in rawRev) {
          delete rawRev.requestedBy
        }
        return rawRev as unknown as TaskRevision
      }
      return rev
    })
  }

  // If old subtasks or checklist arrays exist, move to legacy and remove old keys
  if (task.subtasks !== undefined || task.checklist !== undefined) {
    task.legacy = {
      ...(task.legacy || {}),
      ...(task.subtasks !== undefined ? { subtasks: task.subtasks } : {}),
      ...(task.checklist !== undefined ? { checklist: task.checklist } : {}),
    }
    delete task.subtasks
    delete task.checklist
  }

  return task as unknown as Task
}

export function loadStoredData(): StoreData {
  if (typeof window === "undefined") {
    return createInitialEmptyData()
  }

  try {
    const raw = window.localStorage.getItem(STORE_STORAGE_KEY)
    if (!raw) {
      return createInitialEmptyData()
    }

    const parsed = JSON.parse(raw) as Partial<StoreData>
    if (!parsed || typeof parsed !== "object") {
      return createInitialEmptyData()
    }

    // Ensure all required array fields are present
    const base = createInitialEmptyData()
    const rawTasks = Array.isArray(parsed.tasks) ? parsed.tasks : base.tasks
    const migratedTasks = rawTasks.map(migrateTask)

    const result: StoreData = {
      version: STORE_VERSION,
      brands: Array.isArray(parsed.brands) ? parsed.brands : base.brands,
      cities: Array.isArray(parsed.cities) ? parsed.cities : base.cities,
      teams: Array.isArray(parsed.teams) ? parsed.teams : base.teams,
      users: Array.isArray(parsed.users) && parsed.users.length > 0 ? parsed.users : base.users,
      leads: Array.isArray(parsed.leads) ? parsed.leads : base.leads,
      signups: Array.isArray(parsed.signups) ? parsed.signups : base.signups,
      invoices: Array.isArray(parsed.invoices) ? parsed.invoices : base.invoices,
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : base.transactions,
      marketingSpendings: Array.isArray(parsed.marketingSpendings) ? parsed.marketingSpendings : base.marketingSpendings,
      projects: Array.isArray(parsed.projects) ? parsed.projects : base.projects,
      tasks: migratedTasks,
      chatThreads: Array.isArray(parsed.chatThreads) ? parsed.chatThreads : base.chatThreads,
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : base.notifications,
      attendanceRecords: Array.isArray(parsed.attendanceRecords) ? parsed.attendanceRecords : base.attendanceRecords,
      leaveRequests: Array.isArray(parsed.leaveRequests) ? parsed.leaveRequests : base.leaveRequests,
      leaveTypes: Array.isArray(parsed.leaveTypes) ? parsed.leaveTypes : base.leaveTypes,
      leaveBalances: Array.isArray(parsed.leaveBalances) ? parsed.leaveBalances : base.leaveBalances,
      shiftSchedules: Array.isArray(parsed.shiftSchedules) ? parsed.shiftSchedules : base.shiftSchedules,
      holidays: Array.isArray(parsed.holidays) ? parsed.holidays : base.holidays,
      exportLogs: Array.isArray(parsed.exportLogs) ? parsed.exportLogs : base.exportLogs,
    }

    // Persist migrated schema if it was upgraded from older version
    if (parsed.version !== STORE_VERSION) {
      saveStoredData(result)
    }

    return result
  } catch (err) {
    console.warn("Failed to load AgencyOps data from localStorage:", err)
    return createInitialEmptyData()
  }
}

export function saveStoredData(data: StoreData): { success: boolean; error?: string } {
  if (typeof window === "undefined") {
    return { success: true }
  }

  try {
    const serialized = JSON.stringify(data)
    window.localStorage.setItem(STORE_STORAGE_KEY, serialized)
    return { success: true }
  } catch (err: unknown) {
    const isQuota =
      err instanceof DOMException &&
      (err.code === 22 ||
        err.code === 1014 ||
        err.name === "QuotaExceededError" ||
        err.name === "NS_ERROR_DOM_QUOTA_REACHED")
    const message = isQuota
      ? "Browser local storage quota exceeded. Consider exporting a backup or clearing older logs/records."
      : "Failed to persist data to browser local storage."
    console.error("Storage error:", err)
    return { success: false, error: message }
  }
}

export function clearStoredData(): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(STORE_STORAGE_KEY)
  } catch (err) {
    console.warn("Failed to remove storage item:", err)
  }
}

export function getStorageEstimate(): StorageEstimate {
  if (typeof window === "undefined") {
    return { usedBytes: 0, usedKb: 0, percent: 0 }
  }

  try {
    const raw = window.localStorage.getItem(STORE_STORAGE_KEY) ?? ""
    // Each UTF-16 char in localStorage is ~2 bytes
    const usedBytes = raw.length * 2
    const usedKb = Math.round((usedBytes / 1024) * 10) / 10
    // Standard quota is roughly 5MB (5,242,880 bytes)
    const percent = Math.min(100, Math.round((usedBytes / (5 * 1024 * 1024)) * 1000) / 10)
    return { usedBytes, usedKb, percent }
  } catch {
    return { usedBytes: 0, usedKb: 0, percent: 0 }
  }
}
