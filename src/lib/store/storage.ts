import type { Task, TaskRevision } from "@/types"
import {
  createInitialEmptyData,
  STORE_STORAGE_KEY,
  STORE_VERSION,
  type StoreData,
} from "./types"
import { sanitizeDoc } from "@/components/ui/rich-text-editor"
import { getDemoDataset } from "@/demo-data"

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

  // Ensure revisions array is present and migrate revisions
  if (!Array.isArray(task.revisions)) {
    task.revisions = []
  } else {
    let nextRevNum = 1
    let nextRdNum = 1

    task.revisions = task.revisions.map((rev) => {
      if (rev && typeof rev === "object") {
        const rawRev = { ...(rev as unknown as Record<string, unknown>) }
        // Strip legacy requestedBy
        if ("requestedBy" in rawRev) {
          delete rawRev.requestedBy
        }

        // Migrate assigneeId -> assigneeIds
        let assigneeIds: string[] = []
        if (Array.isArray(rawRev.assigneeIds)) {
          assigneeIds = rawRev.assigneeIds.filter((id) => typeof id === "string" && id)
        } else if (typeof rawRev.assigneeId === "string" && rawRev.assigneeId) {
          assigneeIds = [rawRev.assigneeId]
        }
        delete rawRev.assigneeId

        // Type: "revision" | "redraw"
        const type = rawRev.type === "redraw" ? "redraw" : "revision"

        // Priority: "regular" | "high" | "urgent"
        const priority =
          rawRev.priority === "urgent" || rawRev.priority === "high" || rawRev.priority === "regular"
            ? rawRev.priority
            : "regular"

        // Flagged user IDs: string[]
        const flaggedUserIds = Array.isArray(rawRev.flaggedUserIds)
          ? rawRev.flaggedUserIds.filter((f) => typeof f === "string")
          : []
        delete (rawRev as Record<string, unknown>).flagIds

        // Details: sanitize into Tiptap doc
        const details = sanitizeDoc(rawRev.details)

        // Number
        let num = typeof rawRev.number === "number" && rawRev.number > 0 ? rawRev.number : 0
        if (num === 0) {
          num = type === "redraw" ? nextRdNum++ : nextRevNum++
        }

        return {
          ...rawRev,
          type,
          number: num,
          title: typeof rawRev.title === "string" ? rawRev.title : "",
          details,
          assigneeIds,
          priority,
          flaggedUserIds,
          status: rawRev.status || "requested",
          files: Array.isArray(rawRev.files) ? rawRev.files : [],
        } as unknown as TaskRevision
      }
      return rev
    })
  }

  // Calculate nextRevisionNumber and nextRedrawNumber
  const revisionNums = (task.revisions as TaskRevision[])
    .filter((r) => r.type !== "redraw")
    .map((r) => r.number || 0)
  const maxRevNum = revisionNums.length > 0 ? Math.max(...revisionNums) : 0
  const existingNextRev = typeof task.nextRevisionNumber === "number" ? task.nextRevisionNumber : 1
  task.nextRevisionNumber = Math.max(existingNextRev, maxRevNum + 1)

  const redrawNums = (task.revisions as TaskRevision[])
    .filter((r) => r.type === "redraw")
    .map((r) => r.number || 0)
  const maxRdNum = redrawNums.length > 0 ? Math.max(...redrawNums) : 0
  const existingNextRd = typeof task.nextRedrawNumber === "number" ? task.nextRedrawNumber : 1
  task.nextRedrawNumber = Math.max(existingNextRd, maxRdNum + 1)

  // If old subtasks, checklist, tags, estimatedHours, or loggedHours exist, move to legacy and remove old keys
  const rawT = task as unknown as Record<string, unknown>
  if (
    rawT.subtasks !== undefined ||
    rawT.checklist !== undefined ||
    rawT.tags !== undefined ||
    rawT.estimatedHours !== undefined ||
    rawT.loggedHours !== undefined
  ) {
    task.legacy = {
      ...(task.legacy || {}),
      ...(rawT.subtasks !== undefined
        ? { subtasks: Array.isArray(rawT.subtasks) ? rawT.subtasks : [] }
        : {}),
      ...(rawT.checklist !== undefined
        ? { checklist: Array.isArray(rawT.checklist) ? rawT.checklist : [] }
        : {}),
      ...(rawT.tags !== undefined ? { tags: rawT.tags } : {}),
      ...(rawT.estimatedHours !== undefined ? { estimatedHours: rawT.estimatedHours } : {}),
      ...(rawT.loggedHours !== undefined ? { loggedHours: rawT.loggedHours } : {}),
    }
    delete rawT.subtasks
    delete rawT.checklist
    delete rawT.tags
    delete rawT.estimatedHours
    delete rawT.loggedHours
    delete rawT.trackedSeconds
  }

  // Ensure clientId and leadId default to null
  if (task.clientId === undefined) {
    task.clientId = null
  }
  if (task.leadId === undefined) {
    task.leadId = null
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
      const demo = getDemoDataset()
      demo.version = STORE_VERSION
      saveStoredData(demo)
      return demo
    }

    const parsed = JSON.parse(raw) as Partial<StoreData>
    if (!parsed || typeof parsed !== "object" || (!parsed.projects?.length && !parsed.brands?.length)) {
      const demo = getDemoDataset()
      demo.version = STORE_VERSION
      saveStoredData(demo)
      return demo
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
      tasksViewMode:
        parsed.tasksViewMode === "list" || parsed.tasksViewMode === "table"
          ? parsed.tasksViewMode
          : "board",
      userTaskPermissions:
        parsed.userTaskPermissions &&
        typeof parsed.userTaskPermissions === "object"
          ? parsed.userTaskPermissions
          : base.userTaskPermissions,
      files: Array.isArray(parsed.files) ? parsed.files : base.files,
      filesViewMode: parsed.filesViewMode === "list" ? "list" : "grid",
      activeFileUserId:
        typeof parsed.activeFileUserId === "string" && parsed.activeFileUserId
          ? parsed.activeFileUserId
          : Array.isArray(parsed.users) && parsed.users[0]?.id
            ? parsed.users[0].id
            : base.activeFileUserId,
      userFilePermissions:
        parsed.userFilePermissions && typeof parsed.userFilePermissions === "object"
          ? parsed.userFilePermissions
          : base.userFilePermissions,
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
