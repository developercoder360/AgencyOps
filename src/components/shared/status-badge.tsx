import { cn } from "cn"

export type StatusValue = string

type ToneName =
  | "sky"
  | "blue"
  | "indigo"
  | "violet"
  | "purple"
  | "amber"
  | "orange"
  | "emerald"
  | "teal"
  | "cyan"
  | "rose"
  | "red"
  | "slate"

interface StatusConfig {
  label?: string
  classes: string
  dotClass?: string
}

const TONE_CLASS_MAP: Record<ToneName, { classes: string; dotClass: string }> = {
  sky: {
    classes:
      "bg-(--tone-sky-bg) text-(--tone-sky-fg) border-(--tone-sky-border)",
    dotClass: "bg-(--tone-sky-dot)",
  },
  blue: {
    classes:
      "bg-(--tone-blue-bg) text-(--tone-blue-fg) border-(--tone-blue-border)",
    dotClass: "bg-(--tone-blue-dot)",
  },
  indigo: {
    classes:
      "bg-(--tone-indigo-bg) text-(--tone-indigo-fg) border-(--tone-indigo-border)",
    dotClass: "bg-(--tone-indigo-dot)",
  },
  violet: {
    classes:
      "bg-(--tone-violet-bg) text-(--tone-violet-fg) border-(--tone-violet-border)",
    dotClass: "bg-(--tone-violet-dot)",
  },
  purple: {
    classes:
      "bg-(--tone-purple-bg) text-(--tone-purple-fg) border-(--tone-purple-border)",
    dotClass: "bg-(--tone-purple-dot)",
  },
  amber: {
    classes:
      "bg-(--tone-amber-bg) text-(--tone-amber-fg) border-(--tone-amber-border)",
    dotClass: "bg-(--tone-amber-dot)",
  },
  orange: {
    classes:
      "bg-(--tone-orange-bg) text-(--tone-orange-fg) border-(--tone-orange-border)",
    dotClass: "bg-(--tone-orange-dot)",
  },
  emerald: {
    classes:
      "bg-(--tone-emerald-bg) text-(--tone-emerald-fg) border-(--tone-emerald-border)",
    dotClass: "bg-(--tone-emerald-dot)",
  },
  teal: {
    classes:
      "bg-(--tone-teal-bg) text-(--tone-teal-fg) border-(--tone-teal-border)",
    dotClass: "bg-(--tone-teal-dot)",
  },
  cyan: {
    classes:
      "bg-(--tone-cyan-bg) text-(--tone-cyan-fg) border-(--tone-cyan-border)",
    dotClass: "bg-(--tone-cyan-dot)",
  },
  rose: {
    classes:
      "bg-(--tone-rose-bg) text-(--tone-rose-fg) border-(--tone-rose-border)",
    dotClass: "bg-(--tone-rose-dot)",
  },
  red: {
    classes:
      "bg-(--tone-red-bg) text-(--tone-red-fg) border-(--tone-red-border)",
    dotClass: "bg-(--tone-red-dot)",
  },
  slate: {
    classes:
      "bg-(--tone-slate-bg) text-(--tone-slate-fg) border-(--tone-slate-border)",
    dotClass: "bg-(--tone-slate-dot)",
  },
}

function toneConfig(label: string, tone: ToneName): StatusConfig {
  return {
    label,
    ...TONE_CLASS_MAP[tone],
  }
}

const STATUS_STYLE_MAP: Record<string, StatusConfig> = {
  // Project & Task statuses
  open: toneConfig("Open", "sky"),
  progress: toneConfig("Progress", "blue"),
  "qa review": toneConfig("QA Review", "violet"),
  "on hold": toneConfig("On Hold", "amber"),
  "re-draw": toneConfig("Re-Draw", "orange"),
  complete: toneConfig("Complete", "emerald"),
  overdue: toneConfig("Overdue", "rose"),

  // Task priority
  regular: toneConfig("Regular", "slate"),
  high: toneConfig("High", "amber"),
  urgent: toneConfig("Urgent", "rose"),

  // Invoice / Transaction statuses
  created: toneConfig("Created", "slate"),
  viewed: toneConfig("Viewed", "indigo"),
  processing: toneConfig("Processing", "blue"),
  success: toneConfig("Success", "emerald"),
  denied: toneConfig("Denied", "rose"),
  "refund requested": toneConfig("Refund Requested", "amber"),
  refunded: toneConfig("Refunded", "purple"),
  chargeback: toneConfig("Chargeback", "red"),

  // Attendance statuses
  present: toneConfig("Present", "emerald"),
  late: toneConfig("Late", "amber"),
  halfday: toneConfig("Half Day", "cyan"),
  absent: toneConfig("Absent", "rose"),
  leave: toneConfig("Leave", "indigo"),
  holiday: toneConfig("Holiday", "violet"),
  weekend: toneConfig("Weekend", "slate"),

  // Export statuses
  queued: toneConfig("Queued", "slate"),
  completed: toneConfig("Completed", "emerald"),
  failed: toneConfig("Failed", "rose"),

  // Leads, Leave & User statuses
  new: toneConfig("New", "sky"),
  contacted: toneConfig("Contacted", "indigo"),
  qualified: toneConfig("Qualified", "violet"),
  "proposal sent": toneConfig("Proposal Sent", "amber"),
  converted: toneConfig("Converted", "emerald"),
  lost: toneConfig("Lost", "slate"),
  pending: toneConfig("Pending", "amber"),
  approved: toneConfig("Approved", "emerald"),
  rejected: toneConfig("Rejected", "rose"),
  active: toneConfig("Active", "emerald"),
  inactive: toneConfig("Inactive", "slate"),
  "on leave": toneConfig("On Leave", "indigo"),
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
    classes: "bg-muted text-muted-foreground border-border",
    dotClass: "bg-muted-foreground",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-(--radius-badge) border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
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
