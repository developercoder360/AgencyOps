import type {
  AppNotification,
  AttendanceRecord,
  Brand,
  City,
  CurrencyCode,
  ExportLog,
  Holiday,
  Invoice,
  Lead,
  LeadSource,
  LeaveBalance,
  LeaveRequest,
  LeaveType,
  MarketingSpend,
  ModulePermissions,
  PaymentGateway,
  PermissionModule,
  Project,
  Role,
  ShiftSchedule,
  SignUp,
  StaffUser,
  Task,
  ChatThread,
  Transaction,
} from "@/types"

export interface StoreData {
  version: number
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

export const STORE_STORAGE_KEY = "agencyops:data:v1"
export const STORE_VERSION = 1

export const REFERENCE_CURRENCIES: CurrencyCode[] = ["USD", "GBP", "CAD"]

export const REFERENCE_GATEWAYS: PaymentGateway[] = [
  "Stripe",
  "Square",
  "Authorize.Net",
  "NMI",
  "Bank Transfer",
]

export const REFERENCE_LEAD_SOURCES: LeadSource[] = [
  "Google Ads",
  "Bing Ads",
  "Website",
  "Organic SEO",
  "Referral",
  "Social Media",
  "Email Campaign",
]

const ALL_MODULES: PermissionModule[] = [
  "dashboard",
  "brands",
  "leads",
  "signups",
  "invoices",
  "transactions",
  "marketing",
  "projects",
  "tasks",
  "chats",
  "hrm",
  "users",
  "teams",
  "cities",
  "exports",
  "settings",
]

export function buildPermissions(role: Role): Record<PermissionModule, ModulePermissions> {
  const result = {} as Record<PermissionModule, ModulePermissions>
  for (const mod of ALL_MODULES) {
    const isAdmin = role === "Super Admin"
    const isSales =
      role === "Sales/Account Manager" &&
      [
        "dashboard",
        "brands",
        "leads",
        "signups",
        "invoices",
        "transactions",
        "marketing",
        "projects",
        "chats",
        "exports",
      ].includes(mod)
    const isPm =
      role === "Project Admin" &&
      [
        "dashboard",
        "leads",
        "projects",
        "tasks",
        "chats",
        "teams",
        "exports",
      ].includes(mod)
    const isDev =
      role === "Designer/Developer" &&
      ["dashboard", "projects", "tasks", "chats"].includes(mod)
    const isQa =
      role === "QA Reviewer" &&
      ["dashboard", "projects", "tasks", "chats", "exports"].includes(mod)
    const isHr =
      role === "HR Manager" &&
      [
        "dashboard",
        "hrm",
        "users",
        "teams",
        "cities",
        "exports",
        "settings",
      ].includes(mod)

    const canView = isAdmin || isSales || isPm || isDev || isQa || isHr
    result[mod] = {
      view: canView,
      create: canView && !isDev && mod !== "transactions",
      edit: canView && (isAdmin || !isDev || mod === "tasks"),
      delete: isAdmin,
      export: isAdmin || isSales || isPm || isHr || (isQa && mod === "tasks"),
    }
  }
  return result
}

export const DEFAULT_LEAVE_TYPES: LeaveType[] = [
  {
    id: "lt-annual",
    name: "Annual Leave",
    code: "AL",
    daysAllowedPerYear: 20,
    paid: true,
    carryForwardLimit: 5,
    requiresDocument: false,
    color: "#059669",
    description: "Standard statutory annual paid vacation allowance.",
  },
  {
    id: "lt-sick",
    name: "Medical / Sick Leave",
    code: "SL",
    daysAllowedPerYear: 10,
    paid: true,
    carryForwardLimit: 0,
    requiresDocument: true,
    color: "#DC2626",
    description: "Sick leave for health recovery; doctor note required for >2 days.",
  },
  {
    id: "lt-casual",
    name: "Casual / Personal Leave",
    code: "CL",
    daysAllowedPerYear: 6,
    paid: true,
    carryForwardLimit: 0,
    requiresDocument: false,
    color: "#7C3AED",
    description: "Short-notice personal errands and family commitments.",
  },
  {
    id: "lt-parental",
    name: "Parental Leave",
    code: "PL",
    daysAllowedPerYear: 60,
    paid: true,
    carryForwardLimit: 0,
    requiresDocument: true,
    color: "#D97706",
    description: "Primary and secondary caregiver paid parental bonding leave.",
  },
  {
    id: "lt-unpaid",
    name: "Unpaid Sabbatical",
    code: "UL",
    daysAllowedPerYear: 30,
    paid: false,
    carryForwardLimit: 0,
    requiresDocument: false,
    color: "#64748B",
    description: "Approved extended unpaid leave subject to lead sign-off.",
  },
]

export const DEFAULT_SHIFTS: ShiftSchedule[] = [
  {
    id: "sh-core",
    name: "US Core Business Shift",
    code: "EST-09",
    startTime: "09:00",
    endTime: "18:00",
    graceMinutes: 15,
    timezone: "America/New_York",
    workDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    assignedCount: 1,
    isNightShift: false,
  },
]

export const DEFAULT_ADMIN_USER: StaffUser = {
  id: "usr-admin",
  name: "Marcus Vance",
  email: "admin@agencyops.io",
  role: "Super Admin",
  department: "Executive",
  teamId: "",
  teamName: "Executive Operations",
  brandIds: [],
  avatarInitials: "MV",
  avatarColor: "bg-blue-600",
  phone: "+1 (212) 555-0100",
  city: "New York",
  timezone: "America/New_York",
  status: "Active",
  joinedAt: "2024-01-01",
  birthday: "1988-06-15",
  monthlyTargetUsd: 150000,
  redFlagCount: 0,
  permissions: buildPermissions("Super Admin"),
}

export function createInitialEmptyData(): StoreData {
  return {
    version: STORE_VERSION,
    brands: [],
    cities: [],
    teams: [],
    users: [DEFAULT_ADMIN_USER],
    leads: [],
    signups: [],
    invoices: [],
    transactions: [],
    marketingSpendings: [],
    projects: [],
    tasks: [],
    chatThreads: [],
    notifications: [],
    attendanceRecords: [],
    leaveRequests: [],
    leaveTypes: [...DEFAULT_LEAVE_TYPES],
    leaveBalances: [
      {
        id: "lb-admin",
        userId: DEFAULT_ADMIN_USER.id,
        userName: DEFAULT_ADMIN_USER.name,
        department: DEFAULT_ADMIN_USER.department,
        annualTotal: 20,
        annualUsed: 0,
        sickTotal: 10,
        sickUsed: 0,
        casualTotal: 6,
        casualUsed: 0,
        carryForward: 0,
      },
    ],
    shiftSchedules: [...DEFAULT_SHIFTS],
    holidays: [],
    exportLogs: [],
  }
}
