export type Role =
  | "Super Admin"
  | "Sales/Account Manager"
  | "Project Admin"
  | "Designer/Developer"
  | "QA Reviewer"
  | "HR Manager"

export type CurrencyCode = "USD" | "GBP" | "CAD"

export type ProjectStatus =
  | "Open"
  | "Progress"
  | "Re-Draw"
  | "Complete"
  | "Overdue"

export type TaskStatus =
  | "Open"
  | "Progress"
  | "QA Review"
  | "On Hold"
  | "Re-Draw"
  | "Complete"

export type TaskPriority = "Regular" | "High" | "Urgent"

export type PaymentStatus =
  | "Created"
  | "Viewed"
  | "Processing"
  | "Success"
  | "Denied"
  | "Refund Requested"
  | "Refunded"
  | "Chargeback"

export type AttendanceStatus =
  | "present"
  | "late"
  | "halfday"
  | "absent"
  | "leave"
  | "holiday"
  | "weekend"

export type ExportStatus = "queued" | "processing" | "completed" | "failed"

export type LeaveStatus = "pending" | "approved" | "rejected"

export type LeadSource =
  | "Google Ads"
  | "Bing Ads"
  | "Website"
  | "Organic SEO"
  | "Referral"
  | "Social Media"
  | "Email Campaign"

export type LeadStatus =
  | "New"
  | "Contacted"
  | "Qualified"
  | "Proposal Sent"
  | "Converted"
  | "Lost"

export type PaymentGateway =
  | "Stripe"
  | "Square"
  | "Authorize.Net"
  | "NMI"
  | "Bank Transfer"

export type PermissionModule =
  | "dashboard"
  | "brands"
  | "leads"
  | "signups"
  | "invoices"
  | "transactions"
  | "marketing"
  | "projects"
  | "tasks"
  | "chats"
  | "hrm"
  | "users"
  | "teams"
  | "cities"
  | "exports"
  | "settings"

export interface ModulePermissions {
  view: boolean
  create: boolean
  edit: boolean
  delete: boolean
  export: boolean
}

export interface Brand {
  id: string
  name: string
  slug: string
  domain: string
  tagline: string
  primaryColor: string
  logoText: string
  logoUrl?: string
  email: string
  phone: string
  activeLeads: number
  monthlyRevenueUsd: number
  status: "Active" | "Inactive"
  createdAt: string
}

export interface Team {
  id: string
  name: string
  department: string
  leadId: string
  leadName: string
  memberIds: string[]
  brandIds: string[]
  activeProjects: number
  createdAt: string
}

export interface City {
  id: string
  name: string
  state: string
  country: string
  timezone: string
  currency: CurrencyCode
  activeClients: number
  leadCount: number
  status: "Active" | "Inactive"
}

export interface StaffUser {
  id: string
  name: string
  email: string
  role: Role
  department: string
  teamId: string
  teamName: string
  brandIds: string[]
  avatarInitials: string
  avatarColor: string
  phone: string
  city: string
  timezone: string
  status: "Active" | "Inactive" | "On Leave"
  joinedAt: string
  birthday: string
  monthlyTargetUsd: number
  redFlagCount: number
  permissions: Record<PermissionModule, ModulePermissions>
}

export interface LeadAssignmentEvent {
  id: string
  fromStaffName: string | null
  toStaffName: string
  assignedBy: string
  timestamp: string
  note: string
}

export interface Lead {
  id: string
  code: string
  name: string
  email: string
  phone: string
  company: string
  brandId: string
  brandName: string
  source: LeadSource
  city: string
  country: string
  estimatedValue: number
  currency: CurrencyCode
  status: LeadStatus
  assignedStaffIds: string[]
  createdAt: string
  notes: string
  assignmentHistory: LeadAssignmentEvent[]
}

export interface SignUp {
  id: string
  code: string
  name: string
  email: string
  phone: string
  brandId: string
  brandName: string
  serviceInterest: string
  source: LeadSource
  city: string
  ipAddress: string
  utmCampaign: string
  convertedToLead: boolean
  leadId?: string
  createdAt: string
  notes: string
}

export interface AttachmentFile {
  id: string
  name: string
  size: string
  type: string
  uploadedBy: string
  uploadedAt: string
}

export interface InvoiceLineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
}

export interface Invoice {
  id: string
  invoiceNumber: string
  clientName: string
  clientEmail: string
  clientCompany: string
  brandId: string
  brandName: string
  projectId?: string
  projectName?: string
  gateway: PaymentGateway
  currency: CurrencyCode
  lineItems: InvoiceLineItem[]
  subtotal: number
  taxRate: number
  taxAmount: number
  discountAmount: number
  total: number
  status: PaymentStatus
  dueDate: string
  issuedAt: string
  paidAt?: string
  salesRepId: string
  attachments: AttachmentFile[]
  notes?: string
}

export interface TransactionEvent {
  id: string
  status: PaymentStatus
  title: string
  detail: string
  actor: string
  timestamp: string
}

