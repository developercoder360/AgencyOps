"use client"

import * as React from "react"
import { DEMO_ROLES } from "@/lib/permissions"
import type { AppNotification, Role } from "@/types"
import { useStore } from "@/lib/store"

const ROLE_STORAGE_KEY = "agencyops_demo_role"
const VALID_ROLES = new Set<Role>(DEMO_ROLES)

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

const AppStateContext = React.createContext<AppStateContextValue | null>(null)

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const store = useStore()

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

  const [timezone, setTimezone] = React.useState<string>("America/New_York")
  const [celebrationDismissed, setCelebrationDismissed] = React.useState(false)

  const notifications = store.notifications
  const unreadNotificationsCount = React.useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  )

  const computedUnreadMessages = React.useMemo(
    () => store.chatThreads.reduce((sum, t) => sum + (t.unreadCount || 0), 0),
    [store.chatThreads]
  )

  const [manualUnreadMessagesCount, setUnreadMessagesCount] = React.useState<number | null>(null)

  const unreadMessagesCount =
    manualUnreadMessagesCount !== null ? manualUnreadMessagesCount : computedUnreadMessages

  const markAllNotificationsRead = React.useCallback(() => {
    store.markAllNotificationsRead()
  }, [store])

  const markNotificationRead = React.useCallback(
    (id: string) => {
      store.markNotificationRead(id)
    },
    [store]
  )

  const dismissCelebration = React.useCallback(() => {
    setCelebrationDismissed(true)
  }, [])

  const value = React.useMemo<AppStateContextValue>(
    () => ({
      role,
      setRole,
      timezone,
      setTimezone,
      celebrationDismissed,
      dismissCelebration,
      notifications,
      unreadNotificationsCount,
      markAllNotificationsRead,
      markNotificationRead,
      unreadMessagesCount,
      setUnreadMessagesCount: setUnreadMessagesCount as React.Dispatch<
        React.SetStateAction<number>
      >,
    }),
    [
      role,
      setRole,
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
