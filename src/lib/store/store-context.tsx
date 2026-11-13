"use client"

import * as React from "react"
import { storeManager } from "./store"
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
import type { StorageEstimate } from "./storage"
import type { Team } from "./types"

export interface StoreContextValue {
  isLoaded: boolean

  // Entities
  brands: Brand[]
  cities: City[]
  teams: Team[]
  users: StaffUser[]
  leads: Lead[]
  signups: SignUp[]
  invoices: Invoice[]
  transactions: Transaction[]
  marketingSpendings: MarketingSpend[]
  projects: Project[]
  tasks: Task[]
  chatThreads: ChatThread[]
  notifications: AppNotification[]
  attendanceRecords: AttendanceRecord[]
  leaveRequests: LeaveRequest[]
  leaveTypes: LeaveType[]
  leaveBalances: LeaveBalance[]
  shiftSchedules: ShiftSchedule[]
  holidays: Holiday[]
  exportLogs: ExportLog[]

  // Lookups
  getBrandById: (id: string) => Brand | undefined
  getCityById: (id: string) => City | undefined
  getTeamById: (id: string) => Team | undefined
  getUserById: (id: string) => StaffUser | undefined
  getLeadById: (id: string) => Lead | undefined
  getProjectById: (id: string) => Project | undefined
  getInvoiceById: (id: string) => Invoice | undefined
  getTaskById: (id: string) => Task | undefined
  getChatThreadById: (id: string) => ChatThread | undefined

  // Deletion checks
  checkBrandDeletion: (id: string) => DeletionCheckResult
  checkTeamDeletion: (id: string) => DeletionCheckResult
  checkCityDeletion: (id: string) => DeletionCheckResult
  checkUserDeletion: (id: string) => DeletionCheckResult
  checkLeadDeletion: (id: string) => DeletionCheckResult
  checkProjectDeletion: (id: string) => DeletionCheckResult
  checkInvoiceDeletion: (id: string) => DeletionCheckResult
  checkLeaveTypeDeletion: (id: string) => DeletionCheckResult
  checkShiftDeletion: (id: string) => DeletionCheckResult

  // CRUD actions
  createBrand: (brand: Omit<Brand, "id" | "createdAt"> & { id?: string; createdAt?: string }) => Brand
  updateBrand: (id: string, updates: Partial<Brand>) => void
  deleteBrand: (id: string) => DeletionCheckResult

  createCity: (city: Omit<City, "id"> & { id?: string }) => City
  updateCity: (id: string, updates: Partial<City>) => void
  deleteCity: (id: string) => DeletionCheckResult

  createTeam: (team: Omit<Team, "id" | "createdAt"> & { id?: string; createdAt?: string }) => Team
  updateTeam: (id: string, updates: Partial<Team>) => void
  deleteTeam: (id: string) => DeletionCheckResult

  createUser: (user: Omit<StaffUser, "id" | "joinedAt"> & { id?: string; joinedAt?: string }) => StaffUser
  updateUser: (id: string, updates: Partial<StaffUser>) => void
  deleteUser: (id: string) => DeletionCheckResult

  createLead: (
    lead: Omit<Lead, "id" | "createdAt" | "assignmentHistory"> & {
      id?: string
      createdAt?: string
      assignmentHistory?: Lead["assignmentHistory"]
    }
  ) => Lead
  updateLead: (id: string, updates: Partial<Lead>) => void
  deleteLead: (id: string) => DeletionCheckResult

  createSignUp: (signup: Omit<SignUp, "id" | "createdAt"> & { id?: string; createdAt?: string }) => SignUp
  updateSignUp: (id: string, updates: Partial<SignUp>) => void
  deleteSignUp: (id: string) => void
  convertSignUpToLead: (
    signupId: string,
    leadData: {
      estimatedValue: number
      currency: "USD" | "GBP" | "CAD"
      assignedStaffId: string
      city: string
    }
  ) => Lead | null

  createInvoice: (
    inv: Omit<Invoice, "id" | "issuedAt"> & { id?: string; issuedAt?: string }
  ) => Invoice
  updateInvoice: (id: string, updates: Partial<Invoice>) => void
  deleteInvoice: (id: string) => DeletionCheckResult

  createTransaction: (
    tx: Omit<Transaction, "id" | "createdAt" | "events"> & {
      id?: string
      createdAt?: string
      events?: Transaction["events"]
    }
  ) => Transaction
  updateTransaction: (id: string, updates: Partial<Transaction>) => void
  deleteTransaction: (id: string) => void