export interface Transaction {
  id: string
  txRef: string
  invoiceId: string
  invoiceNumber: string
  clientName: string
  brandId: string
  brandName: string
  gateway: PaymentGateway
  currency: CurrencyCode
  amount: number
  amountUsd: number
  status: PaymentStatus
  cardLast4?: string
  cardBrand?: string
  createdAt: string
  events: TransactionEvent[]
}

export interface MarketingSpend {
  id: string
  date: string
  brandId: string
  brandName: string
  source: LeadSource
  spendUsd: number
  impressions: number
  clicks: number
  leadsGenerated: number
  revenueAttributedUsd: number
}

export interface ProjectFile extends AttachmentFile {
  clientVisible: boolean
  folder: "Briefs" | "Designs" | "Deliverables" | "Contracts"
}

export interface ActivityComment {
  id: string
  authorId: string
  authorName: string
  authorRole: Role
  content: string
  createdAt: string
  type: "comment" | "system"
}

export interface Project {
  id: string
  code: string
  name: string
  clientName: string
  clientCompany: string
  brandId: string
  brandName: string
  category:
    | "Web Design"
    | "Logo & Branding"
    | "SEO"
    | "Performance Marketing"
    | "Full Stack App"
  status: ProjectStatus
  priority: TaskPriority
  budget: number
  currency: CurrencyCode
  progress: number
  startDate: string
  deadline: string
  managerId: string
  memberIds: string[]
  description: string
  files: ProjectFile[]
  comments: ActivityComment[]
}

export interface Subtask {
  id: string
  title: string
  completed: boolean
  assigneeId: string
}

export interface TaskComment {
  id: string
  authorId: string
  authorName: string
  content: string
  createdAt: string
}

export interface QAReviewEvent {
  id: string
  outcome: "Pass" | "Fail"
  reviewerName: string
  category?: string
  reason?: string
  evidenceNames: string[]
  redFlagUserIds: string[]
  timestamp: string
}

export interface Task {
  id: string
  code: string
  title: string
  description: string
  projectId: string
  projectName: string
  brandId: string
  brandName: string
  status: TaskStatus
  priority: TaskPriority
  assigneeIds: string[]
  reviewerId: string
  dueDate: string
  estimatedHours: number
  loggedHours: number
  subtasks: Subtask[]
  comments: TaskComment[]
  evidenceFiles: AttachmentFile[]
  onHoldReason?: string
  qaHistory: QAReviewEvent[]
  redFlaggedUserIds: string[]
  createdAt: string
}

export interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  senderInitials: string
  content: string
  timestamp: string
  edited?: boolean
  readByIds: string[]
  attachment?: string
}

export interface ChatThread {
  id: string
  projectId: string
  projectName: string
  brandName: string
  participantIds: string[]
  unreadCount: number
  lastMessageAt: string
  lastMessagePreview: string
  messages: ChatMessage[]
}

export interface AttendanceLogEvent {
  id: string
  action: string
  actor: string
  timestamp: string
  detail: string
}

export interface AttendanceRecord {
  id: string
  userId: string
  userName: string
  userRole: Role
  department: string
  date: string
  status: AttendanceStatus
  checkIn?: string
  checkOut?: string
  workHours: number
  lateMinutes: number
  shiftName: string
  notes?: string
  logs: AttendanceLogEvent[]
}

export interface LeaveBalance {
  id: string
  userId: string
  userName: string
  department: string
  annualTotal: number
  annualUsed: number
  sickTotal: number
  sickUsed: number
  casualTotal: number
  casualUsed: number
  carryForward: number
}

export interface LeaveRequest {
  id: string
  userId: string
  userName: string
  department: string
  leaveTypeId: string
  leaveTypeName: string
  startDate: string
  endDate: string
  days: number
  reason: string
  status: LeaveStatus
  reviewedBy?: string
  reviewRemarks?: string
  appliedAt: string
}

export interface LeaveType {
  id: string
  name: string
  code: string
  daysAllowedPerYear: number
  paid: boolean
  carryForwardLimit: number
  requiresDocument: boolean
  color: string
  description: string
}

export interface ShiftSchedule {
  id: string
  name: string
  code: string
  startTime: string
  endTime: string
  graceMinutes: number
  timezone: string
  workDays: string[]
  assignedCount: number
  isNightShift: boolean
}

export interface Holiday {
  id: string
  name: string
  date: string
  type: "Public" | "Company" | "Optional"
  region: string
  description: string
}

export interface ExportLog {
  id: string
  module: string
  fileName: string
  format: "CSV" | "XLSX"
  rowCount: number
  columns: string[]
  status: ExportStatus
  requestedBy: string
  requestedAt: string
  completedAt?: string
  fileSize: string
  errorMessage?: string
}

export interface AppNotification {
  id: string
  title: string
  description: string
  category: "lead" | "payment" | "project" | "task" | "hr" | "system"
  read: boolean
  timestamp: string
  href: string
}
