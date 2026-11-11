import type {
  AttendanceRecord,
  AttendanceStatus,
  Holiday,
  LeaveBalance,
  LeaveRequest,
  LeaveStatus,
  LeaveType,
  ShiftSchedule,
} from "@/types"
import { MOCK_USERS } from "./users"
import { createSeededRandom, intBetween } from "./seed"

const ATT_STATUSES: AttendanceStatus[] = [
  "present",
  "present",
  "present",
  "present",
  "late",
  "halfday",
  "leave",
  "absent",
]

export const MOCK_LEAVE_TYPES: LeaveType[] = [
  {
    id: "lt-1",
    name: "Annual Paid Leave",
    code: "AL",
    daysAllowedPerYear: 20,
    paid: true,
    carryForwardLimit: 5,
    requiresDocument: false,
    color: "#2563EB",
    description: "Standard accrued annual vacation and personal time off.",
  },
  {
    id: "lt-2",
    name: "Sick & Medical Leave",
    code: "SL",
    daysAllowedPerYear: 10,
    paid: true,
    carryForwardLimit: 0,
    requiresDocument: true,
    color: "#059669",
    description: "Medical recovery; doctor note required beyond 2 consecutive days.",
  },
  {
    id: "lt-3",
    name: "Casual / Personal Leave",
    code: "CL",
    daysAllowedPerYear: 6,
    paid: true,
    carryForwardLimit: 0,
    requiresDocument: false,
    color: "#7C3AED",
    description: "Short-notice personal errands and family commitments.",
  },
  {
    id: "lt-4",
    name: "Parental Leave",
    code: "PL",
    daysAllowedPerYear: 60,
    paid: true,
    carryForwardLimit: 0,
    requiresDocument: true,
    color: "#D97706",
    description: "Primary and secondary caregiver paid parental bonding leave.",
  },
  {
    id: "lt-5",
    name: "Unpaid Sabbatical",
    code: "UL",
    daysAllowedPerYear: 30,
    paid: false,
    carryForwardLimit: 0,
    requiresDocument: false,
    color: "#64748B",
    description: "Approved extended unpaid leave subject to department lead sign-off.",
  },
]

export const MOCK_SHIFTS: ShiftSchedule[] = [
  {
    id: "sh-1",
    name: "US East Core Shift",
    code: "EST-09",
    startTime: "09:00",
    endTime: "18:00",
    graceMinutes: 15,
    timezone: "America/New_York",
    workDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    assignedCount: 8,
    isNightShift: false,
  },
  {
    id: "sh-2",
    name: "UK & EMEA Studio Shift",
    code: "GMT-09",
    startTime: "09:30",
    endTime: "18:30",
    graceMinutes: 15,
    timezone: "Europe/London",
    workDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    assignedCount: 5,
    isNightShift: false,
  },
  {
    id: "sh-3",
    name: "US West / PST Overlap",
    code: "PST-09",
    startTime: "09:00",
    endTime: "18:00",
    graceMinutes: 10,
    timezone: "America/Los_Angeles",
    workDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    assignedCount: 3,
    isNightShift: false,
  },
  {
    id: "sh-4",
    name: "24/7 Release & QA Night Shift",
    code: "QA-21",
    startTime: "21:00",
    endTime: "06:00",
    graceMinutes: 10,
    timezone: "America/New_York",
    workDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    assignedCount: 2,
    isNightShift: true,
  },
]

