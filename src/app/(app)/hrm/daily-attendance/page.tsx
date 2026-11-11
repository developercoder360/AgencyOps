"use client"

import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Clock, Edit3, History } from "lucide-react"
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
import { MOCK_ATTENDANCE_RECORDS } from "@/mocks/hrm"
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

export default function DailyAttendancePage() {
  const [records, setRecords] = React.useState<AttendanceRecord[]>(
    MOCK_ATTENDANCE_RECORDS
  )
  const [selected, setSelected] = React.useState<AttendanceRecord | null>(null)
  const [editing, setEditing] = React.useState<AttendanceRecord | null>(null)

  const form = useForm<z.infer<typeof manualEditSchema>>({
    resolver: zodResolver(manualEditSchema),
    defaultValues: {
      status: "present",
      checkIn: "09:00",
      checkOut: "18:00",
      notes: "",
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
    const updated: AttendanceRecord = {
      ...editing,
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
      logs: [
        ...editing.logs,
        {
          id: `alog-edit-${editing.logs.length + 1}`,
          action: "Manual HR Override",
          actor: "Nadia Kapoor",
          timestamp: `${editing.date} 18:10`,
          detail: `Set to ${values.status} (${values.notes})`,
        },
      ],
    }
    setRecords((prev) =>
      prev.map((r) => (r.id === editing.id ? updated : r))
    )
    setSelected(updated)
    setEditing(null)
    toast.success(`Updated attendance for ${updated.userName}`)
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
        badge={<Badge variant="secondary">{records.length} logs</Badge>}
      />

      <DataTable
        columns={columns}
        data={records}
        searchPlaceholder="Search by employee name, shift..."
        facetedFilters={facetedFilters}
        dateField="date"
        exportModule="Daily Attendance"
        onRowClick={setSelected}
      />

      {/* Logs Timeline Sheet */}
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

              <div className="space-y-5 p-4">
                <div className="grid grid-cols-3 gap-2 rounded-lg border border-border bg-muted/30 p-3 text-xs">
                  <div>
                    <div className="text-muted-foreground">In</div>
                    <div className="font-mono font-semibold">
                      {selected.checkIn ?? "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Out</div>
                    <div className="font-mono font-semibold">
                      {selected.checkOut ?? "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Logged</div>
                    <div className="font-semibold tabular-nums">
                      {selected.workHours}h
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <History className="size-3.5" />
                    Attendance Logs Timeline
                  </h3>
                  <ol className="relative ml-2 space-y-4 border-l border-border pl-5">
                    {selected.logs.map((log) => (
                      <li key={log.id} className="relative space-y-1">
                        <span className="absolute -left-[25px] top-1 size-2.5 rounded-full border-2 border-background bg-primary [[data-theme=studio]_&]:ring-4 [[data-theme=studio]_&]:ring-primary/15" />
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">
                            {log.action}
                          </span>
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {log.timestamp}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {log.detail}
                        </p>
                        <p className="text-[11px] text-muted-foreground/80">
                          Actor: {log.actor}
                        </p>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              <SheetFooter className="border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => openEditDialog(selected)}
                  className="gap-1.5"
                >
                  <Clock className="size-4" />
                  Manual Edit
                </Button>
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* Manual Edit Dialog */}
      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manual Attendance Override</DialogTitle>
            <DialogDescription>
              Adjust attendance record for {editing?.userName} on{" "}
              {editing?.date}.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit(onEditSubmit)}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label>Status</Label>
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
                        <SelectItem key={s} value={s} className="capitalize">
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="att-in">Check In</Label>
                <Input id="att-in" type="time" {...form.register("checkIn")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="att-out">Check Out</Label>
                <Input
                  id="att-out"
                  type="time"
                  {...form.register("checkOut")}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="att-note">Audit Note</Label>
              <Textarea id="att-note" rows={2} {...form.register("notes")} />
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
              <Button type="submit">Save Override</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
