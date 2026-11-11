import type { PermissionModule, Role } from "@/types"

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
  "Super Admin": {
    name: "Marcus Vance",
    initials: "MV",
    email: "marcus.vance@agencyops.io",
    title: "Managing Director",
  },
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

export const ROLE_MODULE_ACCESS: Record<Role, PermissionModule[]> = {
  "Super Admin": [
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
  ],
  "Sales/Account Manager": [
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
  ],
  "Project Admin": [
    "dashboard",
    "leads",
    "projects",
    "tasks",
    "chats",
    "teams",
    "exports",
  ],
  "Designer/Developer": ["dashboard", "projects", "tasks", "chats"],
  "QA Reviewer": ["dashboard", "projects", "tasks", "chats", "exports"],
  "HR Manager": [
    "dashboard",
    "hrm",
    "users",
    "teams",
    "cities",
    "exports",
    "settings",
  ],
}

export function canAccessModule(role: Role, mod: PermissionModule): boolean {
  return ROLE_MODULE_ACCESS[role].includes(mod)
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
