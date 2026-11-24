import type { StoreData } from "./types"

export interface DeletionCheckResult {
  allowed: boolean
  cascadeCount?: number
  reason?: string
  warningMessage?: string
}

/**
 * Brand deletion rule: Brands cannot be deleted as they are foundational organization entities.
 */
export function checkBrandDeletion(_store: StoreData, _brandId: string): DeletionCheckResult {
  return {
    allowed: false,
    reason: "Agency brands cannot be deleted as they are core foundational entities.",
  }
}

/**
 * Team deletion rule: BLOCK if referenced by active staff users.
 */
export function checkTeamDeletion(store: StoreData, teamId: string): DeletionCheckResult {
  const linkedUsers = store.users.filter((u) => u.teamId === teamId).length
  if (linkedUsers > 0) {
    return {
      allowed: false,
      reason: `Cannot delete team: ${linkedUsers} staff member${linkedUsers === 1 ? "" : "s"} assigned to this team.`,
    }
  }
  return { allowed: true }
}

/**
 * City deletion rule: BLOCK if referenced by active staff users or leads.
 */
export function checkCityDeletion(store: StoreData, cityId: string): DeletionCheckResult {
  const city = store.cities.find((c) => c.id === cityId)
  if (!city) return { allowed: true }

  const linkedUsers = store.users.filter((u) => u.city === city.name).length
  const linkedLeads = store.leads.filter((l) => l.city === city.name).length

  if (linkedUsers > 0 || linkedLeads > 0) {
    return {
      allowed: false,
      reason: `Cannot delete city: linked to ${linkedUsers} staff member(s) and ${linkedLeads} lead(s).`,
    }
  }
  return { allowed: true }
}

/**
 * Staff user deletion rule: BLOCK if default admin or actively assigned to projects/tasks/leads.
 */
export function checkUserDeletion(store: StoreData, userId: string): DeletionCheckResult {
  if (userId === "usr-admin") {
    return {
      allowed: false,
      reason: "The default Super Admin user account cannot be deleted.",
    }
  }

  const managingProjects = store.projects.filter((p) => p.managerId === userId).length
  const assignedTasks = store.tasks.filter((t) => t.assigneeIds.includes(userId)).length
  const assignedLeads = store.leads.filter((l) => l.assignedStaffIds.includes(userId)).length

  if (managingProjects > 0 || assignedTasks > 0 || assignedLeads > 0) {
    const parts: string[] = []
    if (managingProjects > 0) parts.push(`managing ${managingProjects} project(s)`)
    if (assignedTasks > 0) parts.push(`assigned to ${assignedTasks} task(s)`)
    if (assignedLeads > 0) parts.push(`owner of ${assignedLeads} lead(s)`)

    return {
      allowed: false,
      reason: `Cannot delete staff user: currently ${parts.join(", ")}. Reassign them first.`,
    }
  }

  return { allowed: true }
}

/**
 * Project deletion rule: CASCADE (deletes project and all related tasks and chat threads).
 */
export function checkProjectDeletion(store: StoreData, projectId: string): DeletionCheckResult {
  const tasksCount = store.tasks.filter((t) => t.projectId === projectId).length
  const threadsCount = store.chatThreads.filter((c) => c.projectId === projectId).length

  return {
    allowed: true,
    cascadeCount: tasksCount,
    warningMessage:
      tasksCount > 0 || threadsCount > 0
        ? `Deleting this project will permanently remove ${tasksCount} task(s) and ${threadsCount} chat thread(s).`
        : undefined,
  }
}

/**
 * Lead deletion rule: BLOCK if referenced by active tasks or invoices.
 */
export function checkLeadDeletion(store: StoreData, leadId: string): DeletionCheckResult {
  const lead = store.leads.find((l) => l.id === leadId)
  if (!lead) return { allowed: true }

  const linkedTasks = store.tasks.filter((t) => t.leadId === leadId).length
  if (linkedTasks > 0) {
    return {
      allowed: false,
      reason: `Cannot delete lead: referenced by ${linkedTasks} active task(s).`,
    }
  }

  const linkedInvoices = store.invoices.filter(
    (inv) =>
      inv.clientEmail.toLowerCase() === lead.email.toLowerCase() ||
      inv.clientName.toLowerCase() === lead.name.toLowerCase()
  ).length

  if (linkedInvoices > 0) {
    return {
      allowed: false,
      reason: `Cannot delete lead: referenced by ${linkedInvoices} invoice(s).`,
    }
  }

  return { allowed: true }
}

/**
 * Sign-up / Client deletion rule: BLOCK if referenced by active tasks.
 */
export function checkSignUpDeletion(store: StoreData, signUpId: string): DeletionCheckResult {
  const linkedTasks = store.tasks.filter((t) => t.clientId === signUpId).length
  if (linkedTasks > 0) {
    return {
      allowed: false,
      reason: `Cannot delete client: referenced by ${linkedTasks} active task(s).`,
    }
  }

  return { allowed: true }
}

/**
 * Invoice deletion rule: BLOCK if settled transactions exist; CASCADE pending transactions.
 */
export function checkInvoiceDeletion(store: StoreData, invoiceId: string): DeletionCheckResult {
  const settledTx = store.transactions.filter(
    (tx) => tx.invoiceId === invoiceId && tx.status === "Success"
  ).length

  if (settledTx > 0) {
    return {
      allowed: false,
      reason: `Cannot delete invoice: ${settledTx} settled transaction(s) have been captured.`,
    }
  }

  const linkedTx = store.transactions.filter((tx) => tx.invoiceId === invoiceId).length

  return {
    allowed: true,
    cascadeCount: linkedTx,
    warningMessage:
      linkedTx > 0
        ? `Deleting this invoice will also remove ${linkedTx} uncaptured/pending transaction record(s).`
        : undefined,
  }
}

/**
 * Leave type deletion rule: BLOCK if referenced by leave requests.
 */
export function checkLeaveTypeDeletion(store: StoreData, leaveTypeId: string): DeletionCheckResult {
  const count = store.leaveRequests.filter((lr) => lr.leaveTypeId === leaveTypeId).length
  if (count > 0) {
    return {
      allowed: false,
      reason: `Cannot delete leave type: linked to ${count} leave request(s).`,
    }
  }
  return { allowed: true }
}

/**
 * Shift schedule deletion rule: BLOCK if referenced by attendance records.
 */
export function checkShiftDeletion(store: StoreData, shiftId: string): DeletionCheckResult {
  const shift = store.shiftSchedules.find((s) => s.id === shiftId)
  if (!shift) return { allowed: true }

  const count = store.attendanceRecords.filter((a) => a.shiftName === shift.name).length
  if (count > 0) {
    return {
      allowed: false,
      reason: `Cannot delete shift schedule: referenced in ${count} attendance record(s).`,
    }
  }
  return { allowed: true }
}
