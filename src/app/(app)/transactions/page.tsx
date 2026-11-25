"use client"

import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import {
  DollarSign,
  History,
  RotateCcw,
  Trash2,
} from "lucide-react"
import { cn } from "cn"
import {
  DataTable,
  DataTableColumnHeader,
  type FacetedFilterConfig,
} from "@/components/data-table"
import {
  ConfirmDeleteDialog,
  GatewayBadge,
  PageHeader,
  StatusBadge,
} from "@/components/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { formatCurrency } from "@/lib/currency"
import { ALL_GATEWAYS } from "@/lib/gateways"
import { useStore } from "@/lib/store"
import type {
  CurrencyCode,
  LeadSource,
  PaymentGateway,
  PaymentStatus,
  SaleType,
  Transaction,
} from "@/types"

const TX_STATUSES: PaymentStatus[] = [
  "Success",
  "Processing",
  "Viewed",
  "Denied",
  "Expired",
  "Refund Requested",
  "Refunded",
  "Chargeback",
]

const GATEWAYS: PaymentGateway[] = ALL_GATEWAYS

const SALE_TYPES: SaleType[] = ["Sale", "Upsell"]

const LEAD_SOURCES: LeadSource[] = [
  "Google Ads",
  "Bing Ads",
  "Website",
  "Organic SEO",
  "Referral",
  "Social Media",
  "Email Campaign",
]

const CURRENCIES: CurrencyCode[] = ["USD", "GBP", "CAD", "AED"]