  createMarketingSpend: (
    ms: Omit<MarketingSpend, "id" | "date"> & { id?: string; date?: string }
  ) => MarketingSpend
  updateMarketingSpend: (id: string, updates: Partial<MarketingSpend>) => void
  deleteMarketingSpend: (id: string) => void

  createProject: (
    project: Omit<Project, "id" | "files" | "comments"> & {
      id?: string
      files?: ProjectFile[]
      comments?: ActivityComment[]
    }
  ) => Project
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => DeletionCheckResult
  addProjectFile: (projectId: string, file: Omit<ProjectFile, "id" | "uploadedAt">) => void
  addProjectComment: (projectId: string, content: string, authorId?: string) => void

  createTask: (
    task: Omit<Task, "id" | "createdAt" | "subtasks" | "comments" | "evidenceFiles" | "qaHistory" | "redFlaggedUserIds"> & {
      id?: string
      createdAt?: string
      subtasks?: Subtask[]
      comments?: TaskComment[]
      evidenceFiles?: Task["evidenceFiles"]
      qaHistory?: QAReviewEvent[]
      redFlaggedUserIds?: string[]
    }
  ) => Task
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  addSubtask: (taskId: string, title: string, assigneeId: string) => void
  toggleSubtask: (taskId: string, subtaskId: string, completed: boolean) => void
  deleteSubtask: (taskId: string, subtaskId: string) => void
  addTaskComment: (taskId: string, content: string, authorId?: string) => void
  recordQAReview: (
    taskId: string,
    review: {
      outcome: "Pass" | "Fail"
      reviewerName: string
      category?: string
      reason?: string
      evidenceNames?: string[]
      redFlagUserIds?: string[]
    }
  ) => void
  setTaskOnHold: (taskId: string, reason: string) => void

  createChatThread: (
    thread: Omit<ChatThread, "id" | "messages" | "unreadCount"> & {
      id?: string
      messages?: ChatMessage[]
    }
  ) => ChatThread
  sendMessage: (
    threadId: string,
    content: string,
    senderId?: string,
    attachment?: string
  ) => ChatMessage | null
  editMessage: (threadId: string, messageId: string, content: string) => void
  deleteChatThread: (threadId: string) => void
  markThreadRead: (threadId: string) => void

  addNotification: (
    notif: Omit<AppNotification, "id" | "timestamp" | "read"> & { id?: string; timestamp?: string }
  ) => AppNotification
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  deleteNotification: (id: string) => void

  createAttendanceRecord: (
    record: Omit<AttendanceRecord, "id" | "logs"> & { id?: string; logs?: AttendanceRecord["logs"] }
  ) => AttendanceRecord
  updateAttendanceRecord: (id: string, updates: Partial<AttendanceRecord>) => void
  deleteAttendanceRecord: (id: string) => void

  createLeaveRequest: (
    request: Omit<LeaveRequest, "id" | "appliedAt" | "status"> & {
      id?: string
      appliedAt?: string
      status?: LeaveRequest["status"]
    }
  ) => LeaveRequest
  updateLeaveRequest: (id: string, updates: Partial<LeaveRequest>) => void
  deleteLeaveRequest: (id: string) => void
  reviewLeaveRequest: (
    id: string,
    status: "approved" | "rejected",
    remarks?: string,
    reviewerName?: string
  ) => void

  createLeaveType: (lt: Omit<LeaveType, "id"> & { id?: string }) => LeaveType
  updateLeaveType: (id: string, updates: Partial<LeaveType>) => void
  deleteLeaveType: (id: string) => DeletionCheckResult

  createLeaveBalance: (lb: Omit<LeaveBalance, "id"> & { id?: string }) => LeaveBalance
  updateLeaveBalance: (id: string, updates: Partial<LeaveBalance>) => void
  deleteLeaveBalance: (id: string) => void

  createShiftSchedule: (s: Omit<ShiftSchedule, "id"> & { id?: string }) => ShiftSchedule
  updateShiftSchedule: (id: string, updates: Partial<ShiftSchedule>) => void
  deleteShiftSchedule: (id: string) => DeletionCheckResult

  createHoliday: (h: Omit<Holiday, "id"> & { id?: string }) => Holiday
  updateHoliday: (id: string, updates: Partial<Holiday>) => void
  deleteHoliday: (id: string) => void