export const MOCK_HOLIDAYS: Holiday[] = [
  {
    id: "hol-1",
    name: "New Year's Day",
    date: "2026-01-01",
    type: "Public",
    region: "Global (US / UK / CA)",
    description: "Company-wide paid public holiday.",
  },
  {
    id: "hol-2",
    name: "Good Friday",
    date: "2026-04-03",
    type: "Public",
    region: "UK & Canada",
    description: "Regional bank holiday for London and Toronto teams.",
  },
  {
    id: "hol-3",
    name: "Memorial Day",
    date: "2026-05-25",
    type: "Public",
    region: "United States",
    description: "US offices closed.",
  },
  {
    id: "hol-4",
    name: "Agency Summer Recharge Day",
    date: "2026-07-17",
    type: "Company",
    region: "Global",
    description: "Paid mental health & recharge day across all brands.",
  },
  {
    id: "hol-5",
    name: "Labor Day",
    date: "2026-09-07",
    type: "Public",
    region: "US & Canada",
    description: "North American offices closed.",
  },
  {
    id: "hol-6",
    name: "Veterans / Remembrance Day",
    date: "2026-11-11",
    type: "Optional",
    region: "US & Canada",
    description: "Optional floating holiday observance.",
  },
  {
    id: "hol-7",
    name: "Thanksgiving Day",
    date: "2026-11-26",
    type: "Public",
    region: "United States",
    description: "US offices closed Thursday & Friday.",
  },
  {
    id: "hol-8",
    name: "Christmas Day",
    date: "2026-12-25",
    type: "Public",
    region: "Global (US / UK / CA)",
    description: "Year-end global holiday closure.",
  },
]

function generateAttendanceRecords(): AttendanceRecord[] {
  const rng = createSeededRandom(31415)
  const records: AttendanceRecord[] = []
  const activeUsers = MOCK_USERS.filter((u) => u.status !== "Inactive")
  const dates = ["2026-11-11", "2026-11-10", "2026-11-09"]

  let idCounter = 1
  for (const date of dates) {
    for (const user of activeUsers) {
      const status =
        date === "2026-11-11" && user.status === "On Leave"
          ? "leave"
          : ATT_STATUSES[
              (idCounter + intBetween(rng, 0, 3)) % ATT_STATUSES.length
            ]
      const lateMinutes =
        status === "late" ? intBetween(rng, 18, 52) : 0
      const checkIn =
        status === "absent" || status === "leave"
          ? undefined
          : status === "late"
            ? `09:${String(lateMinutes).padStart(2, "0")}`
            : `08:${String(intBetween(rng, 48, 59)).padStart(2, "0")}`
      const checkOut =
        status === "absent" || status === "leave"
          ? undefined
          : status === "halfday"
            ? "13:30"
            : `18:${String(intBetween(rng, 0, 22)).padStart(2, "0")}`
      const workHours =
        status === "absent" || status === "leave"
          ? 0
          : status === "halfday"
            ? 4.5
            : status === "late"
              ? 8.2
              : 8.8

      records.push({
        id: `att-${idCounter}`,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        department: user.department,
        date,
        status,
        checkIn,
        checkOut,
        workHours,
        lateMinutes,
        shiftName:
          user.timezone === "Europe/London"
            ? "UK & EMEA Studio Shift"
            : "US East Core Shift",
        notes:
          status === "late"
            ? "Transit delay reported via Slack"
            : status === "halfday"
              ? "Approved afternoon medical appointment"
              : undefined,
        logs: [
          {
            id: `alog-${idCounter}-1`,
            action: checkIn ? "Clocked In (Biometric / Web)" : "Shift Auto-Check",
            actor: checkIn ? user.name : "Attendance Engine",
            timestamp: `${date} ${checkIn ?? "09:30"}`,
            detail: checkIn
              ? `Verified session from ${user.city} (${user.timezone})`
              : `Marked as ${status}`,
          },
          ...(checkOut
            ? [
                {
                  id: `alog-${idCounter}-2`,
                  action: "Clocked Out",
                  actor: user.name,
                  timestamp: `${date} ${checkOut}`,
                  detail: `Total logged hours: ${workHours}h`,
                },
              ]
            : []),
        ],
      })
      idCounter++
    }
  }

  return records
}

function generateLeaveBalances(): LeaveBalance[] {
  const rng = createSeededRandom(27182)
  return MOCK_USERS.map((user, idx) => ({
    id: `lb-${idx + 1}`,
    userId: user.id,
    userName: user.name,
    department: user.department,
    annualTotal: 20,
    annualUsed: intBetween(rng, 3, 14),
    sickTotal: 10,
    sickUsed: intBetween(rng, 0, 5),
    casualTotal: 6,
    casualUsed: intBetween(rng, 1, 4),
    carryForward: intBetween(rng, 0, 4),
  }))
}

