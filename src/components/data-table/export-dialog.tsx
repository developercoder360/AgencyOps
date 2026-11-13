"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ProgressBar } from "@/components/tremor"
import { StatusBadge } from "@/components/shared"
import { useStore } from "@/lib/store"
import type { ExportStatus } from "@/types"

export interface ExportColumnOption {
  id: string
  label: string
}

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  moduleName: string
  columns: ExportColumnOption[]
  rowCount: number
  onExportDownload?: (format: "CSV" | "XLSX", selectedColumns: string[]) => void
}

export function ExportDialog(props: ExportDialogProps) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {props.open ? <ExportDialogBody {...props} /> : null}
      </DialogContent>
    </Dialog>
  )
}

function ExportDialogBody({
  onOpenChange,
  moduleName,
  columns,
  rowCount,
  onExportDownload,
}: ExportDialogProps) {
  const { createExportLog } = useStore()
  const [format, setFormat] = React.useState<"CSV" | "XLSX">("XLSX")
  const [selectedIds, setSelectedIds] = React.useState<string[]>(() =>
    columns.map((c) => c.id)
  )
  const [status, setStatus] = React.useState<ExportStatus | "idle">("idle")
  const [progress, setProgress] = React.useState(0)

  const timersRef = React.useRef<number[]>([])

  React.useEffect(() => {
    return () => {
      for (const t of timersRef.current) {
        window.clearTimeout(t)
      }
    }
  }, [])

  function toggleColumn(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  function triggerBlobDownload(ext: "CSV" | "XLSX", cols: string[]) {
    const fileName = `${moduleName.toLowerCase().replace(/\s+/g, "-")}-export.${ext.toLowerCase()}`
    
    // Write entry to Export Logs in Store
    try {
      createExportLog({
        module: moduleName,
        fileName,
        format: ext,
        rowCount,
        columns: cols,
        requestedBy: "Current User",
        status: "completed",
        fileSize: `${Math.max(12, Math.round(rowCount * 0.4))} KB`,
      })
    } catch {
      // Store log write error should not prevent client download
    }

    if (onExportDownload) {
      onExportDownload(ext, cols)
      return
    }

    const header = cols.join(",")
    const csvSample = `${header}\n# Exported ${rowCount} rows from ${moduleName} (${ext} prototype export)\n`
    const blob = new Blob([csvSample], {
      type:
        ext === "CSV"
          ? "text/csv;charset=utf-8;"
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
  }

  function startExport() {
    if (selectedIds.length === 0) {
      toast.error("Select at least one column to export.")
      return
    }
    for (const t of timersRef.current) window.clearTimeout(t)
    timersRef.current = []

    setStatus("queued")
    setProgress(20)

    const t1 = window.setTimeout(() => {
      setStatus("processing")
      setProgress(65)
    }, 550)

    const t2 = window.setTimeout(() => {
      setStatus("completed")
      setProgress(100)
      toast.success(
        `${moduleName} export ready (${rowCount} rows, ${format})`,
        {
          description: `${selectedIds.length} columns included.`,
          action: {
            label: "Download",
            onClick: () => triggerBlobDownload(format, selectedIds),
          },
        }
      )
    }, 1300)

    timersRef.current.push(t1, t2)
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Download className="size-4 text-primary" />
          Export {moduleName}
        </DialogTitle>
        <DialogDescription>
          Choose file format and columns to generate an export for{" "}
          <span className="font-medium text-foreground">{rowCount}</span>{" "}
          matching row{rowCount === 1 ? "" : "s"}.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            File Format
          </Label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setFormat("XLSX")}
              disabled={status === "queued" || status === "processing"}
              className={`flex items-center gap-2.5 rounded-lg border p-3 text-left text-sm transition-colors ${
                format === "XLSX"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              <FileSpreadsheet className="size-4 shrink-0" />
              <div>
                <div className="font-medium">Excel (.xlsx)</div>
                <div className="text-[11px] text-muted-foreground">
                  Styled sheet with frozen headers
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setFormat("CSV")}
              disabled={status === "queued" || status === "processing"}
              className={`flex items-center gap-2.5 rounded-lg border p-3 text-left text-sm transition-colors ${
                format === "CSV"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              <FileText className="size-4 shrink-0" />
              <div>
                <div className="font-medium">Raw CSV (.csv)</div>
                <div className="text-[11px] text-muted-foreground">
                  Lightweight universal text delimiter
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Columns to Include ({selectedIds.length}/{columns.length})
            </Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedIds(columns.map((c) => c.id))}
                className="text-xs text-primary hover:underline"
              >
                Select All
              </button>
              <span className="text-xs text-muted-foreground">•</span>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="text-xs text-muted-foreground hover:underline"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="max-h-44 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
            {columns.map((col) => (
              <label
                key={col.id}
                className="flex cursor-pointer items-center gap-2.5 text-xs text-foreground"
              >
                <Checkbox
                  checked={selectedIds.includes(col.id)}
                  onCheckedChange={() => toggleColumn(col.id)}
                />
                <span>{col.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Async Progress Simulation */}
        {status !== "idle" ? (
          <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 font-medium">
                {status === "completed" ? (
                  <CheckCircle2 className="size-4 text-emerald-600" />
                ) : (
                  <Loader2 className="size-4 animate-spin text-primary" />
                )}
                {status === "queued" && "Queued in background worker pool..."}
                {status === "processing" && "Serializing records into dataset..."}
                {status === "completed" && "Export ready for download"}
              </span>
              <StatusBadge status={status} />
            </div>
            <ProgressBar
              value={progress}
              color={status === "completed" ? "emerald" : "blue"}
            />
          </div>
        ) : null}
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
        >
          Close
        </Button>
        {status === "completed" ? (
          <Button
            type="button"
            onClick={() => triggerBlobDownload(format, selectedIds)}
            className="gap-1.5"
          >
            <Download className="size-4" />
            Download {format}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={startExport}
            disabled={status === "queued" || status === "processing"}
            className="gap-1.5"
          >
            {status === "queued" || status === "processing" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            Start Export
          </Button>
        )}
      </DialogFooter>
    </>
  )
}
