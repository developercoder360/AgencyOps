"use client"

import * as React from "react"
import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Check, Plus, Trash2, X } from "lucide-react"
import {
  DataTable,
  DataTableColumnHeader,
  type FacetedFilterConfig,
} from "@/components/data-table"
import { ConfirmDeleteDialog, PageHeader, StatusBadge } from "@/components/shared"
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
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { useStore } from "@/lib/store"
import type { LeaveRequest } from "@/types"

const applySchema = z.object({
  userId: z.string().min(1, "Select an employee"),
  leaveTypeId: z.string().min(1, "Select a leave type"),
  startDate: z.string().min(8, "Enter start date"),
  endDate: z.string().min(8, "Enter end date"),
  days: z.number().min(1).max(30),
  reason: z.string().min(4, "Provide a leave reason"),
})

export default function LeaveRequestsPage() {
  const {
    leaveRequests,
    leaveTypes,
    users,
    createLeaveRequest,
    reviewLeaveRequest,
    deleteLeaveRequest,
    isLoaded,
  } = useStore()

  const [applyOpen, setApplyOpen] = React.useState(false)
  const [selected, setSelected] = React.useState<LeaveRequest | null>(null)
  const [rejectTarget, setRejectTarget] = React.useState<LeaveRequest | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<LeaveRequest | null>(null)
  const [remarks, setRemarks] = React.useState("")

  const form = useForm<z.infer<typeof applySchema>>({
    resolver: zodResolver(applySchema),
    defaultValues: {
      userId: "",
      leaveTypeId: "",
      startDate: "2026-11-18",
      endDate: "2026-11-20",
      days: 3,
      reason: "",
    },
  })

  // Prepopulate default ids if available
  React.useEffect(() => {
    if (users.length > 0 && !form.getValues("userId")) {
      form.setValue("userId", users[0].id)
    }
    if (leaveTypes.length > 0 && !form.getValues("leaveTypeId")) {
      form.setValue("leaveTypeId", leaveTypes[0].id)
    }
  }, [users, leaveTypes, form])

  function onApply(values: z.infer<typeof applySchema>) {
    const user = users.find((u) => u.id === values.userId)
    const lt = leaveTypes.find((l) => l.id === values.leaveTypeId)

    if (!user || !lt) {
      toast.error("Invalid user or leave type selection")
      return
    }

    createLeaveRequest({
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
    })

    toast.success(`Submitted leave request for ${user.name}`)
    form.reset({
      userId: users[0]?.id || "",
      leaveTypeId: leaveTypes[0]?.id || "",
      startDate: "2026-11-18",
      endDate: "2026-11-20",
      days: 3,
      reason: "",
    })
    setApplyOpen(false)
  }

  const approveRequest = React.useCallback(
    (req: LeaveRequest) => {
      reviewLeaveRequest(req.id, "approved", "Approved", "Nadia Kapoor")
      toast.success(`Approved ${req.userName}'s leave`)
    },
    [reviewLeaveRequest]
  )

  const promptReject = React.useCallback((req: LeaveRequest) => {
    setRemarks("")
    setRejectTarget(req)
  }, [])

  const promptDelete = React.useCallback((req: LeaveRequest) => {
    setDeleteTarget(req)
  }, [])

  function confirmReject(e: React.FormEvent) {
    e.preventDefault()
    if (!rejectTarget) return
    reviewLeaveRequest(
      rejectTarget.id,
      "rejected",
      remarks || "Rejected due to team bandwidth",
      "Nadia Kapoor"
    )
    toast.error(`Rejected leave request for ${rejectTarget.userName}`)
    setRemarks("")
    setRejectTarget(null)
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return
    deleteLeaveRequest(deleteTarget.id)
    toast.success("Leave request removed")
    setDeleteTarget(null)
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
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            {row.original.status === "pending" ? (
              <>
                <Button
                  type="button"
                  size="icon-xs"
                  variant="outline"
                  onClick={() => approveRequest(row.original)}
                  aria-label="Approve leave"
                >
                  <Check className="size-3.5 text-emerald-600" />
                </Button>
                <Button
                  type="button"
                  size="icon-xs"
                  variant="outline"
                  onClick={() => promptReject(row.original)}
                  aria-label="Reject leave"
                >
                  <X className="size-3.5 text-rose-600" />
                </Button>
              </>
            ) : null}
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => promptDelete(row.original)}
              aria-label="Delete request"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    [approveRequest, promptReject, promptDelete]
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
        options: leaveTypes.map((lt) => ({
          label: lt.name,
          value: lt.name,
        })),
      },
    ],
    [leaveTypes]
  )

  if (!isLoaded) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  const missingUsers = users.length === 0
  const missingLeaveTypes = leaveTypes.length === 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Requests"
        description="Submit, review, approve, or reject employee time-off applications."
        badge={<Badge variant="secondary">{leaveRequests.length} requests</Badge>}
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
        data={leaveRequests}
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
          {missingUsers || missingLeaveTypes ? (
            <div className="p-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Before applying for leave, you must have at least one employee and one leave policy configured.
              </p>
              <div className="flex flex-col gap-2 pt-2">
                {missingUsers && (
                  <Button asChild variant="outline" size="sm">
                    <Link href="/users">Add Staff Member First</Link>
                  </Button>
                )}
                {missingLeaveTypes && (
                  <Button asChild variant="outline" size="sm">
                    <Link href="/hrm/leave-types">Add Leave Policy First</Link>
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(onApply)} className="space-y-4 p-4">
              <div className="space-y-1.5">
                <Label>Employee</Label>
                <Controller
                  control={form.control}
                  name="userId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select staff..." />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name} ({u.department})
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
                        <SelectValue placeholder="Select leave policy..." />
                      </SelectTrigger>
                      <SelectContent>
                        {leaveTypes.map((lt) => (
                          <SelectItem key={lt.id} value={lt.id}>
                            {lt.name} ({lt.daysAllowedPerYear}d max)
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
          )}
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

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open: boolean) => !open && setDeleteTarget(null)}
        title="Delete Leave Request"
        description={`Are you sure you want to remove the leave request for ${deleteTarget?.userName}?`}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
