"use client"

import * as React from "react"
import Link from "next/link"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Building2,
  CalendarIcon,
  CheckCircle2,
  Circle,
  CreditCard,
  DollarSign,
  FolderKanban,
  PartyPopper,
  Sparkles,
  Target,
  UserCheck,
  UserPlus,
  Users,
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
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency } from "@/lib/currency"
import { useStore } from "@/lib/store"

const REFERENCE_DATE_ISO = "2026-11-11"

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

function subscribeStorage(callback: () => void) {
  window.addEventListener("storage", callback)
  return () => window.removeEventListener("storage", callback)
}

function getDismissedSnapshot(): boolean {
  try {
    return localStorage.getItem("agencyops:getting-started:dismissed") === "true"
  } catch {
    return false
  }
}

function getDismissedServerSnapshot(): boolean {
  return true
}

export function DashboardClient() {
  const { celebrationDismissed, dismissCelebration } = useAppState()
  const {
    brands,
    transactions,
    leads,
    marketingSpendings,
    projects,
    tasks,
    users,
    teams,
    cities,
    invoices,
    isLoaded,
  } = useStore()

  const [brandFilter, setBrandFilter] = React.useState<string>("all")
  const [presetId, setPresetId] = React.useState<string>("6m")
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: parseIsoDate("2026-05-15"),
    to: parseIsoDate("2026-11-11"),
  })

  // Dismissible Getting Started Checklist
  const isDismissedStored = React.useSyncExternalStore(
    subscribeStorage,
    getDismissedSnapshot,
    getDismissedServerSnapshot
  )
  const [overrideDismissed, setOverrideDismissed] = React.useState<boolean | null>(null)
  const checklistDismissed = overrideDismissed !== null ? overrideDismissed : isDismissedStored

  function handleDismissChecklist() {
    setOverrideDismissed(true)
    try {
      localStorage.setItem("agencyops:getting-started:dismissed", "true")
    } catch {
      // ignore
    }
  }

  function handleReopenChecklist() {
    setOverrideDismissed(false)
    try {
      localStorage.removeItem("agencyops:getting-started:dismissed")
    } catch {
      // ignore
    }
  }

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
      transactions.filter((t) => {
        const matchBrand = brandFilter === "all" || t.brandId === brandFilter
        const matchDate = t.createdAt >= fromIso && t.createdAt <= toIso
        return matchBrand && matchDate
      }),
    [transactions, brandFilter, fromIso, toIso]
  )

  const filteredLeads = React.useMemo(
    () =>
      leads.filter((l) => {
        const matchBrand = brandFilter === "all" || l.brandId === brandFilter
        const matchDate = l.createdAt >= fromIso && l.createdAt <= toIso
        return matchBrand && matchDate
      }),
    [leads, brandFilter, fromIso, toIso]
  )

  const filteredProjects = React.useMemo(
    () =>
      projects.filter(
        (p) => brandFilter === "all" || p.brandId === brandFilter
      ),
    [projects, brandFilter]
  )

  const filteredTasks = React.useMemo(
    () =>
      tasks.filter(
        (t) => brandFilter === "all" || t.brandId === brandFilter
      ),
    [tasks, brandFilter]
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

  // Monthly target calculation
  const monthlySalesTargetUsd = React.useMemo(() => {
    const base = users.reduce((sum, u) => sum + (u.monthlyTargetUsd || 0), 0)
    if (brandFilter === "all" || brands.length === 0) return base
    const brandShare = 1 / brands.length
    return Math.round(base * brandShare)
  }, [users, brands, brandFilter])

  const periodTargetUsd = monthlySalesTargetUsd * monthsInRange
  const targetPercent =
    periodTargetUsd > 0
      ? Math.min(100, Math.round((totalRevenueUsd / periodTargetUsd) * 100))
      : 0

  // Revenue over time by month x brand
  const visibleBrands = React.useMemo(
    () =>
      brandFilter === "all"
        ? brands
        : brands.filter((b) => b.id === brandFilter),
    [brands, brandFilter]
  )

  const revenueAreaData = React.useMemo(() => {
    if (visibleBrands.length === 0) return []
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
        const sum = transactions
          .filter(
            (t) =>
              t.brandId === brand.id &&
              t.createdAt.startsWith(mk) &&
              (t.status === "Success" || t.status === "Processing")
          )
          .reduce((acc, t) => acc + t.amountUsd, 0)
        row[brand.name] = sum
      }
      return row
    })
  }, [visibleBrands, transactions])

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
        const spend = marketingSpendings
          .filter((m) => m.brandId === b.id)
          .reduce((acc, m) => acc + m.spendUsd, 0)
        const rev = marketingSpendings
          .filter((m) => m.brandId === b.id)
          .reduce((acc, m) => acc + m.revenueAttributedUsd, 0)
        return {
          brand: b.name.replace(" Studio", "").replace(" Digital", ""),
          "Ad Spend": spend,
          "Attributed Revenue": rev,
        }
      }),
    [visibleBrands, marketingSpendings]
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

  // Checklist items
  const checklist = React.useMemo(() => {
    const hasBrand = brands.length > 0
    const hasTeamOrCity = teams.length > 0 || cities.length > 0
    const hasStaff = users.filter((u) => u.id !== "usr-admin").length > 0
    const hasLead = leads.length > 0
    const hasInvoice = invoices.length > 0
    const hasProject = projects.length > 0

    return [
      {
        id: "brand",
        title: "Create your first agency brand",
        description: "Set up brand storefronts and currency parameters.",
        completed: hasBrand,
        href: "/brands",
        icon: Building2,
      },
      {
        id: "team",
        title: "Add a regional team or office city",
        description: "Configure studio hubs and department pods.",
        completed: hasTeamOrCity,
        href: "/teams",
        icon: Users,
      },
      {
        id: "staff",
        title: "Invite your team staff members",
        description: "Add designers, sales reps, and PMs to roles.",
        completed: hasStaff,
        href: "/users",
        icon: UserCheck,
      },
      {
        id: "lead",
        title: "Capture or import incoming leads",
        description: "Track prospect pipeline across marketing sources.",
        completed: hasLead,
        href: "/leads",
        icon: UserPlus,
      },
      {
        id: "invoice",
        title: "Issue a client invoice",
        description: "Generate multi-gateway hosted payment links.",
        completed: hasInvoice,
        href: "/invoices",
        icon: CreditCard,
      },
      {
        id: "project",
        title: "Kick off a client delivery project",
        description: "Assign deliverables, tasks, and QA reviewers.",
        completed: hasProject,
        href: "/projects",
        icon: Briefcase,
      },
    ]
  }, [brands, teams, cities, users, leads, invoices, projects])

  const completedChecklistCount = checklist.filter((item) => item.completed).length
  const isAllChecklistDone = completedChecklistCount === checklist.length
  const checklistProgressPercent = Math.round((completedChecklistCount / checklist.length) * 100)

  function applyPreset(id: string) {
    const preset = PRESETS.find((p) => p.id === id)
    if (!preset) return
    setPresetId(id)
    setDateRange({
      from: parseIsoDate(preset.from),
      to: parseIsoDate(preset.to),
    })
  }

  if (!isLoaded) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-14 w-full" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
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
                <SelectItem value="all">
                  All Brands ({brands.length})
                </SelectItem>
                {brands.map((brand) => (
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

      {/* Getting Started Onboarding Checklist Card */}
      {!checklistDismissed && !isAllChecklistDone ? (
        <Card className="border-primary/30 bg-gradient-to-r from-primary/5 via-background to-primary/10">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-xs">
                    Getting Started
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {completedChecklistCount} of {checklist.length} completed ({checklistProgressPercent}%)
                  </span>
                </div>
                <CardTitle className="mt-1 text-base">
                  Welcome to AgencyOps — Operational Setup Checklist
                </CardTitle>
                <CardDescription>
                  Complete these recommended initial steps to unlock your live agency pipeline.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleDismissChecklist}
                  aria-label="Dismiss checklist"
                >
                  <X className="size-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
            <div className="pt-2">
              <ProgressBar value={checklistProgressPercent} color="blue" />
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 pt-1">
            {checklist.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.id}
                  className={`flex flex-col justify-between rounded-lg border p-3 transition-colors ${
                    item.completed
                      ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-950 dark:text-emerald-100"
                      : "border-border bg-card/70 hover:border-primary/50"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Icon className="size-4 text-primary" />
                        <span className="text-xs font-semibold">{item.title}</span>
                      </div>
                      {item.completed ? (
                        <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <Circle className="size-4 text-muted-foreground shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                  <div className="pt-3">
                    <Button
                      asChild
                      variant={item.completed ? "outline" : "default"}
                      size="xs"
                      className="w-full text-xs"
                    >
                      <Link href={item.href}>
                        {item.completed ? "Manage" : "Complete Step"}
                        <ArrowRight className="ml-1 size-3" />
                      </Link>
                    </Button>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      ) : checklistDismissed && !isAllChecklistDone ? (
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs">
          <span className="text-muted-foreground">
            Onboarding checklist: <strong>{completedChecklistCount}/{checklist.length}</strong> steps completed.
          </span>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={handleReopenChecklist}
            className="text-xs text-primary"
          >
            Show Checklist
          </Button>
        </div>
      ) : null}

      {/* Dismissible celebration banner (only shown if users > 1) */}
      {!celebrationDismissed && users.length > 1 ? (
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
                  Happy Work Anniversary to team staff members! Keep up the great velocity.
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
          {brands.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2 lg:grid-cols-5">
              {brands.map((brand) => {
                const actual = transactions
                  .filter(
                    (t) =>
                      t.brandId === brand.id &&
                      t.createdAt >= fromIso &&
                      t.createdAt <= toIso &&
                      t.status === "Success"
                  )
                  .reduce((acc, t) => acc + t.amountUsd, 0)
                const brandTarget = (brand.monthlyRevenueUsd || 10000) * monthsInRange
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
          ) : (
            <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
              Add brands to track brand-by-brand revenue performance targets.
            </div>
          )}
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
            {visibleBrands.length === 0 || filteredTransactions.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-border p-6 text-center">
                <CreditCard className="size-8 text-muted-foreground/60 mb-2" />
                <h4 className="font-semibold text-sm">No transaction volume recorded</h4>
                <p className="text-xs text-muted-foreground max-w-xs mt-1 mb-3">
                  Invoices and transactions generated for your brands will chart monthly cash flow here.
                </p>
                <Button asChild size="xs" variant="outline">
                  <Link href="/invoices">Go to Invoices</Link>
                </Button>
              </div>
            ) : (
              <AreaChart
                data={revenueAreaData}
                index="month"
                categories={visibleBrands.map((b) => b.name)}
                colors={["blue", "emerald", "violet", "amber", "cyan"]}
                valueFormatter={(v) => formatCurrency(v, "USD", true)}
              />
            )}
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
            {leadsBySourceData.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-border p-6 text-center">
                <UserPlus className="size-8 text-muted-foreground/60 mb-2" />
                <h4 className="font-semibold text-sm">No lead acquisitions</h4>
                <p className="text-xs text-muted-foreground max-w-xs mt-1 mb-3">
                  Capture inbound leads to view marketing acquisition source breakdown.
                </p>
                <Button asChild size="xs" variant="outline">
                  <Link href="/leads">Add First Lead</Link>
                </Button>
              </div>
            ) : (
              <DonutChart
                data={leadsBySourceData}
                category="count"
                index="source"
                colors={["blue", "emerald", "violet", "amber", "cyan", "rose", "slate"]}
                valueFormatter={(v) => `${v}`}
                label={`${filteredLeads.length}`}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Marketing Spend vs Revenue BarChart */}
      <Card>
        <CardHeader>
          <CardTitle>Marketing Spend vs Attributed Revenue by Brand</CardTitle>
          <CardDescription>
            Paid & organic acquisition efficiency across agency brands
          </CardDescription>
        </CardHeader>
        <CardContent>
          {visibleBrands.length === 0 || marketingSpendings.length === 0 ? (
            <div className="flex h-52 flex-col items-center justify-center rounded-lg border border-dashed border-border p-6 text-center">
              <Sparkles className="size-8 text-muted-foreground/60 mb-2" />
              <h4 className="font-semibold text-sm">No marketing spend records</h4>
              <p className="text-xs text-muted-foreground max-w-xs mt-1 mb-3">
                Log ad budgets and ROAS across platforms to analyze channel profitability.
              </p>
              <Button asChild size="xs" variant="outline">
                <Link href="/marketing-spendings">Log Marketing Spend</Link>
              </Button>
            </div>
          ) : (
            <BarChart
              data={spendVsRevenueData}
              index="brand"
              categories={["Ad Spend", "Attributed Revenue"]}
              colors={["amber", "emerald"]}
              valueFormatter={(v) => formatCurrency(v, "USD", true)}
            />
          )}
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
                        No transactions recorded for this brand and date selection.
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
                const assignees = users.filter((u) =>
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
