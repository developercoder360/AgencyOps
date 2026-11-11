"use client"

import * as React from "react"
import Link from "next/link"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"
import {
  AlertTriangle,
  ArrowRight,
  CalendarIcon,
  DollarSign,
  FolderKanban,
  PartyPopper,
  Sparkles,
  Target,
  UserPlus,
  X,
} from "lucide-react"
import { useAppState } from "@/components/providers/app-state-provider"
import {
  AvatarGroup,
  KpiCard,
  PageHeader,
  StatusBadge,
} from "@/components/shared"
import {
  AreaChart,
  BarChart,
  DonutChart,
  ProgressBar,
} from "@/components/tremor"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency } from "@/lib/currency"
import { MOCK_BRANDS } from "@/mocks/brands"
import { MOCK_TRANSACTIONS } from "@/mocks/billing"
import { MOCK_LEADS } from "@/mocks/leads"
import { MOCK_MARKETING_SPENDS } from "@/mocks/marketing"
import { MOCK_PROJECTS } from "@/mocks/projects"
import { MOCK_TASKS } from "@/mocks/tasks"
import { MOCK_USERS } from "@/mocks/users"
import { REFERENCE_DATE_ISO } from "@/mocks/seed"

const PRESETS = [
  { id: "30d", label: "Last 30 Days", from: "2026-10-12", to: "2026-11-11", months: 1 },
  { id: "90d", label: "Last 90 Days", from: "2026-08-13", to: "2026-11-11", months: 3 },
  { id: "6m", label: "Last 6 Months", from: "2026-05-15", to: "2026-11-11", months: 6 },
]

