import type {
  FilePermissionKey,
  PermissionModule,
  Role,
  TaskPermissionKey,
  UserFilePermissions,
  UserTaskPermissions,
} from "@/types"

export const FILE_PERMISSION_KEYS: readonly FilePermissionKey[] = [
  "files.view",
  "files.upload",
  "files.download",
  "files.delete",
  "files.manage_visibility",
] as const

export const DEFAULT_FILE_PERMISSIONS: UserFilePermissions = {
  "files.view": true,
  "files.upload": true,
  "files.download": true,
  "files.delete": true,
  "files.manage_visibility": true,
}

export const READ_ONLY_FILE_PERMISSIONS: UserFilePermissions = {
  "files.view": true,
  "files.upload": false,
  "files.download": true,
  "files.delete": false,
  "files.manage_visibility": false,
}

export const FILE_PERMISSION_META: Record<
  FilePermissionKey,
  { label: string; description: string }
> = {
  "files.view": {
    label: "View Files",
    description: "Browse and preview files across tasks, projects, and clients",
  },
  "files.upload": {
    label: "Upload Files",
    description: "Upload new files, rename files, and move files between scopes",
  },
  "files.download": {
    label: "Download Files",
    description: "Download individual files and bulk ZIP archives",
  },
  "files.delete": {
    label: "Delete Files",
    description: "Permanently remove files from the workspace",
  },
  "files.manage_visibility": {
    label: "Manage Client Visibility",
    description: "Toggle Client visible vs Internal status on files",
  },
}

/**
 * Pure permission-based check (per-user permissions, independent of roles).
 */
export function hasFilePermission(
  permissions: Partial<UserFilePermissions> | undefined,
  key: FilePermissionKey
): boolean {
  if (!permissions) return true
  return permissions[key] ?? true
}

export function resolveUserFilePermissions(
  userPermissionsMap: Record<string, UserFilePermissions> | undefined,
  userId: string | undefined
): UserFilePermissions {
  if (!userId || !userPermissionsMap || !userPermissionsMap[userId]) {
    return { ...DEFAULT_FILE_PERMISSIONS }
  }
  return {
    ...DEFAULT_FILE_PERMISSIONS,
    ...userPermissionsMap[userId],
  }
}

export const TASK_PERMISSION_KEYS: readonly TaskPermissionKey[] = [
  "tasks.view",
  "tasks.create",
  "tasks.edit",
  "tasks.delete",
  "tasks.assign",
  "tasks.manage_status",
] as const

export const DEFAULT_TASK_PERMISSIONS: UserTaskPermissions = {
  "tasks.view": true,
  "tasks.create": true,
  "tasks.edit": true,
  "tasks.delete": true,
  "tasks.assign": true,
  "tasks.manage_status": true,
}

export const READ_ONLY_TASK_PERMISSIONS: UserTaskPermissions = {
  "tasks.view": true,
  "tasks.create": false,
  "tasks.edit": false,
  "tasks.delete": false,
  "tasks.assign": false,
  "tasks.manage_status": false,
}

export const TASK_PERMISSION_META: Record<
  TaskPermissionKey,
  { label: string; description: string }
> = {
  "tasks.view": {
    label: "View Tasks",
    description: "Browse task boards, lists, tables, and task details",
  },
  "tasks.create": {
    label: "Create Tasks",
    description: "Create new tasks across projects and clients",
  },
  "tasks.edit": {
    label: "Edit Tasks",
    description: "Update task titles, descriptions, dates, and priorities",
  },
  "tasks.delete": {
    label: "Delete Tasks",
    description: "Permanently remove tasks from the workspace",
  },
  "tasks.assign": {
    label: "Assign Members",
    description: "Assign or reassign team members on tasks",
  },
  "tasks.manage_status": {
    label: "Manage Status",
    description: "Transition task workflow statuses and QA states",
  },
}

/**
 * Pure permission-based check for task actions (per-user, independent of roles).
 */
export function hasTaskPermission(
  permissions: Partial<UserTaskPermissions> | undefined,
  key: TaskPermissionKey
): boolean {
  if (!permissions) return true
  return permissions[key] ?? true
}

