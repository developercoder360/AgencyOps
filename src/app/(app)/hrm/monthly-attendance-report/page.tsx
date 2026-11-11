"use client"

import * as React from "react"
import { CalendarRange, Download } from "lucide-react"
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { buildPayrollMonthlyReport } from "@/mocks/hrm"
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
      "border border-(--tone-emerald-border) bg-(--tone-emerald-bg) text-(--tone-emerald-fg)",
  },
  late: {
    code: "L",
    label: "Late",
    classes:
      "border border-(--tone-amber-border) bg-(--tone-amber-bg) text-(--tone-amber-fg)",
  },
  halfday: {
    code: "HD",
    label: "Half Day",
    classes:
      "border border-(--tone-cyan-border) bg-(--tone-cyan-bg) text-(--tone-cyan-fg)",
  },
  absent: {
    code: "A",
    label: "Absent",
    classes:
      "border border-(--tone-rose-border) bg-(--tone-rose-bg) text-(--tone-rose-fg)",
  },
  leave: {
    code: "LV",
    label: "Leave",
    classes:
      "border border-(--tone-indigo-border) bg-(--tone-indigo-bg) text-(--tone-indigo-fg)",
  },
  holiday: {
    code: "H",
    label: "Holiday",
    classes:
      "border border-(--tone-violet-border) bg-(--tone-violet-bg) text-(--tone-violet-fg)",
  },
  weekend: {
    code: "W",
    label: "Weekend",
    classes:
      "bg-muted text-muted-foreground",
  },
}

export default function MonthlyAttendanceReportPage() {
  const [monthKey, setMonthKey] = React.useState("2026-11")
  const [exportOpen, setExportOpen] = React.useState(false)

  const report = React.useMemo(
    () => buildPayrollMonthlyReport(monthKey),
    [monthKey]
  )

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

      {/* Pivot-Style Grid */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>{report.label} Payroll Matrix</CardTitle>
          <CardDescription>
            Per-day status chips from the 26th of the previous month through the
            25th of the selected month.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
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
                      <span className="text-(--tone-emerald-text)">
                        {row.summary.present}
                      </span>
                      {" / "}
                      <span className="text-(--tone-amber-text)">
                        {row.summary.late}
                      </span>
                      {" / "}
                      <span className="text-(--tone-rose-text)">
                        {row.summary.absent}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
