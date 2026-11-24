import type { Brand, City, Invoice, Lead, Project, SignUp, Task, TaskRevision } from "@/types"
import {
  createInitialEmptyData,
  STORE_STORAGE_KEY,
  STORE_VERSION,
  type StoreData,
} from "./types"
import { sanitizeDoc } from "@/components/ui/rich-text-editor"

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

export function migrateBrand(rawBrand: unknown): Brand {
  if (!rawBrand || typeof rawBrand !== "object") {
    return rawBrand as Brand
  }
  const b = { ...(rawBrand as Record<string, unknown>) }
  if (!b.address && typeof b.tagline === "string") {
    b.address = "100 Montgomery St, Suite 1200, San Francisco, CA 94104"
  } else if (!b.address) {
    b.address = ""
  }
  if (!b.merchantKeys || typeof b.merchantKeys !== "object") {
    b.merchantKeys = {}
  }
  return b as unknown as Brand
}

export function migrateLead(rawLead: unknown, index: number): Lead {
  if (!rawLead || typeof rawLead !== "object") {
    return rawLead as Lead
  }
  const ld = { ...(rawLead as Record<string, unknown>) }
  if (!ld.address) {
    ld.address = "120 Broadway, Suite 1400"
  }
  if (!ld.zipCode) {
    ld.zipCode = "10005"
  }
  if (!Array.isArray(ld.services) || ld.services.length === 0) {
    ld.services = ["Website Design & Development", "Brand Identity"]
  }
  if (!ld.description && typeof ld.notes === "string") {
    ld.description = ld.notes
  }
  return ld as unknown as Lead
}

export function migrateInvoice(rawInvoice: unknown, index: number): Invoice {
  if (!rawInvoice || typeof rawInvoice !== "object") {
    return rawInvoice as Invoice
  }
  const inv = { ...(rawInvoice as Record<string, unknown>) }
  if (!inv.leadId) {
    inv.leadId = `lead-${(index % 8) + 1}`
  }
  return inv as unknown as Invoice
}

export function migrateProject(rawProject: unknown, index: number): Project {
  if (!rawProject || typeof rawProject !== "object") {
    return rawProject as Project
  }
  const prj = { ...(rawProject as Record<string, unknown>) }
  if (!prj.leadId) {
    prj.leadId = `lead-${(index % 8) + 1}`
  }
  return prj as unknown as Project
}

export function migrateSignUp(
  rawSignUp: unknown,
  index: number,
  leads: Lead[],
  brands: Brand[],
  cities: City[]
): SignUp {
  if (!rawSignUp || typeof rawSignUp !== "object") {
    return rawSignUp as SignUp
  }
  const su = { ...(rawSignUp as Record<string, unknown>) }
  if (!Array.isArray(su.assignedStaffIds)) {
    const linkedLead =
      typeof su.leadId === "string"
        ? leads.find((l) => l.id === su.leadId)
        : undefined
    su.assignedStaffIds = linkedLead?.assignedStaffIds ?? []
  }
  if (typeof su.createdAt === "string" && su.createdAt.length === 10) {
    const hour = String(9 + (index % 10)).padStart(2, "0")
    const min = String((index * 13) % 60).padStart(2, "0")
    su.createdAt = `${su.createdAt} ${hour}:${min}`
  }
  const cityName = typeof su.city === "string" ? su.city.toLowerCase() : ""
  const cityObj = cities.find((c) => c.name.toLowerCase() === cityName)
  if (!su.state && cityObj?.state) {
    su.state = cityObj.state
  }
  if (!su.country) {
    su.country = cityObj?.country || "United States"
  }
  if (!su.zipCode) {
    const sampleZips = ["10005", "10017", "60654", "78701", "98104", "94104"]
    su.zipCode = sampleZips[index % sampleZips.length]
  }
  if (!su.referralUrl) {
    const brand = brands.find(
      (b) => b.id === su.brandId || b.name === su.brandName
    )
    const domain = brand?.domain || "agencyops.io"
    const sourceSlug = String(su.source || "website")
      .toLowerCase()
      .replace(/\s+/g, "-")
    const campaign = String(su.utmCampaign || "direct")
    su.referralUrl = `https://${domain}/get-started?utm_source=${sourceSlug}&utm_campaign=${campaign}`
  }
  return su as unknown as SignUp
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
    const rawBrands = Array.isArray(parsed.brands) ? parsed.brands : base.brands
    const migratedBrands = rawBrands.map(migrateBrand)
    const rawCities = Array.isArray(parsed.cities) ? parsed.cities : base.cities
    const rawLeads = Array.isArray(parsed.leads) ? parsed.leads : base.leads
    const migratedLeads = rawLeads.map(migrateLead)
    const rawSignUps = Array.isArray(parsed.signups) ? parsed.signups : base.signups
    const migratedSignUps = rawSignUps.map((su, idx) =>
      migrateSignUp(su, idx, migratedLeads, migratedBrands, rawCities)
    )
    const rawInvoices = Array.isArray(parsed.invoices) ? parsed.invoices : base.invoices
    const migratedInvoices = rawInvoices.map(migrateInvoice)
    const rawProjects = Array.isArray(parsed.projects) ? parsed.projects : base.projects
    const migratedProjects = rawProjects.map(migrateProject)

    const result: StoreData = {
      version: STORE_VERSION,
      brands: migratedBrands,
      cities: Array.isArray(parsed.cities) ? parsed.cities : base.cities,
      teams: Array.isArray(parsed.teams) ? parsed.teams : base.teams,
      users: Array.isArray(parsed.users) && parsed.users.length > 0 ? parsed.users : base.users,
      leads: migratedLeads,
      signups: migratedSignUps,
      invoices: migratedInvoices,
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : base.transactions,
      marketingSpendings: Array.isArray(parsed.marketingSpendings) ? parsed.marketingSpendings : base.marketingSpendings,
      projects: migratedProjects,
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