function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function DashboardClient() {
  const { celebrationDismissed, dismissCelebration } = useAppState()

  const [brandFilter, setBrandFilter] = React.useState<string>("all")
  const [presetId, setPresetId] = React.useState<string>("6m")
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: parseIsoDate("2026-05-15"),
    to: parseIsoDate("2026-11-11"),
  })

  const fromIso = dateRange?.from ? toIsoDate(dateRange.from) : "2026-05-15"
  const toIso = dateRange?.to
    ? toIsoDate(dateRange.to)
    : dateRange?.from
      ? toIsoDate(dateRange.from)
      : "2026-11-11"

  const monthsInRange = React.useMemo(() => {
    const start = parseIsoDate(fromIso)
    const end = parseIsoDate(toIso)
    const days = Math.max(
      1,
      Math.round((end.getTime() - start.getTime()) / 86400000) + 1
    )
    return Math.max(1, Math.round(days / 30))
  }, [fromIso, toIso])

  // Filtered datasets
  const filteredTransactions = React.useMemo(
    () =>
      MOCK_TRANSACTIONS.filter((t) => {
        const matchBrand = brandFilter === "all" || t.brandId === brandFilter
        const matchDate = t.createdAt >= fromIso && t.createdAt <= toIso
        return matchBrand && matchDate
      }),
    [brandFilter, fromIso, toIso]
  )

  const filteredLeads = React.useMemo(
    () =>
      MOCK_LEADS.filter((l) => {
        const matchBrand = brandFilter === "all" || l.brandId === brandFilter
        const matchDate = l.createdAt >= fromIso && l.createdAt <= toIso
        return matchBrand && matchDate
      }),
    [brandFilter, fromIso, toIso]
  )

  const filteredProjects = React.useMemo(
    () =>
      MOCK_PROJECTS.filter(
        (p) => brandFilter === "all" || p.brandId === brandFilter
      ),
    [brandFilter]
  )

  const filteredTasks = React.useMemo(
    () =>
      MOCK_TASKS.filter(
        (t) => brandFilter === "all" || t.brandId === brandFilter
      ),
    [brandFilter]
  )

  // KPI metrics
  const totalRevenueUsd = React.useMemo(
    () =>
      filteredTransactions
        .filter((t) => t.status === "Success" || t.status === "Processing")
        .reduce((sum, t) => sum + t.amountUsd, 0),
    [filteredTransactions]
  )

  const activeProjectsCount = React.useMemo(
    () => filteredProjects.filter((p) => p.status !== "Complete").length,
    [filteredProjects]
  )

  const overdueTasksCount = React.useMemo(
    () =>
      filteredTasks.filter(
        (t) => t.status !== "Complete" && t.dueDate < REFERENCE_DATE_ISO
      ).length,
    [filteredTasks]
  )

  // Monthly target calculation (sum of active sales reps monthlyTargetUsd * monthsInRange)
  const monthlySalesTargetUsd = React.useMemo(() => {
    const base = MOCK_USERS.reduce((sum, u) => sum + u.monthlyTargetUsd, 0)
    if (brandFilter === "all") return base
    const brandShare = 1 / MOCK_BRANDS.length
    return Math.round(base * brandShare)
  }, [brandFilter])

  const periodTargetUsd = monthlySalesTargetUsd * monthsInRange
  const targetPercent =
    periodTargetUsd > 0
      ? Math.min(100, Math.round((totalRevenueUsd / periodTargetUsd) * 100))
      : 0

  // Revenue over time by month x brand
  const visibleBrands = React.useMemo(
    () =>
      brandFilter === "all"
        ? MOCK_BRANDS
        : MOCK_BRANDS.filter((b) => b.id === brandFilter),
    [brandFilter]
  )

  const revenueAreaData = React.useMemo(() => {
    const monthKeys = ["2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11"]
    const monthLabels: Record<string, string> = {
      "2026-06": "Jun 2026",
      "2026-07": "Jul 2026",
      "2026-08": "Aug 2026",
      "2026-09": "Sep 2026",
      "2026-10": "Oct 2026",
      "2026-11": "Nov 2026",
    }
    return monthKeys.map((mk) => {
      const row: Record<string, string | number> = { month: monthLabels[mk] }
      for (const brand of visibleBrands) {
        const sum = MOCK_TRANSACTIONS.filter(
          (t) =>
            t.brandId === brand.id &&
            t.createdAt.startsWith(mk) &&
            (t.status === "Success" || t.status === "Processing")
        ).reduce((acc, t) => acc + t.amountUsd, 0)
        // Add deterministic baseline from brand monthly revenue if sparse in a bucket
        row[brand.name] = Math.round(sum || brand.monthlyRevenueUsd * 0.42)
      }
      return row
    })
  }, [visibleBrands])

  // Leads by source DonutChart
  const leadsBySourceData = React.useMemo(() => {
    const counts = new Map<string, number>()
    for (const lead of filteredLeads) {
      counts.set(lead.source, (counts.get(lead.source) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
  }, [filteredLeads])

  // Marketing spend vs revenue by brand BarChart
  const spendVsRevenueData = React.useMemo(
    () =>
      visibleBrands.map((b) => {
        const spend = MOCK_MARKETING_SPENDS.filter(
          (m) => m.brandId === b.id
        ).reduce((acc, m) => acc + m.spendUsd, 0)
        const rev = MOCK_MARKETING_SPENDS.filter(
          (m) => m.brandId === b.id
        ).reduce((acc, m) => acc + m.revenueAttributedUsd, 0)
        return {
          brand: b.name.replace(" Studio", "").replace(" Digital", ""),
          "Ad Spend": spend,
          "Attributed Revenue": rev,
        }
      }),
    [visibleBrands]
  )

  const recentTransactions = React.useMemo(
    () => filteredTransactions.slice(0, 6),
    [filteredTransactions]
  )

  const tasksDueSoon = React.useMemo(
    () =>
      filteredTasks
        .filter(
          (t) =>
            t.status !== "Complete" &&
            t.dueDate >= REFERENCE_DATE_ISO
        )
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        .slice(0, 5),
    [filteredTasks]
  )

  function applyPreset(id: string) {
    const preset = PRESETS.find((p) => p.id === id)
    if (!preset) return
    setPresetId(id)
    setDateRange({
      from: parseIsoDate(preset.from),
      to: parseIsoDate(preset.to),
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Executive Dashboard"
        description="Cross-brand revenue, lead acquisition, delivery velocity, and target attainment."
        actions={
          <>
            {/* Brand filter */}
            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger
                aria-label="Filter by brand"
                className="h-9 w-[180px]"
              >
                <Sparkles className="mr-1.5 size-3.5 text-primary" />
                <SelectValue placeholder="All Brands" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands ({MOCK_BRANDS.length})</SelectItem>
                {MOCK_BRANDS.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date range picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 justify-start gap-2 text-left font-normal"
                >
                  <CalendarIcon className="size-4 text-muted-foreground" />
                  <span className="truncate">
                    {dateRange?.from
                      ? dateRange.to
                        ? `${format(dateRange.from, "MMM d, yyyy")} – ${format(
                            dateRange.to,
                            "MMM d, yyyy"
                          )}`
                        : format(dateRange.from, "MMM d, yyyy")
                      : "Select date range"}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-auto p-3">
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {PRESETS.map((p) => (
                    <Button
                      key={p.id}
                      type="button"
                      size="xs"
                      variant={presetId === p.id ? "default" : "outline"}
                      onClick={() => applyPreset(p.id)}
                    >
                      {p.label}
                    </Button>
                  ))}
                </div>
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={(range) => {
                    setPresetId("custom")
                    setDateRange(range)
                  }}
                  defaultMonth={parseIsoDate("2026-10-01")}
                  numberOfMonths={1}
                />
              </PopoverContent>
            </Popover>
          </>
        }
      />

      {/* Dismissible celebration banner */}
      {!celebrationDismissed ? (
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50/90 via-background to-blue-50/70 py-3 dark:border-amber-500/30 dark:from-amber-950/30 dark:via-card dark:to-blue-950/30">
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <PartyPopper className="size-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    Team Milestones Today
                  </span>
                  <Badge variant="secondary" className="text-[11px]">
                    Celebrations
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Happy Birthday to <strong className="text-foreground">Aria Chen</strong>{" "}
                  (Lead Product Designer) and Happy Work Anniversary to{" "}
                  <strong className="text-foreground">Elena Rostova</strong> (4 yrs) &{" "}
                  <strong className="text-foreground">Maya Alvarez</strong> (3 yrs)!
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center">
              <Button asChild variant="outline" size="xs">
                <Link href="/hrm/holidays">View Calendar</Link>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={dismissCelebration}
                aria-label="Dismiss celebration card"
              >
                <X className="size-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* KPI Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Revenue (USD Eq.)"
          value={formatCurrency(totalRevenueUsd)}
          delta="+14.2%"
          deltaType="increase"
          subtitle={`Converted across USD, GBP & CAD (${filteredTransactions.length} txns)`}
          icon={<DollarSign className="size-4" />}
        />
        <KpiCard
          title="New Leads"
          value={filteredLeads.length}
          delta="+9.8%"
          deltaType="moderateIncrease"
          subtitle={`${
            filteredLeads.filter((l) => l.status === "Converted").length
          } converted in selected range`}
          icon={<UserPlus className="size-4" />}
        />
        <KpiCard
          title="Active Projects"
          value={activeProjectsCount}
          delta="+4.1%"
          deltaType="moderateIncrease"
          subtitle={`${
            filteredProjects.filter((p) => p.status === "Re-Draw").length
          } in Re-Draw • ${
            filteredProjects.filter((p) => p.status === "Overdue").length
          } overdue`}
          icon={<FolderKanban className="size-4" />}
        />
        <KpiCard
          title="Overdue Tasks"
          value={overdueTasksCount}
          delta="-12.5%"
          deltaType="decrease"
          isIncreasePositive={false}
          subtitle={`${
            filteredTasks.filter((t) => t.priority === "Urgent" && t.status !== "Complete").length
          } urgent deliverables pending`}
          icon={<AlertTriangle className="size-4" />}
        />
      </div>

      {/* Monthly Target Progress Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="size-4 text-primary" />
                Sales Target Attainment ({monthsInRange} month
                {monthsInRange > 1 ? "s" : ""} in range)
              </CardTitle>
              <CardDescription>
                Monthly target ({formatCurrency(monthlySalesTargetUsd)}/mo) ×{" "}
                {monthsInRange} = {formatCurrency(periodTargetUsd)} vs{" "}
                {formatCurrency(totalRevenueUsd)} actual USD revenue
              </CardDescription>
            </div>
            <Badge variant="outline" className="w-fit text-sm font-semibold tabular-nums">
              {targetPercent}% Achieved
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ProgressBar
            value={targetPercent}
            label={`${formatCurrency(totalRevenueUsd, "USD", true)} / ${formatCurrency(
              periodTargetUsd,
              "USD",
              true
            )}`}
            color={targetPercent >= 75 ? "emerald" : "blue"}
          />
          <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2 lg:grid-cols-5">
            {MOCK_BRANDS.map((brand) => {
              const actual = MOCK_TRANSACTIONS.filter(
                (t) =>
                  t.brandId === brand.id &&
                  t.createdAt >= fromIso &&
                  t.createdAt <= toIso &&
                  t.status === "Success"
              ).reduce((acc, t) => acc + t.amountUsd, 0)
              const brandTarget = brand.monthlyRevenueUsd * monthsInRange
              const pct = Math.min(
                100,
                Math.round((actual / Math.max(1, brandTarget)) * 100)
              )
              return (
                <div
                  key={brand.id}
                  className="rounded-lg border border-border bg-muted/20 p-2.5"
                >
                  <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
                    <span className="truncate font-medium text-foreground">
                      {brand.name}
                    </span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {pct}%
                    </span>
                  </div>
                  <ProgressBar value={pct} color="blue" />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Primary Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-8">
          <CardHeader>
            <CardTitle>Revenue Over Time by Brand (USD)</CardTitle>
            <CardDescription>
              Settled & processing transaction volume converted to USD
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AreaChart
              data={revenueAreaData}
              index="month"
              categories={visibleBrands.map((b) => b.name)}
              colors={["blue", "emerald", "violet", "amber", "cyan"]}
              valueFormatter={(v) => formatCurrency(v, "USD", true)}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Leads by Source</CardTitle>
            <CardDescription>
              Channel distribution for {filteredLeads.length} leads in range
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart
              data={leadsBySourceData}
              category="count"
              index="source"
              colors={["blue", "emerald", "violet", "amber", "cyan", "rose", "slate"]}
              valueFormatter={(v) => `${v}`}
              label={`${filteredLeads.length}`}
            />
          </CardContent>
        </Card>
      </div>

      {/* Marketing Spend vs Revenue BarChart */}
      <Card>
        <CardHeader>
          <CardTitle>Marketing Spend vs Attributed Revenue by Brand</CardTitle>
          <CardDescription>
            14-day paid & organic acquisition efficiency across agency brands
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BarChart
            data={spendVsRevenueData}
            index="brand"
            categories={["Ad Spend", "Attributed Revenue"]}
            colors={["amber", "emerald"]}
            valueFormatter={(v) => formatCurrency(v, "USD", true)}
          />
        </CardContent>
      </Card>

      {/* Bottom Operational Lists */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Recent transactions mini table */}
        <Card className="lg:col-span-7">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                Latest multi-gateway payments and settlements
              </CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-1">
              <Link href="/transactions">
                View All
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ref</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Gateway</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-8 text-center text-sm text-muted-foreground"
                      >
                        No transactions match the selected brand and date range.
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentTransactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-mono text-xs font-medium">
                          {tx.txRef}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-foreground">
                            {tx.clientName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {tx.brandName}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {tx.gateway}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          <div className="font-medium">
                            {formatCurrency(tx.amount, tx.currency)}
                          </div>
                          {tx.currency !== "USD" ? (
                            <div className="text-[11px] text-muted-foreground">
                              ≈ {formatCurrency(tx.amountUsd, "USD")}
                            </div>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={tx.status} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Tasks due soon */}
        <Card className="lg:col-span-5">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Tasks Due Soon</CardTitle>
              <CardDescription>
                Upcoming deliverables requiring attention
              </CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-1">
              <Link href="/tasks">
                Board
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasksDueSoon.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No upcoming tasks due for this brand selection.
              </p>
            ) : (
              tasksDueSoon.map((task) => {
                const assignees = MOCK_USERS.filter((u) =>
                  task.assigneeIds.includes(u.id)
                )
                return (
                  <Link
                    key={task.id}
                    href="/tasks"
                    className="flex items-start justify-between gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-[11px] font-semibold text-primary">
                          {task.code}
                        </span>
                        <StatusBadge status={task.priority} showDot={false} />
                        <StatusBadge status={task.status} />
                      </div>
                      <p className="truncate text-sm font-medium text-foreground">
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="min-w-0 truncate">
                          {task.projectName}
                        </span>
                        <span className="shrink-0 whitespace-nowrap font-medium text-foreground/80">
                          • Due {task.dueDate}
                        </span>
                      </div>
                    </div>
                    <AvatarGroup people={assignees} max={2} />
                  </Link>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
