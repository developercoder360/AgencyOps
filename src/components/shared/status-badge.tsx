import { cn } from "cn"

export type StatusValue = string

interface StatusConfig {
  label?: string
  classes: string
  dotClass?: string
}

const STATUS_STYLE_MAP: Record<string, StatusConfig> = {
  // Project & Task statuses
  open: {
    label: "Open",
    classes:
      "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30",
    dotClass: "bg-sky-500",
  },
  progress: {
    label: "Progress",
    classes:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30",
    dotClass: "bg-blue-500",
  },
  "qa review": {
    label: "QA Review",
    classes:
      "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30",
    dotClass: "bg-violet-500",
  },
  "on hold": {
    label: "On Hold",
    classes:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
    dotClass: "bg-amber-500",
  },
  "re-draw": {
    label: "Re-Draw",
    classes:
      "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/30",
    dotClass: "bg-orange-500",
  },
  complete: {
    label: "Complete",
    classes:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
    dotClass: "bg-emerald-500",
  },
  overdue: {
    label: "Overdue",
    classes:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30",
    dotClass: "bg-rose-500",
  },

  // Task priority
  regular: {
    label: "Regular",
    classes:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/30",
    dotClass: "bg-slate-400",
  },
  high: {
    label: "High",
    classes:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
    dotClass: "bg-amber-500",
  },
  urgent: {
    label: "Urgent",
    classes:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30",
    dotClass: "bg-rose-500",
  },

  // Invoice / Transaction statuses
  created: {
    label: "Created",
    classes:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/30",
    dotClass: "bg-slate-400",
  },
  viewed: {
    label: "Viewed",
    classes:
      "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30",
    dotClass: "bg-indigo-500",
  },
  processing: {
    label: "Processing",
    classes:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30",
    dotClass: "bg-blue-500",
  },
  success: {
    label: "Success",
    classes:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
    dotClass: "bg-emerald-500",
  },
  denied: {
    label: "Denied",
    classes:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30",
    dotClass: "bg-rose-500",
  },
  "refund requested": {
    label: "Refund Requested",
    classes:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
    dotClass: "bg-amber-500",
  },
  refunded: {
    label: "Refunded",
    classes:
      "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30",
    dotClass: "bg-purple-500",
  },
  chargeback: {
    label: "Chargeback",
    classes:
      "bg-red-100 text-red-800 border-red-300 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/40",
    dotClass: "bg-red-600",
  },

  // Attendance statuses
  present: {
    label: "Present",
    classes:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
    dotClass: "bg-emerald-500",
  },
  late: {
    label: "Late",
    classes:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
    dotClass: "bg-amber-500",
  },
  halfday: {
    label: "Half Day",
    classes:
      "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-500/30",
    dotClass: "bg-cyan-500",
  },
  absent: {
    label: "Absent",
    classes:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30",
    dotClass: "bg-rose-500",
  },
  leave: {
    label: "Leave",
    classes:
      "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30",
    dotClass: "bg-indigo-500",
  },
  holiday: {
    label: "Holiday",
    classes:
      "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30",
    dotClass: "bg-violet-500",
  },
  weekend: {
    label: "Weekend",
    classes:
      "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/15 dark:text-slate-400 dark:border-slate-500/30",
    dotClass: "bg-slate-400",
  },

  // Export statuses
  queued: {
    label: "Queued",
    classes:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/30",
    dotClass: "bg-slate-400",
  },
  completed: {
    label: "Completed",
    classes:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
    dotClass: "bg-emerald-500",
  },
  failed: {
    label: "Failed",
    classes:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30",
    dotClass: "bg-rose-500",
  },

  // Leads, Leave & User statuses
  new: {
    label: "New",
    classes:
      "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30",
    dotClass: "bg-sky-500",
  },
  contacted: {
    label: "Contacted",
    classes:
      "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30",
    dotClass: "bg-indigo-500",
  },
  qualified: {
    label: "Qualified",
    classes:
      "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30",
    dotClass: "bg-violet-500",
  },
  "proposal sent": {
    label: "Proposal Sent",
    classes:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
    dotClass: "bg-amber-500",
  },
  converted: {
    label: "Converted",
    classes:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
    dotClass: "bg-emerald-500",
  },
  lost: {
    label: "Lost",
    classes:
      "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/15 dark:text-slate-400 dark:border-slate-500/30",
    dotClass: "bg-slate-400",
  },
  pending: {
    label: "Pending",
    classes:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
    dotClass: "bg-amber-500",
  },
  approved: {
    label: "Approved",
    classes:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
    dotClass: "bg-emerald-500",
  },
  rejected: {
    label: "Rejected",
    classes:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30",
    dotClass: "bg-rose-500",
  },
  active: {
    label: "Active",
    classes:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
    dotClass: "bg-emerald-500",
  },
  inactive: {
    label: "Inactive",
    classes:
      "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/15 dark:text-slate-400 dark:border-slate-500/30",
    dotClass: "bg-slate-400",
  },
  "on leave": {
    label: "On Leave",
    classes:
      "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30",
    dotClass: "bg-indigo-500",
  },
}

interface StatusBadgeProps {
  status: StatusValue
  showDot?: boolean
  className?: string
}

export function StatusBadge({
  status,
  showDot = true,
  className,
}: StatusBadgeProps) {
  const key = status.trim().toLowerCase()
  const config = STATUS_STYLE_MAP[key] ?? {
    label: status,
    classes:
      "bg-muted text-muted-foreground border-border",
    dotClass: "bg-muted-foreground",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        config.classes,
        className
      )}
    >
      {showDot ? (
        <span
          className={cn("size-1.5 shrink-0 rounded-full", config.dotClass)}
          aria-hidden="true"
        />
      ) : null}
      <span>{config.label ?? status}</span>
    </span>
  )
}
