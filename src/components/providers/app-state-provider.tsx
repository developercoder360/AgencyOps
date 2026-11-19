"use client"

import * as React from "react"
import type { AppNotification, Role } from "@/types"
import { useStore } from "@/lib/store"

interface AppStateContextValue {
  role: Role
  setRole: (role: Role) => void
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

  const role: Role = "Super Admin"
  const setRole = React.useCallback((_nextRole: Role) => {}, [])

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