function generateLeaveRequests(): LeaveRequest[] {
  const rng = createSeededRandom(98765)
  const statuses: LeaveStatus[] = [
    "pending",
    "pending",
    "approved",
    "approved",
    "rejected",
  ]
  const reasons = [
    "Family wedding out of state",
    "Annual recharge trip",
    "Dental surgery recovery",
    "Home relocation & internet setup",
    "Attending design leadership summit",
  ]

  const items: LeaveRequest[] = []
  for (let i = 0; i < 40; i++) {
    const user = MOCK_USERS[i % MOCK_USERS.length]
    const lt = MOCK_LEAVE_TYPES[i % 3]
    const status = statuses[i % statuses.length]
    const dayStart = 2 + (i % 20)
    const days = intBetween(rng, 1, 4)
    const monthStr = i < 10 ? "2026-11" : i < 25 ? "2026-10" : "2026-09"
    const startDate = `${monthStr}-${String(dayStart).padStart(2, "0")}`
    const endDate = `${monthStr}-${String(
      Math.min(28, dayStart + days - 1)
    ).padStart(2, "0")}`

    items.push({
      id: `lr-${i + 1}`,
      userId: user.id,
      userName: user.name,
      department: user.department,
      leaveTypeId: lt.id,
      leaveTypeName: lt.name,
      startDate,
      endDate,
      days,
      reason: reasons[i % reasons.length],
      status,
      reviewedBy: status === "pending" ? undefined : "Nadia Kapoor",
      reviewRemarks:
        status === "rejected"
          ? "Overlaps with sprint launch freeze; please reschedule by 1 week."
          : status === "approved"
            ? "Approved — handover documented with team lead."
            : undefined,
      appliedAt: `${monthStr}-01`,
    })
  }
  return items
}

export interface PayrollDayCell {
  isoDate: string
  dayNum: number
  label: string
  status: AttendanceStatus
}

export interface PayrollEmployeeRow {
  userId: string
  userName: string
  department: string
  days: PayrollDayCell[]
  summary: Record<AttendanceStatus, number>
}

export interface PayrollPeriodData {
  monthKey: string
  label: string
  rangeLabel: string
  dates: { isoDate: string; dayNum: number; shortLabel: string }[]
  rows: PayrollEmployeeRow[]
}

/**
 * Generates deterministic 26th-to-25th payroll window matrix for a given YYYY-MM month key.
 * e.g. "2026-11" => Oct 26, 2026 – Nov 25, 2026.
 */
export function buildPayrollMonthlyReport(monthKey: string): PayrollPeriodData {
  const [yearStr, monthStr] = monthKey.split("-")
  const year = Number(yearStr)
  const month = Number(monthStr) // 1..12

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

  const seedNum = year * 100 + month
  const rng = createSeededRandom(seedNum)
  const holidaySet = new Set(MOCK_HOLIDAYS.map((h) => h.date))

  const rows: PayrollEmployeeRow[] = MOCK_USERS.map((user) => {
    const summary: Record<AttendanceStatus, number> = {
      present: 0,
      late: 0,
      halfday: 0,
      absent: 0,
      leave: 0,
      holiday: 0,
      weekend: 0,
    }

    const days: PayrollDayCell[] = dates.map((d) => {
      const dt = new Date(`${d.isoDate}T00:00:00Z`)
      const dow = dt.getUTCDay()
      let status: AttendanceStatus
      if (dow === 0 || dow === 6) {
        status = "weekend"
      } else if (holidaySet.has(d.isoDate)) {
        status = "holiday"
      } else {
        const roll = rng()
        if (roll < 0.76) status = "present"
        else if (roll < 0.87) status = "late"
        else if (roll < 0.92) status = "halfday"
        else if (roll < 0.97) status = "leave"
        else status = "absent"
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
}

export const MOCK_ATTENDANCE_RECORDS: AttendanceRecord[] =
  generateAttendanceRecords()
export const MOCK_LEAVE_BALANCES: LeaveBalance[] = generateLeaveBalances()
export const MOCK_LEAVE_REQUESTS: LeaveRequest[] = generateLeaveRequests()
