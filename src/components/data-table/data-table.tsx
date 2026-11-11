"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"
import {
  CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Columns3,
  Download,
  Inbox,
  PlusCircle,
  Search,
  X,
} from "lucide-react"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ExportDialog, type ExportColumnOption } from "./export-dialog"
import type { FacetedFilterConfig } from "./types"

function toIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchPlaceholder?: string
  facetedFilters?: FacetedFilterConfig[]
  dateField?: keyof TData | ((row: TData) => string)
  exportModule?: string
  onRowClick?: (row: TData) => void
  isLoading?: boolean
  emptyTitle?: string
  emptyDescription?: string
  toolbarExtra?: React.ReactNode
  defaultPageSize?: number
  enableRowSelection?: boolean
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = "Search records...",
  facetedFilters = [],
  dateField,
  exportModule = "Records",
  onRowClick,
  isLoading = false,
  emptyTitle = "No records found",
  emptyDescription = "Try adjusting your search query or clearing active filters.",
  toolbarExtra,
  defaultPageSize = 10,
  enableRowSelection = true,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>()
  const [exportOpen, setExportOpen] = React.useState(false)

  // Optional date-range pre-filtering before passing to TanStack Table
  const dateFilteredData = React.useMemo(() => {
    if (!dateField || !dateRange?.from) return data
    const fromIso = toIsoDate(dateRange.from)
    const toIso = dateRange.to ? toIsoDate(dateRange.to) : fromIso
    return data.filter((row) => {
      const raw =
        typeof dateField === "function"
          ? dateField(row)
          : String((row as Record<string, unknown>)[dateField as string] ?? "")
      const datePart = raw.slice(0, 10)
      return datePart >= fromIso && datePart <= toIso
    })
  }, [data, dateField, dateRange])

  const mergedColumns = React.useMemo<ColumnDef<TData, TValue>[]>(() => {
    if (!enableRowSelection) return columns
    const selectColumn: ColumnDef<TData, TValue> = {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all rows on page"
        />
      ),
      cell: ({ row }) => (
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex items-center"
        >
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    }
    return [selectColumn, ...columns]
  }, [columns, enableRowSelection])

  // Enhance faceted filter columns with multi-select array filterFn when not set
  const tableColumns = React.useMemo(() => {
    const facetedIds = new Set(facetedFilters.map((f) => f.columnId))
    return mergedColumns.map((col) => {
      const colId =
        col.id ?? ("accessorKey" in col ? String(col.accessorKey) : undefined)
      if (colId && facetedIds.has(colId) && !col.filterFn) {
        return {
          ...col,
          filterFn: (
            row: { getValue: (id: string) => unknown },
            id: string,
            filterValue: unknown
          ) => {
            if (!Array.isArray(filterValue) || filterValue.length === 0) {
              return true
            }
            const cellVal = String(row.getValue(id) ?? "")
            return filterValue.includes(cellVal)
          },
        } as ColumnDef<TData, TValue>
      }
      return col
    })
  }, [mergedColumns, facetedFilters])

  const table = useReactTable({
    data: dateFilteredData,
    columns: tableColumns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize: defaultPageSize,
      },
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  const exportColumns = React.useMemo<ExportColumnOption[]>(
    () =>
      table
        .getAllLeafColumns()
        .filter((col) => col.id !== "select" && col.id !== "actions")
        .map((col) => ({
          id: col.id,
          label:
            typeof col.columnDef.header === "string"
              ? col.columnDef.header
              : col.id.replace(/([A-Z])/g, " $1").trim(),
        })),
    [table]
  )

  const hasActiveFilters =
    globalFilter.length > 0 ||
    columnFilters.length > 0 ||
    Boolean(dateRange?.from)

  function resetAllFilters() {
    setGlobalFilter("")
    setColumnFilters([])
    setDateRange(undefined)
  }

  const filteredRows = table.getFilteredRowModel().rows
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const exportRowsCount =
    selectedRows.length > 0 ? selectedRows.length : filteredRows.length

  function handleExportDownload(
    formatType: "CSV" | "XLSX",
    selectedColIds: string[]
  ) {
    const sourceRows = selectedRows.length > 0 ? selectedRows : filteredRows
    const headers = selectedColIds.join(",")
    const lines = sourceRows.map((row) =>
      selectedColIds
        .map((colId) => {
          const val = row.getValue(colId)
          const str = Array.isArray(val)
            ? val.join("; ")
            : String(val ?? "")
          return `"${str.replace(/"/g, '""')}"`
        })
        .join(",")
    )
    const content = [headers, ...lines].join("\n")
    const blob = new Blob([content], {
      type:
        formatType === "CSV"
          ? "text/csv;charset=utf-8;"
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${exportModule.toLowerCase().replace(/\s+/g, "-")}.${formatType.toLowerCase()}`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {/* Global search */}
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="h-8 pl-8 text-sm"
            />
          </div>

          {/* Faceted filters */}
          {facetedFilters.map((filter) => {
            const col = table.getColumn(filter.columnId)
            if (!col) return null
            const selected = (col.getFilterValue() as string[] | undefined) ?? []
            const facets = col.getFacetedUniqueValues()

            return (
              <Popover key={filter.columnId}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 border-dashed gap-1.5"
                  >
                    <PlusCircle className="size-3.5" />
                    <span>{filter.title}</span>
                    {selected.length > 0 ? (
                      <>
                        <span className="mx-0.5 h-3.5 w-px bg-border" />
                        <Badge
                          variant="secondary"
                          className="rounded-sm px-1.5 font-normal"
                        >
                          {selected.length}
                        </Badge>
                      </>
                    ) : null}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-56 p-2">
                  <div className="mb-1.5 px-2 py-1 text-xs font-medium text-muted-foreground">
                    Filter by {filter.title}
                  </div>
                  <div
                    role="listbox"
                    aria-label={`Filter by ${filter.title}`}
                    aria-multiselectable="true"
                    className="max-h-56 space-y-1 overflow-y-auto"
                  >
                    {filter.options.map((opt) => {
                      const isChecked = selected.includes(opt.value)
                      const count = facets.get(opt.value) ?? 0
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          role="option"
                          aria-selected={isChecked}
                          onClick={() => {
                            const next = isChecked
                              ? selected.filter((v) => v !== opt.value)
                              : [...selected, opt.value]
                            col.setFilterValue(next.length ? next : undefined)
                          }}
                          className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <span className="flex items-center gap-2 truncate">
                            <span
                              aria-hidden="true"
                              className={cn(
                                "flex size-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors",
                                isChecked
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-input dark:bg-input/30"
                              )}
                            >
                              {isChecked ? <Check className="size-3.5" /> : null}
                            </span>
                            <span className="truncate">{opt.label}</span>
                          </span>
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {count}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                  {selected.length > 0 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => col.setFilterValue(undefined)}
                      className="mt-2 w-full"
                    >
                      Clear filter
                    </Button>
                  ) : null}
                </PopoverContent>
              </Popover>
            )
          })}

          {/* Date-range filter */}
          {dateField ? (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-8 border-dashed gap-1.5",
                    dateRange?.from && "border-solid border-primary/50"
                  )}
                >
                  <CalendarIcon className="size-3.5" />
                  <span>
                    {dateRange?.from
                      ? dateRange.to
                        ? `${format(dateRange.from, "MMM d")} – ${format(
                            dateRange.to,
                            "MMM d"
                          )}`
                        : format(dateRange.from, "MMM d, yyyy")
                      : "Date range"}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto p-3">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  defaultMonth={new Date(2026, 9, 1)}
                />
                {dateRange?.from ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => setDateRange(undefined)}
                    className="mt-2 w-full"
                  >
                    Clear dates
                  </Button>
                ) : null}
              </PopoverContent>
            </Popover>
          ) : null}

          {hasActiveFilters ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetAllFilters}
              className="h-8 gap-1 px-2 text-muted-foreground"
            >
              Reset
              <X className="size-3.5" />
            </Button>
          ) : null}
        </div>

        {/* Right toolbar actions */}
        <div className="flex flex-wrap items-center gap-2">
          {toolbarExtra}

          {/* Column visibility toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5">
                <Columns3 className="size-3.5" />
                <span className="hidden sm:inline">Columns</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs">
                Toggle columns
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter(
                  (col) => typeof col.accessorFn !== "undefined" && col.getCanHide()
                )
                .map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.id}
                    className="capitalize"
                    checked={col.getIsVisible()}
                    onCheckedChange={(value) => col.toggleVisibility(!!value)}
                  >
                    {typeof col.columnDef.header === "string"
                      ? col.columnDef.header
                      : col.id.replace(/([A-Z])/g, " $1")}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Export button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setExportOpen(true)}
            className="h-8 gap-1.5"
          >
            <Download className="size-3.5" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      {/* Table container: sticky header + mobile horizontal scroll on single scroll box */}
      <div className="overflow-hidden rounded-(--radius-surface) border border-border bg-card">
        <div className="relative max-h-[600px] w-full overflow-auto">
          <table className="w-full min-w-full caption-bottom text-sm">
            <TableHeader className="sticky top-0 z-10 bg-(--table-head-bg) backdrop-blur-xs">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="bg-(--table-head-bg)">
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
              {isLoading ? (
                Array.from({ length: 8 }).map((_, rowIdx) => (
                  <TableRow key={`skeleton-${rowIdx}`}>
                    {table.getVisibleLeafColumns().map((col) => (
                      <TableCell key={col.id}>
                        <Skeleton className="h-5 w-full max-w-[140px]" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() ? "selected" : undefined}
                    tabIndex={onRowClick ? 0 : undefined}
                    onClick={(e) => {
                      if (!onRowClick) return
                      const target = e.target as HTMLElement
                      if (
                        target.closest(
                          'button,a,input,[role="checkbox"],[role="menuitem"]'
                        )
                      ) {
                        return
                      }
                      onRowClick(row.original)
                    }}
                    onKeyDown={(e) => {
                      if (
                        onRowClick &&
                        (e.key === "Enter" || e.key === " ")
                      ) {
                        const target = e.target as HTMLElement
                        if (target.closest("button,a,input")) return
                        e.preventDefault()
                        onRowClick(row.original)
                      }
                    }}
                    className={cn(
                      onRowClick &&
                        "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={table.getVisibleLeafColumns().length}
                    className="h-48 text-center"
                  >
                    <div className="mx-auto flex max-w-sm flex-col items-center justify-center gap-2 py-6">
                      <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <Inbox className="size-5" />
                      </div>
                      <div className="text-sm font-medium text-foreground">
                        {emptyTitle}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {emptyDescription}
                      </p>
                      {hasActiveFilters ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          onClick={resetAllFilters}
                          className="mt-1"
                        >
                          Clear all filters
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </table>
        </div>
      </div>

      {/* Pagination footer */}
      <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-muted-foreground">
          {enableRowSelection ? (
            <>
              <span className="font-medium text-foreground">
                {selectedRows.length}
              </span>{" "}
              of{" "}
              <span className="font-medium text-foreground">
                {filteredRows.length}
              </span>{" "}
              row(s) selected
            </>
          ) : (
            <>
              Showing{" "}
              <span className="font-medium text-foreground">
                {filteredRows.length}
              </span>{" "}
              record(s)
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 sm:justify-end">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Rows per page</span>
            <Select
              value={String(table.getState().pagination.pageSize)}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger
                aria-label="Rows per page"
                className="h-8 w-[72px] text-xs"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 30, 50].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-xs font-medium tabular-nums">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {Math.max(1, table.getPageCount())}
          </div>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              aria-label="First page"
            >
              <ChevronsLeft className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Previous page"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Next page"
            >
              <ChevronRight className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              aria-label="Last page"
            >
              <ChevronsRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Shared Export Dialog */}
      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        moduleName={exportModule}
        columns={exportColumns}
        rowCount={exportRowsCount}
        onExportDownload={handleExportDownload}
      />
    </div>
  )
}
