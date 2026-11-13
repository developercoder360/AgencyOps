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
import { useStore } from "@/lib/store"
import type { LeaveRequest } from "@/types"

const rejectSchema = z.object({
  remarks: z.string().min(4, "Provide rejection remarks for the employee"),
})

export default function HrmDashboardPage() {
  const { attendanceRecords, leaveRequests, users, reviewLeaveRequest } = useStore()
  const [rejectTarget, setRejectTarget] = React.useState<LeaveRequest | null>(null)

  const form = useForm<z.infer<typeof rejectSchema>>({
    resolver: zodResolver(rejectSchema),
    defaultValues: { remarks: "" },
  })

  const todayIso = React.useMemo(() => new Date().toISOString().slice(0, 10), [])

  const todayRecords = React.useMemo(() => {
    const today = attendanceRecords.filter((r) => r.date === todayIso)
    if (today.length > 0) return today
    if (attendanceRecords.length === 0) return []
    // If no records for today, use the most recent recorded date
    const latestDate = attendanceRecords.reduce((max, r) => (r.date > max ? r.date : max), "")
    return attendanceRecords.filter((r) => r.date === latestDate)
  }, [attendanceRecords, todayIso])

  const presentToday = todayRecords.filter(
    (r) => r.status === "present" || r.status === "halfday"
  ).length
  const lateToday = todayRecords.filter((r) => r.status === "late").length
  const absentToday = todayRecords.filter(
    (r) => r.status === "absent" || r.status === "leave"
  ).length

  const pendingLeaves = React.useMemo(
    () => leaveRequests.filter((r) => r.status === "pending"),
    [leaveRequests]
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

  const trendData = React.useMemo(() => {
    if (attendanceRecords.length === 0) return []
    const datesMap = new Map<string, { day: string; Present: number; Late: number; Leave: number }>()

    for (const r of attendanceRecords) {
      const day = r.date.slice(5)
      const existing = datesMap.get(r.date) ?? { day, Present: 0, Late: 0, Leave: 0 }
      if (r.status === "present" || r.status === "halfday") existing.Present += 1
      else if (r.status === "late") existing.Late += 1
      else if (r.status === "leave") existing.Leave += 1
      datesMap.set(r.date, existing)
    }

    return Array.from(datesMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([, v]) => v)
  }, [attendanceRecords])

  function handleApprove(req: LeaveRequest) {
    reviewLeaveRequest(req.id, "approved", "HR Manager", "Approved via HR Overview")
    toast.success(`Approved ${req.leaveTypeName} for ${req.userName}`)
  }

  function onRejectSubmit(values: z.infer<typeof rejectSchema>) {
    if (!rejectTarget) return
    reviewLeaveRequest(rejectTarget.id, "rejected", "HR Manager", values.remarks)
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

      {/* KPI Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Present Today"
          value={presentToday}
          delta="+5.2%"
          deltaType="increase"
          subtitle={`Out of ${todayRecords.length || users.length} active scheduled staff`}
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
          subtitle="Awaiting HR review"
          icon={<CalendarClock className="size-4" />}
        />
      </div>

      {/* Attendance Tracker Strip */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Workforce Roster Pulse</CardTitle>
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
          {trackerData.length > 0 ? (
            <Tracker data={trackerData} />
          ) : (
            <div className="flex h-12 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
              No daily attendance records logged yet. Check in on the Daily Attendance page.
            </div>
          )}
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
            {trendData.length > 0 ? (
              <AreaChart
                data={trendData}
                index="day"
                categories={["Present", "Late", "Leave"]}
                colors={["emerald", "amber", "indigo"]}
              />
            ) : (
              <div className="flex h-48 items-center justify-center text-xs text-muted-foreground">
                No attendance trend data available yet.
              </div>
            )}
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
                        <TableCell>
                          <Badge variant="outline">{req.leaveTypeName}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {req.startDate} → {req.endDate} ({req.days}d)
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={req.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => handleApprove(req)}
                              className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40"
                              title="Approve request"
                            >
                              <Check className="size-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => {
                                setRejectTarget(req)
                                form.reset({ remarks: "" })
                              }}
                              className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40"
                              title="Reject with remarks"
                            >
                              <X className="size-4" />
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

      {/* Reject Modal */}
      <Dialog
        open={Boolean(rejectTarget)}
        onOpenChange={(open) => !open && setRejectTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Leave Request</DialogTitle>
            <DialogDescription>
              Provide clear remarks explaining why {rejectTarget?.userName}&apos;s{" "}
              {rejectTarget?.leaveTypeName} cannot be approved at this time.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit(onRejectSubmit)}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="remarks">Mandatory HR Remarks</Label>
              <Textarea
                id="remarks"
                rows={3}
                placeholder="e.g., Conflicting project milestone deadlines..."
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
