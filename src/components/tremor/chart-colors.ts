export type TremorColor =
  | "blue"
  | "emerald"
  | "amber"
  | "violet"
  | "rose"
  | "cyan"
  | "indigo"
  | "slate"

export const TREMOR_COLOR_MAP: Record<
  TremorColor,
  { stroke: string; fill: string; bg: string; text: string }
> = {
  blue: {
    stroke: "#2563eb",
    fill: "#3b82f6",
    bg: "bg-blue-500",
    text: "text-blue-600 dark:text-blue-400",
  },
  emerald: {
    stroke: "#059669",
    fill: "#10b981",
    bg: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  amber: {
    stroke: "#d97706",
    fill: "#f59e0b",
    bg: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
  },
  violet: {
    stroke: "#7c3aed",
    fill: "#8b5cf6",
    bg: "bg-violet-500",
    text: "text-violet-600 dark:text-violet-400",
  },
  rose: {
    stroke: "#e11d48",
    fill: "#f43f5e",
    bg: "bg-rose-500",
    text: "text-rose-600 dark:text-rose-400",
  },
  cyan: {
    stroke: "#0891b2",
    fill: "#06b6d4",
    bg: "bg-cyan-500",
    text: "text-cyan-600 dark:text-cyan-400",
  },
  indigo: {
    stroke: "#4f46e5",
    fill: "#6366f1",
    bg: "bg-indigo-500",
    text: "text-indigo-600 dark:text-indigo-400",
  },
  slate: {
    stroke: "#475569",
    fill: "#64748b",
    bg: "bg-slate-500",
    text: "text-slate-600 dark:text-slate-400",
  },
}

export const DEFAULT_CHART_COLORS: TremorColor[] = [
  "blue",
  "emerald",
  "violet",
  "amber",
  "cyan",
  "rose",
]
