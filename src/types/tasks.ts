export type TaskScope = "all" | "project" | "client"

export type TasksViewMode = "board" | "list" | "table"

export type TaskSortField =
  | "dueDate"
  | "createdAt"
  | "priority"
  | "status"
  | "title"

export type TaskSortDirection = "asc" | "desc"

export type TaskPermissionKey =
  | "tasks.view"
  | "tasks.create"
  | "tasks.edit"
  | "tasks.delete"
  | "tasks.assign"
  | "tasks.manage_status"

export type UserTaskPermissions = Record<TaskPermissionKey, boolean>
