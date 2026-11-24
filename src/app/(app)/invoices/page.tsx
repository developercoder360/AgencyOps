"use client"

import * as React from "react"
import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  Check,
  ChevronsUpDown,
  Copy,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  FileText,
  Loader2,
  Lock,
  MoreHorizontal,
  Paperclip,
  Plus,
  Search,
  Trash2,
  Upload,
  User,
  X,
} from "lucide-react"
import {
  DataTable,
  DataTableColumnHeader,
  type FacetedFilterConfig,
} from "@/components/data-table"
import {
  BrandBadge,
  ConfirmDeleteDialog,
  GatewayBadge,
  PageHeader,
  StatusBadge,
} from "@/components/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { formatCurrency, formatUsdEquivalent } from "@/lib/currency"
import { ALL_GATEWAYS, isOfflineMerchant } from "@/lib/gateways"
import { downloadInvoicePdf } from "@/lib/invoice-pdf"
import { useStore } from "@/lib/store"
import type {
  AttachmentFile,
  Brand,
  CurrencyCode,
  Invoice,
  Lead,
  PaymentGateway,
  PaymentStatus,
  StaffUser,
} from "@/types"

const GATEWAYS: PaymentGateway[] = ALL_GATEWAYS

const INVOICE_STATUSES: PaymentStatus[] = [
  "Created",
  "Viewed",
  "Processing",
  "Success",
  "Denied",
  "Expired",
  "Refund Requested",
  "Refunded",
  "Chargeback",
]

function toSafeNumber(val: unknown): number {
  if (val === "" || val === null || val === undefined) return 0
  const n = typeof val === "number" ? val : Number(val)
  return Number.isFinite(n) ? n : 0
}

const lineItemSchema = z.object({
  description: z.string().min(2, "Item description required"),
  amount: z.number().min(1, "Min amount 1"),
})

const invoiceSchema = z.object({
  clientId: z.string().min(1, "Please select a client"),
  gateway: z.enum([
    "Stripe",
    "Square",
    "Authorize.Net",
    "NMI",
    "ACH Routing",
    "Bank Transfer",
    "Zelle",
    "Wise",
  ]),
  status: z
    .enum([
      "Created",
      "Viewed",
      "Processing",
      "Success",
      "Denied",
      "Expired",
      "Refund Requested",
      "Refunded",
      "Chargeback",
    ])
    .optional(),
  currency: z.enum(["USD", "GBP", "CAD", "AED"]),
  taxAmount: z.number().min(0, "Tax cannot be negative"),
  discountAmount: z.number().min(0, "Discount cannot be negative"),
  dueDate: z.string().min(8),
  lineItems: z.array(lineItemSchema).min(1, "Add at least one line item"),
})

type InvoiceFormValues = z.infer<typeof invoiceSchema>

