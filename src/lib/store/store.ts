import {
  createInitialEmptyData,
  STORE_VERSION,
  type StoreData,
  type Team,
} from "./types"
import {
  clearStoredData,
  getStorageEstimate,
  loadStoredData,
  saveStoredData,
  type StorageEstimate,
} from "./storage"
import {
  checkBrandDeletion,
  checkCityDeletion,
  checkInvoiceDeletion,
  checkLeadDeletion,
  checkLeaveTypeDeletion,
  checkProjectDeletion,
  checkShiftDeletion,
  checkTeamDeletion,
  checkUserDeletion,
  type DeletionCheckResult,
} from "./relations"
import type {
  ActivityComment,
  AppNotification,
  AttendanceRecord,
  Brand,
  ChatMessage,
  ChatThread,
  City,
  ExportLog,
  Holiday,
  Invoice,
  Lead,
  LeaveBalance,
  LeaveRequest,
  LeaveType,
  MarketingSpend,
  Project,
  ProjectFile,
  QAReviewEvent,
  ShiftSchedule,
  SignUp,
  StaffUser,
  Subtask,
  Task,
  TaskComment,
  Transaction,
} from "@/types"
import { toast } from "sonner"
import { getDemoDataset } from "@/demo-data"

type Listener = () => void

class StoreManager {
  private data: StoreData
  private listeners: Set<Listener> = new Set()
  private isClient = false

  constructor() {
    this.data = createInitialEmptyData()
  }

  public initClient(): void {
    if (this.isClient || typeof window === "undefined") return
    this.isClient = true
    this.data = loadStoredData()
    this.notify()

    window.addEventListener("storage", (e) => {
      if (e.key === "agencyops:data:v1") {
        this.data = loadStoredData()
        this.notify()
      }
    })
  }

