"use client"

import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Check, Plus, X } from "lucide-react"
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
import { MOCK_LEAVE_REQUESTS, MOCK_LEAVE_TYPES } from "@/mocks/hrm"
import { MOCK_USERS } from "@/mocks/users"
import type { LeaveRequest } from "@/types"

const applySchema = z.object({
  userId: z.string().min(1),
  leaveTypeId: z.string().min(1),
  startDate: z.string().min(8),
  endDate: z.string().min(8),
  days: z.number().min(1).max(30),
  reason: z.string().min(4, "Provide a leave reason"),
})

export default function LeaveRequestsPage() {
  const [requests, setRequests] =
    React.useState<LeaveRequest[]>(MOCK_LEAVE_REQUESTS)
  const [applyOpen, setApplyOpen] = React.useState(false)
  const [selected, setSelected] = React.useState<LeaveRequest | null>(null)
  const [rejectTarget, setRejectTarget] = React.useState<LeaveRequest | null>(
    null
  )
  const [remarks, setRemarks] = React.useState("")

  const form = useForm<z.infer<typeof applySchema>>({
    resolver: zodResolver(applySchema),
    defaultValues: {
      userId: MOCK_USERS[3].id,
      leaveTypeId: MOCK_LEAVE_TYPES[0].id,
      startDate: "2026-11-18",
      endDate: "2026-11-20",
      days: 3,
      reason: "",
    },
  })

  function onApply(values: z.infer<typeof applySchema>) {
    const user =
      MOCK_USERS.find((u) => u.id === values.userId) ?? MOCK_USERS[0]
    const lt =
      MOCK_LEAVE_TYPES.find((l) => l.id === values.leaveTypeId) ??
      MOCK_LEAVE_TYPES[0]
    const created: LeaveRequest = {
      id: `lr-new-${requests.length + 1}`,
      userId: user.id,
      userName: user.name,
      department: user.department,
      leaveTypeId: lt.id,
      leaveTypeName: lt.name,
      startDate: values.startDate,
      endDate: values.endDate,
      days: values.days,
      reason: values.reason,
      status: "pending",
      appliedAt: "2026-11-11",
    }
    setRequests((prev) => [created, ...prev])
    toast.success(`Submitted leave request for ${user.name}`)
    form.reset()
    setApplyOpen(false)
  }

  function approveRequest(req: LeaveRequest) {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === req.id
          ? {
              ...r,
              status: "approved",
              reviewedBy: "Nadia Kapoor",
              reviewRemarks: "Approved",
            }
          : r
      )
    )
    toast.success(`Approved ${req.userName}'s leave`)
  }

  function confirmReject(e: React.FormEvent) {
    e.preventDefault()
    if (!rejectTarget) return
    setRequests((prev) =>
      prev.map((r) =>
        r.id === rejectTarget.id
          ? {
              ...r,
              status: "rejected",
              reviewedBy: "Nadia Kapoor",
              reviewRemarks: remarks || "Rejected due to team bandwidth",
            }
          : r
      )
    )
    toast.error(`Rejected leave request for ${rejectTarget.userName}`)
    setRemarks("")
    setRejectTarget(null)
  }

  const columns = React.useMemo<ColumnDef<LeaveRequest>[]>(
    () => [
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
        accessorKey: "leaveTypeName",
        header: "Leave Type",
      },
      {
        accessorKey: "startDate",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Dates" />
        ),
        cell: ({ row }) => (
          <span className="text-xs tabular-nums">
            {row.original.startDate} → {row.original.endDate} (
            {row.original.days}d)
          </span>
        ),
      },
      {
        accessorKey: "reason",
        header: "Reason",
        cell: ({ row }) => (
          <span className="line-clamp-1 max-w-[200px] text-xs text-muted-foreground">
            {row.original.reason}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: "",
        enableHiding: false,
        cell: ({ row }) =>
          row.original.status === "pending" ? (
            <div className="flex gap-1">
              <Button
                type="button"
                size="icon-xs"
                variant="outline"
                onClick={() => approveRequest(row.original)}
                aria-label="Approve leave"
              >
                <Check className="size-3.5 text-(--tone-emerald-text)" />
              </Button>
              <Button
                type="button"
                size="icon-xs"
                variant="outline"
                onClick={() => {
                  setRemarks("")
                  setRejectTarget(row.original)
                }}
                aria-label="Reject leave"
              >
                <X className="size-3.5 text-(--tone-rose-text)" />
              </Button>
            </div>
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
        options: [
          { label: "Pending", value: "pending" },
          { label: "Approved", value: "approved" },
          { label: "Rejected", value: "rejected" },
        ],
      },
      {
        columnId: "leaveTypeName",
        title: "Leave Type",
        options: MOCK_LEAVE_TYPES.map((lt) => ({
          label: lt.name,
          value: lt.name,
        })),
      },
    ],
    []
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Requests"
        description="Submit, review, approve, or reject employee time-off applications."
        badge={<Badge variant="secondary">{requests.length} requests</Badge>}
        actions={
          <Button
            type="button"
            onClick={() => setApplyOpen(true)}
            className="gap-1.5"
          >
            <Plus className="size-4" />
            Apply Leave
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={requests}
        searchPlaceholder="Search employee or reason..."
        facetedFilters={facetedFilters}
        dateField="startDate"
        exportModule="Leave Requests"
        onRowClick={setSelected}
      />

      {/* Detail Sheet */}
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
                  <Badge variant="outline">{selected.days} day(s)</Badge>
                </div>
                <SheetTitle className="mt-1">{selected.userName}</SheetTitle>
                <SheetDescription>
                  {selected.leaveTypeName} • {selected.startDate} to{" "}
                  {selected.endDate}
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 p-4 text-sm">
                <div>
                  <div className="text-xs font-semibold uppercase text-muted-foreground">
                    Reason
                  </div>
                  <p className="mt-1 rounded-lg border border-border p-3 text-muted-foreground">
                    {selected.reason}
                  </p>
                </div>
                {selected.reviewRemarks ? (
                  <div>
                    <div className="text-xs font-semibold uppercase text-muted-foreground">
                      HR Review ({selected.reviewedBy})
                    </div>
                    <p className="mt-1 rounded-lg border border-border bg-muted/30 p-3 text-muted-foreground">
                      {selected.reviewRemarks}
                    </p>
                  </div>
                ) : null}
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* Apply Leave Sheet */}
      <Sheet open={applyOpen} onOpenChange={setApplyOpen}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader className="border-b border-border pb-3">
            <SheetTitle>Apply for Leave</SheetTitle>
            <SheetDescription>
              Submit a new PTO or medical leave request.
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={form.handleSubmit(onApply)} className="space-y-4 p-4">
            <div className="space-y-1.5">
              <Label>Employee</Label>
              <Controller
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MOCK_USERS.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Leave Type</Label>
              <Controller
                control={form.control}
                name="leaveTypeId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MOCK_LEAVE_TYPES.map((lt) => (
                        <SelectItem key={lt.id} value={lt.id}>
                          {lt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="lr-start">Start Date</Label>
                <Input
                  id="lr-start"
                  type="date"
                  {...form.register("startDate")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lr-end">End Date</Label>
                <Input id="lr-end" type="date" {...form.register("endDate")} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lr-days">Total Days</Label>
              <Input
                id="lr-days"
                type="number"
                {...form.register("days", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lr-reason">Reason</Label>
              <Textarea id="lr-reason" rows={3} {...form.register("reason")} />
              {form.formState.errors.reason ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.reason.message}
                </p>
              ) : null}
            </div>
            <SheetFooter className="px-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setApplyOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Submit Request</Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Reject Dialog */}
      <Dialog
        open={Boolean(rejectTarget)}
        onOpenChange={(open) => !open && setRejectTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Leave Request</DialogTitle>
            <DialogDescription>
              Add rejection remarks for {rejectTarget?.userName}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={confirmReject} className="space-y-4">
            <Textarea
              rows={3}
              required
              placeholder="Reason for rejection..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRejectTarget(null)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="destructive">
                Reject Leave
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
