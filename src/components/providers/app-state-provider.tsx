"use client"

import * as React from "react"
import type {
  AppNotification,
  FilePermissionKey,
  Role,
  StaffUser,
  TaskPermissionKey,
  UserFilePermissions,
  UserTaskPermissions,
} from "@/types"
import { useStore } from "@/lib/store"
import {
  DEFAULT_FILE_PERMISSIONS,
  hasFilePermission,
  hasTaskPermission as checkTaskPermission,
  resolveUserFilePermissions,
  resolveUserTaskPermissions,
} from "@/lib/permissions"

interface AppStateContextValue {
  role: Role
  setRole: (role: Role) => void
  activeUserId: string
  activeUser: StaffUser | undefined
  setActiveUserId: (userId: string) => void
  filePermissions: UserFilePermissions
  hasPermission: (key: FilePermissionKey) => boolean
  setFilePermission: (key: FilePermissionKey, allowed: boolean) => void
  setAllFilePermissions: (permissions: UserFilePermissions) => void
  taskPermissions: UserTaskPermissions
  hasTaskPermission: (key: TaskPermissionKey) => boolean
  setTaskPermission: (key: TaskPermissionKey, allowed: boolean) => void
  setAllTaskPermissions: (permissions: UserTaskPermissions) => void
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

  const activeUser = React.useMemo(() => {
    return (
      store.users.find((u) => u.id === store.activeFileUserId) ?? store.users[0]
    )
  }, [store.users, store.activeFileUserId])

  const activeUserId = activeUser?.id ?? store.activeFileUserId ?? "usr-admin"

  const filePermissions = React.useMemo<UserFilePermissions>(
    () => resolveUserFilePermissions(store.userFilePermissions, activeUserId),
    [store.userFilePermissions, activeUserId]
  )

  const hasPermission = React.useCallback(
    (key: FilePermissionKey) => hasFilePermission(filePermissions, key),
    [filePermissions]
  )

  const setActiveUserId = React.useCallback(
    (userId: string) => {
      store.setActiveFileUserId(userId)
    },
    [store]
  )

  const setFilePermission = React.useCallback(
    (key: FilePermissionKey, allowed: boolean) => {
      store.setUserFilePermission(activeUserId, key, allowed)
    },
    [store, activeUserId]
  )

  const setAllFilePermissions = React.useCallback(
    (permissions: UserFilePermissions) => {
      store.setAllUserFilePermissions(activeUserId, permissions)
    },
    [store, activeUserId]
  )

  const taskPermissions = React.useMemo<UserTaskPermissions>(
    () => resolveUserTaskPermissions(store.userTaskPermissions, activeUserId),
    [store.userTaskPermissions, activeUserId]
  )

  const hasTaskPermission = React.useCallback(
    (key: TaskPermissionKey) => checkTaskPermission(taskPermissions, key),
    [taskPermissions]
  )

  const setTaskPermission = React.useCallback(
    (key: TaskPermissionKey, allowed: boolean) => {
      store.setUserTaskPermission(activeUserId, key, allowed)
    },
    [store, activeUserId]
  )

  const setAllTaskPermissions = React.useCallback(
    (permissions: UserTaskPermissions) => {
      store.setAllUserTaskPermissions(activeUserId, permissions)
    },
    [store, activeUserId]
  )

  const notifications = store.notifications
  const unreadNotificationsCount = React.useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  )

  const computedUnreadMessages = React.useMemo(
    () => store.chatThreads.reduce((sum, t) => sum + (t.unreadCount || 0), 0),
    [store.chatThreads]
  )

  const [manualUnreadMessagesCount, setUnreadMessagesCount] = React.useState<
    number | null
  >(null)

  const unreadMessagesCount =
    manualUnreadMessagesCount !== null
      ? manualUnreadMessagesCount
      : computedUnreadMessages

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
      activeUserId,
      activeUser,
      setActiveUserId,
      filePermissions: filePermissions ?? DEFAULT_FILE_PERMISSIONS,
      hasPermission,
      setFilePermission,
      setAllFilePermissions,
      taskPermissions,
      hasTaskPermission,
      setTaskPermission,
      setAllTaskPermissions,
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
      activeUserId,
      activeUser,
      setActiveUserId,
      filePermissions,
      hasPermission,
      setFilePermission,
      setAllFilePermissions,
      taskPermissions,
      hasTaskPermission,
      setTaskPermission,
      setAllTaskPermissions,
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