export default function InvoicesPage() {
  const {
    invoices,
    brands,
    leads,
    users,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    checkInvoiceDeletion,
  } = useStore()

  const [selectedInvoice, setSelectedInvoice] = React.useState<Invoice | null>(
    null
  )
  const [isEditingSelected, setIsEditingSelected] = React.useState(false)
  const [createOpen, setCreateOpen] = React.useState(false)

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = React.useState<Invoice | null>(null)
  const [deleteWarning, setDeleteWarning] = React.useState<string | undefined>()

  const promptDelete = React.useCallback(
    (invoice: Invoice) => {
      const check = checkInvoiceDeletion(invoice.id)
      if (!check.allowed) {
        toast.error(check.reason || "Cannot delete this invoice.")
        return
      }
      setDeleteWarning(undefined)
      setDeleteTarget(invoice)
    },
    [checkInvoiceDeletion]
  )

  function handleConfirmDelete() {
    if (!deleteTarget) return
    const res = deleteInvoice(deleteTarget.id)
    if (!res.allowed) {
      toast.error(res.reason || "Failed to delete invoice.")
    } else {
      toast.success(`Removed invoice ${deleteTarget.invoiceNumber}`)
      if (selectedInvoice?.id === deleteTarget.id) {
        setSelectedInvoice(null)
      }
    }
    setDeleteTarget(null)
  }

  function copyPublicCheckoutUrl(invoice: Invoice) {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/invoice/${invoice.id}`
        : `/invoice/${invoice.id}`
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {})
    }
    toast.success(`Copied payment link for ${invoice.invoiceNumber}`)
  }

  const columns = React.useMemo<ColumnDef<Invoice>[]>(
    () => [
      {
        accessorKey: "invoiceNumber",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Invoice #" />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold text-primary">
            {row.original.invoiceNumber}
          </span>
        ),
      },
      {
        accessorKey: "clientName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Client" />
        ),
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.clientName}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.clientCompany}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "brandName",
        header: "Brand",
        cell: ({ row }) => (
          <BrandBadge
            brandId={row.original.brandId}
            brandName={row.original.brandName}
            brands={brands}
          />
        ),
      },
      {
        accessorKey: "gateway",
        header: "Gateway",
        cell: ({ row }) => <GatewayBadge gateway={row.original.gateway} />,
      },
      {
        accessorKey: "total",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Amount" />
        ),
        cell: ({ row }) => (
          <div className="font-semibold tabular-nums">
            {formatCurrency(row.original.total, row.original.currency)}
            <div className="text-[11px] font-normal text-muted-foreground">
              {formatUsdEquivalent(row.original.total, row.original.currency)}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "createdBy",
        accessorFn: (row) => {
          if (row.createdBy) return row.createdBy
          const rep = users.find((u) => u.id === row.salesRepId)
          return rep?.name ?? users[0]?.name ?? "Marcus Vance"
        },
        meta: { label: "Created By" },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Created By" />
        ),
        cell: ({ row }) => {
          const rep = users.find((u) => u.id === row.original.salesRepId)
          const name =
            row.original.createdBy ||
            rep?.name ||
            users[0]?.name ||
            "Marcus Vance"
          return (
            <div className="flex items-center gap-2">
              {rep ? (
                <span
                  className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white ${rep.avatarColor}`}
                >
                  {rep.avatarInitials}
                </span>
              ) : null}
              <span className="max-w-[130px] truncate text-xs font-medium text-foreground">
                {name}
              </span>
            </div>
          )
        },
      },
      {
        id: "createdAt",
        accessorFn: (row) => row.createdAt || row.issuedAt,
        meta: { label: "Created At" },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Created At" />
        ),
        cell: ({ row }) => (
          <span className="text-xs tabular-nums text-muted-foreground whitespace-nowrap">
            {row.original.createdAt || row.original.issuedAt}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        enableHiding: false,
        cell: ({ row }) => {
          const canDelete =
            row.original.status === "Processing" ||
            row.original.status === "Expired"
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Actions for ${row.original.invoiceNumber}`}
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onSelect={() => copyPublicCheckoutUrl(row.original)}
                >
                  <Copy className="size-3.5" />
                  Copy Link
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    setIsEditingSelected(false)
                    setSelectedInvoice(row.original)
                  }}
                >
                  <Eye className="size-3.5" />
                  View
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {canDelete ? (
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onSelect={() => promptDelete(row.original)}
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onSelect={() => {
                      downloadInvoicePdf(row.original)
                      toast.success(
                        `Downloaded ${row.original.invoiceNumber}.pdf`
                      )
                    }}
                  >
                    <Download className="size-3.5" />
                    Download PDF
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [brands, users, promptDelete]
  )

  const facetedFilters = React.useMemo<FacetedFilterConfig[]>(
    () => [
      {
        columnId: "status",
        title: "Status",
        options: INVOICE_STATUSES.map((s) => ({ label: s, value: s })),
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
        title="Invoices & Hosted Billing"
        description="Multi-currency milestone invoices with hosted client checkout links, automated taxes, and PDF previews."
        badge={<Badge variant="secondary">{invoices.length} invoices</Badge>}
        actions={
          <Button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="gap-1.5"
          >
            <Plus className="size-4" />
            Create Invoice
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={invoices}
        searchPlaceholder="Search invoices..."
        facetedFilters={facetedFilters}
        dateField="issuedAt"
        exportModule="Invoices"
        onRowClick={(inv) => {
          setIsEditingSelected(false)
          setSelectedInvoice(inv)
        }}
      />

      {/* Invoice Detail / Edit Sheet */}
      <Sheet
        open={Boolean(selectedInvoice)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedInvoice(null)
            setIsEditingSelected(false)
          }
        }}
      >
        <SheetContent side="right" className="overflow-y-auto sm:max-w-xl">
          {selectedInvoice ? (
            isEditingSelected &&
            (isOfflineMerchant(selectedInvoice.gateway) ||
              selectedInvoice.status === "Processing" ||
              selectedInvoice.status === "Expired") ? (
              <>
                <SheetHeader className="border-b border-border pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      {selectedInvoice.invoiceNumber}
                    </Badge>
                    <StatusBadge status={selectedInvoice.status} />
                  </div>
                  <SheetTitle className="mt-1">
                    Edit {selectedInvoice.invoiceNumber}
                  </SheetTitle>
                  <SheetDescription>
                    Update payment gateway, currency, due date, services, tax,
                    and discount. Client cannot be changed.
                  </SheetDescription>
                </SheetHeader>
                <InvoiceForm
                  key={selectedInvoice.id}
                  brands={brands}
                  leads={leads}
                  users={users}
                  editingInvoice={selectedInvoice}
                  onClose={() => setIsEditingSelected(false)}
                  onSave={(updates) => {
                    updateInvoice(selectedInvoice.id, updates)
                    setSelectedInvoice((prev) =>
                      prev && prev.id === selectedInvoice.id
                        ? { ...prev, ...updates }
                        : prev
                    )
                    toast.success(
                      `Invoice ${selectedInvoice.invoiceNumber} updated`
                    )
                    setIsEditingSelected(false)
                  }}
                />
              </>
            ) : (
              <>
                <SheetHeader className="border-b border-border pb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      {selectedInvoice.invoiceNumber}
                    </Badge>
                    <GatewayBadge gateway={selectedInvoice.gateway} />
                    <StatusBadge status={selectedInvoice.status} />
                  </div>
                  <SheetTitle className="mt-1 text-xl">
                    {selectedInvoice.clientCompany}
                  </SheetTitle>
                  <SheetDescription>
                    {selectedInvoice.clientName} • {selectedInvoice.clientEmail}
                  </SheetDescription>
                </SheetHeader>

                <div className="space-y-6 p-4">
                  <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/30 p-3.5 text-xs sm:grid-cols-3">
                    <div>
                      <div className="text-muted-foreground">Brand</div>
                      <div className="mt-1">
                        <BrandBadge
                          brandId={selectedInvoice.brandId}
                          brandName={selectedInvoice.brandName}
                          brands={brands}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Issued Date</div>
                      <div className="mt-0.5 font-medium tabular-nums">
                        {selectedInvoice.issuedAt}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Due Date</div>
                      <div className="mt-0.5 font-medium tabular-nums">
                        {selectedInvoice.dueDate}
                      </div>
                    </div>
                  </div>

                  {/* Services */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Services ({selectedInvoice.currency})
                    </h3>
                    <div className="divide-y divide-border rounded-lg border border-border">
                      {selectedInvoice.lineItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-3 p-3 text-sm"
                        >
                          <div className="min-w-0">
                            <div className="font-medium">{item.description}</div>
                            <div className="text-xs text-muted-foreground">
                              Qty {item.quantity} ×{" "}
                              {formatCurrency(
                                item.unitPrice,
                                selectedInvoice.currency
                              )}
                            </div>
                          </div>
                          <div className="shrink-0 font-semibold tabular-nums">
                            {formatCurrency(
                              item.quantity * item.unitPrice,
                              selectedInvoice.currency
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Totals breakdown */}
                  <div className="space-y-1.5 rounded-lg border border-border bg-muted/20 p-3.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="tabular-nums">
                        {formatCurrency(
                          selectedInvoice.subtotal,
                          selectedInvoice.currency
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {selectedInvoice.taxRate > 0
                          ? `Tax (${selectedInvoice.taxRate}%)`
                          : "Tax"}
                      </span>
                      <span className="tabular-nums">
                        {formatCurrency(
                          selectedInvoice.taxAmount,
                          selectedInvoice.currency
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Discount</span>
                      <span className="tabular-nums text-emerald-600 dark:text-emerald-400">
                        -
                        {formatCurrency(
                          selectedInvoice.discountAmount,
                          selectedInvoice.currency
                        )}
                      </span>
                    </div>
                    <Separator className="my-1" />
                    <div className="flex justify-between text-base font-bold">
                      <span>Total Due</span>
                      <span className="tabular-nums">
                        {formatUsdEquivalent(
                          selectedInvoice.total,
                          selectedInvoice.currency
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Attachments list (only for attachment merchants: ACH Routing, Bank Transfer, Zelle, Wise) */}
                  {isOfflineMerchant(selectedInvoice.gateway) ? (
                    <div className="space-y-2">
                      <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <Paperclip className="size-3.5" />
                        Attachments ({selectedInvoice.attachments.length})
                      </h3>
                      <div className="space-y-2">
                        {selectedInvoice.attachments.length === 0 ? (
                          <div className="text-xs text-muted-foreground">
                            No attachments uploaded.
                          </div>
                        ) : (
                          selectedInvoice.attachments.map((file) => (
                            <div
                              key={file.id}
                              className="flex items-center justify-between gap-2 rounded-lg border border-border p-2.5 text-xs"
                            >
                              <div className="flex min-w-0 items-center gap-2">
                                <FileText className="size-4 shrink-0 text-primary" />
                                <div className="min-w-0">
                                  <div className="truncate font-medium">
                                    {file.name}
                                  </div>
                                  <div className="text-[11px] text-muted-foreground">
                                    {file.size} • Uploaded by {file.uploadedBy}
                                  </div>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="xs"
                                onClick={() =>
                                  toast.info(`Previewing ${file.name}`)
                                }
                              >
                                View
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>

                <SheetFooter className="flex-row flex-wrap justify-between gap-2 border-t border-border pt-4 sm:justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => promptDelete(selectedInvoice)}
                  >
                    <Trash2 className="mr-1.5 size-4" />
                    Delete
                  </Button>
                  <div className="flex flex-wrap gap-2">
                    {isOfflineMerchant(selectedInvoice.gateway) ||
                    selectedInvoice.status === "Processing" ||
                    selectedInvoice.status === "Expired" ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditingSelected(true)}
                        className="gap-1.5"
                      >
                        <Edit3 className="size-4" />
                        Edit
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => copyPublicCheckoutUrl(selectedInvoice)}
                      className="gap-1.5"
                    >
                      <Copy className="size-4" />
                      Copy Link
                    </Button>
                    <Button asChild className="gap-1.5">
                      <Link
                        href={`/invoice/${selectedInvoice.id}`}
                        onClick={() => {
                          setSelectedInvoice(null)
                          setIsEditingSelected(false)
                        }}
                      >
                        Checkout
                        <ExternalLink className="size-4" />
                      </Link>
                    </Button>
                  </div>
                </SheetFooter>
              </>
            )
          ) : null}
        </SheetContent>
      </Sheet>

      {/* Invoice Create Sheet with Line-Item Editor & Live Total */}
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent side="right" className="overflow-y-auto sm:max-w-2xl">
          <SheetHeader className="border-b border-border pb-3">
            <SheetTitle>Create Multi-Currency Invoice</SheetTitle>
            <SheetDescription>
              Add services, taxes, and discount to generate a hosted checkout
              link.
            </SheetDescription>
          </SheetHeader>
          {createOpen ? (
            <InvoiceForm
              brands={brands}
              leads={leads}
              users={users}
              onClose={() => setCreateOpen(false)}
              onSave={(data) => {
                const created = createInvoice(data)
                toast.success(
                  `Invoice ${created.invoiceNumber} created (${formatCurrency(created.total, created.currency)})`
                )
                setCreateOpen(false)
              }}
            />
          ) : null}
        </SheetContent>
      </Sheet>

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title={`Delete Invoice "${deleteTarget?.invoiceNumber}"?`}
        description="Are you sure you want to remove this invoice? This will break any existing hosted payment links."
        warningMessage={deleteWarning}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}

function ClientSearchSelect({
  leads,
  brands,
  value,
  onSelect,
}: {
  leads: Lead[]
  brands: Brand[]
  value: string
  onSelect: (client: Lead | null) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<Lead[]>([])
  const [isSearching, setIsSearching] = React.useState(false)

  const selectedClient = React.useMemo(
    () => leads.find((l) => l.id === value) ?? null,
    [leads, value]
  )

  React.useEffect(() => {
    if (!open) return
    const q = query.trim().toLowerCase()
    if (!q) return

    let cancelled = false
    const timer = window.setTimeout(async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 180))
        const matches = leads.filter(
          (l) =>
            l.name.toLowerCase().includes(q) ||
            l.email.toLowerCase().includes(q) ||
            (l.company && l.company.toLowerCase().includes(q)) ||
            l.code.toLowerCase().includes(q)
        )
        if (!cancelled) {
          setResults(matches)
        }
      } finally {
        if (!cancelled) {
          setIsSearching(false)
        }
      }
    }, 200)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [open, query, leads])

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) {
      setQuery("")
      setResults([])
      setIsSearching(false)
    }
  }

  function handleQueryChange(val: string) {
    setQuery(val)
    if (!val.trim()) {
      setResults([])
      setIsSearching(false)
      return
    }
    setIsSearching(true)
  }

  const trimmedQuery = query.trim()

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Client</Label>
        {selectedClient ? (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="text-[11px] text-muted-foreground hover:text-foreground"
          >
            Clear selection
          </button>
        ) : null}
      </div>

      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-9 w-full justify-between bg-background text-xs font-normal"
          >
            {selectedClient ? (
              <span className="flex min-w-0 items-center gap-2 truncate">
                <User className="size-3.5 shrink-0 text-primary" />
                <span className="truncate font-medium text-foreground">
                  {selectedClient.name}
                </span>
                <span className="truncate text-muted-foreground">
                  ({selectedClient.email})
                </span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Search className="size-3.5 shrink-0" />
                <span>Search and select a client...</span>
              </span>
            )}
            <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[var(--radix-popover-trigger-width)] min-w-[300px] p-2"
        >
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search client by name, email, company, or ID..."
              aria-label="Search client"
              autoFocus
              className="h-8 pl-8 pr-7 text-xs"
            />
            {query ? (
              <button
                type="button"
                onClick={() => handleQueryChange("")}
                aria-label="Clear search"
                className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>

          <div className="max-h-56 space-y-1 overflow-y-auto">
            {!trimmedQuery ? (
              <div className="px-2 py-4 text-center text-xs text-muted-foreground">
                Type to search clients...
              </div>
            ) : isSearching ? (
              <div className="flex items-center justify-center gap-2 px-2 py-4 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                <span>Searching clients...</span>
              </div>
            ) : results.length === 0 ? (
              <div className="px-2 py-4 text-center text-xs text-muted-foreground">
                No matching clients found.
              </div>
            ) : (
              results.map((client) => {
                const isSelected = client.id === value
                return (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => {
                      onSelect(client)
                      handleOpenChange(false)
                    }}
                    className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] font-semibold text-primary">
                          {client.code}
                        </span>
                        <span className="truncate font-medium text-foreground">
                          {client.name}
                        </span>
                      </div>
                      <div className="truncate text-[11px] text-muted-foreground">
                        {client.email}
                        {client.company ? ` • ${client.company}` : ""}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <BrandBadge
                        brandId={client.brandId}
                        brandName={client.brandName}
                        brands={brands}
                        className="px-1.5 py-0 text-[10px]"
                      />
                      {isSelected ? (
                        <Check className="size-3.5 text-primary" />
                      ) : null}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </PopoverContent>
      </Popover>

      {selectedClient ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/25 px-3 py-2 text-xs">
          <div className="min-w-0">
            <div className="font-medium text-foreground">
              {selectedClient.company || selectedClient.name}
            </div>
            <div className="truncate text-[11px] text-muted-foreground">
              {selectedClient.name} • {selectedClient.email}
            </div>
          </div>
          <BrandBadge
            brandId={selectedClient.brandId}
            brandName={selectedClient.brandName}
            brands={brands}
          />
        </div>
      ) : null}
    </div>
  )
}

function InvoiceForm({
  brands,
  leads,
  users,
  editingInvoice = null,
  onClose,
  onSave,
}: {
  brands: Brand[]
  leads: Lead[]
  users: StaffUser[]
  editingInvoice?: Invoice | null
  onClose: () => void
  onSave: (invoice: Omit<Invoice, "id" | "invoiceNumber">) => void
}) {
  const defaultDueDate = React.useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 14)
    return d.toISOString().slice(0, 10)
  }, [])

  const [attachments, setAttachments] = React.useState<AttachmentFile[]>(
    editingInvoice?.attachments ?? []
  )

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: editingInvoice
      ? {
          clientId: editingInvoice.leadId || "locked-client",
          gateway: editingInvoice.gateway,
          status: isOfflineMerchant(editingInvoice.gateway)
            ? editingInvoice.status === "Success"
              ? "Success"
              : "Processing"
            : editingInvoice.status,
          currency: editingInvoice.currency,
          taxAmount: editingInvoice.taxAmount,
          discountAmount: editingInvoice.discountAmount,
          dueDate: editingInvoice.dueDate,
          lineItems:
            editingInvoice.lineItems.length > 0
              ? editingInvoice.lineItems.map((item) => ({
                  description: item.description,
                  amount: item.quantity * item.unitPrice,
                }))
              : [{ description: "", amount: 0 }],
        }
      : {
          clientId: "",
          gateway: "Stripe",
          status: "Created",
          currency: "USD",
          taxAmount: 0,
          discountAmount: 0,
          dueDate: defaultDueDate,
          lineItems: [
            {
              description: "",
              amount: 0,
            },
          ],
        },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lineItems",
  })

  const watchItems = useWatch({ control: form.control, name: "lineItems" })
  const watchGateway =
    useWatch({ control: form.control, name: "gateway" }) ?? "Stripe"
  const watchTaxAmount = useWatch({ control: form.control, name: "taxAmount" })
  const watchDiscount = useWatch({
    control: form.control,
    name: "discountAmount",
  })
  const watchCurrency = (useWatch({
    control: form.control,
    name: "currency",
  }) ?? "USD") as CurrencyCode

  const offlineMerchant = isOfflineMerchant(watchGateway)

  const liveSubtotal = React.useMemo(
    () =>
      (watchItems ?? []).reduce(
        (sum, item) => sum + Math.max(0, toSafeNumber(item?.amount)),
        0
      ),
    [watchItems]
  )
  const liveTaxAmount = Math.max(0, toSafeNumber(watchTaxAmount))
  const liveDiscount = Math.max(0, toSafeNumber(watchDiscount))
  const liveTotal = Math.max(0, liveSubtotal + liveTaxAmount - liveDiscount)

  function handleEvidenceUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    const today = new Date().toISOString().slice(0, 10)
    const uploader = users[0]?.name ?? "Marcus Vance"
    const nextFiles: AttachmentFile[] = Array.from(files).map((file) => {
      const kb = Math.max(1, Math.round(file.size / 1024))
      return {
        id: `att-${crypto.randomUUID().slice(0, 8)}`,
        name: file.name,
        size: kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`,
        type: file.type || "application/octet-stream",
        uploadedBy: uploader,
        uploadedAt: today,
      }
    })
    setAttachments((prev) => [...prev, ...nextFiles])
    e.target.value = ""
  }

  function removeAttachment(attId: string) {
    setAttachments((prev) => prev.filter((a) => a.id !== attId))
  }

  function onSubmit(values: InvoiceFormValues) {
    const mappedLineItems = values.lineItems.map((item, idx) => ({
      id: editingInvoice?.lineItems[idx]?.id || `li-new-${idx + 1}`,
      description: item.description,
      quantity: 1,
      unitPrice: toSafeNumber(item.amount),
    }))
    const today = new Date().toISOString().slice(0, 10)
    const isOffline = isOfflineMerchant(values.gateway)
    const resolvedStatus: PaymentStatus = isOffline
      ? values.status === "Success"
        ? "Success"
        : "Processing"
      : editingInvoice
        ? editingInvoice.status
        : "Created"

    if (editingInvoice) {
      onSave({
        leadId: editingInvoice.leadId,
        clientName: editingInvoice.clientName,
        clientEmail: editingInvoice.clientEmail,
        clientCompany: editingInvoice.clientCompany,
        brandId: editingInvoice.brandId,
        brandName: editingInvoice.brandName,
        projectId: editingInvoice.projectId,
        projectName: editingInvoice.projectName,
        gateway: values.gateway,
        currency: values.currency,
        lineItems: mappedLineItems,
        subtotal: liveSubtotal,
        taxRate: 0,
        taxAmount: liveTaxAmount,
        discountAmount: liveDiscount,
        total: liveTotal,
        status: resolvedStatus,
        dueDate: values.dueDate,
        issuedAt: editingInvoice.issuedAt,
        createdAt: editingInvoice.createdAt,
        createdBy: editingInvoice.createdBy,
        paidAt:
          resolvedStatus === "Success"
            ? editingInvoice.paidAt || today
            : undefined,
        salesRepId: editingInvoice.salesRepId,
        attachments,
        notes: editingInvoice.notes,
      })
      return
    }

    const selectedClient = leads.find((l) => l.id === values.clientId)
    if (!selectedClient) {
      form.setError("clientId", { message: "Please select a valid client" })
      return
    }
    const brand =
      brands.find(
        (b) =>
          b.id === selectedClient.brandId || b.name === selectedClient.brandName
      ) ?? brands[0]
    const brandName = selectedClient.brandName || brand?.name || "Primary Brand"
    const brandId = selectedClient.brandId || brand?.id || ""
    const nowTimestamp = new Date().toISOString().replace("T", " ").slice(0, 16)
    const creator = users[0]

    onSave({
      leadId: selectedClient.id,
      clientName: selectedClient.name,
      clientEmail: selectedClient.email,
      clientCompany: selectedClient.company || selectedClient.name,
      brandId,
      brandName,
      gateway: values.gateway,
      currency: values.currency,
      lineItems: mappedLineItems,
      subtotal: liveSubtotal,
      taxRate: 0,
      taxAmount: liveTaxAmount,
      discountAmount: liveDiscount,
      total: liveTotal,
      status: resolvedStatus,
      dueDate: values.dueDate,
      issuedAt: nowTimestamp.slice(0, 10),
      createdAt: nowTimestamp,
      createdBy: creator?.name ?? "Marcus Vance",
      salesRepId: creator?.id ?? "usr-1",
      paidAt: resolvedStatus === "Success" ? nowTimestamp.slice(0, 10) : undefined,
      attachments,
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 p-4">
      <div className="space-y-1.5">
        {editingInvoice ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Client</Label>
              <span className="flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                <Lock className="size-3" /> Locked in edit
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-input bg-muted/50 px-3 py-2 text-xs opacity-85 cursor-not-allowed">
              <div className="min-w-0">
                <div className="font-medium text-foreground">
                  {editingInvoice.clientCompany}
                </div>
                <div className="truncate text-[11px] text-muted-foreground">
                  {editingInvoice.clientName} • {editingInvoice.clientEmail}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <BrandBadge
                  brandId={editingInvoice.brandId}
                  brandName={editingInvoice.brandName}
                  brands={brands}
                />
                <Lock className="size-3.5 shrink-0 text-muted-foreground" />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Client cannot be changed once an invoice is created.
            </p>
          </div>
        ) : (
          <>
            <Controller
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <ClientSearchSelect
                  leads={leads}
                  brands={brands}
                  value={field.value}
                  onSelect={(client) => {
                    field.onChange(client?.id ?? "")
                    if (client?.currency) {
                      form.setValue("currency", client.currency)
                    }
                  }}
                />
              )}
            />
            {form.formState.errors.clientId ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.clientId.message}
              </p>
            ) : null}
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label>Payment Gateway</Label>
          <Controller
            control={form.control}
            name="gateway"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(val) => {
                  const nextGateway = val as PaymentGateway
                  field.onChange(nextGateway)
                  if (isOfflineMerchant(nextGateway)) {
                    const currStatus = form.getValues("status")
                    if (currStatus !== "Processing" && currStatus !== "Success") {
                      form.setValue("status", "Processing")
                    }
                  } else if (!editingInvoice) {
                    form.setValue("status", "Created")
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GATEWAYS.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Currency</Label>
          <Controller
            control={form.control}
            name="currency"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="CAD">CAD (CA$)</SelectItem>
                  <SelectItem value="AED">AED (AED)</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="inv-due">Due Date</Label>
          <Input id="inv-due" type="date" {...form.register("dueDate")} />
        </div>
      </div>

      {offlineMerchant ? (
        <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {watchGateway} Status & Evidence
            </div>
            <span className="text-[11px] text-muted-foreground">
              Manual attachment verification (no direct card pay)
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Payment Status</Label>
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Select
                    value={field.value || "Processing"}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Processing">Processing</SelectItem>
                      <SelectItem value="Success">Success</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="inv-evidence-upload">Upload Evidence</Label>
              <Label
                htmlFor="inv-evidence-upload"
                className="flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-muted/40"
              >
                <Upload className="size-3.5 text-primary" />
                <span>Attach proof file</span>
                <input
                  id="inv-evidence-upload"
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  className="sr-only"
                  onChange={handleEvidenceUpload}
                />
              </Label>
            </div>
          </div>

          {attachments.length > 0 ? (
            <div className="space-y-1.5">
              <div className="text-[11px] font-medium text-muted-foreground">
                Attached Evidence ({attachments.length})
              </div>
              <div className="space-y-1.5">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <FileText className="size-3.5 shrink-0 text-primary" />
                      <span className="truncate font-medium">{att.name}</span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {att.size}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(att.id)}
                      aria-label={`Remove ${att.name}`}
                      className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground">
              No evidence files attached yet. Upload receipt or transfer proof
              above.
            </p>
          )}
        </div>
      ) : null}

      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Service
          </Label>
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() =>
              append({
                description: "",
                amount: 0,
              })
            }
          >
            <Plus className="mr-1 size-3" />
            Add Row
          </Button>
        </div>

        <div className="space-y-2">
          {fields.map((field, idx) => (
            <div
              key={field.id}
              className="grid grid-cols-12 items-start gap-2 rounded-lg border border-border p-2.5 text-xs"
            >
              <div className="col-span-12 space-y-1 sm:col-span-7">
                <Input
                  placeholder="Description"
                  {...form.register(`lineItems.${idx}.description`)}
                />
                {form.formState.errors.lineItems?.[idx]?.description ? (
                  <p className="text-[11px] text-destructive">
                    {form.formState.errors.lineItems[idx]?.description?.message}
                  </p>
                ) : null}
              </div>
              <div className="col-span-9 space-y-1 sm:col-span-4">
                <Input
                  type="number"
                  placeholder="Amount"
                  {...form.register(`lineItems.${idx}.amount`, {
                    setValueAs: toSafeNumber,
                  })}
                />
                {form.formState.errors.lineItems?.[idx]?.amount ? (
                  <p className="text-[11px] text-destructive">
                    {form.formState.errors.lineItems[idx]?.amount?.message}
                  </p>
                ) : null}
              </div>
              <div className="col-span-3 flex justify-end pt-1 sm:col-span-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={fields.length === 1}
                  onClick={() => remove(idx)}
                >
                  <Trash2 className="size-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        {form.formState.errors.lineItems ? (
          <p className="text-xs text-destructive">
            {form.formState.errors.lineItems.message}
          </p>
        ) : null}
      </div>

      {/* Pricing adjustments */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="inv-tax">Tax Amount ({watchCurrency})</Label>
          <Input
            id="inv-tax"
            type="number"
            min="0"
            step="any"
            placeholder="0"
            {...form.register("taxAmount", { setValueAs: toSafeNumber })}
          />
          {form.formState.errors.taxAmount ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.taxAmount.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="inv-discount">Discount Amount ({watchCurrency})</Label>
          <Input
            id="inv-discount"
            type="number"
            min="0"
            step="any"
            placeholder="0"
            {...form.register("discountAmount", { setValueAs: toSafeNumber })}
          />
          {form.formState.errors.discountAmount ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.discountAmount.message}
            </p>
          ) : null}
        </div>
      </div>

      {/* Real-time Calculation Box */}
      <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
        <div className="flex justify-between py-0.5 text-muted-foreground">
          <span>Subtotal</span>
          <span className="tabular-nums">
            {formatCurrency(liveSubtotal, watchCurrency)}
          </span>
        </div>
        <div className="flex justify-between py-0.5 text-muted-foreground">
          <span>Tax</span>
          <span className="tabular-nums">
            {formatCurrency(liveTaxAmount, watchCurrency)}
          </span>
        </div>
        <div className="flex justify-between py-0.5 text-emerald-600 dark:text-emerald-400">
          <span>Discount</span>
          <span className="tabular-nums">
            -{formatCurrency(liveDiscount, watchCurrency)}
          </span>
        </div>
        <Separator className="my-2" />
        <div className="flex items-center justify-between text-base font-bold text-foreground">
          <span>Calculated Total</span>
          <span className="text-lg text-primary tabular-nums">
            {formatCurrency(liveTotal, watchCurrency)}
          </span>
        </div>
      </div>

      <SheetFooter className="px-0 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">
          {editingInvoice ? "Save Changes" : "Issue & Generate Payment Link"}
        </Button>
      </SheetFooter>
    </form>
  )
}