export function resolveUserTaskPermissions(
  userPermissionsMap: Record<string, UserTaskPermissions> | undefined,
  userId: string | undefined
): UserTaskPermissions {
  if (!userId || !userPermissionsMap || !userPermissionsMap[userId]) {
    return { ...DEFAULT_TASK_PERMISSIONS }
  }
  return {
    ...DEFAULT_TASK_PERMISSIONS,
    ...userPermissionsMap[userId],
  }
}

export const CURRENT_USER = {
  name: "Marcus Vance",
  initials: "MV",
  email: "marcus.vance@agencyops.io",
  title: "Managing Director",
}

export const DEMO_ROLES: Role[] = [
  "Super Admin",
  "Sales/Account Manager",
  "Project Admin",
  "Designer/Developer",
  "QA Reviewer",
  "HR Manager",
]

export const ROLE_PERSONA_SUMMARY: Record<
  Role,
  { name: string; initials: string; email: string; title: string }
> = {
  "Super Admin": CURRENT_USER,
  "Sales/Account Manager": {
    name: "Elena Rostova",
    initials: "ER",
    email: "elena.rostova@agencyops.io",
    title: "Senior Account Director",
  },
  "Project Admin": {
    name: "Devon Brooks",
    initials: "DB",
    email: "devon.brooks@agencyops.io",
    title: "Head of Delivery",
  },
  "Designer/Developer": {
    name: "Aria Chen",
    initials: "AC",
    email: "aria.chen@agencyops.io",
    title: "Lead Product Designer",
  },
  "QA Reviewer": {
    name: "Tariq Al-Mansoor",
    initials: "TA",
    email: "tariq.mansoor@agencyops.io",
    title: "Principal QA Lead",
  },
  "HR Manager": {
    name: "Nadia Kapoor",
    initials: "NK",
    email: "nadia.kapoor@agencyops.io",
    title: "People Operations Lead",
  },
}

