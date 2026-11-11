"use client"

import * as React from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  CalendarClock,
  Check,
  Clock,
  UserCheck,
  UserX,
  X,
} from "lucide-react"
import { KpiCard, PageHeader, StatusBadge } from "@/components/shared"
import { AreaChart, Tracker, type TrackerBlock } from "@/components/tremor"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  MOCK_ATTENDANCE_RECORDS,
  MOCK_LEAVE_REQUESTS,
} from "@/mocks/hrm"
import type { LeaveRequest } from "@/types"

const rejectSchema = z.object({
  remarks: z.string().min(4, "Provide rejection remarks for the employee"),
})

const ATTENDANCE_TREND = [
  { day: "Nov 03", Present: 14, Late: 2, Leave: 1 },
  { day: "Nov 04", Present: 15, Late: 1, Leave: 1 },
  { day: "Nov 05", Present: 13, Late: 3, Leave: 1 },
  { day: "Nov 06", Present: 15, Late: 1, Leave: 1 },
  { day: "Nov 07", Present: 14, Late: 2, Leave: 1 },
  { day: "Nov 10", Present: 14, Late: 2, Leave: 1 },
  { day: "Nov 11", Present: 13, Late: 2, Leave: 2 },
]

export default function HrmDashboardPage() {
  const [requests, setRequests] =
    React.useState<LeaveRequest[]>(MOCK_LEAVE_REQUESTS)
  const [rejectTarget, setRejectTarget] = React.useState<LeaveRequest | null>(
    null
  )

  const form = useForm<z.infer<typeof rejectSchema>>({
    resolver: zodResolver(rejectSchema),
    defaultValues: { remarks: "" },
  })

  const todayRecords = React.useMemo(
    () => MOCK_ATTENDANCE_RECORDS.filter((r) => r.date === "2026-11-11"),
    []
  )

  const presentToday = todayRecords.filter(
    (r) => r.status === "present" || r.status === "halfday"
  ).length
  const lateToday = todayRecords.filter((r) => r.status === "late").length
  const absentToday = todayRecords.filter(
    (r) => r.status === "absent" || r.status === "leave"
  ).length

  const pendingLeaves = React.useMemo(
    () => requests.filter((r) => r.status === "pending"),
    [requests]
  )

  const trackerData: TrackerBlock[] = React.useMemo(
    () =>
      todayRecords.map((r) => ({
        key: r.id,
        color:
          r.status === "present"
            ? "bg-emerald-500"
            : r.status === "late"
              ? "bg-amber-500"
              : r.status === "halfday"
                ? "bg-cyan-500"
                : r.status === "leave"
                  ? "bg-indigo-500"
                  : "bg-rose-500",
        tooltip: `${r.userName}: ${r.status}`,
      })),
    [todayRecords]
  )

  function handleApprove(req: LeaveRequest) {
    setRequests((prev) =>
      prev.map((item) =>
        item.id === req.id
          ? {
              ...item,
              status: "approved",
              reviewedBy: "Nadia Kapoor",
              reviewRemarks: "Approved via HR Overview",
            }
          : item
      )
    )
    toast.success(`Approved ${req.leaveTypeName} for ${req.userName}`)
  }

  function onRejectSubmit(values: z.infer<typeof rejectSchema>) {
    if (!rejectTarget) return
    setRequests((prev) =>
      prev.map((item) =>
        item.id === rejectTarget.id
          ? {
              ...item,
              status: "rejected",
              reviewedBy: "Nadia Kapoor",
              reviewRemarks: values.remarks,
            }
          : item
      )
    )
    toast.error(`Rejected leave request for ${rejectTarget.userName}`)
    form.reset()
    setRejectTarget(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="HR Overview"
        description="Daily workforce attendance pulse, punctuality trends, and pending leave approvals."
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/hrm/daily-attendance">Daily Attendance</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/hrm/monthly-attendance-report">
                26th–25th Payroll Report
              </Link>
            </Button>
          </>
        }
      />

      {/* Tremor KPI Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Present Today"
          value={presentToday}
          delta="+5.2%"
          deltaType="increase"
          subtitle={`Out of ${todayRecords.length} active scheduled staff`}
          icon={<UserCheck className="size-4" />}
        />
        <KpiCard
          title="Late Today"
          value={lateToday}
          delta="-1"
          deltaType="decrease"
          isIncreasePositive={false}
          subtitle="Beyond 15-min shift grace window"
          icon={<Clock className="size-4" />}
        />
        <KpiCard
          title="Absent / On Leave"
          value={absentToday}
          delta="0%"
          deltaType="unchanged"
          subtitle="Approved PTO & unscheduled absences"
          icon={<UserX className="size-4" />}
        />
        <KpiCard
          title="Pending Leave Requests"
          value={pendingLeaves.length}
          delta={`${pendingLeaves.length} open`}
          deltaType={pendingLeaves.length > 5 ? "moderateIncrease" : "unchanged"}
          isIncreasePositive={false}
          subtitle="Awaiting HR Manager review"
          icon={<CalendarClock className="size-4" />}
        />
      </div>

      {/* Attendance Tracker Strip */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Today&apos;s Roster Pulse (Nov 11, 2026)</CardTitle>
              <CardDescription>
                Hover each employee block for live check-in classification
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="size-2.5 rounded-xs bg-emerald-500" />
                Present
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2.5 rounded-xs bg-amber-500" />
                Late
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2.5 rounded-xs bg-cyan-500" />
                Half Day
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2.5 rounded-xs bg-indigo-500" />
                Leave
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2.5 rounded-xs bg-rose-500" />
                Absent
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tracker data={trackerData} />
        </CardContent>
      </Card>

      {/* Attendance Trend Chart + Pending Leave Requests */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle>7-Day Attendance Trend</CardTitle>
            <CardDescription>
              Present vs late arrivals and scheduled leave
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AreaChart
              data={ATTENDANCE_TREND}
              index="day"
              categories={["Present", "Late", "Leave"]}
              colors={["emerald", "amber", "indigo"]}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-7">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Pending Leave Requests</CardTitle>
              <CardDescription>
                Approve immediately or reject with mandatory HR remarks
              </CardDescription>
            </div>
            <Badge variant="secondary">{pendingLeaves.length} pending</Badge>
          </CardHeader>
          <CardContent>
            {pendingLeaves.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                All leave requests have been processed.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingLeaves.slice(0, 7).map((req) => (
                      <TableRow key={req.id}>
                        <TableCell>
                          <div className="font-medium">{req.userName}</div>
                          <div className="text-xs text-muted-foreground">
                            {req.department}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          {req.leaveTypeName}
                        </TableCell>
                        <TableCell className="text-xs tabular-nums">
                          <div>
                            {req.startDate} → {req.endDate}
                          </div>
                          <div className="text-muted-foreground">
                            {req.days} day{req.days > 1 ? "s" : ""}
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={req.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1.5">
                            <Button
                              type="button"
                              size="xs"
                              onClick={() => handleApprove(req)}
                              className="gap-1 bg-emerald-600 text-white hover:bg-emerald-700"
                            >
                              <Check className="size-3" />
                              Approve
                            </Button>
                            <Button
                              type="button"
                              size="xs"
                              variant="destructive"
                              onClick={() => {
                                form.reset({ remarks: "" })
                                setRejectTarget(req)
                              }}
                              className="gap-1"
                            >
                              <X className="size-3" />
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reject Leave Remarks Dialog */}
      <Dialog
        open={Boolean(rejectTarget)}
        onOpenChange={(open) => !open && setRejectTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Leave Request</DialogTitle>
            <DialogDescription>
              Provide remarks for {rejectTarget?.userName} (
              {rejectTarget?.startDate} – {rejectTarget?.endDate}).
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit(onRejectSubmit)}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="reject-remarks">HR Review Remarks</Label>
              <Textarea
                id="reject-remarks"
                rows={3}
                placeholder="Explain coverage conflict or requested alternate dates..."
                {...form.register("remarks")}
              />
              {form.formState.errors.remarks ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.remarks.message}
                </p>
              ) : null}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRejectTarget(null)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="destructive">
                Confirm Rejection
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
