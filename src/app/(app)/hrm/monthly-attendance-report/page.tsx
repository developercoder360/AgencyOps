"use client"

import * as React from "react"
import Link from "next/link"
import { CalendarRange, Download, Users } from "lucide-react"
import { ExportDialog } from "@/components/data-table"
import { PageHeader } from "@/components/shared"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useStore } from "@/lib/store"
import type { AttendanceStatus } from "@/types"
import { cn } from "cn"

const PAYROLL_MONTHS = [
  { key: "2026-11", label: "November 2026 Cycle" },
  { key: "2026-10", label: "October 2026 Cycle" },
  { key: "2026-09", label: "September 2026 Cycle" },
  { key: "2026-08", label: "August 2026 Cycle" },
]

const CHIP_META: Record<
  AttendanceStatus,
  { code: string; label: string; classes: string }
> = {
  present: {
    code: "P",
    label: "Present",
    classes:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
  },
  late: {
    code: "L",
    label: "Late",
    classes:
      "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  },
  halfday: {
    code: "HD",
    label: "Half Day",
    classes:
      "bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300",
  },
  absent: {
    code: "A",
    label: "Absent",
    classes:
      "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300",
  },
  leave: {
    code: "LV",
    label: "Leave",
    classes:
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-300",
  },
  holiday: {
    code: "H",
    label: "Holiday",
    classes:
      "bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-300",
  },
  weekend: {
    code: "W",
    label: "Weekend",
    classes:
      "bg-muted text-muted-foreground",
  },
}

export default function MonthlyAttendanceReportPage() {
  const { users, attendanceRecords, holidays, isLoaded } = useStore()
  const [monthKey, setMonthKey] = React.useState("2026-11")
  const [exportOpen, setExportOpen] = React.useState(false)

  const report = React.useMemo(() => {
    const [yearStr, monthStr] = monthKey.split("-")
    const year = Number(yearStr)
    const month = Number(monthStr)

    const end = new Date(Date.UTC(year, month - 1, 25))
    const start = new Date(Date.UTC(year, month - 2, 26))

    const dates: { isoDate: string; dayNum: number; shortLabel: string }[] = []
    const cursor = new Date(start.getTime())
    while (cursor <= end) {
      const iso = cursor.toISOString().slice(0, 10)
      const dayNum = cursor.getUTCDate()
      const mShort = cursor.toLocaleString("en-US", {
        month: "short",
        timeZone: "UTC",
      })
      dates.push({
        isoDate: iso,
        dayNum,
        shortLabel: `${mShort} ${dayNum}`,
      })
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    }

    const holidaySet = new Set(holidays.map((h) => h.date))

    const rows = users.map((user) => {
      const summary: Record<AttendanceStatus, number> = {
        present: 0,
        late: 0,
        halfday: 0,
        absent: 0,
        leave: 0,
        holiday: 0,
        weekend: 0,
      }

      const days = dates.map((d) => {
        const dt = new Date(`${d.isoDate}T00:00:00Z`)
        const dow = dt.getUTCDay()
        let status: AttendanceStatus

        const match = attendanceRecords.find(
          (r) => r.userId === user.id && r.date === d.isoDate
        )

        if (match) {
          status = match.status
        } else if (dow === 0 || dow === 6) {
          status = "weekend"
        } else if (holidaySet.has(d.isoDate)) {
          status = "holiday"
        } else {
          status = "present"
        }

        summary[status]++
        return {
          isoDate: d.isoDate,
          dayNum: d.dayNum,
          label: d.shortLabel,
          status,
        }
      })

      return {
        userId: user.id,
        userName: user.name,
        department: user.department,
        days,
        summary,
      }
    })

    const fmtMonth = (d: Date) =>
      d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      })

    return {
      monthKey,
      label: end.toLocaleString("en-US", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }),
      rangeLabel: `${fmtMonth(start)} – ${fmtMonth(end)}`,
      dates,
      rows,
    }
  }, [monthKey, users, attendanceRecords, holidays])

  if (!isLoaded) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monthly Attendance Report"
        description="Pivot attendance grid aligned to the agency's 26th-to-25th monthly payroll cycle."
        badge={
          <Badge variant="outline" className="gap-1.5 font-medium">
            <CalendarRange className="size-3.5 text-primary" />
            Payroll Window: {report.rangeLabel}
          </Badge>
        }
        actions={
          <>
            <Select value={monthKey} onValueChange={setMonthKey}>
              <SelectTrigger
                aria-label="Select payroll month"
                className="h-9 w-[210px]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYROLL_MONTHS.map((m) => (
                  <SelectItem key={m.key} value={m.key}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setExportOpen(true)}
              className="gap-1.5"
              disabled={report.rows.length === 0}
            >
              <Download className="size-4" />
              Export Payroll Sheet
            </Button>
          </>
        }
      />

      {/* Legend */}
      <Card className="py-3">
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-medium text-muted-foreground">
            Active Cycle:{" "}
            <span className="font-semibold text-foreground">
              {report.rangeLabel}
            </span>{" "}
            ({report.dates.length} calendar days)
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {(Object.keys(CHIP_META) as AttendanceStatus[]).map((status) => {
              const meta = CHIP_META[status]
              return (
                <div key={status} className="flex items-center gap-1.5 text-xs">
                  <span
                    className={cn(
                      "inline-flex size-5 items-center justify-center rounded text-[10px] font-bold",
                      meta.classes
                    )}
                  >
                    {meta.code}
                  </span>
                  <span className="text-muted-foreground">{meta.label}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Pivot-Style Grid or Empty State */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>{report.label} Payroll Matrix</CardTitle>
          <CardDescription>
            Per-day status chips from the 26th of the previous month through the
            25th of the selected month.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {report.rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Users className="size-10 text-muted-foreground/60 mb-3" />
              <h3 className="font-semibold text-base">No staff members found</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
                Add employees in the Users directory to generate monthly payroll attendance sheets.
              </p>
              <Button asChild size="sm">
                <Link href="/users">Go to Users</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-y border-border bg-muted/60">
                    <th className="sticky left-0 z-20 min-w-[136px] border-r border-border bg-muted px-3 py-2.5 text-left font-semibold sm:min-w-[180px]">
                      Employee
                    </th>
                    {report.dates.map((d) => (
                      <th
                        key={d.isoDate}
                        className="min-w-[34px] px-1 py-2 text-center font-medium text-muted-foreground"
                        title={d.isoDate}
                      >
                        <div className="text-[10px]">{d.shortLabel.split(" ")[0]}</div>
                        <div className="font-mono text-[11px] text-foreground">
                          {d.dayNum}
                        </div>
                      </th>
                    ))}
                    <th className="border-l border-border bg-muted px-3 py-2 text-center font-semibold">
                      P / L / A
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {report.rows.map((row) => (
                    <tr key={row.userId} className="hover:bg-muted/30">
                      <td className="sticky left-0 z-10 border-r border-border bg-card px-3 py-2">
                        <div className="font-medium text-foreground">
                          {row.userName}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {row.department}
                        </div>
                      </td>
                      {row.days.map((day) => {
                        const meta = CHIP_META[day.status]
                        return (
                          <td key={day.isoDate} className="p-1 text-center">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span
                                  className={cn(
                                    "inline-flex h-6 w-6 cursor-default items-center justify-center rounded text-[10px] font-bold",
                                    meta.classes
                                  )}
                                >
                                  {meta.code}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="text-xs">
                                {row.userName} • {day.isoDate}: {meta.label}
                              </TooltipContent>
                            </Tooltip>
                          </td>
                        )
                      })}
                      <td className="border-l border-border px-3 py-2 text-center font-mono text-xs whitespace-nowrap">
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {row.summary.present}
                        </span>
                        {" / "}
                        <span className="text-amber-600 dark:text-amber-400">
                          {row.summary.late}
                        </span>
                        {" / "}
                        <span className="text-rose-600 dark:text-rose-400">
                          {row.summary.absent}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        moduleName={`Payroll Attendance (${report.rangeLabel})`}
        columns={[
          { id: "employee", label: "Employee Name" },
          { id: "department", label: "Department" },
          { id: "presentDays", label: "Present Days" },
          { id: "lateDays", label: "Late Days" },
          { id: "leaveDays", label: "Leave Days" },
          { id: "absentDays", label: "Absent Days" },
        ]}
        rowCount={report.rows.length}
      />
    </div>
  )
}