export const ALL_MODULES: PermissionModule[] = [
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

export const ROLE_MODULE_ACCESS: Record<Role, PermissionModule[]> = {
  "Super Admin": ALL_MODULES,
  "Sales/Account Manager": ALL_MODULES,
  "Project Admin": ALL_MODULES,
  "Designer/Developer": ALL_MODULES,
  "QA Reviewer": ALL_MODULES,
  "HR Manager": ALL_MODULES,
}

export function canAccessModule(_role?: Role, _mod?: PermissionModule): boolean {
  return true
}

export interface TaskRolePermissions {
  isReadOnly: boolean
  canEditDetails: boolean
  canEditStatus: boolean
  canEditAssignees: boolean
  canDeleteOrMove: boolean
  canDuplicate: boolean
  canComment: boolean
  canUploadEvidence: boolean
  canPutOnHold: boolean
  canSendToQa: boolean
  canQaReview: boolean
  canResolveQaComment: boolean
  canCreateTask: boolean
  canAddRevision: boolean
  canEditRevision: boolean
  canDeleteRevision: boolean
  canApproveRejectRevision: boolean
  canUpdateAssignedRevisionProgress: boolean
}

export const ALL_TASK_PERMISSIONS: TaskRolePermissions = {
  isReadOnly: false,
  canEditDetails: true,
  canEditStatus: true,
  canEditAssignees: true,
  canDeleteOrMove: true,
  canDuplicate: true,
  canComment: true,
  canUploadEvidence: true,
  canPutOnHold: true,
  canSendToQa: true,
  canQaReview: true,
  canResolveQaComment: true,
  canCreateTask: true,
  canAddRevision: true,
  canEditRevision: true,
  canDeleteRevision: true,
  canApproveRejectRevision: true,
  canUpdateAssignedRevisionProgress: true,
}

export function getTaskPermissions(_role?: Role): TaskRolePermissions {
  return ALL_TASK_PERMISSIONS
}

export function getModuleForPathname(
  pathname: string
): PermissionModule | null {
  if (pathname === "/dashboard") return "dashboard"
  if (pathname.startsWith("/brands")) return "brands"
  if (pathname.startsWith("/leads")) return "leads"
  if (pathname.startsWith("/sign-ups")) return "signups"
  if (pathname.startsWith("/invoices")) return "invoices"
  if (pathname.startsWith("/transactions")) return "transactions"
  if (pathname.startsWith("/marketing-spendings")) return "marketing"
  if (pathname.startsWith("/projects")) return "projects"
  if (pathname.startsWith("/tasks")) return "tasks"
  if (pathname.startsWith("/chats")) return "chats"
  if (pathname.startsWith("/hrm")) return "hrm"
  if (pathname.startsWith("/users")) return "users"
  if (pathname.startsWith("/teams")) return "teams"
  if (pathname.startsWith("/cities")) return "cities"
  if (pathname.startsWith("/export-logs")) return "exports"
  if (pathname.startsWith("/settings")) return "settings"
  return null
}

export interface NavItemConfig {
  label: string
  href: string
  module: PermissionModule
  iconName: string
  badge?: string
}

export interface NavGroupConfig {
  id: string
  label: string
  items: NavItemConfig[]
}

export const SIDEBAR_GROUPS: NavGroupConfig[] = [
  {
    id: "overview",
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        module: "dashboard",
        iconName: "LayoutDashboard",
      },
    ],
  },
  {
    id: "inquiry",
    label: "Inquiry",
    items: [
      {
        label: "Brands",
        href: "/brands",
        module: "brands",
        iconName: "Sparkles",
      },
      {
        label: "Leads",
        href: "/leads",
        module: "leads",
        iconName: "UserPlus",
      },
      {
        label: "Sign Ups",
        href: "/sign-ups",
        module: "signups",
        iconName: "ClipboardList",
      },
    ],
  },
  {
    id: "payment",
    label: "Payment",
    items: [
      {
        label: "Invoices",
        href: "/invoices",
        module: "invoices",
        iconName: "FileText",
      },
      {
        label: "Transactions",
        href: "/transactions",
        module: "transactions",
        iconName: "CreditCard",
      },
      {
        label: "Marketing",
        href: "/marketing-spendings",
        module: "marketing",
        iconName: "Megaphone",
      },
    ],
  },
  {
    id: "delivery",
    label: "Delivery",
    items: [
      {
        label: "Projects",
        href: "/projects",
        module: "projects",
        iconName: "FolderKanban",
      },
      {
        label: "Tasks",
        href: "/tasks",
        module: "tasks",
        iconName: "CheckSquare",
      },
      {
        label: "Chats",
        href: "/chats",
        module: "chats",
        iconName: "MessageSquare",
      },
    ],
  },
  {
    id: "hrm",
    label: "HR Management",
    items: [
      {
        label: "HR Overview",
        href: "/hrm/dashboard",
        module: "hrm",
        iconName: "HeartHandshake",
      },
      {
        label: "Daily Attendance",
        href: "/hrm/daily-attendance",
        module: "hrm",
        iconName: "Clock",
      },
      {
        label: "Monthly Report",
        href: "/hrm/monthly-attendance-report",
        module: "hrm",
        iconName: "CalendarRange",
      },
      {
        label: "Leave Balances",
        href: "/hrm/leave-balances",
        module: "hrm",
        iconName: "Scale",
      },
      {
        label: "Leave Requests",
        href: "/hrm/leave-requests",
        module: "hrm",
        iconName: "CalendarOff",
      },
      {
        label: "Leave Types",
        href: "/hrm/leave-types",
        module: "hrm",
        iconName: "Tags",
      },
      {
        label: "Shift Scheduling",
        href: "/hrm/shift-scheduling",
        module: "hrm",
        iconName: "Timer",
      },
      {
        label: "Holidays",
        href: "/hrm/holidays",
        module: "hrm",
        iconName: "CalendarHeart",
      },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    items: [
      {
        label: "Users",
        href: "/users",
        module: "users",
        iconName: "Users",
      },
      {
        label: "Teams",
        href: "/teams",
        module: "teams",
        iconName: "UsersRound",
      },
      {
        label: "Cities",
        href: "/cities",
        module: "cities",
        iconName: "MapPin",
      },
      {
        label: "Export Logs",
        href: "/export-logs",
        module: "exports",
        iconName: "Download",
      },
      {
        label: "General Settings",
        href: "/settings",
        module: "settings",
        iconName: "Settings",
      },
      {
        label: "Security & 2FA",
        href: "/settings/security",
        module: "settings",
        iconName: "ShieldCheck",
      },
    ],
  },
]
