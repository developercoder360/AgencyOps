"use client"

import { DatePicker } from "@/components/ui/date-picker"

import * as React from "react"
import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Download, Edit3, History, Plus, Upload } from "lucide-react"
import {
  DataTable,
  DataTableColumnHeader,
  type FacetedFilterConfig,
} from "@/components/data-table"
import { PageHeader, StatusBadge } from "@/components/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { useStore } from "@/lib/store"
import type { AttendanceRecord, AttendanceStatus } from "@/types"

const STATUS_OPTIONS: AttendanceStatus[] = [
  "present",
  "late",
  "halfday",
  "absent",
  "leave",
  "holiday",
  "weekend",
]

interface ParsedImportRow {
  rowNumber: number
  rawEmployee: string
  userId?: string
  userName?: string
  userRole?: AttendanceRecord["userRole"]
  department?: string
  date: string
  status: AttendanceStatus
  checkIn?: string
  checkOut?: string
  notes?: string
  error?: string
}

function computeWorkHours(
  status: AttendanceStatus,
  checkIn?: string,
  checkOut?: string
): number {
  if (checkIn && checkOut) {
    const [inH, inM] = checkIn.split(":").map(Number)
    const [outH, outM] = checkOut.split(":").map(Number)
    if (
      Number.isFinite(inH) &&
      Number.isFinite(inM) &&
      Number.isFinite(outH) &&
      Number.isFinite(outM)
    ) {
      const diff = (outH * 60 + outM - (inH * 60 + inM)) / 60
      if (diff > 0) return Math.round(diff * 10) / 10
    }
  }
  if (status === "present" || status === "late") return 8
  if (status === "halfday") return 4
  return 0
}

const manualEditSchema = z.object({
  status: z.enum([
    "present",
    "late",
    "halfday",
    "absent",
    "leave",
    "holiday",
    "weekend",
  ]),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  notes: z.string().min(3, "Provide an audit note for manual adjustment"),
})

const createRecordSchema = z.object({
  userId: z.string().min(1, "Select employee"),
  status: z.enum([
    "present",
    "late",
    "halfday",
    "absent",
    "leave",
    "holiday",
    "weekend",
  ]),
  date: z.string().min(8),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
})

