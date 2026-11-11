"use client"

import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import {
  DollarSign,
  Eye,
  MousePointerClick,
  Plus,
  TrendingUp,
} from "lucide-react"
import {
  DataTable,
  DataTableColumnHeader,
  type FacetedFilterConfig,
} from "@/components/data-table"
import { KpiCard, PageHeader } from "@/components/shared"
import { BarChart } from "@/components/tremor"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency } from "@/lib/currency"
import { MOCK_BRANDS } from "@/mocks/brands"
import { MOCK_MARKETING_SPENDS } from "@/mocks/marketing"
import type { LeadSource, MarketingSpend } from "@/types"

const CHANNELS: LeadSource[] = [
  "Google Ads",
  "Bing Ads",
  "Social Media",
  "Email Campaign",
  "Organic SEO",
]

export default function MarketingSpendingsPage() {
  const [spends, setSpends] = React.useState<MarketingSpend[]>(
    MOCK_MARKETING_SPENDS
  )
  const [logOpen, setLogOpen] = React.useState(false)
  const [brandId, setBrandId] = React.useState(MOCK_BRANDS[0].id)
  const [source, setSource] = React.useState<LeadSource>("Google Ads")
  const [spendAmount, setSpendAmount] = React.useState("480")
  const [leadsCount, setLeadsCount] = React.useState("12")

  const totals = React.useMemo(() => {
    const totalSpend = spends.reduce((acc, s) => acc + s.spendUsd, 0)
    const totalRev = spends.reduce((acc, s) => acc + s.revenueAttributedUsd, 0)
    const totalClicks = spends.reduce((acc, s) => acc + s.clicks, 0)
    const totalImpressions = spends.reduce((acc, s) => acc + s.impressions, 0)
    const roas = totalSpend > 0 ? (totalRev / totalSpend).toFixed(2) : "0.00"
    return { totalSpend, totalRev, totalClicks, totalImpressions, roas }
  }, [spends])

  const chartData = React.useMemo(() => {
    const byDate = new Map<
      string,
      { date: string; Spend: number; Revenue: number }
    >()
    for (const item of spends) {
      const existing = byDate.get(item.date) ?? {
        date: item.date.slice(5),
        Spend: 0,
        Revenue: 0,
      }
      existing.Spend += item.spendUsd
      existing.Revenue += item.revenueAttributedUsd
      byDate.set(item.date, existing)
    }
    return Array.from(byDate.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    )
  }, [spends])

  // Brand x Source Matrix
  const matrixRows = React.useMemo(() => {
    return MOCK_BRANDS.map((brand) => {
      const row: Record<string, string | number> = {
        brandId: brand.id,
        brandName: brand.name,
      }
      let brandTotal = 0
      for (const ch of CHANNELS) {
        const val = spends
          .filter((s) => s.brandId === brand.id && s.source === ch)
          .reduce((acc, s) => acc + s.spendUsd, 0)
        row[ch] = val
        brandTotal += val
      }
      row.total = brandTotal
      return row
    })
  }, [spends])

  function handleAddSpend(e: React.FormEvent) {
    e.preventDefault()
    const brand =
      MOCK_BRANDS.find((b) => b.id === brandId) ?? MOCK_BRANDS[0]
    const spendNum = Math.max(10, Number(spendAmount) || 250)
    const leadsNum = Math.max(1, Number(leadsCount) || 5)
    const created: MarketingSpend = {
      id: `mkt-new-${spends.length + 1}`,
      date: "2026-11-11",
      brandId: brand.id,
      brandName: brand.name,
      source,
      spendUsd: spendNum,
      impressions: spendNum * 34,
      clicks: leadsNum * 14,
      leadsGenerated: leadsNum,
      revenueAttributedUsd: spendNum * 4.5,
    }
    setSpends((prev) => [created, ...prev])
    toast.success(`Logged ${formatCurrency(spendNum)} spend for ${brand.name} (${source})`)
    setLogOpen(false)
  }

  const columns = React.useMemo<ColumnDef<MarketingSpend>[]>(
    () => [
      {
        accessorKey: "date",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Date" />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.date}</span>
        ),
      },
      {
        accessorKey: "brandName",
        header: "Brand",
        cell: ({ row }) => (
          <Badge variant="outline" className="font-normal">
            {row.original.brandName}
          </Badge>
        ),
      },
      {
        accessorKey: "source",
        header: "Channel",
      },
      {
        accessorKey: "spendUsd",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Spend" />
        ),
        cell: ({ row }) => (
          <span className="font-medium tabular-nums">
            {formatCurrency(row.original.spendUsd)}
          </span>
        ),
      },
      {
        accessorKey: "impressions",
        header: "Impressions",
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground">
            {row.original.impressions.toLocaleString("en-US")}
          </span>
        ),
      },
      {
        accessorKey: "clicks",
        header: "Clicks",
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.clicks.toLocaleString("en-US")}</span>
        ),
      },
      {
        accessorKey: "leadsGenerated",
        header: "Leads",
        cell: ({ row }) => (
          <span className="font-medium tabular-nums">
            {row.original.leadsGenerated}
          </span>
        ),
      },
      {
        accessorKey: "revenueAttributedUsd",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Attributed Rev." />
        ),
        cell: ({ row }) => (
          <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatCurrency(row.original.revenueAttributedUsd)}
          </span>
        ),
      },
    ],
    []
  )

  const facetedFilters = React.useMemo<FacetedFilterConfig[]>(
    () => [
      {
        columnId: "brandName",
        title: "Brand",
        options: MOCK_BRANDS.map((b) => ({ label: b.name, value: b.name })),
      },
      {
        columnId: "source",
        title: "Channel",
        options: CHANNELS.map((c) => ({ label: c, value: c })),
      },
    ],
    []
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketing Spendings"
        description="Daily ad spend allocation across brands and acquisition channels with attributed return."
        actions={
          <Button
            type="button"
            onClick={() => setLogOpen(true)}
            className="gap-1.5"
          >
            <Plus className="size-4" />
            Log Daily Spend
          </Button>
        }
      />

      {/* KPI Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="14-Day Ad Spend"
          value={formatCurrency(totals.totalSpend)}
          delta="+6.4%"
          deltaType="moderateIncrease"
          icon={<DollarSign className="size-4" />}
        />
        <KpiCard
          title="Attributed Revenue"
          value={formatCurrency(totals.totalRev)}
          delta="+18.1%"
          deltaType="increase"
          icon={<TrendingUp className="size-4" />}
        />
        <KpiCard
          title="Blended ROAS"
          value={`${totals.roas}x`}
          delta="+0.4x"
          deltaType="increase"
          icon={<MousePointerClick className="size-4" />}
        />
        <KpiCard
          title="Total Impressions"
          value={totals.totalImpressions.toLocaleString("en-US")}
          subtitle={`${totals.totalClicks.toLocaleString("en-US")} qualified clicks`}
          icon={<Eye className="size-4" />}
        />
      </div>

      {/* Tremor Chart above grid */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Marketing Spend vs Attributed Revenue</CardTitle>
          <CardDescription>
            Combined multi-brand media spend compared against attributed revenue
            over the last 14 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BarChart
            data={chartData}
            index="date"
            categories={["Spend", "Revenue"]}
            colors={["amber", "blue"]}
            valueFormatter={(v) => formatCurrency(v, "USD", true)}
          />
        </CardContent>
      </Card>

      {/* Brand x Source Matrix & Daily Ledger */}
      <Tabs defaultValue="matrix" className="space-y-4">
        <TabsList>
          <TabsTrigger value="matrix">Brand × Source Grid</TabsTrigger>
          <TabsTrigger value="ledger">Daily Spend Ledger</TabsTrigger>
        </TabsList>

        <TabsContent value="matrix">
          <Card>
            <CardHeader>
              <CardTitle>Spend Matrix (Brand × Channel)</CardTitle>
              <CardDescription>
                Aggregated USD media allocation per brand across paid & organic
                channels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Brand</TableHead>
                      {CHANNELS.map((ch) => (
                        <TableHead key={ch} className="text-right">
                          {ch}
                        </TableHead>
                      ))}
                      <TableHead className="text-right font-semibold">
                        Total Spend
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matrixRows.map((row) => (
                      <TableRow key={String(row.brandId)}>
                        <TableCell className="font-medium">
                          {String(row.brandName)}
                        </TableCell>
                        {CHANNELS.map((ch) => (
                          <TableCell
                            key={ch}
                            className="text-right tabular-nums text-muted-foreground"
                          >
                            {formatCurrency(Number(row[ch] ?? 0))}
                          </TableCell>
                        ))}
                        <TableCell className="text-right font-bold tabular-nums text-foreground">
                          {formatCurrency(Number(row.total ?? 0))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ledger">
          <DataTable
            columns={columns}
            data={spends}
            searchPlaceholder="Search daily spend records..."
            facetedFilters={facetedFilters}
            dateField="date"
            exportModule="Marketing Spendings"
          />
        </TabsContent>
      </Tabs>

      {/* Log Daily Spend Dialog */}
      <Dialog open={logOpen} onOpenChange={setLogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Log Daily Marketing Spend</DialogTitle>
            <DialogDescription>
              Record daily channel spend and lead attribution for a brand.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSpend} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Brand</Label>
              <Select value={brandId} onValueChange={setBrandId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_BRANDS.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Channel</Label>
              <Select
                value={source}
                onValueChange={(v) => setSource(v as LeadSource)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHANNELS.map((ch) => (
                    <SelectItem key={ch} value={ch}>
                      {ch}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="spend-usd">Spend (USD)</Label>
                <Input
                  id="spend-usd"
                  type="number"
                  value={spendAmount}
                  onChange={(e) => setSpendAmount(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="spend-leads">Leads Generated</Label>
                <Input
                  id="spend-leads"
                  type="number"
                  value={leadsCount}
                  onChange={(e) => setLeadsCount(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setLogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save Entry</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
