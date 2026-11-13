import { MOCK_INVOICES, MOCK_TRANSACTIONS } from "./billing"
import { MOCK_BRANDS, MOCK_CITIES, MOCK_TEAMS } from "./brands"
import { MOCK_CHAT_THREADS } from "./chats"
import { MOCK_EXPORT_LOGS } from "./exports"
import {
  MOCK_ATTENDANCE_RECORDS,
  MOCK_HOLIDAYS,
  MOCK_LEAVE_BALANCES,
  MOCK_LEAVE_REQUESTS,
  MOCK_LEAVE_TYPES,
  MOCK_SHIFTS,
} from "./hrm"
import { MOCK_LEADS, MOCK_SIGNUPS } from "./leads"
import { MOCK_MARKETING_SPENDS } from "./marketing"
import { MOCK_PROJECTS } from "./projects"
import { MOCK_TASKS } from "./tasks"
import { MOCK_USERS } from "./users"
import type { AppNotification } from "@/types"
import type { StoreData } from "@/lib/store/types"

export const DEMO_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif-1",
    title: "Payment Captured via Stripe",
    description: "Invoice INV-2026-1042 ($4,850.00) marked as Success.",
    category: "payment",
    read: false,
    timestamp: "8 mins ago",
    href: "/transactions",
  },
  {
    id: "notif-2",
    title: "QA Failed on TSK-118",
    description: "Homepage responsive hero layout moved to Re-Draw.",
    category: "task",
    read: false,
    timestamp: "24 mins ago",
    href: "/tasks",
  },
  {
    id: "notif-3",
    title: "New Enterprise Lead Assigned",
    description: "Harborline Logistics ($18,500 est.) assigned to Elena Rostova.",
    category: "lead",
    read: false,
    timestamp: "1 hour ago",
    href: "/leads",
  },
  {
    id: "notif-4",
    title: "Pending Leave Request",
    description: "Liam Gallagher requested 3 days Annual Leave (Nov 18–20).",
    category: "hr",
    read: false,
    timestamp: "2 hours ago",
    href: "/hrm/leave-requests",
  },
  {
    id: "notif-5",
    title: "Export Ready for Download",
    description: "invoices-oct-2026.xlsx (48 rows) completed.",
    category: "system",
    read: true,
    timestamp: "Yesterday",
    href: "/export-logs",
  },
]

export function getDemoDataset(): StoreData {
  return {
    version: 1,
    brands: JSON.parse(JSON.stringify(MOCK_BRANDS)),
    cities: JSON.parse(JSON.stringify(MOCK_CITIES)),
    teams: JSON.parse(JSON.stringify(MOCK_TEAMS)),
    users: JSON.parse(JSON.stringify(MOCK_USERS)),
    leads: JSON.parse(JSON.stringify(MOCK_LEADS)),
    signups: JSON.parse(JSON.stringify(MOCK_SIGNUPS)),
    invoices: JSON.parse(JSON.stringify(MOCK_INVOICES)),
    transactions: JSON.parse(JSON.stringify(MOCK_TRANSACTIONS)),
    marketingSpendings: JSON.parse(JSON.stringify(MOCK_MARKETING_SPENDS)),
    projects: JSON.parse(JSON.stringify(MOCK_PROJECTS)),
    tasks: JSON.parse(JSON.stringify(MOCK_TASKS)),
    chatThreads: JSON.parse(JSON.stringify(MOCK_CHAT_THREADS)),
    notifications: JSON.parse(JSON.stringify(DEMO_NOTIFICATIONS)),
    attendanceRecords: JSON.parse(JSON.stringify(MOCK_ATTENDANCE_RECORDS)),
    leaveRequests: JSON.parse(JSON.stringify(MOCK_LEAVE_REQUESTS)),
    leaveTypes: JSON.parse(JSON.stringify(MOCK_LEAVE_TYPES)),
    leaveBalances: JSON.parse(JSON.stringify(MOCK_LEAVE_BALANCES)),
    shiftSchedules: JSON.parse(JSON.stringify(MOCK_SHIFTS)),
    holidays: JSON.parse(JSON.stringify(MOCK_HOLIDAYS)),
    exportLogs: JSON.parse(JSON.stringify(MOCK_EXPORT_LOGS)),
  }
}

export * from "./billing"
export * from "./brands"
export * from "./chats"
export * from "./exports"
export * from "./hrm"
export * from "./leads"
export * from "./marketing"
export * from "./projects"
export * from "./seed"
export * from "./tasks"
export * from "./users"