export default function DailyAttendancePage() {
  const {
    attendanceRecords,
    users,
    shiftSchedules,
    createAttendanceRecord,
    updateAttendanceRecord,
  } = useStore()

  const [selected, setSelected] = React.useState<AttendanceRecord | null>(null)
  const [editing, setEditing] = React.useState<AttendanceRecord | null>(null)
  const [createOpen, setCreateOpen] = React.useState(false)
  const [importOpen, setImportOpen] = React.useState(false)
  const [importText, setImportText] = React.useState("")
  const [importFileName, setImportFileName] = React.useState<string | null>(
    null
  )
  const importFileInputRef = React.useRef<HTMLInputElement | null>(null)

  const form = useForm<z.infer<typeof manualEditSchema>>({
    resolver: zodResolver(manualEditSchema),
    defaultValues: {
      status: "present",
      checkIn: "09:00",
      checkOut: "18:00",
      notes: "",
    },
  })

  const todayIso = React.useMemo(() => new Date().toISOString().slice(0, 10), [])

  const createForm = useForm<z.infer<typeof createRecordSchema>>({
    resolver: zodResolver(createRecordSchema),
    defaultValues: {
      userId: users[0]?.id ?? "usr-admin",
      status: "present",
      date: todayIso,
      checkIn: "09:00",
      checkOut: "18:00",
    },
  })

  const openEditDialog = React.useCallback(
    (rec: AttendanceRecord) => {
      setEditing(rec)
      form.reset({
        status: rec.status,
        checkIn: rec.checkIn ?? "09:00",
        checkOut: rec.checkOut ?? "18:00",
        notes: rec.notes ?? "Manual adjustment verified by HR",
      })
    },
    [form]
  )

  function onEditSubmit(values: z.infer<typeof manualEditSchema>) {
    if (!editing) return
    const now = new Date().toISOString().replace("T", " ").slice(0, 16)
    const newLog = {
      id: `alog-${crypto.randomUUID().slice(0, 8)}`,
      action: "Manual HR Override",
      actor: "HR Administrator",
      timestamp: now,
      detail: `Set to ${values.status} (${values.notes})`,
    }

    const updatedData = {
      status: values.status,
      checkIn:
        values.status === "absent" || values.status === "leave"
          ? undefined
          : values.checkIn,
      checkOut:
        values.status === "absent" || values.status === "leave"
          ? undefined
          : values.checkOut,
      notes: values.notes,
      logs: [...editing.logs, newLog],
    }

    updateAttendanceRecord(editing.id, updatedData)
    setSelected((prev) => (prev && prev.id === editing.id ? { ...prev, ...updatedData } : prev))
    setEditing(null)
    toast.success(`Updated attendance for ${editing.userName}`)
  }

  function onCreateSubmit(values: z.infer<typeof createRecordSchema>) {
    const user = users.find((u) => u.id === values.userId)
    const userName = user ? user.name : "Staff"
    const department = user ? user.department : "General"
    const shift = shiftSchedules[0]?.name ?? "Morning Standard Shift (9-6)"
    const now = new Date().toISOString().replace("T", " ").slice(0, 16)

    createAttendanceRecord({
      userId: values.userId,
      userName,
      userRole: user ? user.role : "Designer/Developer",
      department,
      date: values.date,
      shiftName: shift,
      status: values.status,
      checkIn: values.checkIn || undefined,
      checkOut: values.checkOut || undefined,
      workHours: values.status === "present" ? 8 : values.status === "halfday" ? 4 : 0,
      lateMinutes: values.status === "late" ? 25 : 0,
      notes: "Manual check-in logged via attendance ledger",
      logs: [
        {
          id: `alog-${crypto.randomUUID().slice(0, 8)}`,
          action: "Check-in Logged",
          actor: "HR Manager",
          timestamp: now,
          detail: `Initial record: ${values.status}`,
        },
      ],
    })

    toast.success(`Recorded attendance for ${userName}`)
    setCreateOpen(false)
  }

  const parsedImportRows = React.useMemo<ParsedImportRow[]>(() => {
    const lines = importText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
    if (lines.length === 0) return []

    const firstCols = lines[0]
      .split(",")
      .map((c) => c.trim().toLowerCase())
    const hasHeader =
      firstCols[0] === "employee" ||
      firstCols[0] === "name" ||
      firstCols[0] === "email" ||
      firstCols[0] === "userid"
    const dataLines = hasHeader ? lines.slice(1) : lines

    return dataLines.map((line, idx) => {
      const cols = line.split(",").map((c) => c.trim())
      const [rawEmployee = "", rawDate = "", rawStatus = "present", rawIn = "", rawOut = "", rawNotes = ""] = cols
      const rowNumber = hasHeader ? idx + 2 : idx + 1

      const empKey = rawEmployee.toLowerCase()
      const matchedUser = users.find(
        (u) =>
          u.id.toLowerCase() === empKey ||
          u.email.toLowerCase() === empKey ||
          u.name.toLowerCase() === empKey
      )

      const normalizedStatus = (rawStatus || "present").toLowerCase() as AttendanceStatus
      const validStatus = STATUS_OPTIONS.includes(normalizedStatus)
      const validDate = /^\d{4}-\d{2}-\d{2}$/.test(rawDate)

      let error: string | undefined
      if (!matchedUser) {
        error = rawEmployee ? `Unknown employee "${rawEmployee}"` : "Missing employee"
      } else if (!validDate) {
        error = "Date must be YYYY-MM-DD"
      } else if (!validStatus) {
        error = `Invalid status "${rawStatus}"`
      }

      return {
        rowNumber,
        rawEmployee,
        userId: matchedUser?.id,
        userName: matchedUser?.name,
        userRole: matchedUser?.role,
        department: matchedUser?.department,
        date: rawDate,
        status: validStatus ? normalizedStatus : "present",
        checkIn: rawIn || undefined,
        checkOut: rawOut || undefined,
        notes: rawNotes || undefined,
        error,
      }
    })
  }, [importText, users])

  const validImportRows = React.useMemo(
    () => parsedImportRows.filter((r) => !r.error && r.userId),
    [parsedImportRows]
  )

  function handleImportFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      setImportText(typeof reader.result === "string" ? reader.result : "")
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  function handleDownloadTemplate() {
    const firstUser = users[0]?.name ?? "Chloe Laurent"
    const secondUser = users[1]?.name ?? "Marcus Vance"
    const csv = [
      "employee,date,status,checkIn,checkOut,notes",
      `${firstUser},${todayIso},present,09:00,18:00,Biometric import`,
      `${secondUser},${todayIso},late,09:25,18:15,Traffic delay`,
    ].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `attendance-import-template-${todayIso}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleConfirmImport() {
    if (validImportRows.length === 0) return
    const shift = shiftSchedules[0]?.name ?? "Morning Standard Shift (9-6)"
    const now = new Date().toISOString().replace("T", " ").slice(0, 16)

    for (const row of validImportRows) {
      if (!row.userId) continue
      createAttendanceRecord({
        userId: row.userId,
        userName: row.userName ?? row.rawEmployee,
        userRole: row.userRole ?? "Designer/Developer",
        department: row.department ?? "General",
        date: row.date,
        shiftName: shift,
        status: row.status,
        checkIn: row.checkIn,
        checkOut: row.checkOut,
        workHours: computeWorkHours(row.status, row.checkIn, row.checkOut),
        lateMinutes: row.status === "late" ? 25 : 0,
        notes: row.notes ?? "Bulk imported via CSV",
        logs: [
          {
            id: `alog-${crypto.randomUUID().slice(0, 8)}`,
            action: "Imported via CSV",
            actor: "HR Manager",
            timestamp: now,
            detail: `Imported status: ${row.status}${row.checkIn ? ` (${row.checkIn}–${row.checkOut ?? "?"})` : ""}`,
          },
        ],
      })
    }

    toast.success(
      `Imported ${validImportRows.length} attendance ${validImportRows.length === 1 ? "record" : "records"}`
    )
    setImportText("")
    setImportFileName(null)
    setImportOpen(false)
  }

  const columns = React.useMemo<ColumnDef<AttendanceRecord>[]>(
    () => [
      {
        accessorKey: "date",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Date" />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.date}</span>
        ),
      },
      {
        accessorKey: "userName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Employee" />
        ),
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.userName}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.department}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "shiftName",
        header: "Shift",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.shiftName}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "checkIn",
        header: "Check In",
        cell: ({ row }) => (
          <span className="font-mono text-xs">
            {row.original.checkIn ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "checkOut",
        header: "Check Out",
        cell: ({ row }) => (
          <span className="font-mono text-xs">
            {row.original.checkOut ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "workHours",
        header: "Hours",
        cell: ({ row }) => (
          <span className="tabular-nums text-xs font-medium">
            {row.original.workHours}h
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        enableHiding: false,
        cell: ({ row }) => (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => openEditDialog(row.original)}
            className="gap-1"
          >
            <Edit3 className="size-3" />
            Edit
          </Button>
        ),
      },
    ],
    [openEditDialog]
  )

  const facetedFilters = React.useMemo<FacetedFilterConfig[]>(
    () => [
      {
        columnId: "status",
        title: "Status",
        options: STATUS_OPTIONS.map((s) => ({
          label: s.charAt(0).toUpperCase() + s.slice(1),
          value: s,
        })),
      },
    ],
    []
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily Attendance"
        description="Inspect daily biometric/web clock-ins, override attendance statuses, and audit check-in logs."
        badge={<Badge variant="secondary">{attendanceRecords.length} logs</Badge>}
        actions={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setImportOpen(true)}
              className="gap-1.5"
            >
              <Upload className="size-4" />
              Import Attendance
            </Button>
            <Button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="gap-1.5"
            >
              <Plus className="size-4" />
              Log Attendance
            </Button>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={attendanceRecords}
        searchPlaceholder="Search by employee name, shift..."
        facetedFilters={facetedFilters}
        dateField="date"
        exportModule="Daily Attendance"
        onRowClick={setSelected}
      />

      {/* Manual Override Dialog */}
      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Override Attendance Status</DialogTitle>
            <DialogDescription>
              Adjust record for {editing?.userName} on {editing?.date}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Attendance Status</Label>
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>
                          <span className="capitalize">{s}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ci-time">Check In</Label>
                <Input
                  id="ci-time"
                  type="time"
                  {...form.register("checkIn")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="co-time">Check Out</Label>
                <Input
                  id="co-time"
                  type="time"
                  {...form.register("checkOut")}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-notes">Mandatory HR Audit Reason</Label>
              <Textarea
                id="edit-notes"
                rows={3}
                placeholder="e.g. Biometric reader offline, verified manager email..."
                {...form.register("notes")}
              />
              {form.formState.errors.notes ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.notes.message}
                </p>
              ) : null}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditing(null)}
              >
                Cancel
              </Button>
              <Button type="submit">Save Adjustment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Log Attendance Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Log Daily Attendance</DialogTitle>
            <DialogDescription>
              Record an employee check-in or status for today.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Employee</Label>
              {users.length === 0 ? (
                <div className="rounded-md border border-dashed border-border p-2 text-xs text-muted-foreground">
                  <Link href="/users" className="text-primary underline">
                    Add staff in Users first
                  </Link>
                </div>
              ) : (
                <Controller
                  control={createForm.control}
                  name="userId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select staff member" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name} ({u.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Controller
                  control={createForm.control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s}>
                            <span className="capitalize">{s}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="log-date">Date</Label>
                <Controller
                  control={createForm.control}
                  name="date"
                  render={({ field }) => (
                    <DatePicker
                      id="log-date"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="log-ci">Check In</Label>
                <Input id="log-ci" type="time" {...createForm.register("checkIn")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="log-co">Check Out</Label>
                <Input id="log-co" type="time" {...createForm.register("checkOut")} />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={users.length === 0}>
                Save Attendance
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Import Attendance CSV Dialog */}
      <Dialog
        open={importOpen}
        onOpenChange={(next) => {
          setImportOpen(next)
          if (!next) {
            setImportText("")
            setImportFileName(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Import Attendance (CSV)</DialogTitle>
            <DialogDescription>
              Upload a CSV file or paste rows using{" "}
              <span className="font-mono text-xs">
                employee,date,status,checkIn,checkOut,notes
              </span>
              . Employees match by name, email, or ID.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-border bg-muted/30 p-3">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => importFileInputRef.current?.click()}
                  className="gap-1.5"
                >
                  <Upload className="size-3.5" />
                  {importFileName ? "Replace CSV" : "Choose CSV File"}
                </Button>
                <input
                  ref={importFileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="sr-only"
                  onChange={handleImportFileChange}
                />
                {importFileName ? (
                  <span className="text-xs font-medium text-foreground">
                    {importFileName}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    or paste CSV data below
                  </span>
                )}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDownloadTemplate}
                className="gap-1.5 text-xs"
              >
                <Download className="size-3.5" />
                Sample Template
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="import-csv-text">CSV Content</Label>
              <Textarea
                id="import-csv-text"
                rows={5}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={`employee,date,status,checkIn,checkOut,notes\n${users[0]?.name ?? "Chloe Laurent"},${todayIso},present,09:00,18:00,Biometric sync`}
                className="font-mono text-xs"
              />
            </div>

            {parsedImportRows.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">
                    Preview ({parsedImportRows.length} rows)
                  </span>
                  <span className="text-muted-foreground">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {validImportRows.length} ready
                    </span>
                    {parsedImportRows.length - validImportRows.length > 0 ? (
                      <span className="ml-2 font-semibold text-destructive">
                        {parsedImportRows.length - validImportRows.length} skipped
                      </span>
                    ) : null}
                  </span>
                </div>

                <div className="max-h-44 overflow-auto rounded-lg border border-border">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-muted/80 text-[11px] text-muted-foreground">
                      <tr>
                        <th className="px-2.5 py-1.5">#</th>
                        <th className="px-2.5 py-1.5">Employee</th>
                        <th className="px-2.5 py-1.5">Date</th>
                        <th className="px-2.5 py-1.5">Status</th>
                        <th className="px-2.5 py-1.5">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {parsedImportRows.map((r) => (
                        <tr key={r.rowNumber}>
                          <td className="px-2.5 py-1.5 font-mono text-muted-foreground">
                            {r.rowNumber}
                          </td>
                          <td className="px-2.5 py-1.5 font-medium">
                            {r.userName ?? (r.rawEmployee || "—")}
                          </td>
                          <td className="px-2.5 py-1.5 font-mono">
                            {r.date || "—"}
                          </td>
                          <td className="px-2.5 py-1.5 capitalize">
                            {r.status}
                          </td>
                          <td className="px-2.5 py-1.5">
                            {r.error ? (
                              <span className="text-[11px] text-destructive">
                                {r.error}
                              </span>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="bg-emerald-500/15 text-[10px] text-emerald-700 dark:text-emerald-300"
                              >
                                Ready
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setImportOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={validImportRows.length === 0}
              onClick={handleConfirmImport}
            >
              Import {validImportRows.length > 0 ? validImportRows.length : ""}{" "}
              {validImportRows.length === 1 ? "Record" : "Records"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Sheet with Logs */}
      <Sheet
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <SheetContent side="right" className="overflow-y-auto sm:max-w-md">
          {selected ? (
            <>
              <SheetHeader className="border-b border-border pb-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">
                    {selected.date}
                  </Badge>
                  <StatusBadge status={selected.status} />
                </div>
                <SheetTitle className="mt-1">{selected.userName}</SheetTitle>
                <SheetDescription>
                  {selected.department} • {selected.shiftName}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-5 p-4 text-xs">
                <div className="grid grid-cols-2 gap-2.5 rounded-lg border border-border bg-muted/30 p-3">
                  <div>
                    <span className="text-muted-foreground">Check In</span>
                    <div className="mt-0.5 font-mono text-sm font-semibold">
                      {selected.checkIn ?? "None"}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Check Out</span>
                    <div className="mt-0.5 font-mono text-sm font-semibold">
                      {selected.checkOut ?? "None"}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Work Hours</span>
                    <div className="mt-0.5 font-mono text-sm font-semibold">
                      {selected.workHours}h
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Late Minutes</span>
                    <div className="mt-0.5 font-mono text-sm font-semibold text-amber-600">
                      {selected.lateMinutes}m
                    </div>
                  </div>
                </div>

                {selected.notes ? (
                  <div className="space-y-1">
                    <span className="font-semibold uppercase tracking-wider text-muted-foreground">
                      Notes
                    </span>
                    <p className="rounded-lg border border-border p-2.5 text-muted-foreground">
                      {selected.notes}
                    </p>
                  </div>
                ) : null}

                {/* Audit Logs */}
                <div className="space-y-2">
                  <span className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-muted-foreground">
                    <History className="size-3.5" />
                    Biometric & Modification Logs
                  </span>
                  <div className="space-y-2">
                    {selected.logs.map((l) => (
                      <div
                        key={l.id}
                        className="rounded-lg border border-border p-2.5"
                      >
                        <div className="flex items-center justify-between font-medium">
                          <span>{l.action}</span>
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {l.timestamp}
                          </span>
                        </div>
                        <div className="mt-1 text-muted-foreground">
                          {l.detail}
                        </div>
                        <div className="mt-0.5 text-[11px] text-muted-foreground/80">
                          Actor: {l.actor}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <SheetFooter className="border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const toEdit = selected
                    setSelected(null)
                    openEditDialog(toEdit)
                  }}
                  className="gap-1.5"
                >
                  <Edit3 className="size-4" />
                  Edit Status
                </Button>
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}
