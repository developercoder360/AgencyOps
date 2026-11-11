"use client"

import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import {
  AlertTriangle,
  CreditCard,
  History,
  RotateCcw,
  ShieldAlert,
} from "lucide-react"
import {
  DataTable,
  DataTableColumnHeader,
  type FacetedFilterConfig,
} from "@/components/data-table"
import {
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
import { formatCurrency } from "@/lib/currency"
import { MOCK_TRANSACTIONS } from "@/mocks/billing"
import { MOCK_BRANDS } from "@/mocks/brands"
import type { PaymentGateway, PaymentStatus, Transaction } from "@/types"

const TX_STATUSES: PaymentStatus[] = [
  "Success",
  "Processing",
  "Viewed",
  "Denied",
  "Refund Requested",
  "Refunded",
  "Chargeback",
]

const GATEWAYS: PaymentGateway[] = [
  "Stripe",
  "Square",
  "Authorize.Net",
  "NMI",
  "Bank Transfer",
]

export default function TransactionsPage() {
  const [transactions, setTransactions] =
    React.useState<Transaction[]>(MOCK_TRANSACTIONS)
  const [selectedTx, setSelectedTx] = React.useState<Transaction | null>(null)

  function handleRefundAction(tx: Transaction) {
    const nextStatus: PaymentStatus =
      tx.status === "Refund Requested" ? "Refunded" : "Refund Requested"
    const updated: Transaction = {
      ...tx,
      status: nextStatus,
      events: [
        ...tx.events,
        {
          id: `evt-${Date.now()}`,
          status: nextStatus,
          title:
            nextStatus === "Refunded"
              ? "Refund processed to original payment method"
              : "Refund request logged by Finance",
          detail: `Updated via Transactions modal`,
          actor: "Marcus Vance",
          timestamp: "2026-11-11 18:15",
        },
      ],
    }
    setTransactions((prev) =>
      prev.map((item) => (item.id === tx.id ? updated : item))
    )
    setSelectedTx(updated)
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
        id: "method",
        header: "Method",
        cell: ({ row }) =>
          row.original.cardBrand ? (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CreditCard className="size-3.5" />
              {row.original.cardBrand} ••{row.original.cardLast4}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">ACH / Wire</span>
          ),
      },
      {
        accessorKey: "amountUsd",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Amount" />
        ),
        cell: ({ row }) => (
          <div className="tabular-nums">
            <div className="font-medium">
              {formatCurrency(row.original.amount, row.original.currency)}
            </div>
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
        header: "Status / Dispute",
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <StatusBadge status={row.original.status} />
            {row.original.status === "Chargeback" ? (
              <ShieldAlert
                className="size-3.5 text-rose-600 dark:text-rose-400"
                aria-label="Dispute open"
              />
            ) : row.original.status === "Refund Requested" ? (
              <AlertTriangle
                className="size-3.5 text-amber-600 dark:text-amber-400"
                aria-label="Refund review needed"
              />
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Date" />
        ),
        cell: ({ row }) => (
          <span className="text-xs tabular-nums text-muted-foreground">
            {row.original.createdAt}
          </span>
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
        options: MOCK_BRANDS.map((b) => ({ label: b.name, value: b.name })),
      },
    ],
    []
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        description="Monitor multi-gateway settlements, failed authorizations, refund workflows, and chargeback disputes."
        badge={<Badge variant="secondary">{transactions.length} txns</Badge>}
      />

      <DataTable
        columns={columns}
        data={transactions}
        searchPlaceholder="Search transactions..."
        facetedFilters={facetedFilters}
        dateField="createdAt"
        exportModule="Transactions"
        onRowClick={setSelectedTx}
      />

      {/* Transaction Detail Dialog with Event Timeline */}
      <Dialog
        open={Boolean(selectedTx)}
        onOpenChange={(open) => !open && setSelectedTx(null)}
      >
        <DialogContent className="sm:max-w-xl">
          {selectedTx ? (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2">
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
                <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/30 p-3 text-xs sm:grid-cols-3">
                  <div>
                    <div className="text-muted-foreground">Payment Method</div>
                    <div className="mt-0.5 font-medium">
                      {selectedTx.cardBrand
                        ? `${selectedTx.cardBrand} •••• ${selectedTx.cardLast4}`
                        : "Bank Wire / ACH"}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Gateway</div>
                    <div className="mt-0.5 font-medium">
                      {selectedTx.gateway}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Created</div>
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
                ) : (
                  <div />
                )}
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
    </div>
  )
}
