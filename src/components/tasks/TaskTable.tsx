"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import {
  Clock,
  Copy,
  Edit3,
  Flag,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  RotateCcw,
  Trash2,
} from "lucide-react"
import { DataTableColumnHeader } from "@/components/data-table"
import { PRIORITY_META, TASK_STATUSES } from "@/components/delivery/task-detail"
import { AvatarGroup, StatusBadge } from "@/components/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { StaffUser, Task, TaskStatus } from "@/types"
import { cn } from "cn"

interface TaskTableProps {
  tasks: Task[]
  users: StaffUser[]
  todayIso: string
  hideProjectColumn?: boolean
  selectedIds: Set<string>
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canManageStatus: boolean
  onToggleSelect: (taskId: string, checked: boolean) => void
  onToggleSelectAll: (tasks: Task[], checked: boolean) => void
  onOpenTask: (taskId: string) => void
  onEditTask: (task: Task) => void
  onDuplicateTask: (task: Task) => void
  onChangeStatus: (task: Task, status: TaskStatus) => void
  onDeleteTask: (task: Task) => void
}

const PRIORITY_WEIGHT: Record<string, number> = {
  Urgent: 3,
  High: 2,
  Regular: 1,
}

export function TaskTable({
  tasks,
  users,
  todayIso,
  hideProjectColumn = false,
  selectedIds,
  canCreate,
  canEdit,
  canDelete,
  canManageStatus,
  onToggleSelect,
  onToggleSelectAll,
  onOpenTask,
  onEditTask,
  onDuplicateTask,
  onChangeStatus,
  onDeleteTask,
}: TaskTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])

  const allSelected =
    tasks.length > 0 && tasks.every((t) => selectedIds.has(t.id))
  const someSelected =
    tasks.some((t) => selectedIds.has(t.id)) && !allSelected

  const columns = React.useMemo<ColumnDef<Task>[]>(() => {
    const baseCols: ColumnDef<Task>[] = [
      {
        id: "select",
        header: () => (
          <Checkbox
            checked={
              allSelected ? true : someSelected ? "indeterminate" : false
            }
            onCheckedChange={(v) => onToggleSelectAll(tasks, v === true)}
            aria-label="Select all tasks in view"
          />
        ),
        cell: ({ row }) => {
          const t = row.original
          return (
            <Checkbox
              checked={selectedIds.has(t.id)}
              onCheckedChange={(v) => onToggleSelect(t.id, v === true)}
              aria-label={`Select ${t.code}`}
            />
          )
        },
        enableSorting: false,
      },
      {
        id: "title",
        accessorFn: (row) => `${row.code} ${row.title}`,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Task" />
        ),
        cell: ({ row }) => {
          const t = row.original
          const revs = t.revisions || []
          const openRevs = revs.filter(
            (r) => r.status !== "approved" && r.status !== "rejected"
          ).length
          return (
            <div className="min-w-44 max-w-md space-y-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenTask(t.id)}
                  className="shrink-0 font-mono text-[11px] font-semibold text-primary hover:underline"
                >
                  {t.code}
                </button>
                <button
                  type="button"
                  onClick={() => onOpenTask(t.id)}
                  className="truncate text-left text-xs font-medium text-foreground hover:text-primary"
                >
                  {t.title}
                </button>
                {(t.redFlaggedUserIds || []).length > 0 && (
                  <Badge
                    variant="destructive"
                    className="h-4 shrink-0 px-1 text-[9px]"
                  >
                    Red Flag
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-0.5 tabular-nums">
                  <RotateCcw className="size-2.5" />
                  {openRevs}/{revs.length}
                </span>
                <span className="inline-flex items-center gap-0.5 tabular-nums">
                  <MessageSquare className="size-2.5" />
                  {(t.comments || []).length}
                </span>
                <span className="inline-flex items-center gap-0.5 tabular-nums">
                  <Paperclip className="size-2.5" />
                  {(t.evidenceFiles || []).length}
                </span>
              </div>
            </div>
          )
        },
      },
    ]

    if (!hideProjectColumn) {
      baseCols.push({
        id: "project",
        accessorFn: (row) => `${row.projectName} ${row.brandName}`,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Project" />
        ),
        cell: ({ row }) => (
          <div className="max-w-48">
            <div className="truncate text-xs font-medium text-foreground">
              {row.original.projectName}
            </div>
            <div className="truncate text-[11px] text-muted-foreground">
              {row.original.brandName}
            </div>
          </div>
        ),
      })
    }

    baseCols.push(
      {
        id: "status",
        accessorFn: (row) => row.status,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "priority",
        accessorFn: (row) => PRIORITY_WEIGHT[row.priority] ?? 0,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Priority" />
        ),
        cell: ({ row }) => {
          const p = row.original.priority
          const pMeta = PRIORITY_META[p]
          return (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs font-medium",
                pMeta.flagClass
              )}
            >
              <Flag className="size-3" />
              {p}
            </span>
          )
        },
      },
      {
        id: "assignees",
        accessorFn: (row) => (row.assigneeIds || []).length,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Assignees" />
        ),
        cell: ({ row }) => {
          const assignees = users.filter((u) =>
            (row.original.assigneeIds || []).includes(u.id)
          )
          return <AvatarGroup people={assignees} max={3} />
        },
      },
      {
        id: "dueDate",
        accessorFn: (row) => row.dueDate,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Due Date" />
        ),
        cell: ({ row }) => {
          const t = row.original
          const overdue = t.status !== "Complete" && t.dueDate < todayIso
          return (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs tabular-nums",
                overdue
                  ? "font-semibold text-rose-600 dark:text-rose-400"
                  : "text-muted-foreground"
              )}
            >
              <Clock className="size-3" />
              {t.dueDate}
            </span>
          )
        },
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const t = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Actions for ${t.code}`}
                >
                  <MoreHorizontal className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onOpenTask(t.id)}>
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!canEdit}
                  onClick={() => onEditTask(t)}
                >
                  <Edit3 className="size-3.5" />
                  Edit Task
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger disabled={!canManageStatus}>
                    Change Status
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {TASK_STATUSES.map((s) => (
                      <DropdownMenuItem
                        key={s}
                        disabled={s === t.status}
                        onClick={() => onChangeStatus(t, s)}
                      >
                        {s}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuItem
                  disabled={!canCreate}
                  onClick={() => onDuplicateTask(t)}
                >
                  <Copy className="size-3.5" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  disabled={!canDelete}
                  onClick={() => onDeleteTask(t)}
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
        enableSorting: false,
      }
    )

    return baseCols
  }, [
    allSelected,
    someSelected,
    tasks,
    selectedIds,
    hideProjectColumn,
    users,
    todayIso,
    canCreate,
    canEdit,
    canDelete,
    canManageStatus,
    onToggleSelect,
    onToggleSelectAll,
    onOpenTask,
    onEditTask,
    onDuplicateTask,
    onChangeStatus,
    onDeleteTask,
  ])

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: tasks,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={selectedIds.has(row.original.id) ? "selected" : undefined}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card Fallback */}
      <div className="space-y-2 md:hidden">
        {tasks.map((t) => {
          const overdue = t.status !== "Complete" && t.dueDate < todayIso
          const isSelected = selectedIds.has(t.id)
          const pMeta = PRIORITY_META[t.priority]

          return (
            <div
              key={t.id}
              className={cn(
                "rounded-xl border bg-card p-3 space-y-2",
                isSelected ? "border-primary ring-1 ring-primary/30" : "border-border"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(v) => onToggleSelect(t.id, v === true)}
                    aria-label={`Select ${t.code}`}
                  />
                  <button
                    type="button"
                    onClick={() => onOpenTask(t.id)}
                    className="font-mono text-xs font-semibold text-primary"
                  >
                    {t.code}
                  </button>
                  <StatusBadge status={t.status} />
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-[11px] font-medium",
                    pMeta.flagClass
                  )}
                >
                  <Flag className="size-3" />
                  {t.priority}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onOpenTask(t.id)}
                className="block w-full text-left text-sm font-medium text-foreground"
              >
                {t.title}
              </button>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="truncate">{t.projectName}</span>
                <span
                  className={cn(
                    "shrink-0 tabular-nums",
                    overdue && "font-semibold text-rose-600 dark:text-rose-400"
                  )}
                >
                  {t.dueDate}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
