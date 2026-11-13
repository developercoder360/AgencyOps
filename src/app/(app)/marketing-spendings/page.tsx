"use client"

import * as React from "react"
import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import {
  DollarSign,
  Eye,
  MousePointerClick,
  Plus,
  Trash2,
  TrendingUp,
} from "lucide-react"
import {
  DataTable,
  DataTableColumnHeader,
  type FacetedFilterConfig,
} from "@/components/data-table"
import { ConfirmDeleteDialog, KpiCard, PageHeader } from "@/components/shared"
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
import { useStore } from "@/lib/store"
import type { LeadSource, MarketingSpend } from "@/types"

const CHANNELS: LeadSource[] = [
  "Google Ads",
  "Bing Ads",
  "Social Media",
  "Email Campaign",
  "Organic SEO",
]

export default function MarketingSpendingsPage() {
  const { brands, marketingSpends, createMarketingSpend, deleteMarketingSpend } = useStore()

  const [logOpen, setLogOpen] = React.useState(false)
  const [brandId, setBrandId] = React.useState("")
  const [source, setSource] = React.useState<LeadSource>("Google Ads")
  const [spendAmount, setSpendAmount] = React.useState("480")
  const [leadsCount, setLeadsCount] = React.useState("12")

  const activeBrandId = brandId || brands[0]?.id || ""

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = React.useState<MarketingSpend | null>(null)

  const totals = React.useMemo(() => {
    const totalSpend = marketingSpends.reduce((acc, s) => acc + s.spendUsd, 0)
    const totalRev = marketingSpends.reduce((acc, s) => acc + s.revenueAttributedUsd, 0)
    const totalClicks = marketingSpends.reduce((acc, s) => acc + s.clicks, 0)
    const totalImpressions = marketingSpends.reduce((acc, s) => acc + s.impressions, 0)
    const roas = totalSpend > 0 ? (totalRev / totalSpend).toFixed(2) : "0.00"
    return { totalSpend, totalRev, totalClicks, totalImpressions, roas }
  }, [marketingSpends])

  const chartData = React.useMemo(() => {
    if (marketingSpends.length === 0) {
      return []
    }
    const byDate = new Map<
      string,
      { date: string; Spend: number; Revenue: number }
    >()
    for (const item of marketingSpends) {
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
  }, [marketingSpends])

  // Brand x Source Matrix
  const matrixRows = React.useMemo(() => {
    return brands.map((brand) => {
      const row: Record<string, string | number> = {
        brandId: brand.id,
        brandName: brand.name,
      }
      let brandTotal = 0
      for (const ch of CHANNELS) {
        const val = marketingSpends
          .filter((s) => s.brandId === brand.id && s.source === ch)
          .reduce((acc, s) => acc + s.spendUsd, 0)
        row[ch] = val
        brandTotal += val
      }
      row.total = brandTotal
      return row
    })
  }, [brands, marketingSpends])

  function handleAddSpend(e: React.FormEvent) {
    e.preventDefault()
    const brand = brands.find((b) => b.id === activeBrandId) ?? brands[0]
    if (!brand) {
      toast.error("Please add a brand first.")
      return
    }

    const spendUsd = parseFloat(spendAmount) || 0
    const leadsGenerated = parseInt(leadsCount, 10) || 0
    const clicks = Math.round(spendUsd * 2.3)
    const impressions = clicks * 24
    const revenueAttributedUsd = Math.round(spendUsd * 2.8)
    const today = new Date().toISOString().slice(0, 10)

    createMarketingSpend({
      brandId: brand.id,
      brandName: brand.name,
      source,
      date: today,
      spendUsd,
      impressions,
      clicks,
      leadsGenerated,
      revenueAttributedUsd,
    })

    toast.success(
      `Logged ${formatCurrency(spendUsd)} spend for ${brand.name} (${source})`
    )
    setLogOpen(false)
  }

  const promptDelete = React.useCallback((item: MarketingSpend) => {
    setDeleteTarget(item)
  }, [])

  function handleConfirmDelete() {
    if (!deleteTarget) return
    deleteMarketingSpend(deleteTarget.id)
    toast.success(`Removed spend entry for ${deleteTarget.brandName}`)
    setDeleteTarget(null)
  }

  const columns = React.useMemo<ColumnDef<MarketingSpend>[]>(
    () => [
      {
        accessorKey: "date",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Date" />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            {row.original.date}
          </span>
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
        cell: ({ row }) => (
          <Badge variant="secondary" className="font-normal">
            {row.original.source}
          </Badge>
        ),
      },
      {
        accessorKey: "spendUsd",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Spend (USD)" />
        ),
        cell: ({ row }) => (
          <span className="font-semibold tabular-nums">
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
          <span className="tabular-nums text-muted-foreground">
            {row.original.clicks.toLocaleString("en-US")}
          </span>
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
      {
        id: "actions",
        header: "",
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => promptDelete(row.original)}
              title="Delete record"
              className="text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    [promptDelete]
  )

  const facetedFilters = React.useMemo<FacetedFilterConfig[]>(
    () => [
      {
        columnId: "brandName",
        title: "Brand",
        options: brands.map((b) => ({ label: b.name, value: b.name })),
      },
      {
        columnId: "source",
        title: "Channel",
        options: CHANNELS.map((c) => ({ label: c, value: c })),
      },
    ],
    [brands]
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketing Spendings"
        description="Daily ad spend allocation across brands and acquisition channels with attributed return."
        badge={<Badge variant="secondary">{marketingSpends.length} records</Badge>}
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
          title="Media Ad Spend"
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
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <BarChart
              data={chartData}
              index="date"
              categories={["Spend", "Revenue"]}
              colors={["amber", "blue"]}
              valueFormatter={(v) => formatCurrency(v, "USD", true)}
            />
          ) : (
            <div className="flex h-56 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
              No marketing spend recorded yet. Click &quot;Log Daily Spend&quot; to begin tracking campaigns.
            </div>
          )}
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
                Aggregated USD media allocation per brand across paid & organic channels
              </CardDescription>
            </CardHeader>
            <CardContent>
              {matrixRows.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No brands configured yet.{" "}
                  <Link href="/brands" className="text-primary underline">
                    Add a brand first
                  </Link>
                  .
                </div>
              ) : (
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ledger">
          <DataTable
            columns={columns}
            data={marketingSpends}
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
              Record daily channel spend and lead attribution for a brand storefront.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSpend} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Brand</Label>
              {brands.length === 0 ? (
                <div className="rounded-md border border-dashed border-border p-2 text-xs text-muted-foreground">
                  <Link href="/brands" className="text-primary underline">
                    Add a brand first
                  </Link>
                </div>
              ) : (
                <Select value={activeBrandId} onValueChange={setBrandId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
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
              <Button type="submit" disabled={brands.length === 0}>
                Save Entry
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete Spend Record?"
        description="Are you sure you want to remove this marketing spend entry? This will adjust your ROAS and attribution numbers."
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
