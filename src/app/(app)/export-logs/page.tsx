"use client"

import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import { AlertCircle, Download, FileSpreadsheet, Plus } from "lucide-react"
import {
  DataTable,
  DataTableColumnHeader,
  ExportDialog,
  type FacetedFilterConfig,
} from "@/components/data-table"
import { PageHeader, StatusBadge } from "@/components/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { MOCK_EXPORT_LOGS } from "@/mocks/exports"
import type { ExportLog, ExportStatus } from "@/types"

const EXPORT_STATUSES: ExportStatus[] = [
  "queued",
  "processing",
  "completed",
  "failed",
]

export default function ExportLogsPage() {
  const [logs] = React.useState<ExportLog[]>(MOCK_EXPORT_LOGS)
  const [selected, setSelected] = React.useState<ExportLog | null>(null)
  const [customExportOpen, setCustomExportOpen] = React.useState(false)

  function downloadFile(log: ExportLog) {
    const csv = `${log.columns.join(",")}\n# Downloaded ${log.fileName} (${log.rowCount} rows)\n`
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = log.fileName
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Downloaded ${log.fileName}`)
  }

  const columns = React.useMemo<ColumnDef<ExportLog>[]>(
    () => [
      {
        accessorKey: "fileName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="File" />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="size-4 shrink-0 text-primary" />
            <div>
              <div className="font-mono text-xs font-medium">
                {row.original.fileName}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {row.original.module}
              </div>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "format",
        header: "Format",
        cell: ({ row }) => (
          <Badge variant="outline">{row.original.format}</Badge>
        ),
      },
      {
        accessorKey: "rowCount",
        header: "Rows",
        cell: ({ row }) => (
          <span className="tabular-nums text-xs">
            {row.original.rowCount.toLocaleString("en-US")}
          </span>
        ),
      },
      {
        accessorKey: "requestedBy",
        header: "Requested By",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "fileSize",
        header: "Size",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.fileSize}
          </span>
        ),
      },
      {
        accessorKey: "requestedAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Requested" />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.requestedAt}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        enableHiding: false,
        cell: ({ row }) =>
          row.original.status === "completed" ? (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => downloadFile(row.original)}
              className="gap-1"
            >
              <Download className="size-3.5" />
              Download
            </Button>
          ) : null,
      },
    ],
    []
  )

  const facetedFilters = React.useMemo<FacetedFilterConfig[]>(
    () => [
      {
        columnId: "status",
        title: "Status",
        options: EXPORT_STATUSES.map((s) => ({
          label: s.charAt(0).toUpperCase() + s.slice(1),
          value: s,
        })),
      },
      {
        columnId: "format",
        title: "Format",
        options: [
          { label: "XLSX", value: "XLSX" },
          { label: "CSV", value: "CSV" },
        ],
      },
    ],
    []
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Export Logs"
        description="Audit background CSV & XLSX report jobs across sales, billing, delivery, and HR modules."
        badge={<Badge variant="secondary">{logs.length} jobs</Badge>}
        actions={
          <Button
            type="button"
            onClick={() => setCustomExportOpen(true)}
            className="gap-1.5"
          >
            <Plus className="size-4" />
            New Custom Export
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={logs}
        searchPlaceholder="Search export files, module, user..."
        facetedFilters={facetedFilters}
        exportModule="Export Audit Logs"
        onRowClick={setSelected}
      />

      <Sheet
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <SheetContent side="right" className="sm:max-w-md">
          {selected ? (
            <>
              <SheetHeader className="border-b border-border pb-4">
                <div className="flex items-center gap-2">
                  <StatusBadge status={selected.status} />
                  <Badge variant="outline">{selected.format}</Badge>
                </div>
                <SheetTitle className="mt-1 font-mono text-base">
                  {selected.fileName}
                </SheetTitle>
                <SheetDescription>
                  Module: {selected.module} • {selected.rowCount} rows
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 p-4 text-sm">
                <div className="space-y-1.5 rounded-lg border border-border bg-muted/30 p-3 text-xs">
                  <div>
                    <span className="text-muted-foreground">Requested By: </span>
                    <span className="font-medium">{selected.requestedBy}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Requested At: </span>
                    <span className="font-mono">{selected.requestedAt}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">File Size: </span>
                    <span>{selected.fileSize}</span>
                  </div>
                </div>

                {selected.errorMessage ? (
                  <div className="flex items-start gap-2 rounded-lg border border-(--tone-rose-border) bg-(--tone-rose-bg) p-3 text-xs text-(--tone-rose-fg)">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                    <span>{selected.errorMessage}</span>
                  </div>
                ) : null}

                <div>
                  <div className="mb-1.5 text-xs font-semibold uppercase text-muted-foreground">
                    Included Columns
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.columns.map((c) => (
                      <Badge key={c} variant="secondary" className="font-mono">
                        {c}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <ExportDialog
        open={customExportOpen}
        onOpenChange={setCustomExportOpen}
        moduleName="Consolidated Agency Report"
        columns={[
          { id: "id", label: "Record ID" },
          { id: "brand", label: "Brand" },
          { id: "client", label: "Client" },
          { id: "amountUsd", label: "USD Amount" },
          { id: "status", label: "Status" },
          { id: "createdAt", label: "Created Date" },
        ]}
        rowCount={142}
      />
    </div>
  )
}
