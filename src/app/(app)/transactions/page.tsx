"use client"

import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import {
  CreditCard,
  History,
  RotateCcw,
  Trash2,
} from "lucide-react"
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
import { formatCurrency } from "@/lib/currency"
import { useStore } from "@/lib/store"
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
  const { transactions, brands, updateTransaction, deleteTransaction } = useStore()
  const [selectedTx, setSelectedTx] = React.useState<Transaction | null>(null)

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
          <DataTableColumnHeader column={column} title="Settled" />
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
    ],
    [brands]
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions Ledger"
        description="Unified payment logs across Stripe, Square, Authorize.Net, and NMI merchant gateways."
        badge={<Badge variant="secondary">{transactions.length} records</Badge>}
      />

      <DataTable
        columns={columns}
        data={transactions}
        searchPlaceholder="Search by tx ref, invoice, client, brand..."
        facetedFilters={facetedFilters}
        dateField="createdAt"
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