export default function TransactionsPage() {
  const { transactions, brands, invoices, leads, updateTransaction, deleteTransaction } =
    useStore()
  const [selectedTx, setSelectedTx] = React.useState<Transaction | null>(null)
  const [amountCurrency, setAmountCurrency] = React.useState<"ALL" | CurrencyCode>("ALL")
  const [minAmount, setMinAmount] = React.useState("")
  const [maxAmount, setMaxAmount] = React.useState("")

  const hasAmountFilter =
    amountCurrency !== "ALL" || minAmount.trim() !== "" || maxAmount.trim() !== ""

  const resetAmountFilter = React.useCallback(() => {
    setAmountCurrency("ALL")
    setMinAmount("")
    setMaxAmount("")
  }, [])

  const resolvedTransactions = React.useMemo<Transaction[]>(() => {
    const invoiceById = new Map(invoices.map((inv) => [inv.id, inv]))
    const leadById = new Map(leads.map((ld) => [ld.id, ld]))
    return transactions.map((tx) => {
      const linkedInvoice = invoiceById.get(tx.invoiceId)
      const linkedLead = linkedInvoice?.leadId
        ? leadById.get(linkedInvoice.leadId)
        : undefined
      return {
        ...tx,
        saleType: tx.saleType ?? linkedInvoice?.saleType ?? "Sale",
        source: tx.source ?? linkedLead?.source ?? "Website",
      }
    })
  }, [transactions, invoices, leads])

  const amountFilteredTransactions = React.useMemo<Transaction[]>(() => {
    const rawMin = minAmount.trim()
    const rawMax = maxAmount.trim()
    const parsedMin = rawMin === "" ? null : Number(rawMin)
    const parsedMax = rawMax === "" ? null : Number(rawMax)

    return resolvedTransactions.filter((tx) => {
      if (amountCurrency !== "ALL" && tx.currency !== amountCurrency) {
        return false
      }
      const value = amountCurrency === "ALL" ? tx.amountUsd : tx.amount
      if (parsedMin !== null && !Number.isNaN(parsedMin) && value < parsedMin) {
        return false
      }
      if (parsedMax !== null && !Number.isNaN(parsedMax) && value > parsedMax) {
        return false
      }
      return true
    })
  }, [resolvedTransactions, amountCurrency, minAmount, maxAmount])

  const amountFilterLabel = React.useMemo(() => {
    if (!hasAmountFilter) return "Amount"
    const rawMin = minAmount.trim()
    const rawMax = maxAmount.trim()
    const prefix = amountCurrency === "ALL" ? "USD Eq." : amountCurrency
    if (rawMin && rawMax) return `${prefix}: ${rawMin} – ${rawMax}`
    if (rawMin) return `${prefix}: ≥ ${rawMin}`
    if (rawMax) return `${prefix}: ≤ ${rawMax}`
    return `Currency: ${amountCurrency}`
  }, [hasAmountFilter, amountCurrency, minAmount, maxAmount])

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = React.useState<Transaction | null>(null)

  function promptDelete(tx: Transaction) {
    setDeleteTarget(tx)
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return
    deleteTransaction(deleteTarget.id)
    toast.success(`Removed transaction record ${deleteTarget.txRef}`)
    if (selectedTx?.id === deleteTarget.id) {
      setSelectedTx(null)
    }
    setDeleteTarget(null)
  }

  function handleRefundAction(tx: Transaction) {
    const nextStatus: PaymentStatus =
      tx.status === "Refund Requested" ? "Refunded" : "Refund Requested"
    const now = new Date().toISOString().replace("T", " ").slice(0, 16)

    const updatedEvents = [
      ...tx.events,
      {
        id: `evt-${crypto.randomUUID()}`,
        status: nextStatus,
        title:
          nextStatus === "Refunded"
            ? "Refund processed to original payment method"
            : "Refund request logged by Finance",
        detail: `Updated via Transactions ledger`,
        actor: "Current User",
        timestamp: now,
      },
    ]

    updateTransaction(tx.id, {
      status: nextStatus,
      events: updatedEvents,
    })

    setSelectedTx((prev) =>
      prev && prev.id === tx.id
        ? {
            ...prev,
            status: nextStatus,
            events: updatedEvents,
          }
        : prev
    )
    toast.success(`${tx.txRef} updated to ${nextStatus}`)
  }

  const columns = React.useMemo<ColumnDef<Transaction>[]>(
    () => [
      {
        accessorKey: "txRef",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Transaction Ref" />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold text-primary">
            {row.original.txRef}
          </span>
        ),
      },
      {
        accessorKey: "invoiceNumber",
        header: "Invoice #",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.invoiceNumber}
          </span>
        ),
      },
      {
        accessorKey: "clientName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Client" />
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
        accessorKey: "gateway",
        header: "Gateway",
        cell: ({ row }) => <GatewayBadge gateway={row.original.gateway} />,
      },
      {
        accessorKey: "saleType",
        header: "Sale Type",
        cell: ({ row }) => {
          const saleType = row.original.saleType ?? "Sale"
          return (
            <Badge
              variant={saleType === "Upsell" ? "default" : "secondary"}
              className="font-normal"
            >
              {saleType}
            </Badge>
          )
        },
      },
      {
        accessorKey: "source",
        header: "Source",
        cell: ({ row }) => (
          <Badge variant="outline" className="font-normal">
            {row.original.source ?? "Website"}
          </Badge>
        ),
      },
      {
        accessorKey: "amountUsd",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Amount" />
        ),
        cell: ({ row }) => (
          <div className="tabular-nums">
            <span className="font-semibold">
              {formatCurrency(row.original.amount, row.original.currency)}
            </span>
            {row.original.currency !== "USD" ? (
              <div className="text-[11px] text-muted-foreground">
                ≈ {formatCurrency(row.original.amountUsd, "USD")}
              </div>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Created At" />
        ),
        cell: ({ row }) => (
          <span className="text-xs tabular-nums text-muted-foreground">
            {row.original.createdAt}
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
              title="Delete transaction record"
              className="text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    []
  )

  const facetedFilters = React.useMemo<FacetedFilterConfig[]>(
    () => [
      {
        columnId: "status",
        title: "Status",
        options: TX_STATUSES.map((s) => ({ label: s, value: s })),
      },
      {
        columnId: "gateway",
        title: "Gateway",
        options: GATEWAYS.map((g) => ({ label: g, value: g })),
      },
      {
        columnId: "brandName",
        title: "Brand",
        options: brands.map((b) => ({ label: b.name, value: b.name })),
      },
      {
        columnId: "saleType",
        title: "Sale Type",
        options: SALE_TYPES.map((st) => ({ label: st, value: st })),
      },
      {
        columnId: "source",
        title: "Source",
        options: LEAD_SOURCES.map((src) => ({ label: src, value: src })),
      },
    ],
    [brands]
  )

  const amountFilterPopover = (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "h-8 border-dashed gap-1.5",
            hasAmountFilter && "border-solid border-primary/50"
          )}
        >
          <DollarSign className="size-3.5" />
          <span>{amountFilterLabel}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 space-y-3 p-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Currency</Label>
          <Select
            value={amountCurrency}
            onValueChange={(v) => setAmountCurrency(v as "ALL" | CurrencyCode)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="All currencies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All currencies (USD eq.)</SelectItem>
              {CURRENCIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="tx-amount-min" className="text-xs font-medium">
              Min
            </Label>
            <Input
              id="tx-amount-min"
              type="number"
              min={0}
              step="any"
              placeholder="0"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className="h-8 text-xs tabular-nums"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="tx-amount-max" className="text-xs font-medium">
              Max
            </Label>
            <Input
              id="tx-amount-max"
              type="number"
              min={0}
              step="any"
              placeholder="No limit"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              className="h-8 text-xs tabular-nums"
            />
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground">
          {amountCurrency === "ALL"
            ? "Min and Max filter by USD equivalent across all currencies."
            : `Showing ${amountCurrency} transactions within this amount range.`}
        </p>

        {hasAmountFilter ? (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={resetAmountFilter}
            className="w-full"
          >
            Clear amount filter
          </Button>
        ) : null}
      </PopoverContent>
    </Popover>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions Ledger"
        description="Unified payment logs across Stripe, Square, Authorize.Net, and NMI merchant gateways."
        badge={
          <Badge variant="secondary">
            {amountFilteredTransactions.length} records
          </Badge>
        }
      />

      <DataTable
        columns={columns}
        data={amountFilteredTransactions}
        searchPlaceholder="Search by tx ref, invoice, client, brand..."
        facetedFilters={facetedFilters}
        dateField="createdAt"
        filterExtra={amountFilterPopover}
        hasExtraFilters={hasAmountFilter}
        onResetExtraFilters={resetAmountFilter}
        exportModule="Transactions Ledger"
        onRowClick={setSelectedTx}
      />

      {/* Detail & Event History Dialog */}
      <Dialog
        open={Boolean(selectedTx)}
        onOpenChange={(open) => !open && setSelectedTx(null)}
      >
        <DialogContent className="sm:max-w-xl">
          {selectedTx ? (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">
                    {selectedTx.txRef}
                  </Badge>
                  <GatewayBadge gateway={selectedTx.gateway} />
                  <StatusBadge status={selectedTx.status} />
                </div>
                <DialogTitle className="mt-1">
                  {formatCurrency(selectedTx.amount, selectedTx.currency)} —{" "}
                  {selectedTx.clientName}
                </DialogTitle>
                <DialogDescription>
                  Invoice {selectedTx.invoiceNumber} • {selectedTx.brandName}
                  {selectedTx.currency !== "USD"
                    ? ` • USD Eq. ${formatCurrency(selectedTx.amountUsd, "USD")}`
                    : ""}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/30 p-3 text-xs sm:grid-cols-4">
                  <div>
                    <div className="text-muted-foreground">Gateway</div>
                    <div className="mt-0.5 font-medium">
                      {selectedTx.gateway}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Sale Type</div>
                    <div className="mt-0.5 font-medium">
                      {selectedTx.saleType ?? "Sale"}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Source</div>
                    <div className="mt-0.5 font-medium">
                      {selectedTx.source ?? "Website"}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Created At</div>
                    <div className="mt-0.5 font-medium tabular-nums">
                      {selectedTx.createdAt}
                    </div>
                  </div>
                </div>

                {/* Event Timeline */}
                <div className="space-y-2.5">
                  <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <History className="size-3.5" />
                    Gateway Event Timeline
                  </h4>
                  <ol className="relative ml-2 max-h-64 space-y-4 overflow-y-auto border-l border-border pl-5 pr-2">
                    {selectedTx.events.map((evt) => (
                      <li key={evt.id} className="relative space-y-1">
                        <span className="absolute -left-[25px] top-1 size-2.5 rounded-full border-2 border-background bg-primary" />
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">
                              {evt.title}
                            </span>
                            <StatusBadge status={evt.status} showDot={false} />
                          </div>
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {evt.timestamp}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {evt.detail}
                        </p>
                        <p className="text-[11px] text-muted-foreground/80">
                          Actor: {evt.actor}
                        </p>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              <DialogFooter className="sm:justify-between">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => promptDelete(selectedTx)}
                  >
                    <Trash2 className="mr-1.5 size-4" />
                    Delete
                  </Button>
                  {(selectedTx.status === "Success" ||
                    selectedTx.status === "Refund Requested") ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleRefundAction(selectedTx)}
                      className="gap-1.5"
                    >
                      <RotateCcw className="size-4" />
                      {selectedTx.status === "Refund Requested"
                        ? "Approve & Mark Refunded"
                        : "Request Refund"}
                    </Button>
                  ) : null}
                </div>
                <Button
                  type="button"
                  onClick={() => setSelectedTx(null)}
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title={`Delete Transaction "${deleteTarget?.txRef}"?`}
        description="Are you sure you want to remove this ledger entry? This cannot be undone."
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
