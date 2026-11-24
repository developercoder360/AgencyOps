"use client"

import * as React from "react"
import Link from "next/link"
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import { ExternalLink } from "lucide-react"
import { DataTableColumnHeader } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  formatFileDate,
  formatFileSize,
  getFileTypeLabel,
  isImageFileItem,
} from "@/lib/files/format"
import type { FileItem } from "@/types/files"
import type { StaffUser } from "@/types"
import { cn } from "cn"
import { FileActionsMenu } from "./FileActionsMenu"
import type { FileDisplayEntry } from "./FileGrid"
import { FileTypeIcon } from "./FileTypeIcon"
import { FileVisibilityBadge } from "./FileVisibilityBadge"

export interface FileTableProps {
  entries: FileDisplayEntry[]
  users: StaffUser[]
  selectedIds: Set<string>
  canDownload: boolean
  canUpload: boolean
  canDelete: boolean
  canManageVisibility: boolean
  hasMoveTargets: (entry: FileDisplayEntry) => boolean
  onToggleSelect: (fileId: string, checked: boolean) => void
  onToggleSelectAll: (checked: boolean) => void
  onPreview: (file: FileItem) => void
  onDownload: (file: FileItem) => void
  onRename: (file: FileItem) => void
  onMove: (file: FileItem) => void
  onToggleVisibility: (file: FileItem, nextVisible: boolean) => void
  onDelete: (file: FileItem) => void
  onOpenTask?: (taskId: string) => void
}

