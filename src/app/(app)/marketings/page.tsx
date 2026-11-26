"use client"

import * as React from "react"
import { format, isWithinInterval, parseISO, startOfMonth, subDays } from "date-fns"
import type { DateRange } from "react-day-picker"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts"
import { toast } from "sonner"
import {
  ArrowUpDown,
  BarChart3,
  Calculator,
  CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Download,
  Filter,
  Pencil,
  PieChart,
  Plus,
  Receipt,
  RotateCcw,
  ShieldCheck,
  Store,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react"
import marketingRealData from "@/demo-data/marketing-real-data.json"
import { ConfirmDeleteDialog, PageHeader } from "@/components/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "cn"

type SourceKey = "bing" | "google" | "website" | "socialMedia" | "bark"
type SectionFilter = "all" | "spend_roi" | "sales"

interface SourceAmounts {
  bing: number
  google: number
  website: number
  socialMedia: number
  bark: number
}

interface MarketingRow {
  id: string
  date: string
  brandId: string
  brandName: string
  brandShortName: string
  budget: number
  spending: Omit<SourceAmounts, "website">
  frontSales: SourceAmounts
  upsell: SourceAmounts
  chargeback: number
  chargebackWon: number
}

interface MarketingTransaction {
  id: string
  date: string
  brandId: string
  brandShortName: string
  clientName: string
  source: "Bing" | "Google" | "Website" | "Social Media" | "Bark"
  saleType: "Front Sale" | "Upsell" | "Chargeback" | "Chargeback Won"
  status: "Success" | "Disputed" | "Refunded"
  amount: number
}

const INITIAL_BRANDS: Array<{ id: string; name: string; shortName: string }> =
  marketingRealData.brands

const INITIAL_ROWS: MarketingRow[] =
  marketingRealData.rows as MarketingRow[]

const INITIAL_TRANSACTIONS: MarketingTransaction[] =
  marketingRealData.transactions as MarketingTransaction[]

const SPENDING_SOURCES: Array<{ key: Exclude<SourceKey, "website">; label: string }> = [
  { key: "bing", label: "Bing" },
  { key: "google", label: "Google" },
  { key: "socialMedia", label: "Social" },
  { key: "bark", label: "Bark" },
]

const SALES_SOURCES: Array<{ key: SourceKey; label: string }> = [
  { key: "bing", label: "Bing" },
  { key: "google", label: "Google" },
  { key: "website", label: "Website" },
  { key: "socialMedia", label: "Social" },
  { key: "bark", label: "Bark" },
]

function fmtMoney(val: number): string {
  if (!val || val === 0) return "--"
  return `$${val.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function fmtUsd(val: number): string {
  return `$${val.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function calcRoi(sales: number, spend: number): { text: string; positive: boolean } {
  if (!sales || spend <= 0) return { text: "--", positive: true }
  const pct = ((sales - spend) / spend) * 100
  return {
    text: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`,
    positive: pct >= 0,
  }
}

function sumSpending(s: MarketingRow["spending"]): number {
  return s.bing + s.google + s.socialMedia + s.bark
}

function sumSales(s: SourceAmounts): number {
  return s.bing + s.google + s.website + s.socialMedia + s.bark
}

function RoiPill({ sales, spend }: { sales: number; spend: number }) {
  const roi = calcRoi(sales, spend)
  if (roi.text === "--") return <span className="text-muted-foreground">--</span>
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-1.5 py-0.5 font-mono text-[10px] font-semibold",
        roi.positive
          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
          : "bg-rose-500/15 text-rose-700 dark:text-rose-300"
      )}
    >
      {roi.text}
    </span>
  )
}

export default function MarketingsPage() {
  const [rows, setRows] = React.useState<MarketingRow[]>(INITIAL_ROWS)
  const [selectedTab, setSelectedTab] = React.useState("all")

  // Filter popover
  const [filterOpen, setFilterOpen] = React.useState(false)
  const [draftRange, setDraftRange] = React.useState<DateRange | undefined>()
  const [appliedRange, setAppliedRange] = React.useState<DateRange | undefined>()

  // Chart & Table view controls
  const [chartMode, setChartMode] = React.useState<"daily" | "channel">("daily")
  const [sectionFilter, setSectionFilter] = React.useState<SectionFilter>("all")
  const [drilldown, setDrilldown] = React.useState<{
    brandId: string
    brandShortName: string
    date: string
  } | null>(null)

  // Add/Edit spending dialog
  const [formOpen, setFormOpen] = React.useState(false)
  const [editingRow, setEditingRow] = React.useState<MarketingRow | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<MarketingRow | null>(null)
  const [newBrandId, setNewBrandId] = React.useState(INITIAL_BRANDS[0].id)
  const [newDate, setNewDate] = React.useState("2026-11-25")
  const [newBudget, setNewBudget] = React.useState("1000")
  const [newGoogle, setNewGoogle] = React.useState("400")
  const [newBing, setNewBing] = React.useState("200")
  const [newSocial, setNewSocial] = React.useState("180")
  const [newBark, setNewBark] = React.useState("90")

  // Transaction ledger filters, sort, pagination
  const [txnSearch, setTxnSearch] = React.useState("")
  const [txnSourceFilter, setTxnSourceFilter] = React.useState("all")
  const [txnTypeFilter, setTxnTypeFilter] = React.useState("all")
  const [txnSort, setTxnSort] = React.useState<"date_desc" | "date_asc" | "amount_desc" | "amount_asc">("date_desc")
  const [txnPage, setTxnPage] = React.useState(1)
  const [txnPageSize, setTxnPageSize] = React.useState(10)

  const filteredRows = React.useMemo(() => {
    if (!appliedRange?.from) return rows
    const from = appliedRange.from
    const to = appliedRange.to ?? appliedRange.from
    return rows.filter((r) =>
      isWithinInterval(parseISO(r.date), { start: from, end: to })
    )
  }, [rows, appliedRange])

  const activeRows = React.useMemo(() => {
    if (selectedTab === "all") return filteredRows
    return filteredRows.filter((r) => r.brandId === selectedTab)
  }, [filteredRows, selectedTab])

  const stats = React.useMemo(() => {
    const totalSpendings = activeRows.reduce((s, r) => s + sumSpending(r.spending), 0)
    const totalFrontSales = activeRows.reduce((s, r) => s + sumSales(r.frontSales), 0)
    const totalGrossSales = activeRows.reduce(
      (s, r) => s + sumSales(r.frontSales) + sumSales(r.upsell),
      0
    )
    const chargeback = activeRows.reduce((s, r) => s + r.chargeback, 0)
    const chargebackWon = activeRows.reduce((s, r) => s + r.chargebackWon, 0)
    const netSale = totalGrossSales + chargebackWon - chargeback
    const totalFrontRoi =
      totalSpendings > 0
        ? ((totalFrontSales - totalSpendings) / totalSpendings) * 100
        : 0
    const totalRoi =
      totalSpendings > 0
        ? ((netSale - totalSpendings) / totalSpendings) * 100
        : 0
    const recoveryRate = chargeback > 0 ? (chargebackWon / chargeback) * 100 : 0

    return {
      totalSpendings,
      totalFrontSales,
      totalGrossSales,
      chargeback,
      chargebackWon,
      netSale,
      totalFrontRoi,
      totalRoi,
      recoveryRate,
    }
  }, [activeRows])

  const dailyChartData = React.useMemo(() => {
    const byDate = new Map<string, { label: string; spend: number; sales: number }>()
    for (const r of activeRows) {
      const label = format(parseISO(r.date), "dd MMM")
      const cur = byDate.get(r.date) ?? { label, spend: 0, sales: 0 }
      cur.spend += sumSpending(r.spending)
      cur.sales += sumSales(r.frontSales) + sumSales(r.upsell)
      byDate.set(r.date, cur)
    }
    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v)
  }, [activeRows])

  const channelChartData = React.useMemo(() => {
    return SALES_SOURCES.map((src) => {
      const spend =
        src.key === "website"
          ? 0
          : activeRows.reduce((s, r) => s + r.spending[src.key as Exclude<SourceKey, "website">], 0)
      const sales = activeRows.reduce(
        (s, r) => s + r.frontSales[src.key] + r.upsell[src.key],
        0
      )
      return { label: src.label, spend, sales }
    })
  }, [activeRows])

  const activeTransactions = React.useMemo(() => {
    const q = txnSearch.trim().toLowerCase()
    const list = INITIAL_TRANSACTIONS.filter((t) => {
      if (selectedTab !== "all" && t.brandId !== selectedTab) return false
      if (drilldown && (t.brandId !== drilldown.brandId || t.date !== drilldown.date)) {
        return false
      }
      if (appliedRange?.from) {
        const d = parseISO(t.date)
        const to = appliedRange.to ?? appliedRange.from
        if (!isWithinInterval(d, { start: appliedRange.from, end: to })) return false
      }
      if (txnSourceFilter !== "all" && t.source !== txnSourceFilter) return false
      if (txnTypeFilter !== "all" && t.saleType !== txnTypeFilter) return false
      if (
        q &&
        !t.id.toLowerCase().includes(q) &&
        !t.clientName.toLowerCase().includes(q) &&
        !t.brandShortName.toLowerCase().includes(q)
      ) {
        return false
      }
      return true
    })

    return [...list].sort((a, b) => {
      if (txnSort === "date_asc") return a.date.localeCompare(b.date)
      if (txnSort === "date_desc") return b.date.localeCompare(a.date)
      if (txnSort === "amount_asc") return a.amount - b.amount
      return b.amount - a.amount
    })
  }, [selectedTab, drilldown, appliedRange, txnSourceFilter, txnTypeFilter, txnSearch, txnSort])

  const totalTxnPages = Math.max(1, Math.ceil(activeTransactions.length / txnPageSize))
  const safeTxnPage = Math.min(txnPage, totalTxnPages)
  const pagedTransactions = React.useMemo(() => {
    const start = (safeTxnPage - 1) * txnPageSize
    return activeTransactions.slice(start, start + txnPageSize)
  }, [activeTransactions, safeTxnPage, txnPageSize])

  function openAddModal() {
    setEditingRow(null)
    setNewBrandId(INITIAL_BRANDS[0].id)
    setNewDate("2026-11-25")
    setNewBudget("1000")
    setNewGoogle("400")
    setNewBing("200")
    setNewSocial("180")
    setNewBark("90")
    setFormOpen(true)
  }

  function openEditModal(row: MarketingRow) {
    setEditingRow(row)
    setNewBrandId(row.brandId)
    setNewDate(row.date)
    setNewBudget(String(row.budget))
    setNewGoogle(String(row.spending.google))
    setNewBing(String(row.spending.bing))
    setNewSocial(String(row.spending.socialMedia))
    setNewBark(String(row.spending.bark))
    setFormOpen(true)
  }

  function handleSaveSpending(e: React.FormEvent) {
    e.preventDefault()
    const brand =
      INITIAL_BRANDS.find((b) => b.id === newBrandId) ?? INITIAL_BRANDS[0]
    const spending = {
      google: Number(newGoogle) || 0,
      bing: Number(newBing) || 0,
      socialMedia: Number(newSocial) || 0,
      bark: Number(newBark) || 0,
    }

    if (editingRow) {
      setRows((prev) =>
        prev.map((r) =>
          r.id === editingRow.id
            ? {
                ...r,
                date: newDate,
                brandId: brand.id,
                brandName: brand.name,
                brandShortName: brand.shortName,
                budget: Number(newBudget) || 0,
                spending,
              }
            : r
        )
      )
      toast.success(`Updated spending for ${brand.shortName}`)
    } else {
      const created: MarketingRow = {
        id: `mkt-${crypto.randomUUID().slice(0, 8)}`,
        date: newDate,
        brandId: brand.id,
        brandName: brand.name,
        brandShortName: brand.shortName,
        budget: Number(newBudget) || 0,
        spending,
        frontSales: { bing: 0, google: 0, website: 0, socialMedia: 0, bark: 0 },
        upsell: { bing: 0, google: 0, website: 0, socialMedia: 0, bark: 0 },
        chargeback: 0,
        chargebackWon: 0,
      }
      setRows((prev) => [created, ...prev])
      toast.success(`Added spending for ${brand.shortName}`)
    }
    setFormOpen(false)
    setEditingRow(null)
  }

  function handleExportCsv() {
    const header = "Date,Brand,Budget,Total Spending,Front Sales,Upsell,Total Sales"
    const lines = activeRows.map((r) => {
      const sp = sumSpending(r.spending)
      const fs = sumSales(r.frontSales)
      const up = sumSales(r.upsell)
      return [r.date, r.brandShortName, r.budget, sp, fs, up, fs + up].join(",")
    })
    const blob = new Blob([[header, ...lines].join("\n")], {
      type: "text/csv;charset=utf-8;",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `marketings-analytics-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Exported analytics CSV")
  }

  const showSpending = sectionFilter === "all" || sectionFilter === "spend_roi"
  const showFront = sectionFilter === "all" || sectionFilter === "sales"
  const showUpsell = sectionFilter === "all" || sectionFilter === "sales"
  const showTotalSales = sectionFilter === "all" || sectionFilter === "sales"
  const showFrontRoi = sectionFilter === "all" || sectionFilter === "spend_roi"
  const showTotalRoi = sectionFilter === "all" || sectionFilter === "spend_roi"

  return (
    <div className="space-y-5">
      <PageHeader
        title="Marketings Analytics"
        description="Channel-level spending, front sales, upsells, chargebacks, and ROI performance."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Popover open={filterOpen} onOpenChange={setFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Filter className="size-3.5" />
                  <span>
                    {appliedRange?.from
                      ? `${format(appliedRange.from, "MMM d")}${appliedRange.to ? ` – ${format(appliedRange.to, "MMM d")}` : ""}`
                      : "Filter Options"}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-[22rem] max-w-[92vw] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Filter Marketings</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      setDraftRange(undefined)
                      setAppliedRange(undefined)
                      setFilterOpen(false)
                      toast.success("Filters reset")
                    }}
                    className="gap-1 text-muted-foreground"
                  >
                    <RotateCcw className="size-3" />
                    Reset All
                  </Button>
                </div>
                <div className="mb-2.5 flex flex-wrap gap-1.5">
                  <Button
                    type="button"
                    variant="secondary"
                    size="xs"
                    onClick={() => {
                      const today = new Date()
                      setDraftRange({ from: today, to: today })
                    }}
                  >
                    Today
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="xs"
                    onClick={() =>
                      setDraftRange({
                        from: subDays(new Date(), 7),
                        to: new Date(),
                      })
                    }
                  >
                    Last 7 Days
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="xs"
                    onClick={() =>
                      setDraftRange({
                        from: startOfMonth(new Date()),
                        to: new Date(),
                      })
                    }
                  >
                    This Month
                  </Button>
                </div>
                <div className="rounded-md border border-border p-1">
                  <Calendar
                    mode="range"
                    selected={draftRange}
                    onSelect={setDraftRange}
                    disabled={{ after: new Date() }}
                  />
                </div>
                <div className="mt-3 flex justify-end gap-2 border-t border-border pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => setFilterOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="xs"
                    onClick={() => {
                      setAppliedRange(draftRange)
                      setFilterOpen(false)
                    }}
                    className="gap-1"
                  >
                    <Check className="size-3" />
                    Apply Filters
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {appliedRange?.from ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDraftRange(undefined)
                  setAppliedRange(undefined)
                }}
                className="gap-1 text-xs text-muted-foreground"
              >
                <X className="size-3.5" />
                Clear Date
              </Button>
            ) : null}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              className="gap-1.5"
            >
              <Download className="size-3.5" />
              Export CSV
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={openAddModal}
              className="gap-1.5"
            >
              <Plus className="size-3.5" />
              Add Spending
            </Button>
          </div>
        }
      />

      <Tabs
        value={selectedTab}
        onValueChange={(val) => {
          setSelectedTab(val)
          setDrilldown(null)
          setTxnPage(1)
        }}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="all">All Brands</TabsTrigger>
          {INITIAL_BRANDS.map((brand) => {
            if (!filteredRows.some((r) => r.brandId === brand.id)) return null
            return (
              <TabsTrigger key={brand.id} value={brand.id}>
                {brand.shortName}
              </TabsTrigger>
            )
          })}
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-4">
          {/* Tier 1: 4 Executive Hero Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="border-t-2 border-t-emerald-500 shadow-xs">
                  <CardContent className="flex items-center justify-between gap-3 p-4">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        Total Net Sales
                      </p>
                      <p className="text-2xl font-bold tracking-tight tabular-nums">
                        {fmtUsd(stats.netSale)}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        After deductions &amp; recoveries
                      </p>
                    </div>
                    <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <DollarSign className="size-5" />
                    </div>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>Net revenue after refunds and chargebacks</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="border-t-2 border-t-rose-500 shadow-xs">
                  <CardContent className="flex items-center justify-between gap-3 p-4">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        Total Spendings
                      </p>
                      <p className="text-2xl font-bold tracking-tight tabular-nums">
                        {fmtUsd(stats.totalSpendings)}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Across active channels
                      </p>
                    </div>
                    <div className="flex size-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                      <Calculator className="size-5" />
                    </div>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>Total ad spend for this period</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="border-t-2 border-t-indigo-500 shadow-xs">
                  <CardContent className="flex items-center justify-between gap-3 p-4">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        Total ROI
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold tracking-tight tabular-nums">
                          {stats.totalRoi.toFixed(1)}%
                        </p>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[10px]",
                            stats.totalRoi >= 0
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                              : "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                          )}
                        >
                          {stats.totalRoi >= 0 ? "Profitable" : "Loss"}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Overall net return
                      </p>
                    </div>
                    <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                      <BarChart3 className="size-5" />
                    </div>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>Total return on investment across all brands</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="border-t-2 border-t-sky-500 shadow-xs">
                  <CardContent className="flex items-center justify-between gap-3 p-4">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        Total Gross Sales
                      </p>
                      <p className="text-2xl font-bold tracking-tight tabular-nums">
                        {fmtUsd(stats.totalGrossSales)}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Front + Upsell before deductions
                      </p>
                    </div>
                    <div className="flex size-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                      <TrendingUp className="size-5" />
                    </div>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>Total gross revenue before deductions</TooltipContent>
            </Tooltip>
          </div>

          {/* Tier 2: 4 Secondary Metric Cards */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Card className="shadow-2xs">
              <CardContent className="flex items-center justify-between p-3">
                <div>
                  <p className="text-[11px] text-muted-foreground">Total Front Sales</p>
                  <p className="text-sm font-semibold tabular-nums">
                    {fmtUsd(stats.totalFrontSales)}
                  </p>
                </div>
                <Store className="size-4 text-blue-500" />
              </CardContent>
            </Card>
            <Card className="shadow-2xs">
              <CardContent className="flex items-center justify-between p-3">
                <div>
                  <p className="text-[11px] text-muted-foreground">Front ROI</p>
                  <p className="text-sm font-semibold tabular-nums">
                    {stats.totalFrontRoi.toFixed(1)}%
                  </p>
                </div>
                <PieChart className="size-4 text-purple-500" />
              </CardContent>
            </Card>
            <Card className="shadow-2xs">
              <CardContent className="flex items-center justify-between p-3">
                <div>
                  <p className="text-[11px] text-muted-foreground">Chargebacks/Refunds</p>
                  <p className="text-sm font-semibold tabular-nums">
                    {fmtUsd(stats.chargeback)}
                  </p>
                </div>
                <Receipt className="size-4 text-orange-500" />
              </CardContent>
            </Card>
            <Card className="shadow-2xs">
              <CardContent className="flex items-center justify-between p-3">
                <div>
                  <p className="text-[11px] text-muted-foreground">
                    Chargeback Won ({stats.recoveryRate.toFixed(0)}%)
                  </p>
                  <p className="text-sm font-semibold tabular-nums">
                    {fmtUsd(stats.chargebackWon)}
                  </p>
                </div>
                <ShieldCheck className="size-4 text-emerald-500" />
              </CardContent>
            </Card>
          </div>

          {/* Visual Trend & Channel Breakdown Chart */}
          <Card className="shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold">
                Performance Overview
              </CardTitle>
              <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setChartMode("daily")}
                  className={cn(
                    "rounded-md px-2.5 py-1 font-medium transition-colors",
                    chartMode === "daily"
                      ? "bg-background text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Daily Trend
                </button>
                <button
                  type="button"
                  onClick={() => setChartMode("channel")}
                  className={cn(
                    "rounded-md px-2.5 py-1 font-medium transition-colors",
                    chartMode === "channel"
                      ? "bg-background text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Channel Breakdown
                </button>
              </div>
            </CardHeader>
            <CardContent className="h-56 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartMode === "daily" ? dailyChartData : channelChartData}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RechartsTooltip />
                  <Bar
                    dataKey="spend"
                    name="Spending ($)"
                    fill="#f43f5e"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="sales"
                    name="Gross Sales ($)"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Modernized Analytics Table with Section Filter Pills */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5 text-xs">
                {(
                  [
                    { id: "all", label: "All Sections" },
                    { id: "spend_roi", label: "Spend & ROI" },
                    { id: "sales", label: "Sales Breakdown" },
                  ] as const
                ).map((pill) => (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setSectionFilter(pill.id)}
                    className={cn(
                      "rounded-md px-2.5 py-1 font-medium transition-colors",
                      sectionFilter === pill.id
                        ? "bg-background text-foreground shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-muted-foreground">
                Click any row to filter transactions below
              </span>
            </div>

            {activeRows.length === 0 ? (
              <div className="rounded-lg border border-border bg-muted/20 px-6 py-10 text-center text-xs text-muted-foreground">
                No analytics data for the selected filters.
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
                <div className="max-h-[460px] overflow-auto">
                  <table className="min-w-full divide-y divide-border text-xs">
                    <thead className="sticky top-0 z-20 bg-muted/90 text-foreground backdrop-blur-xs">
                      <tr>
                        <th
                          rowSpan={2}
                          className="sticky left-0 z-30 border-r border-border bg-muted/95 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider"
                        >
                          Date
                        </th>
                        <th
                          rowSpan={2}
                          className="sticky left-[92px] z-30 border-r border-border bg-muted/95 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider"
                        >
                          Brand
                        </th>
                        <th
                          rowSpan={2}
                          className="border-r border-border px-2.5 py-2 text-center text-[11px] font-semibold uppercase tracking-wider"
                        >
                          Budget
                        </th>
                        {showSpending ? (
                          <th
                            colSpan={5}
                            className="border-t-2 border-r border-t-rose-500 border-r-border px-2 py-1.5 text-center text-[11px] font-semibold uppercase tracking-wider"
                          >
                            Spending
                          </th>
                        ) : null}
                        {showFront ? (
                          <th
                            colSpan={6}
                            className="border-t-2 border-r border-t-emerald-500 border-r-border px-2 py-1.5 text-center text-[11px] font-semibold uppercase tracking-wider"
                          >
                            Front Sales
                          </th>
                        ) : null}
                        {showUpsell ? (
                          <th
                            colSpan={6}
                            className="border-t-2 border-r border-t-sky-500 border-r-border px-2 py-1.5 text-center text-[11px] font-semibold uppercase tracking-wider"
                          >
                            Upsell
                          </th>
                        ) : null}
                        {showTotalSales ? (
                          <th
                            colSpan={6}
                            className="border-t-2 border-r border-t-violet-500 border-r-border px-2 py-1.5 text-center text-[11px] font-semibold uppercase tracking-wider"
                          >
                            Total Sales
                          </th>
                        ) : null}
                        {showFrontRoi ? (
                          <th
                            colSpan={5}
                            className="border-t-2 border-r border-t-amber-500 border-r-border px-2 py-1.5 text-center text-[11px] font-semibold uppercase tracking-wider"
                          >
                            Front ROI
                          </th>
                        ) : null}
                        {showTotalRoi ? (
                          <th
                            colSpan={5}
                            className="border-t-2 border-r border-t-indigo-500 border-r-border px-2 py-1.5 text-center text-[11px] font-semibold uppercase tracking-wider"
                          >
                            Total ROI
                          </th>
                        ) : null}
                        <th
                          rowSpan={2}
                          className="px-2.5 py-2 text-right text-[11px] font-semibold uppercase tracking-wider"
                        >
                          Actions
                        </th>
                      </tr>
                      <tr className="border-t border-border bg-muted/60 text-[11px] text-muted-foreground">
                        {showSpending ? (
                          <>
                            {SPENDING_SOURCES.map((s) => (
                              <th key={`h-sp-${s.key}`} className="border-r border-border/60 px-2 py-1 text-center">
                                {s.label}
                              </th>
                            ))}
                            <th className="border-r border-border px-2 py-1 text-center font-semibold text-foreground">
                              Total
                            </th>
                          </>
                        ) : null}
                        {showFront ? (
                          <>
                            {SALES_SOURCES.map((s) => (
                              <th key={`h-fs-${s.key}`} className="border-r border-border/60 px-2 py-1 text-center">
                                {s.label}
                              </th>
                            ))}
                            <th className="border-r border-border px-2 py-1 text-center font-semibold text-foreground">
                              Total
                            </th>
                          </>
                        ) : null}
                        {showUpsell ? (
                          <>
                            {SALES_SOURCES.map((s) => (
                              <th key={`h-up-${s.key}`} className="border-r border-border/60 px-2 py-1 text-center">
                                {s.label}
                              </th>
                            ))}
                            <th className="border-r border-border px-2 py-1 text-center font-semibold text-foreground">
                              Total
                            </th>
                          </>
                        ) : null}
                        {showTotalSales ? (
                          <>
                            {SALES_SOURCES.map((s) => (
                              <th key={`h-ts-${s.key}`} className="border-r border-border/60 px-2 py-1 text-center">
                                {s.label}
                              </th>
                            ))}
                            <th className="border-r border-border px-2 py-1 text-center font-semibold text-foreground">
                              Total
                            </th>
                          </>
                        ) : null}
                        {showFrontRoi ? (
                          <>
                            {SPENDING_SOURCES.map((s) => (
                              <th key={`h-fr-${s.key}`} className="border-r border-border/60 px-2 py-1 text-center">
                                {s.label}
                              </th>
                            ))}
                            <th className="border-r border-border px-2 py-1 text-center font-semibold text-foreground">
                              Total
                            </th>
                          </>
                        ) : null}
                        {showTotalRoi ? (
                          <>
                            {SPENDING_SOURCES.map((s) => (
                              <th key={`h-tr-${s.key}`} className="border-r border-border/60 px-2 py-1 text-center">
                                {s.label}
                              </th>
                            ))}
                            <th className="border-r border-border px-2 py-1 text-center font-semibold text-foreground">
                              Total
                            </th>
                          </>
                        ) : null}
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-border">
                      {activeRows.map((row, idx) => {
                        const spTotal = sumSpending(row.spending)
                        const fsTotal = sumSales(row.frontSales)
                        const upTotal = sumSales(row.upsell)
                        const totSales = fsTotal + upTotal
                        const isSelected =
                          drilldown?.brandId === row.brandId &&
                          drilldown?.date === row.date

                        const nextRow = activeRows[idx + 1]
                        const isEndOfDate =
                          selectedTab === "all" &&
                          (!nextRow || nextRow.date !== row.date)
                        const groupRows = isEndOfDate
                          ? activeRows.filter((r) => r.date === row.date)
                          : []

                        return (
                          <React.Fragment key={row.id}>
                            <tr
                              onClick={() => {
                                setDrilldown({
                                  brandId: row.brandId,
                                  brandShortName: row.brandShortName,
                                  date: row.date,
                                })
                                setTxnPage(1)
                              }}
                              className={cn(
                                "cursor-pointer transition-colors hover:bg-muted/40",
                                isSelected && "bg-primary/5"
                              )}
                            >
                              <td className="sticky left-0 z-10 border-r border-border bg-card px-3 py-2 font-mono text-[11px] whitespace-nowrap">
                                {format(parseISO(row.date), "dd MMM yyyy")}
                              </td>
                              <td className="sticky left-[92px] z-10 border-r border-border bg-card px-3 py-2 font-semibold whitespace-nowrap">
                                {row.brandShortName}
                              </td>
                              <td className="border-r border-border px-2.5 py-2 text-center tabular-nums">
                                {fmtMoney(row.budget)}
                              </td>

                              {showSpending ? (
                                <>
                                  {SPENDING_SOURCES.map((s) => (
                                    <td key={`sp-${s.key}`} className="border-r border-border/50 px-2 py-2 text-center tabular-nums">
                                      {fmtMoney(row.spending[s.key])}
                                    </td>
                                  ))}
                                  <td className="border-r border-border bg-rose-500/5 px-2 py-2 text-center font-semibold tabular-nums">
                                    {fmtMoney(spTotal)}
                                  </td>
                                </>
                              ) : null}

                              {showFront ? (
                                <>
                                  {SALES_SOURCES.map((s) => (
                                    <td key={`fs-${s.key}`} className="border-r border-border/50 px-2 py-2 text-center tabular-nums">
                                      {fmtMoney(row.frontSales[s.key])}
                                    </td>
                                  ))}
                                  <td className="border-r border-border bg-emerald-500/5 px-2 py-2 text-center font-semibold tabular-nums">
                                    {fmtMoney(fsTotal)}
                                  </td>
                                </>
                              ) : null}

                              {showUpsell ? (
                                <>
                                  {SALES_SOURCES.map((s) => (
                                    <td key={`up-${s.key}`} className="border-r border-border/50 px-2 py-2 text-center tabular-nums">
                                      {fmtMoney(row.upsell[s.key])}
                                    </td>
                                  ))}
                                  <td className="border-r border-border bg-sky-500/5 px-2 py-2 text-center font-semibold tabular-nums">
                                    {fmtMoney(upTotal)}
                                  </td>
                                </>
                              ) : null}

                              {showTotalSales ? (
                                <>
                                  {SALES_SOURCES.map((s) => (
                                    <td key={`ts-${s.key}`} className="border-r border-border/50 px-2 py-2 text-center tabular-nums">
                                      {fmtMoney(row.frontSales[s.key] + row.upsell[s.key])}
                                    </td>
                                  ))}
                                  <td className="border-r border-border bg-violet-500/5 px-2 py-2 text-center font-semibold tabular-nums">
                                    {fmtMoney(totSales)}
                                  </td>
                                </>
                              ) : null}

                              {showFrontRoi ? (
                                <>
                                  {SPENDING_SOURCES.map((s) => (
                                    <td key={`fr-${s.key}`} className="border-r border-border/50 px-2 py-2 text-center">
                                      <RoiPill sales={row.frontSales[s.key]} spend={row.spending[s.key]} />
                                    </td>
                                  ))}
                                  <td className="border-r border-border bg-amber-500/5 px-2 py-2 text-center">
                                    <RoiPill sales={fsTotal} spend={spTotal} />
                                  </td>
                                </>
                              ) : null}

                              {showTotalRoi ? (
                                <>
                                  {SPENDING_SOURCES.map((s) => (
                                    <td key={`tr-${s.key}`} className="border-r border-border/50 px-2 py-2 text-center">
                                      <RoiPill
                                        sales={row.frontSales[s.key] + row.upsell[s.key]}
                                        spend={row.spending[s.key]}
                                      />
                                    </td>
                                  ))}
                                  <td className="border-r border-border bg-indigo-500/5 px-2 py-2 text-center">
                                    <RoiPill sales={totSales} spend={spTotal} />
                                  </td>
                                </>
                              ) : null}

                              <td
                                className="px-2.5 py-2 text-right whitespace-nowrap"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="inline-flex items-center gap-1">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={() => openEditModal(row)}
                                    aria-label="Edit spending"
                                  >
                                    <Pencil className="size-3.5" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={() => setDeleteTarget(row)}
                                    aria-label="Delete spending"
                                    className="text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash2 className="size-3.5" />
                                  </Button>
                                </div>
                              </td>
                            </tr>

                            {/* Subtle Daily Subtotal Row */}
                            {isEndOfDate && groupRows.length > 1 ? (
                              (() => {
                                const subBudget = groupRows.reduce((s, r) => s + r.budget, 0)
                                const subSp = {
                                  bing: groupRows.reduce((s, r) => s + r.spending.bing, 0),
                                  google: groupRows.reduce((s, r) => s + r.spending.google, 0),
                                  socialMedia: groupRows.reduce((s, r) => s + r.spending.socialMedia, 0),
                                  bark: groupRows.reduce((s, r) => s + r.spending.bark, 0),
                                }
                                const subSpTotal = sumSpending(subSp)
                                const subFs: SourceAmounts = {
                                  bing: groupRows.reduce((s, r) => s + r.frontSales.bing, 0),
                                  google: groupRows.reduce((s, r) => s + r.frontSales.google, 0),
                                  website: groupRows.reduce((s, r) => s + r.frontSales.website, 0),
                                  socialMedia: groupRows.reduce((s, r) => s + r.frontSales.socialMedia, 0),
                                  bark: groupRows.reduce((s, r) => s + r.frontSales.bark, 0),
                                }
                                const subFsTotal = sumSales(subFs)
                                const subUp: SourceAmounts = {
                                  bing: groupRows.reduce((s, r) => s + r.upsell.bing, 0),
                                  google: groupRows.reduce((s, r) => s + r.upsell.google, 0),
                                  website: groupRows.reduce((s, r) => s + r.upsell.website, 0),
                                  socialMedia: groupRows.reduce((s, r) => s + r.upsell.socialMedia, 0),
                                  bark: groupRows.reduce((s, r) => s + r.upsell.bark, 0),
                                }
                                const subUpTotal = sumSales(subUp)
                                const subTotSales = subFsTotal + subUpTotal

                                return (
                                  <tr className="border-t-2 border-border bg-muted/60 font-semibold">
                                    <td
                                      colSpan={2}
                                      className="sticky left-0 z-10 border-r border-border bg-muted/80 px-3 py-2 text-xs whitespace-nowrap"
                                    >
                                      Subtotal · {format(parseISO(row.date), "dd MMM yyyy")}
                                    </td>
                                    <td className="border-r border-border px-2.5 py-2 text-center tabular-nums">
                                      {fmtMoney(subBudget)}
                                    </td>
                                    {showSpending ? (
                                      <>
                                        {SPENDING_SOURCES.map((s) => (
                                          <td key={`sub-sp-${s.key}`} className="border-r border-border/50 px-2 py-2 text-center tabular-nums">
                                            {fmtMoney(subSp[s.key])}
                                          </td>
                                        ))}
                                        <td className="border-r border-border px-2 py-2 text-center tabular-nums">
                                          {fmtMoney(subSpTotal)}
                                        </td>
                                      </>
                                    ) : null}
                                    {showFront ? (
                                      <>
                                        {SALES_SOURCES.map((s) => (
                                          <td key={`sub-fs-${s.key}`} className="border-r border-border/50 px-2 py-2 text-center tabular-nums">
                                            {fmtMoney(subFs[s.key])}
                                          </td>
                                        ))}
                                        <td className="border-r border-border px-2 py-2 text-center tabular-nums">
                                          {fmtMoney(subFsTotal)}
                                        </td>
                                      </>
                                    ) : null}
                                    {showUpsell ? (
                                      <>
                                        {SALES_SOURCES.map((s) => (
                                          <td key={`sub-up-${s.key}`} className="border-r border-border/50 px-2 py-2 text-center tabular-nums">
                                            {fmtMoney(subUp[s.key])}
                                          </td>
                                        ))}
                                        <td className="border-r border-border px-2 py-2 text-center tabular-nums">
                                          {fmtMoney(subUpTotal)}
                                        </td>
                                      </>
                                    ) : null}
                                    {showTotalSales ? (
                                      <>
                                        {SALES_SOURCES.map((s) => (
                                          <td key={`sub-ts-${s.key}`} className="border-r border-border/50 px-2 py-2 text-center tabular-nums">
                                            {fmtMoney(subFs[s.key] + subUp[s.key])}
                                          </td>
                                        ))}
                                        <td className="border-r border-border px-2 py-2 text-center tabular-nums">
                                          {fmtMoney(subTotSales)}
                                        </td>
                                      </>
                                    ) : null}
                                    {showFrontRoi ? (
                                      <>
                                        {SPENDING_SOURCES.map((s) => (
                                          <td key={`sub-fr-${s.key}`} className="border-r border-border/50 px-2 py-2 text-center">
                                            <RoiPill sales={subFs[s.key]} spend={subSp[s.key]} />
                                          </td>
                                        ))}
                                        <td className="border-r border-border px-2 py-2 text-center">
                                          <RoiPill sales={subFsTotal} spend={subSpTotal} />
                                        </td>
                                      </>
                                    ) : null}
                                    {showTotalRoi ? (
                                      <>
                                        {SPENDING_SOURCES.map((s) => (
                                          <td key={`sub-tr-${s.key}`} className="border-r border-border/50 px-2 py-2 text-center">
                                            <RoiPill
                                              sales={subFs[s.key] + subUp[s.key]}
                                              spend={subSp[s.key]}
                                            />
                                          </td>
                                        ))}
                                        <td className="border-r border-border px-2 py-2 text-center">
                                          <RoiPill sales={subTotSales} spend={subSpTotal} />
                                        </td>
                                      </>
                                    ) : null}
                                    <td />
                                  </tr>
                                )
                              })()
                            ) : null}
                          </React.Fragment>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Polished All Transactions Ledger with Sort & Pagination */}
          <Card className="shadow-xs">
            <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-sm font-semibold">
                    All Transactions ({activeTransactions.length})
                  </CardTitle>
                  {drilldown ? (
                    <Badge variant="secondary" className="gap-1 text-[11px]">
                      <span>
                        {drilldown.brandShortName} ·{" "}
                        {format(parseISO(drilldown.date), "dd MMM yyyy")}
                      </span>
                      <button
                        type="button"
                        onClick={() => setDrilldown(null)}
                        aria-label="Clear row filter"
                        className="hover:text-destructive"
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  Every individual front sale, upsell, and chargeback record.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Input
                  value={txnSearch}
                  onChange={(e) => {
                    setTxnSearch(e.target.value)
                    setTxnPage(1)
                  }}
                  placeholder="Search ID or client..."
                  className="h-8 w-44 text-xs"
                />
                <Select
                  value={txnSourceFilter}
                  onValueChange={(v) => {
                    setTxnSourceFilter(v)
                    setTxnPage(1)
                  }}
                >
                  <SelectTrigger className="h-8 w-32 text-xs">
                    <SelectValue placeholder="All Sources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="Google">Google</SelectItem>
                    <SelectItem value="Bing">Bing</SelectItem>
                    <SelectItem value="Website">Website</SelectItem>
                    <SelectItem value="Social Media">Social Media</SelectItem>
                    <SelectItem value="Bark">Bark</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={txnTypeFilter}
                  onValueChange={(v) => {
                    setTxnTypeFilter(v)
                    setTxnPage(1)
                  }}
                >
                  <SelectTrigger className="h-8 w-36 text-xs">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Front Sale">Front Sale</SelectItem>
                    <SelectItem value="Upsell">Upsell</SelectItem>
                    <SelectItem value="Chargeback">Chargeback</SelectItem>
                    <SelectItem value="Chargeback Won">Chargeback Won</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="overflow-auto rounded-lg border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/70 text-[11px] uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">Txn ID</th>
                      <th className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() =>
                            setTxnSort((s) =>
                              s === "date_desc" ? "date_asc" : "date_desc"
                            )
                          }
                          className="inline-flex items-center gap-1 hover:text-foreground"
                        >
                          Date
                          <ArrowUpDown className="size-3" />
                        </button>
                      </th>
                      <th className="px-3 py-2">Brand</th>
                      <th className="px-3 py-2">Client</th>
                      <th className="px-3 py-2">Source</th>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setTxnSort((s) =>
                              s === "amount_desc" ? "amount_asc" : "amount_desc"
                            )
                          }
                          className="inline-flex items-center gap-1 hover:text-foreground"
                        >
                          Amount
                          <ArrowUpDown className="size-3" />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {pagedTransactions.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-3 py-8 text-center text-muted-foreground"
                        >
                          No transactions match your current filters.
                        </td>
                      </tr>
                    ) : (
                      pagedTransactions.map((t) => (
                        <tr key={t.id} className="hover:bg-muted/30">
                          <td className="px-3 py-2 font-mono font-medium">
                            {t.id}
                          </td>
                          <td className="px-3 py-2 font-mono text-muted-foreground">
                            {format(parseISO(t.date), "dd MMM yyyy")}
                          </td>
                          <td className="px-3 py-2 font-medium">
                            {t.brandShortName}
                          </td>
                          <td className="px-3 py-2">{t.clientName}</td>
                          <td className="px-3 py-2">{t.source}</td>
                          <td className="px-3 py-2">{t.saleType}</td>
                          <td className="px-3 py-2">
                            <span
                              className={cn(
                                "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
                                t.status === "Success"
                                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                  : t.status === "Disputed"
                                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                                    : "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                              )}
                            >
                              {t.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-semibold tabular-nums">
                            {fmtMoney(t.amount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>Rows per page</span>
                  <Select
                    value={String(txnPageSize)}
                    onValueChange={(v) => {
                      setTxnPageSize(Number(v))
                      setTxnPage(1)
                    }}
                  >
                    <SelectTrigger className="h-7 w-16 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span>
                    Page {safeTxnPage} of {totalTxnPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-xs"
                    disabled={safeTxnPage <= 1}
                    onClick={() => setTxnPage((p) => Math.max(1, p - 1))}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-xs"
                    disabled={safeTxnPage >= totalTxnPages}
                    onClick={() =>
                      setTxnPage((p) => Math.min(totalTxnPages, p + 1))
                    }
                    aria-label="Next page"
                  >
                    <ChevronRight className="size-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add / Edit Spending Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingRow ? "Edit Marketing Spending" : "Add Marketing Spending"}
            </DialogTitle>
            <DialogDescription>
              Log daily channel spend and budget allocation.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveSpending} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Brand</Label>
                <Select value={newBrandId} onValueChange={setNewBrandId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INITIAL_BRANDS.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name} ({b.shortName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="mkt-date">Date</Label>
                <div className="relative">
                  <CalendarIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="mkt-date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    placeholder="YYYY-MM-DD"
                    className="pl-8 font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="mkt-budget">Budget ($)</Label>
              <Input
                id="mkt-budget"
                type="number"
                value={newBudget}
                onChange={(e) => setNewBudget(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="mkt-google">Google ($)</Label>
                <Input
                  id="mkt-google"
                  type="number"
                  value={newGoogle}
                  onChange={(e) => setNewGoogle(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="mkt-bing">Bing ($)</Label>
                <Input
                  id="mkt-bing"
                  type="number"
                  value={newBing}
                  onChange={(e) => setNewBing(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="mkt-social">Social Media ($)</Label>
                <Input
                  id="mkt-social"
                  type="number"
                  value={newSocial}
                  onChange={(e) => setNewSocial(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="mkt-bark">Bark ($)</Label>
                <Input
                  id="mkt-bark"
                  type="number"
                  value={newBark}
                  onChange={(e) => setNewBark(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingRow ? "Save Changes" : "Save Spending"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title={`Delete Spending "${deleteTarget?.brandShortName}"`}
        description={`Remove marketing record for ${deleteTarget?.brandShortName} on ${deleteTarget?.date}?`}
        onConfirm={() => {
          if (!deleteTarget) return
          setRows((prev) => prev.filter((r) => r.id !== deleteTarget.id))
          toast.success("Spending record removed")
          setDeleteTarget(null)
        }}
      />
    </div>
  )
}
