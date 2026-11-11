"use client"

import * as React from "react"
import { DEMO_ROLES } from "@/lib/permissions"
import {
  DEFAULT_UI_THEME,
  UI_THEME_STORAGE_KEY,
  isValidUiTheme,
  type UiTheme,
} from "@/lib/theme"
import type { AppNotification, Role } from "@/types"

const ROLE_STORAGE_KEY = "agencyops_demo_role"
const VALID_ROLES = new Set<Role>(DEMO_ROLES)

function subscribeUiTheme(callback: () => void) {
  window.addEventListener("storage", callback)
  window.addEventListener("agencyops-ui-theme-change", callback)
  return () => {
    window.removeEventListener("storage", callback)
    window.removeEventListener("agencyops-ui-theme-change", callback)
  }
}

function getClientUiThemeSnapshot(): UiTheme {
  try {
    const saved = window.localStorage.getItem(UI_THEME_STORAGE_KEY)
    if (isValidUiTheme(saved)) return saved
  } catch {
    // ignore storage errors
  }
  return DEFAULT_UI_THEME
}

function getServerUiThemeSnapshot(): UiTheme {
  return DEFAULT_UI_THEME
}

function subscribeRole(callback: () => void) {
  window.addEventListener("storage", callback)
  window.addEventListener("agencyops-role-change", callback)
  return () => {
    window.removeEventListener("storage", callback)
    window.removeEventListener("agencyops-role-change", callback)
  }
}

function getClientRoleSnapshot(): Role {
  try {
    const saved = window.localStorage.getItem(ROLE_STORAGE_KEY) as Role | null
    if (saved && VALID_ROLES.has(saved)) return saved
  } catch {
    // ignore storage errors
  }
  return "Super Admin"
}

function getServerRoleSnapshot(): Role {
  return "Super Admin"
}

interface AppStateContextValue {
  role: Role
  setRole: (role: Role) => void
  uiTheme: UiTheme
  setUiTheme: (theme: UiTheme) => void
  timezone: string
  setTimezone: (tz: string) => void
  celebrationDismissed: boolean
  dismissCelebration: () => void
  notifications: AppNotification[]
  unreadNotificationsCount: number
  markAllNotificationsRead: () => void
  markNotificationRead: (id: string) => void
  unreadMessagesCount: number
  setUnreadMessagesCount: React.Dispatch<React.SetStateAction<number>>
}

const INITIAL_NOTIFICATIONS: AppNotification[] = [
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

const AppStateContext = React.createContext<AppStateContextValue | null>(null)

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const role = React.useSyncExternalStore(
    subscribeRole,
    getClientRoleSnapshot,
    getServerRoleSnapshot
  )
  const setRole = React.useCallback((nextRole: Role) => {
    try {
      window.localStorage.setItem(ROLE_STORAGE_KEY, nextRole)
      window.dispatchEvent(new Event("agencyops-role-change"))
    } catch {
      // ignore storage errors
    }
  }, [])
  const uiTheme = React.useSyncExternalStore(
    subscribeUiTheme,
    getClientUiThemeSnapshot,
    getServerUiThemeSnapshot
  )
  React.useEffect(() => {
    document.documentElement.dataset.theme = uiTheme
  }, [uiTheme])
  const setUiTheme = React.useCallback((nextTheme: UiTheme) => {
    document.documentElement.dataset.theme = nextTheme
    try {
      window.localStorage.setItem(UI_THEME_STORAGE_KEY, nextTheme)
      window.dispatchEvent(new Event("agencyops-ui-theme-change"))
    } catch {
      // ignore storage errors
    }
  }, [])
  const [timezone, setTimezone] = React.useState<string>("America/New_York")
  const [celebrationDismissed, setCelebrationDismissed] = React.useState(false)
  const [notifications, setNotifications] = React.useState<AppNotification[]>(
    INITIAL_NOTIFICATIONS
  )
  const [unreadMessagesCount, setUnreadMessagesCount] = React.useState(5)

  const unreadNotificationsCount = React.useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  )

  const markAllNotificationsRead = React.useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const markNotificationRead = React.useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }, [])

  const dismissCelebration = React.useCallback(() => {
    setCelebrationDismissed(true)
  }, [])

  const value = React.useMemo<AppStateContextValue>(
    () => ({
      role,
      setRole,
      uiTheme,
      setUiTheme,
      timezone,
      setTimezone,
      celebrationDismissed,
      dismissCelebration,
      notifications,
      unreadNotificationsCount,
      markAllNotificationsRead,
      markNotificationRead,
      unreadMessagesCount,
      setUnreadMessagesCount,
    }),
    [
      role,
      setRole,
      uiTheme,
      setUiTheme,
      timezone,
      celebrationDismissed,
      dismissCelebration,
      notifications,
      unreadNotificationsCount,
      markAllNotificationsRead,
      markNotificationRead,
      unreadMessagesCount,
    ]
  )

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  )
}

export function useAppState() {
  const ctx = React.useContext(AppStateContext)
  if (!ctx) {
    throw new Error("useAppState must be used within AppStateProvider")
  }
  return ctx
}