export function FileTable({
  entries,
  users,
  selectedIds,
  canDownload,
  canUpload,
  canDelete,
  canManageVisibility,
  hasMoveTargets,
  onToggleSelect,
  onToggleSelectAll,
  onPreview,
  onDownload,
  onRename,
  onMove,
  onToggleVisibility,
  onDelete,
  onOpenTask,
}: FileTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])

  const allSelected =
    entries.length > 0 && entries.every((e) => selectedIds.has(e.file.id))
  const someSelected =
    !allSelected && entries.some((e) => selectedIds.has(e.file.id))

  const columns = React.useMemo<ColumnDef<FileDisplayEntry>[]>(
    () => [
      {
        id: "select",
        enableSorting: false,
        header: () => (
          <Checkbox
            checked={allSelected || (someSelected && "indeterminate")}
            onCheckedChange={(v) => onToggleSelectAll(Boolean(v))}
            aria-label="Select all files in view"
          />
        ),
        cell: ({ row }) => {
          const item = row.original.file
          return (
            <Checkbox
              checked={selectedIds.has(item.id)}
              onCheckedChange={(v) => onToggleSelect(item.id, Boolean(v))}
              aria-label={`Select ${item.name}`}
            />
          )
        },
      },
      {
        id: "name",
        accessorFn: (row) => row.file.name.toLowerCase(),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="File Name" />
        ),
        cell: ({ row }) => {
          const item = row.original.file
          const isImg = isImageFileItem(item)
          const src = item.thumbnailUrl || item.url
          return (
            <div className="flex min-w-0 items-center gap-2.5">
              <button
                type="button"
                onClick={() => onPreview(item)}
                aria-label={`Preview ${item.name}`}
                className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted/30 cursor-pointer"
              >
                {isImg && src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={src}
                    alt={item.name}
                    className="size-full object-cover"
                  />
                ) : (
                  <FileTypeIcon name={item.name} mimeType={item.mimeType} />
                )}
              </button>
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => onPreview(item)}
                  className="block max-w-[240px] truncate text-left text-xs font-medium text-foreground hover:text-primary cursor-pointer"
                  title={item.name}
                >
                  {item.name}
                </button>
                {item.note ? (
                  <div
                    className="max-w-[240px] truncate text-[11px] text-muted-foreground"
                    title={item.note}
                  >
                    {item.note}
                  </div>
                ) : null}
              </div>
            </div>
          )
        },
      },
      {
        id: "source",
        accessorFn: (row) => row.sourceBadge,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Source" />
        ),
        cell: ({ row }) => {
          const { sourceBadge, sourceTitle, sourceHref, sourceTaskId } =
            row.original
          if (sourceTaskId && onOpenTask) {
            return (
              <button
                type="button"
                onClick={() => onOpenTask(sourceTaskId)}
                title={sourceTitle || sourceBadge}
              >
                <Badge
                  variant="outline"
                  className="text-[10px] hover:border-primary/60 hover:text-primary"
                >
                  {sourceBadge}
                  <ExternalLink className="ml-1 size-2.5" />
                </Badge>
              </button>
            )
          }
          if (sourceHref) {
            return (
              <Link href={sourceHref} title={sourceTitle || sourceBadge}>
                <Badge
                  variant="outline"
                  className="text-[10px] hover:border-primary/60 hover:text-primary"
                >
                  {sourceBadge}
                  <ExternalLink className="ml-1 size-2.5" />
                </Badge>
              </Link>
            )
          }
          return (
            <Badge variant="outline" className="text-[10px] capitalize">
              {sourceBadge}
            </Badge>
          )
        },
      },
      {
        id: "type",
        accessorFn: (row) =>
          getFileTypeLabel(row.file.mimeType, row.file.name),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Type" />
        ),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {getFileTypeLabel(row.original.file.mimeType, row.original.file.name)}
          </span>
        ),
      },
      {
        id: "size",
        accessorFn: (row) => row.file.size,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Size" />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs tabular-nums text-muted-foreground whitespace-nowrap">
            {formatFileSize(row.original.file.size)}
          </span>
        ),
      },
      {
        id: "uploadedBy",
        accessorFn: (row) => {
          const user = users.find((u) => u.id === row.file.uploadedBy)
          return user?.name ?? row.file.uploadedBy
        },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Uploaded By" />
        ),
        cell: ({ row }) => {
          const user = users.find((u) => u.id === row.original.file.uploadedBy)
          return (
            <span className="text-xs text-foreground whitespace-nowrap">
              {user?.name ?? row.original.file.uploadedBy}
            </span>
          )
        },
      },
      {
        id: "date",
        accessorFn: (row) => row.file.uploadedAt,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Date" />
        ),
        cell: ({ row }) => (
          <span className="text-xs tabular-nums text-muted-foreground whitespace-nowrap">
            {formatFileDate(row.original.file.uploadedAt)}
          </span>
        ),
      },
      {
        id: "visibility",
        accessorFn: (row) => (row.file.clientVisible ? 1 : 0),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Visibility" />
        ),
        cell: ({ row }) => (
          <FileVisibilityBadge
            clientVisible={row.original.file.clientVisible}
            canManageVisibility={canManageVisibility}
            showSwitch={!row.original.readOnly}
            readOnly={row.original.readOnly}
            compact
            onToggle={(next) => onToggleVisibility(row.original.file, next)}
          />
        ),
      },
      {
        id: "actions",
        enableSorting: false,
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <FileActionsMenu
              file={row.original.file}
              readOnly={row.original.readOnly}
              canDownload={canDownload}
              canUpload={canUpload}
              canDelete={canDelete}
              canManageVisibility={canManageVisibility}
              canMove={hasMoveTargets(row.original)}
              onPreview={onPreview}
              onDownload={onDownload}
              onRename={onRename}
              onMove={onMove}
              onToggleVisibility={onToggleVisibility}
              onDelete={onDelete}
            />
          </div>
        ),
      },
    ],
    [
      allSelected,
      someSelected,
      selectedIds,
      users,
      canDownload,
      canUpload,
      canDelete,
      canManageVisibility,
      hasMoveTargets,
      onToggleSelectAll,
      onToggleSelect,
      onPreview,
      onDownload,
      onRename,
      onMove,
      onToggleVisibility,
      onDelete,
      onOpenTask,
    ]
  )

  const table = useReactTable({
    data: entries,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <>
      {/* Mobile stacked cards view */}
      <div className="space-y-2 md:hidden">
        {table.getRowModel().rows.map((row) => {
          const entry = row.original
          const { file, readOnly, sourceBadge, sourceHref, sourceTaskId } = entry
          const isImg = isImageFileItem(file)
          const src = file.thumbnailUrl || file.url
          const uploader = users.find((u) => u.id === file.uploadedBy)
          const isSelected = selectedIds.has(file.id)

          return (
            <div
              key={file.id}
              className={cn(
                "rounded-lg border bg-card p-3 space-y-2.5",
                isSelected && "border-primary bg-primary/5"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(v) => onToggleSelect(file.id, Boolean(v))}
                    aria-label={`Select ${file.name}`}
                  />
                  <button
                    type="button"
                    onClick={() => onPreview(file)}
                    className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted/30"
                  >
                    {isImg && src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={src}
                        alt={file.name}
                        className="size-full object-cover"
                      />
                    ) : (
                      <FileTypeIcon name={file.name} mimeType={file.mimeType} />
                    )}
                  </button>
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => onPreview(file)}
                      className="block max-w-full truncate text-left text-xs font-semibold text-foreground"
                    >
                      {file.name}
                    </button>
                    <div className="text-[11px] text-muted-foreground">
                      {formatFileSize(file.size)} • {uploader?.name ?? file.uploadedBy} •{" "}
                      {formatFileDate(file.uploadedAt)}
                    </div>
                  </div>
                </div>

                <FileActionsMenu
                  file={file}
                  readOnly={readOnly}
                  canDownload={canDownload}
                  canUpload={canUpload}
                  canDelete={canDelete}
                  canManageVisibility={canManageVisibility}
                  canMove={hasMoveTargets(entry)}
                  onPreview={onPreview}
                  onDownload={onDownload}
                  onRename={onRename}
                  onMove={onMove}
                  onToggleVisibility={onToggleVisibility}
                  onDelete={onDelete}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-2">
                {sourceTaskId && onOpenTask ? (
                  <button
                    type="button"
                    onClick={() => onOpenTask(sourceTaskId)}
                    className="inline-flex items-center"
                  >
                    <Badge variant="outline" className="text-[10px]">
                      {sourceBadge}
                      <ExternalLink className="ml-1 size-2.5" />
                    </Badge>
                  </button>
                ) : sourceHref ? (
                  <Link href={sourceHref}>
                    <Badge variant="outline" className="text-[10px]">
                      {sourceBadge}
                      <ExternalLink className="ml-1 size-2.5" />
                    </Badge>
                  </Link>
                ) : (
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {sourceBadge}
                  </Badge>
                )}

                <FileVisibilityBadge
                  clientVisible={file.clientVisible}
                  canManageVisibility={canManageVisibility}
                  showSwitch={!readOnly}
                  readOnly={readOnly}
                  compact
                  onToggle={(next) => onToggleVisibility(file, next)}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop TanStack Table view */}
      <div className="hidden overflow-hidden rounded-lg border border-border bg-card md:block">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
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
                data-state={selectedIds.has(row.original.file.id) ? "selected" : undefined}
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
    </>
  )
}
