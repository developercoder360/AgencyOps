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
    stroke: "var(--chart-blue-stroke)",
    fill: "var(--chart-blue-fill)",
    bg: "bg-(--chart-blue-dot)",
    text: "text-(--chart-blue-text)",
  },
  emerald: {
    stroke: "var(--chart-emerald-stroke)",
    fill: "var(--chart-emerald-fill)",
    bg: "bg-(--chart-emerald-dot)",
    text: "text-(--chart-emerald-text)",
  },
  amber: {
    stroke: "var(--chart-amber-stroke)",
    fill: "var(--chart-amber-fill)",
    bg: "bg-(--chart-amber-dot)",
    text: "text-(--chart-amber-text)",
  },
  violet: {
    stroke: "var(--chart-violet-stroke)",
    fill: "var(--chart-violet-fill)",
    bg: "bg-(--chart-violet-dot)",
    text: "text-(--chart-violet-text)",
  },
  rose: {
    stroke: "var(--chart-rose-stroke)",
    fill: "var(--chart-rose-fill)",
    bg: "bg-(--chart-rose-dot)",
    text: "text-(--chart-rose-text)",
  },
  cyan: {
    stroke: "var(--chart-cyan-stroke)",
    fill: "var(--chart-cyan-fill)",
    bg: "bg-(--chart-cyan-dot)",
    text: "text-(--chart-cyan-text)",
  },
  indigo: {
    stroke: "var(--chart-indigo-stroke)",
    fill: "var(--chart-indigo-fill)",
    bg: "bg-(--chart-indigo-dot)",
    text: "text-(--chart-indigo-text)",
  },
  slate: {
    stroke: "var(--chart-slate-stroke)",
    fill: "var(--chart-slate-fill)",
    bg: "bg-(--chart-slate-dot)",
    text: "text-(--chart-slate-text)",
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