  createExportLog: (
    log: Omit<ExportLog, "id" | "requestedAt"> & { id?: string; requestedAt?: string }
  ) => ExportLog
  deleteExportLog: (id: string) => void

  // Management
  loadDemoData: () => void
  clearAllData: () => void
  exportBackup: () => string
  importBackup: (jsonString: string) => { success: boolean; error?: string }
  getStorageUsage: () => StorageEstimate
}

const emptySubscribe = () => () => {}

function useIsMounted() {
  return React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}

const StoreContext = React.createContext<StoreContextValue | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const isLoaded = useIsMounted()

  const store = React.useSyncExternalStore(
    storeManager.subscribe,
    storeManager.getSnapshot,
    storeManager.getServerSnapshot
  )

  const value = React.useMemo<StoreContextValue>(() => {
    return {
      isLoaded,

      brands: store.brands,
      cities: store.cities,
      teams: store.teams,
      users: store.users,
      leads: store.leads,
      signups: store.signups,
      invoices: store.invoices,
      transactions: store.transactions,
      marketingSpendings: store.marketingSpendings,
      projects: store.projects,
      tasks: store.tasks,
      chatThreads: store.chatThreads,
      notifications: store.notifications,
      attendanceRecords: store.attendanceRecords,
      leaveRequests: store.leaveRequests,
      leaveTypes: store.leaveTypes,
      leaveBalances: store.leaveBalances,
      shiftSchedules: store.shiftSchedules,
      holidays: store.holidays,
      exportLogs: store.exportLogs,

      getBrandById: (id: string) => store.brands.find((b) => b.id === id),
      getCityById: (id: string) => store.cities.find((c) => c.id === id),
      getTeamById: (id: string) => store.teams.find((t) => t.id === id),
      getUserById: (id: string) => store.users.find((u) => u.id === id),
      getLeadById: (id: string) => store.leads.find((l) => l.id === id),
      getProjectById: (id: string) => store.projects.find((p) => p.id === id),
      getInvoiceById: (id: string) => store.invoices.find((i) => i.id === id),
      getTaskById: (id: string) => store.tasks.find((t) => t.id === id),
      getChatThreadById: (id: string) => store.chatThreads.find((c) => c.id === id),

      checkBrandDeletion: (id: string) => checkBrandDeletion(store, id),
      checkTeamDeletion: (id: string) => checkTeamDeletion(store, id),
      checkCityDeletion: (id: string) => checkCityDeletion(store, id),
      checkUserDeletion: (id: string) => checkUserDeletion(store, id),
      checkLeadDeletion: (id: string) => checkLeadDeletion(store, id),
      checkProjectDeletion: (id: string) => checkProjectDeletion(store, id),
      checkInvoiceDeletion: (id: string) => checkInvoiceDeletion(store, id),
      checkLeaveTypeDeletion: (id: string) => checkLeaveTypeDeletion(store, id),
      checkShiftDeletion: (id: string) => checkShiftDeletion(store, id),

      createBrand: storeManager.createBrand.bind(storeManager),
      updateBrand: storeManager.updateBrand.bind(storeManager),
      deleteBrand: storeManager.deleteBrand.bind(storeManager),

      createCity: storeManager.createCity.bind(storeManager),
      updateCity: storeManager.updateCity.bind(storeManager),
      deleteCity: storeManager.deleteCity.bind(storeManager),

      createTeam: storeManager.createTeam.bind(storeManager),
      updateTeam: storeManager.updateTeam.bind(storeManager),
      deleteTeam: storeManager.deleteTeam.bind(storeManager),

      createUser: storeManager.createUser.bind(storeManager),
      updateUser: storeManager.updateUser.bind(storeManager),
      deleteUser: storeManager.deleteUser.bind(storeManager),

      createLead: storeManager.createLead.bind(storeManager),
      updateLead: storeManager.updateLead.bind(storeManager),
      deleteLead: storeManager.deleteLead.bind(storeManager),

      createSignUp: storeManager.createSignUp.bind(storeManager),
      updateSignUp: storeManager.updateSignUp.bind(storeManager),
      deleteSignUp: storeManager.deleteSignUp.bind(storeManager),
      convertSignUpToLead: storeManager.convertSignUpToLead.bind(storeManager),

      createInvoice: storeManager.createInvoice.bind(storeManager),
      updateInvoice: storeManager.updateInvoice.bind(storeManager),
      deleteInvoice: storeManager.deleteInvoice.bind(storeManager),

      createTransaction: storeManager.createTransaction.bind(storeManager),
      updateTransaction: storeManager.updateTransaction.bind(storeManager),
      deleteTransaction: storeManager.deleteTransaction.bind(storeManager),

      createMarketingSpend: storeManager.createMarketingSpend.bind(storeManager),
      updateMarketingSpend: storeManager.updateMarketingSpend.bind(storeManager),
      deleteMarketingSpend: storeManager.deleteMarketingSpend.bind(storeManager),

      createProject: storeManager.createProject.bind(storeManager),
      updateProject: storeManager.updateProject.bind(storeManager),
      deleteProject: storeManager.deleteProject.bind(storeManager),
      addProjectFile: storeManager.addProjectFile.bind(storeManager),
      addProjectComment: storeManager.addProjectComment.bind(storeManager),

      createTask: storeManager.createTask.bind(storeManager),
      updateTask: storeManager.updateTask.bind(storeManager),
      deleteTask: storeManager.deleteTask.bind(storeManager),
      addSubtask: storeManager.addSubtask.bind(storeManager),
      toggleSubtask: storeManager.toggleSubtask.bind(storeManager),
      deleteSubtask: storeManager.deleteSubtask.bind(storeManager),
      addTaskComment: storeManager.addTaskComment.bind(storeManager),
      recordQAReview: storeManager.recordQAReview.bind(storeManager),
      setTaskOnHold: storeManager.setTaskOnHold.bind(storeManager),

      createChatThread: storeManager.createChatThread.bind(storeManager),
      sendMessage: storeManager.sendMessage.bind(storeManager),
      editMessage: storeManager.editMessage.bind(storeManager),
      deleteChatThread: storeManager.deleteChatThread.bind(storeManager),
      markThreadRead: storeManager.markThreadRead.bind(storeManager),

      addNotification: storeManager.addNotification.bind(storeManager),
      markNotificationRead: storeManager.markNotificationRead.bind(storeManager),
      markAllNotificationsRead: storeManager.markAllNotificationsRead.bind(storeManager),
      deleteNotification: storeManager.deleteNotification.bind(storeManager),

      createAttendanceRecord: storeManager.createAttendanceRecord.bind(storeManager),
      updateAttendanceRecord: storeManager.updateAttendanceRecord.bind(storeManager),
      deleteAttendanceRecord: storeManager.deleteAttendanceRecord.bind(storeManager),

      createLeaveRequest: storeManager.createLeaveRequest.bind(storeManager),
      updateLeaveRequest: storeManager.updateLeaveRequest.bind(storeManager),
      deleteLeaveRequest: storeManager.deleteLeaveRequest.bind(storeManager),
      reviewLeaveRequest: storeManager.reviewLeaveRequest.bind(storeManager),

      createLeaveType: storeManager.createLeaveType.bind(storeManager),
      updateLeaveType: storeManager.updateLeaveType.bind(storeManager),
      deleteLeaveType: storeManager.deleteLeaveType.bind(storeManager),

      createLeaveBalance: storeManager.createLeaveBalance.bind(storeManager),
      updateLeaveBalance: storeManager.updateLeaveBalance.bind(storeManager),
      deleteLeaveBalance: storeManager.deleteLeaveBalance.bind(storeManager),

      createShiftSchedule: storeManager.createShiftSchedule.bind(storeManager),
      updateShiftSchedule: storeManager.updateShiftSchedule.bind(storeManager),
      deleteShiftSchedule: storeManager.deleteShiftSchedule.bind(storeManager),

      createHoliday: storeManager.createHoliday.bind(storeManager),
      updateHoliday: storeManager.updateHoliday.bind(storeManager),
      deleteHoliday: storeManager.deleteHoliday.bind(storeManager),

      createExportLog: storeManager.createExportLog.bind(storeManager),
      deleteExportLog: storeManager.deleteExportLog.bind(storeManager),

      loadDemoData: storeManager.loadDemoData.bind(storeManager),
      clearAllData: storeManager.clearAllData.bind(storeManager),
      exportBackup: storeManager.exportBackup.bind(storeManager),
      importBackup: storeManager.importBackup.bind(storeManager),
      getStorageUsage: storeManager.getStorageUsage.bind(storeManager),
    }
  }, [store, isLoaded])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreContextValue {
  const ctx = React.useContext(StoreContext)
  if (!ctx) {
    throw new Error("useStore must be used within StoreProvider")
  }
  return ctx
}