  public subscribe = (listener: Listener): (() => void) => {
    this.initClient()
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  public getSnapshot = (): StoreData => {
    if (!this.isClient && typeof window !== "undefined") {
      this.initClient()
    }
    return this.data
  }

  public getServerSnapshot = (): StoreData => {
    return createInitialEmptyData()
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener()
      } catch (e) {
        console.error("Error in store listener:", e)
      }
    }
  }

  private setAndPersist(updater: (prev: StoreData) => StoreData): boolean {
    const next = updater(this.data)
    const result = saveStoredData(next)
    if (!result.success && result.error) {
      toast.error(result.error)
    }
    this.data = next
    this.notify()
    return result.success
  }

  // --- Brand Actions ---
  public createBrand(brand: Omit<Brand, "id" | "createdAt"> & { id?: string; createdAt?: string }): Brand {
    const newBrand: Brand = {
      ...brand,
      id: brand.id || `brd-${crypto.randomUUID().slice(0, 8)}`,
      createdAt: brand.createdAt || new Date().toISOString().slice(0, 10),
    }
    this.setAndPersist((s) => ({
      ...s,
      brands: [newBrand, ...s.brands],
    }))
    return newBrand
  }

  public updateBrand(id: string, updates: Partial<Brand>): void {
    this.setAndPersist((s) => ({
      ...s,
      brands: s.brands.map((b) => (b.id === id ? { ...b, ...updates } : b)),
      // Synchronize brandName across related entities if updated
      leads: updates.name
        ? s.leads.map((l) => (l.brandId === id ? { ...l, brandName: updates.name! } : l))
        : s.leads,
      projects: updates.name
        ? s.projects.map((p) => (p.brandId === id ? { ...p, brandName: updates.name! } : p))
        : s.projects,
      invoices: updates.name
        ? s.invoices.map((i) => (i.brandId === id ? { ...i, brandName: updates.name! } : i))
        : s.invoices,
    }))
  }

  public deleteBrand(id: string): DeletionCheckResult {
    const check = checkBrandDeletion(this.data, id)
    if (!check.allowed) {
      return check
    }
    this.setAndPersist((s) => ({
      ...s,
      brands: s.brands.filter((b) => b.id !== id),
    }))
    return { allowed: true }
  }

  // --- City Actions ---
  public createCity(
    city: Omit<City, "id" | "activeClients" | "leadCount" | "status"> & {
      id?: string
      activeClients?: number
      leadCount?: number
      status?: City["status"]
    }
  ): City {
    const newCity: City = {
      activeClients: 0,
      leadCount: 0,
      status: "Active",
      ...city,
      id: city.id || `cit-${crypto.randomUUID().slice(0, 8)}`,
    }
    this.setAndPersist((s) => ({
      ...s,
      cities: [...s.cities, newCity],
    }))
    return newCity
  }

  public updateCity(id: string, updates: Partial<City>): void {
    this.setAndPersist((s) => ({
      ...s,
      cities: s.cities.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }))
  }

  public deleteCity(id: string): DeletionCheckResult {
    const check = checkCityDeletion(this.data, id)
    if (!check.allowed) return check
    this.setAndPersist((s) => ({
      ...s,
      cities: s.cities.filter((c) => c.id !== id),
    }))
    return { allowed: true }
  }

  // --- Team Actions ---
  public createTeam(team: Omit<Team, "id" | "createdAt"> & { id?: string; createdAt?: string }): Team {
    const newTeam: Team = {
      ...team,
      id: team.id || `tm-${crypto.randomUUID().slice(0, 8)}`,
      createdAt: team.createdAt || new Date().toISOString().slice(0, 10),
    }
    this.setAndPersist((s) => ({
      ...s,
      teams: [...s.teams, newTeam],
    }))
    return newTeam
  }

  public updateTeam(id: string, updates: Partial<Team>): void {
    this.setAndPersist((s) => ({
      ...s,
      teams: s.teams.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      users: updates.name
        ? s.users.map((u) => (u.teamId === id ? { ...u, teamName: updates.name! } : u))
        : s.users,
    }))
  }

  public deleteTeam(id: string): DeletionCheckResult {
    const check = checkTeamDeletion(this.data, id)
    if (!check.allowed) return check
    this.setAndPersist((s) => ({
      ...s,
      teams: s.teams.filter((t) => t.id !== id),
    }))
    return { allowed: true }
  }

  // --- User Actions ---
  public createUser(
    user: Omit<StaffUser, "id" | "joinedAt" | "brandIds" | "timezone" | "birthday" | "monthlyTargetUsd" | "redFlagCount"> & {
      id?: string
      joinedAt?: string
      brandIds?: string[]
      timezone?: string
      birthday?: string
      monthlyTargetUsd?: number
      redFlagCount?: number
    }
  ): StaffUser {
    const newUser: StaffUser = {
      brandIds: [],
      timezone: "America/New_York",
      birthday: "1994-01-01",
      monthlyTargetUsd: 10000,
      redFlagCount: 0,
      ...user,
      id: user.id || `usr-${crypto.randomUUID().slice(0, 8)}`,
      joinedAt: user.joinedAt || new Date().toISOString().slice(0, 10),
    }
    this.setAndPersist((s) => ({
      ...s,
      users: [...s.users, newUser],
      leaveBalances: [
        ...s.leaveBalances,
        {
          id: `lb-${newUser.id}`,
          userId: newUser.id,
          userName: newUser.name,
          department: newUser.department,
          annualTotal: 20,
          annualUsed: 0,
          sickTotal: 10,
          sickUsed: 0,
          casualTotal: 6,
          casualUsed: 0,
          carryForward: 0,
        },
      ],
    }))
    return newUser
  }

  public updateUser(id: string, updates: Partial<StaffUser>): void {
    this.setAndPersist((s) => ({
      ...s,
      users: s.users.map((u) => (u.id === id ? { ...u, ...updates } : u)),
      leaveBalances: updates.name
        ? s.leaveBalances.map((b) => (b.userId === id ? { ...b, userName: updates.name! } : b))
        : s.leaveBalances,
    }))
  }

  public deleteUser(id: string): DeletionCheckResult {
    const check = checkUserDeletion(this.data, id)
    if (!check.allowed) return check
    this.setAndPersist((s) => ({
      ...s,
      users: s.users.filter((u) => u.id !== id),
      leaveBalances: s.leaveBalances.filter((b) => b.userId !== id),
    }))
    return { allowed: true }
  }

  // --- Lead Actions ---
  public createLead(
    lead: Omit<Lead, "id" | "code" | "createdAt" | "assignmentHistory"> & {
      id?: string
      code?: string
      createdAt?: string
      assignmentHistory?: Lead["assignmentHistory"]
    }
  ): Lead {
    const nextSeq = this.data.leads.length + 101
    const newLead: Lead = {
      code: `LD-${nextSeq}`,
      assignmentHistory: [],
      ...lead,
      id: lead.id || `ld-${crypto.randomUUID().slice(0, 8)}`,
      createdAt: lead.createdAt || new Date().toISOString().slice(0, 10),
    }
    this.setAndPersist((s) => ({
      ...s,
      leads: [newLead, ...s.leads],
    }))
    return newLead
  }

  public updateLead(id: string, updates: Partial<Lead>): void {
    this.setAndPersist((s) => ({
      ...s,
      leads: s.leads.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    }))
  }

  public deleteLead(id: string): DeletionCheckResult {
    const check = checkLeadDeletion(this.data, id)
    if (!check.allowed) return check
    this.setAndPersist((s) => ({
      ...s,
      leads: s.leads.filter((l) => l.id !== id),
    }))
    return { allowed: true }
  }

  // --- SignUp Actions ---
  public createSignUp(signup: Omit<SignUp, "id" | "createdAt"> & { id?: string; createdAt?: string }): SignUp {
    const newSignUp: SignUp = {
      ...signup,
      id: signup.id || `sgn-${crypto.randomUUID().slice(0, 8)}`,
      createdAt: signup.createdAt || new Date().toISOString().slice(0, 10),
    }
    this.setAndPersist((s) => ({
      ...s,
      signups: [newSignUp, ...s.signups],
    }))
    return newSignUp
  }

  public updateSignUp(id: string, updates: Partial<SignUp>): void {
    this.setAndPersist((s) => ({
      ...s,
      signups: s.signups.map((sg) => (sg.id === id ? { ...sg, ...updates } : sg)),
    }))
  }

  public deleteSignUp(id: string): void {
    this.setAndPersist((s) => ({
      ...s,
      signups: s.signups.filter((sg) => sg.id !== id),
    }))
  }

  public convertSignUpToLead(
    signupId: string,
    leadData?: Partial<{
      estimatedValue: number
      currency: "USD" | "GBP" | "CAD"
      assignedStaffId: string
      city: string
    }>
  ): Lead | null {
    const signup = this.data.signups.find((s) => s.id === signupId)
    if (!signup) return null

    const brand = this.data.brands.find((b) => b.id === signup.brandId) ?? this.data.brands[0]
    const leadCode = `LD-${String(this.data.leads.length + 101).padStart(4, "0")}`

    const newLead: Lead = {
      id: `ld-${crypto.randomUUID().slice(0, 8)}`,
      code: leadCode,
      name: signup.name,
      email: signup.email,
      phone: signup.phone,
      company: `${signup.name.split(" ")[0]}'s Brand`,
      brandId: signup.brandId,
      brandName: brand ? brand.name : signup.brandName,
      source: signup.source,
      city: leadData?.city || signup.city || "New York",
      country: "United States",
      estimatedValue: leadData?.estimatedValue || 5000,
      currency: leadData?.currency || "USD",
      status: "New",
      assignedStaffIds: [leadData?.assignedStaffId || this.data.users[0]?.id || "usr-admin"],
      createdAt: new Date().toISOString().slice(0, 10),
      notes: `Converted from Sign Up ${signup.code}. Interest: ${signup.serviceInterest}`,
      assignmentHistory: [
        {
          id: `hist-${crypto.randomUUID().slice(0, 8)}`,
          fromStaffName: null,
          toStaffName:
            this.data.users.find((u) => u.id === leadData?.assignedStaffId)?.name ?? "Assigned Staff",
          assignedBy: "System",
          timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
          note: `Auto-assigned upon conversion from Sign Up ${signup.code}`,
        },
      ],
    }

    this.setAndPersist((s) => ({
      ...s,
      leads: [newLead, ...s.leads],
      signups: s.signups.map((sg) =>
        sg.id === signupId ? { ...sg, convertedToLead: true, leadId: newLead.id } : sg
      ),
    }))

    return newLead
  }

  // --- Invoice Actions ---
  public createInvoice(
    inv: Omit<Invoice, "id" | "invoiceNumber" | "issuedAt"> & {
      id?: string
      invoiceNumber?: string
      issuedAt?: string
    }
  ): Invoice {
    const invoiceNumber =
      inv.invoiceNumber || `INV-2026-${String(this.data.invoices.length + 1060).padStart(4, "0")}`
    const newInvoice: Invoice = {
      ...inv,
      id: inv.id || `inv-${crypto.randomUUID().slice(0, 8)}`,
      invoiceNumber,
      issuedAt: inv.issuedAt || new Date().toISOString().slice(0, 10),
    }
    this.setAndPersist((s) => ({
      ...s,
      invoices: [newInvoice, ...s.invoices],
    }))
    return newInvoice
  }

  public updateInvoice(id: string, updates: Partial<Invoice>): void {
    this.setAndPersist((s) => ({
      ...s,
      invoices: s.invoices.map((i) => (i.id === id ? { ...i, ...updates } : i)),
    }))
  }

  public deleteInvoice(id: string): DeletionCheckResult {
    const check = checkInvoiceDeletion(this.data, id)
    if (!check.allowed) return check

    // Cascades uncaptured transactions
    this.setAndPersist((s) => ({
      ...s,
      invoices: s.invoices.filter((i) => i.id !== id),
      transactions: s.transactions.filter((tx) => tx.invoiceId !== id),
    }))
    return { allowed: true }
  }

  // --- Transaction Actions ---
  public createTransaction(
    tx: Omit<Transaction, "id" | "createdAt" | "events"> & {
      id?: string
      createdAt?: string
      events?: Transaction["events"]
    }
  ): Transaction {
    const newTx: Transaction = {
      ...tx,
      id: tx.id || `tx-${crypto.randomUUID().slice(0, 8)}`,
      createdAt: tx.createdAt || new Date().toISOString().slice(0, 10),
      events: tx.events || [],
    }
    this.setAndPersist((s) => ({
      ...s,
      transactions: [newTx, ...s.transactions],
    }))
    return newTx
  }

  public updateTransaction(id: string, updates: Partial<Transaction>): void {
    this.setAndPersist((s) => ({
      ...s,
      transactions: s.transactions.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }))
  }

  public deleteTransaction(id: string): void {
    this.setAndPersist((s) => ({
      ...s,
      transactions: s.transactions.filter((t) => t.id !== id),
    }))
  }

  // --- Marketing Spend Actions ---
  public createMarketingSpend(
    ms: Omit<MarketingSpend, "id" | "date"> & { id?: string; date?: string }
  ): MarketingSpend {
    const newMs: MarketingSpend = {
      ...ms,
      id: ms.id || `mkt-${crypto.randomUUID().slice(0, 8)}`,
      date: ms.date || new Date().toISOString().slice(0, 10),
    }
    this.setAndPersist((s) => ({
      ...s,
      marketingSpendings: [newMs, ...s.marketingSpendings],
    }))
    return newMs
  }

  public updateMarketingSpend(id: string, updates: Partial<MarketingSpend>): void {
    this.setAndPersist((s) => ({
      ...s,
      marketingSpendings: s.marketingSpendings.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    }))
  }

  public deleteMarketingSpend(id: string): void {
    this.setAndPersist((s) => ({
      ...s,
      marketingSpendings: s.marketingSpendings.filter((m) => m.id !== id),
    }))
  }

  // --- Project Actions ---
  public createProject(
    project: Omit<Project, "id" | "files" | "comments"> & {
      id?: string
      files?: ProjectFile[]
      comments?: ActivityComment[]
    }
  ): Project {
    const newProject: Project = {
      ...project,
      id: project.id || `prj-${crypto.randomUUID().slice(0, 8)}`,
      files: project.files || [],
      comments: project.comments || [],
    }

    // Auto-create chat thread for the project
    const newThread: ChatThread = {
      id: `th-${newProject.id}`,
      projectId: newProject.id,
      projectName: newProject.name,
      brandName: newProject.brandName,
      participantIds: [newProject.managerId, ...newProject.memberIds],
      unreadCount: 0,
      lastMessageAt: "Just now",
      lastMessagePreview: `Project ${newProject.code} channel initialized.`,
      messages: [
        {
          id: `msg-${crypto.randomUUID().slice(0, 8)}`,
          senderId: newProject.managerId || "usr-admin",
          senderName:
            this.data.users.find((u) => u.id === newProject.managerId)?.name || "Project Admin",
          senderInitials: "PA",
          content: `Welcome to ${newProject.name}! Deliverables and milestones will be tracked here.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          readByIds: [newProject.managerId || "usr-admin"],
        },
      ],
    }

    this.setAndPersist((s) => ({
      ...s,
      projects: [newProject, ...s.projects],
      chatThreads: [newThread, ...s.chatThreads],
    }))
    return newProject
  }

  public updateProject(id: string, updates: Partial<Project>): void {
    this.setAndPersist((s) => ({
      ...s,
      projects: s.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      tasks: updates.name
        ? s.tasks.map((t) => (t.projectId === id ? { ...t, projectName: updates.name! } : t))
        : s.tasks,
      chatThreads: updates.name
        ? s.chatThreads.map((c) =>
            c.projectId === id ? { ...c, projectName: updates.name! } : c
          )
        : s.chatThreads,
    }))
  }

  public deleteProject(id: string): DeletionCheckResult {
    const check = checkProjectDeletion(this.data, id)
    // Cascade delete tasks and chat threads
    this.setAndPersist((s) => ({
      ...s,
      projects: s.projects.filter((p) => p.id !== id),
      tasks: s.tasks.filter((t) => t.projectId !== id),
      chatThreads: s.chatThreads.filter((c) => c.projectId !== id),
    }))
    return check
  }

  public addProjectFile(projectId: string, file: Omit<ProjectFile, "id" | "uploadedAt">): void {
    const newFile: ProjectFile = {
      ...file,
      id: `pf-${crypto.randomUUID().slice(0, 8)}`,
      uploadedAt: new Date().toISOString().slice(0, 10),
    }
    this.setAndPersist((s) => ({
      ...s,
      projects: s.projects.map((p) =>
        p.id === projectId ? { ...p, files: [newFile, ...p.files] } : p
      ),
    }))
  }

  public addProjectComment(projectId: string, content: string, authorId?: string): void {
    const author =
      this.data.users.find((u) => u.id === authorId) ?? this.data.users[0] ?? {
        id: "usr-admin",
        name: "Admin User",
        role: "Super Admin",
      }

    const comment: ActivityComment = {
      id: `com-${crypto.randomUUID().slice(0, 8)}`,
      authorId: author.id,
      authorName: author.name,
      authorRole: author.role,
      content,
      createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      type: "comment",
    }

    this.setAndPersist((s) => ({
      ...s,
      projects: s.projects.map((p) =>
        p.id === projectId ? { ...p, comments: [comment, ...p.comments] } : p
      ),
    }))
  }

  // --- Task Actions ---
  public createTask(
    task: Omit<Task, "id" | "createdAt" | "subtasks" | "comments" | "evidenceFiles" | "qaHistory" | "redFlaggedUserIds"> & {
      id?: string
      createdAt?: string
      subtasks?: Subtask[]
      comments?: TaskComment[]
      evidenceFiles?: Task["evidenceFiles"]
      qaHistory?: QAReviewEvent[]
      redFlaggedUserIds?: string[]
    }
  ): Task {
    const newTask: Task = {
      ...task,
      id: task.id || `tsk-${crypto.randomUUID().slice(0, 8)}`,
      createdAt: task.createdAt || new Date().toISOString().slice(0, 10),
      subtasks: task.subtasks || [],
      comments: task.comments || [],
      evidenceFiles: task.evidenceFiles || [],
      qaHistory: task.qaHistory || [],
      redFlaggedUserIds: task.redFlaggedUserIds || [],
    }
    this.setAndPersist((s) => ({
      ...s,
      tasks: [newTask, ...s.tasks],
    }))
    return newTask
  }

  public updateTask(id: string, updates: Partial<Task>): void {
    this.setAndPersist((s) => ({
      ...s,
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }))
  }

  public deleteTask(id: string): void {
    this.setAndPersist((s) => ({
      ...s,
      tasks: s.tasks.filter((t) => t.id !== id),
    }))
  }

  public addSubtask(taskId: string, title: string, assigneeId: string): void {
    const newSubtask: Subtask = {
      id: `sub-${crypto.randomUUID().slice(0, 8)}`,
      title,
      completed: false,
      assigneeId,
    }
    this.setAndPersist((s) => ({
      ...s,
      tasks: s.tasks.map((t) =>
        t.id === taskId ? { ...t, subtasks: [...t.subtasks, newSubtask] } : t
      ),
    }))
  }

  public toggleSubtask(taskId: string, subtaskId: string, completed: boolean): void {
    this.setAndPersist((s) => ({
      ...s,
      tasks: s.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: t.subtasks.map((st) =>
                st.id === subtaskId ? { ...st, completed } : st
              ),
            }
          : t
      ),
    }))
  }

  public deleteSubtask(taskId: string, subtaskId: string): void {
    this.setAndPersist((s) => ({
      ...s,
      tasks: s.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: t.subtasks.filter((st) => st.id !== subtaskId),
            }
          : t
      ),
    }))
  }

  public addTaskComment(taskId: string, content: string, authorId?: string): void {
    const author =
      this.data.users.find((u) => u.id === authorId) ?? this.data.users[0] ?? {
        id: "usr-admin",
        name: "Admin User",
      }

    const newComment: TaskComment = {
      id: `tc-${crypto.randomUUID().slice(0, 8)}`,
      authorId: author.id,
      authorName: author.name,
      content,
      createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
    }

    this.setAndPersist((s) => ({
      ...s,
      tasks: s.tasks.map((t) =>
        t.id === taskId ? { ...t, comments: [...t.comments, newComment] } : t
      ),
    }))
  }

  public recordQAReview(
    taskId: string,
    review: {
      outcome: "Pass" | "Fail"
      reviewerName: string
      category?: string
      reason?: string
      evidenceNames?: string[]
      redFlagUserIds?: string[]
    }
  ): void {
    const event: QAReviewEvent = {
      id: `qa-${crypto.randomUUID().slice(0, 8)}`,
      outcome: review.outcome,
      reviewerName: review.reviewerName,
      category: review.category,
      reason: review.reason,
      evidenceNames: review.evidenceNames || [],
      redFlagUserIds: review.redFlagUserIds || [],
      timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
    }

    this.setAndPersist((s) => ({
      ...s,
      tasks: s.tasks.map((t) => {
        if (t.id !== taskId) return t
        return {
          ...t,
          status: review.outcome === "Pass" ? "Complete" : "Re-Draw",
          qaHistory: [event, ...t.qaHistory],
          redFlaggedUserIds:
            review.outcome === "Fail" && review.redFlagUserIds?.length
              ? Array.from(new Set([...t.redFlaggedUserIds, ...review.redFlagUserIds]))
              : t.redFlaggedUserIds,
        }
      }),
    }))
  }

  public setTaskOnHold(taskId: string, reason: string): void {
    this.setAndPersist((s) => ({
      ...s,
      tasks: s.tasks.map((t) =>
        t.id === taskId ? { ...t, status: "On Hold", onHoldReason: reason } : t
      ),
    }))
  }

  // --- Chat Actions ---
  public createChatThread(
    thread: Omit<ChatThread, "id" | "messages" | "unreadCount"> & {
      id?: string
      messages?: ChatMessage[]
    }
  ): ChatThread {
    const newThread: ChatThread = {
      ...thread,
      id: thread.id || `th-${crypto.randomUUID().slice(0, 8)}`,
      unreadCount: 0,
      messages: thread.messages || [],
    }
    this.setAndPersist((s) => ({
      ...s,
      chatThreads: [newThread, ...s.chatThreads],
    }))
    return newThread
  }

  public sendMessage(
    threadId: string,
    content: string,
    senderId?: string,
    attachment?: string
  ): ChatMessage | null {
    const thread = this.data.chatThreads.find((t) => t.id === threadId)
    if (!thread) return null

    const sender =
      this.data.users.find((u) => u.id === senderId) ?? this.data.users[0] ?? {
        id: "usr-admin",
        name: "Admin User",
        avatarInitials: "AU",
      }

    const newMsg: ChatMessage = {
      id: `msg-${crypto.randomUUID().slice(0, 8)}`,
      senderId: sender.id,
      senderName: sender.name,
      senderInitials: sender.avatarInitials,
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      readByIds: [sender.id],
      attachment,
    }

    this.setAndPersist((s) => ({
      ...s,
      chatThreads: s.chatThreads.map((t) =>
        t.id === threadId
          ? {
              ...t,
              messages: [...t.messages, newMsg],
              lastMessageAt: "Just now",
              lastMessagePreview: content,
            }
          : t
      ),
    }))

    return newMsg
  }

  public editMessage(threadId: string, messageId: string, content: string): void {
    this.setAndPersist((s) => ({
      ...s,
      chatThreads: s.chatThreads.map((t) =>
        t.id === threadId
          ? {
              ...t,
              messages: t.messages.map((m) =>
                m.id === messageId ? { ...m, content, edited: true } : m
              ),
            }
          : t
      ),
    }))
  }

  public deleteChatThread(threadId: string): void {
    this.setAndPersist((s) => ({
      ...s,
      chatThreads: s.chatThreads.filter((t) => t.id !== threadId),
    }))
  }

  public markThreadRead(threadId: string): void {
    this.setAndPersist((s) => ({
      ...s,
      chatThreads: s.chatThreads.map((t) =>
        t.id === threadId ? { ...t, unreadCount: 0 } : t
      ),
    }))
  }

  // --- Notification Actions ---
  public addNotification(
    notif: Omit<AppNotification, "id" | "timestamp" | "read"> & { id?: string; timestamp?: string }
  ): AppNotification {
    const newNotif: AppNotification = {
      ...notif,
      id: notif.id || `notif-${crypto.randomUUID().slice(0, 8)}`,
      timestamp: notif.timestamp || "Just now",
      read: false,
    }
    this.setAndPersist((s) => ({
      ...s,
      notifications: [newNotif, ...s.notifications],
    }))
    return newNotif
  }

  public markNotificationRead(id: string): void {
    this.setAndPersist((s) => ({
      ...s,
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }))
  }

  public markAllNotificationsRead(): void {
    this.setAndPersist((s) => ({
      ...s,
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    }))
  }

  public deleteNotification(id: string): void {
    this.setAndPersist((s) => ({
      ...s,
      notifications: s.notifications.filter((n) => n.id !== id),
    }))
  }

  // --- Attendance Actions ---
  public createAttendanceRecord(
    record: Omit<AttendanceRecord, "id" | "logs"> & { id?: string; logs?: AttendanceRecord["logs"] }
  ): AttendanceRecord {
    const newRecord: AttendanceRecord = {
      ...record,
      id: record.id || `att-${crypto.randomUUID().slice(0, 8)}`,
      logs: record.logs || [],
    }
    this.setAndPersist((s) => ({
      ...s,
      attendanceRecords: [newRecord, ...s.attendanceRecords],
    }))
    return newRecord
  }

  public updateAttendanceRecord(id: string, updates: Partial<AttendanceRecord>): void {
    this.setAndPersist((s) => ({
      ...s,
      attendanceRecords: s.attendanceRecords.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      ),
    }))
  }

  public deleteAttendanceRecord(id: string): void {
    this.setAndPersist((s) => ({
      ...s,
      attendanceRecords: s.attendanceRecords.filter((a) => a.id !== id),
    }))
  }

  // --- Leave Actions ---
  public createLeaveRequest(
    request: Omit<LeaveRequest, "id" | "appliedAt" | "status"> & {
      id?: string
      appliedAt?: string
      status?: LeaveRequest["status"]
    }
  ): LeaveRequest {
    const newRequest: LeaveRequest = {
      ...request,
      id: request.id || `lr-${crypto.randomUUID().slice(0, 8)}`,
      appliedAt: request.appliedAt || new Date().toISOString().slice(0, 10),
      status: request.status || "pending",
    }
    this.setAndPersist((s) => ({
      ...s,
      leaveRequests: [newRequest, ...s.leaveRequests],
    }))
    return newRequest
  }

  public updateLeaveRequest(id: string, updates: Partial<LeaveRequest>): void {
    this.setAndPersist((s) => ({
      ...s,
      leaveRequests: s.leaveRequests.map((lr) =>
        lr.id === id ? { ...lr, ...updates } : lr
      ),
    }))
  }

  public deleteLeaveRequest(id: string): void {
    this.setAndPersist((s) => ({
      ...s,
      leaveRequests: s.leaveRequests.filter((lr) => lr.id !== id),
    }))
  }

  public reviewLeaveRequest(
    id: string,
    status: "approved" | "rejected",
    remarks?: string,
    reviewerName?: string
  ): void {
    this.setAndPersist((s) => {
      const request = s.leaveRequests.find((r) => r.id === id)
      if (!request) return s

      // If approved, update user's leave balance accordingly
      const nextBalances =
        status === "approved"
          ? s.leaveBalances.map((b) => {
              if (b.userId !== request.userId) return b
              const lt = s.leaveTypes.find((t) => t.id === request.leaveTypeId)
              if (lt?.code === "AL") {
                return { ...b, annualUsed: b.annualUsed + request.days }
              }
              if (lt?.code === "SL") {
                return { ...b, sickUsed: b.sickUsed + request.days }
              }
              if (lt?.code === "CL") {
                return { ...b, casualUsed: b.casualUsed + request.days }
              }
              return b
            })
          : s.leaveBalances

      return {
        ...s,
        leaveRequests: s.leaveRequests.map((lr) =>
          lr.id === id
            ? {
                ...lr,
                status,
                reviewedBy: reviewerName || "Nadia Kapoor",
                reviewRemarks: remarks,
              }
            : lr
        ),
        leaveBalances: nextBalances,
      }
    })
  }

  public createLeaveType(lt: Omit<LeaveType, "id"> & { id?: string }): LeaveType {
    const newLt: LeaveType = {
      ...lt,
      id: lt.id || `lt-${crypto.randomUUID().slice(0, 8)}`,
    }
    this.setAndPersist((s) => ({
      ...s,
      leaveTypes: [...s.leaveTypes, newLt],
    }))
    return newLt
  }

  public updateLeaveType(id: string, updates: Partial<LeaveType>): void {
    this.setAndPersist((s) => ({
      ...s,
      leaveTypes: s.leaveTypes.map((lt) => (lt.id === id ? { ...lt, ...updates } : lt)),
    }))
  }

  public deleteLeaveType(id: string): DeletionCheckResult {
    const check = checkLeaveTypeDeletion(this.data, id)
    if (!check.allowed) return check
    this.setAndPersist((s) => ({
      ...s,
      leaveTypes: s.leaveTypes.filter((lt) => lt.id !== id),
    }))
    return { allowed: true }
  }

  public createLeaveBalance(lb: Omit<LeaveBalance, "id"> & { id?: string }): LeaveBalance {
    const newLb: LeaveBalance = {
      ...lb,
      id: lb.id || `lb-${crypto.randomUUID().slice(0, 8)}`,
    }
    this.setAndPersist((s) => ({
      ...s,
      leaveBalances: [...s.leaveBalances, newLb],
    }))
    return newLb
  }

  public updateLeaveBalance(id: string, updates: Partial<LeaveBalance>): void {
    this.setAndPersist((s) => ({
      ...s,
      leaveBalances: s.leaveBalances.map((lb) => (lb.id === id ? { ...lb, ...updates } : lb)),
    }))
  }

  public deleteLeaveBalance(id: string): void {
    this.setAndPersist((s) => ({
      ...s,
      leaveBalances: s.leaveBalances.filter((lb) => lb.id !== id),
    }))
  }

  // --- Shifts & Holidays ---
  public createShiftSchedule(s: Omit<ShiftSchedule, "id"> & { id?: string }): ShiftSchedule {
    const newShift: ShiftSchedule = {
      ...s,
      id: s.id || `sh-${crypto.randomUUID().slice(0, 8)}`,
    }
    this.setAndPersist((st) => ({
      ...st,
      shiftSchedules: [...st.shiftSchedules, newShift],
    }))
    return newShift
  }

  public updateShiftSchedule(id: string, updates: Partial<ShiftSchedule>): void {
    this.setAndPersist((s) => ({
      ...s,
      shiftSchedules: s.shiftSchedules.map((sh) =>
        sh.id === id ? { ...sh, ...updates } : sh
      ),
    }))
  }

  public deleteShiftSchedule(id: string): DeletionCheckResult {
    const check = checkShiftDeletion(this.data, id)
    if (!check.allowed) return check
    this.setAndPersist((s) => ({
      ...s,
      shiftSchedules: s.shiftSchedules.filter((sh) => sh.id !== id),
    }))
    return { allowed: true }
  }

  public createHoliday(h: Omit<Holiday, "id"> & { id?: string }): Holiday {
    const newHol: Holiday = {
      ...h,
      id: h.id || `hol-${crypto.randomUUID().slice(0, 8)}`,
    }
    this.setAndPersist((s) => ({
      ...s,
      holidays: [...s.holidays, newHol],
    }))
    return newHol
  }

  public updateHoliday(id: string, updates: Partial<Holiday>): void {
    this.setAndPersist((s) => ({
      ...s,
      holidays: s.holidays.map((h) => (h.id === id ? { ...h, ...updates } : h)),
    }))
  }

  public deleteHoliday(id: string): void {
    this.setAndPersist((s) => ({
      ...s,
      holidays: s.holidays.filter((h) => h.id !== id),
    }))
  }

  // --- Export Logs Actions ---
  public createExportLog(
    log: Omit<ExportLog, "id" | "requestedAt"> & { id?: string; requestedAt?: string }
  ): ExportLog {
    const newLog: ExportLog = {
      ...log,
      id: log.id || `exp-${crypto.randomUUID().slice(0, 8)}`,
      requestedAt: log.requestedAt || new Date().toISOString().slice(0, 16).replace("T", " "),
    }
    this.setAndPersist((s) => ({
      ...s,
      exportLogs: [newLog, ...s.exportLogs],
    }))
    return newLog
  }

  public deleteExportLog(id: string): void {
    this.setAndPersist((s) => ({
      ...s,
      exportLogs: s.exportLogs.filter((l) => l.id !== id),
    }))
  }

  // --- Global Store Management ---
  public loadDemoData(): void {
    const demo = getDemoDataset()
    this.setAndPersist(() => demo)
    toast.success("Loaded full demo dataset successfully.")
  }

  public clearAllData(): void {
    const fresh = createInitialEmptyData()
    this.setAndPersist(() => fresh)
    clearStoredData()
    toast.success("Cleared all agency data; reset to empty reference state.")
  }

  public exportBackup(): string {
    const backup = {
      format: "agencyops-backup",
      version: STORE_VERSION,
      exportedAt: new Date().toISOString(),
      data: this.data,
    }
    return JSON.stringify(backup, null, 2)
  }

  public importBackup(jsonString: string): { success: boolean; error?: string } {
    try {
      const parsed = JSON.parse(jsonString)
      const data = (parsed.data || parsed) as Partial<StoreData>

      if (!data || typeof data !== "object") {
        return { success: false, error: "Invalid backup format: root data object missing." }
      }

      if (data.version && data.version !== STORE_VERSION) {
        return {
          success: false,
          error: `Incompatible backup version: expected ${STORE_VERSION}, got ${data.version}.`,
        }
      }

      // Merge safely into complete store structure
      const base = createInitialEmptyData()
      const restored: StoreData = {
        version: STORE_VERSION,
        brands: Array.isArray(data.brands) ? data.brands : base.brands,
        cities: Array.isArray(data.cities) ? data.cities : base.cities,
        teams: Array.isArray(data.teams) ? data.teams : base.teams,
        users: Array.isArray(data.users) && data.users.length > 0 ? data.users : base.users,
        leads: Array.isArray(data.leads) ? data.leads : base.leads,
        signups: Array.isArray(data.signups) ? data.signups : base.signups,
        invoices: Array.isArray(data.invoices) ? data.invoices : base.invoices,
        transactions: Array.isArray(data.transactions) ? data.transactions : base.transactions,
        marketingSpendings: Array.isArray(data.marketingSpendings)
          ? data.marketingSpendings
          : base.marketingSpendings,
        projects: Array.isArray(data.projects) ? data.projects : base.projects,
        tasks: Array.isArray(data.tasks) ? data.tasks : base.tasks,
        chatThreads: Array.isArray(data.chatThreads) ? data.chatThreads : base.chatThreads,
        notifications: Array.isArray(data.notifications) ? data.notifications : base.notifications,
        attendanceRecords: Array.isArray(data.attendanceRecords)
          ? data.attendanceRecords
          : base.attendanceRecords,
        leaveRequests: Array.isArray(data.leaveRequests) ? data.leaveRequests : base.leaveRequests,
        leaveTypes: Array.isArray(data.leaveTypes) ? data.leaveTypes : base.leaveTypes,
        leaveBalances: Array.isArray(data.leaveBalances) ? data.leaveBalances : base.leaveBalances,
        shiftSchedules: Array.isArray(data.shiftSchedules) ? data.shiftSchedules : base.shiftSchedules,
        holidays: Array.isArray(data.holidays) ? data.holidays : base.holidays,
        exportLogs: Array.isArray(data.exportLogs) ? data.exportLogs : base.exportLogs,
      }

      const ok = this.setAndPersist(() => restored)
      if (ok) {
        toast.success("Imported backup and refreshed store successfully.")
      }
      return { success: ok }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to parse JSON backup"
      return { success: false, error: msg }
    }
  }

  public getStorageUsage(): StorageEstimate {
    return getStorageEstimate()
  }
}

export const storeManager = new StoreManager()
