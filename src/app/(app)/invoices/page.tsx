"use client"

import * as React from "react"
import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  Copy,
  ExternalLink,
  FileText,
  Paperclip,
  Plus,
  Trash2,
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Textarea } from "@/components/ui/textarea"
import { formatCurrency, formatUsdEquivalent } from "@/lib/currency"
import { MOCK_INVOICES } from "@/mocks/billing"
import { MOCK_BRANDS } from "@/mocks/brands"
import type {
  CurrencyCode,
  Invoice,
  PaymentGateway,
  PaymentStatus,
} from "@/types"

const GATEWAYS: PaymentGateway[] = [
  "Stripe",
  "Square",
  "Authorize.Net",
  "NMI",
  "Bank Transfer",
]

const INVOICE_STATUSES: PaymentStatus[] = [
  "Created",
  "Viewed",
  "Processing",
  "Success",
  "Denied",
  "Refund Requested",
  "Refunded",
  "Chargeback",
]

const lineItemSchema = z.object({
  description: z.string().min(2, "Item description required"),
  quantity: z.number().min(1, "Min qty 1"),
  unitPrice: z.number().min(1, "Min price 1"),
})

const invoiceSchema = z.object({
  clientName: z.string().min(2, "Client name is required"),
  clientEmail: z.string().email("Valid email required"),
  clientCompany: z.string().min(2, "Company name is required"),
  brandId: z.string().min(1),
  gateway: z.enum([
    "Stripe",
    "Square",
    "Authorize.Net",
    "NMI",
    "Bank Transfer",
  ]),
  currency: z.enum(["USD", "GBP", "CAD"]),
  taxRate: z.number().min(0).max(30),
  discountAmount: z.number().min(0),
  dueDate: z.string().min(8),
  notes: z.string().optional(),
  lineItems: z.array(lineItemSchema).min(1, "Add at least one line item"),
})

type InvoiceFormValues = z.infer<typeof invoiceSchema>

export default function InvoicesPage() {
  const [invoices, setInvoices] = React.useState<Invoice[]>(MOCK_INVOICES)
  const [selectedInvoice, setSelectedInvoice] = React.useState<Invoice | null>(
    null
  )
  const [createOpen, setCreateOpen] = React.useState(false)

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
        accessorKey: "total",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Total" />
        ),
        cell: ({ row }) => (
          <div className="font-medium tabular-nums">
            {formatUsdEquivalent(row.original.total, row.original.currency)}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "dueDate",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Due Date" />
        ),
        cell: ({ row }) => (
          <span className="text-xs tabular-nums text-muted-foreground">
            {row.original.dueDate}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        enableHiding: false,
        cell: ({ row }) => (
          <Button asChild variant="ghost" size="xs" className="gap-1">
            <Link href={`/invoice/${row.original.id}`}>
              Pay Page
              <ExternalLink className="size-3" />
            </Link>
          </Button>
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
        options: MOCK_BRANDS.map((b) => ({ label: b.name, value: b.name })),
      },
    ],
    []
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description="Multi-currency billing with hosted payment links across Stripe, Square, Authorize.Net, NMI, and Bank Transfer."
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
        onRowClick={setSelectedInvoice}
      />

      {/* Invoice Detail Sheet */}
      <Sheet
        open={Boolean(selectedInvoice)}
        onOpenChange={(open) => !open && setSelectedInvoice(null)}
      >
        <SheetContent side="right" className="overflow-y-auto sm:max-w-xl">
          {selectedInvoice ? (
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
                    <div className="mt-0.5 font-medium">
                      {selectedInvoice.brandName}
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

                {/* Line Items */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Line Items ({selectedInvoice.currency})
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
                      Tax ({selectedInvoice.taxRate}%)
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
                    <span className="tabular-nums text-(--tone-emerald-text)">
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

                {/* Attachments list */}
                <div className="space-y-2">
                  <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <Paperclip className="size-3.5" />
                    Attachments ({selectedInvoice.attachments.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedInvoice.attachments.map((file) => (
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
                            toast.info(`Previewing ${file.name} (mock file)`)
                          }
                        >
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <SheetFooter className="border-t border-border sm:flex-row sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => copyPublicCheckoutUrl(selectedInvoice)}
                  className="gap-1.5"
                >
                  <Copy className="size-4" />
                  Copy Payment Link
                </Button>
                <Button asChild className="gap-1.5">
                  <Link href={`/invoice/${selectedInvoice.id}`}>
                    Open Hosted Checkout
                    <ExternalLink className="size-4" />
                  </Link>
                </Button>
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* Invoice Create Sheet with Line-Item Editor & Live Total */}
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent side="right" className="overflow-y-auto sm:max-w-2xl">
          <SheetHeader className="border-b border-border pb-3">
            <SheetTitle>Create Multi-Currency Invoice</SheetTitle>
            <SheetDescription>
              Add line items, taxes, and discount to generate a hosted checkout
              link.
            </SheetDescription>
          </SheetHeader>
          {createOpen ? (
            <CreateInvoiceForm
              invoiceCount={invoices.length}
              onClose={() => setCreateOpen(false)}
              onCreate={(created) => {
                setInvoices((prev) => [created, ...prev])
                setCreateOpen(false)
              }}
            />
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function CreateInvoiceForm({
  invoiceCount,
  onClose,
  onCreate,
}: {
  invoiceCount: number
  onClose: () => void
  onCreate: (invoice: Invoice) => void
}) {
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      clientName: "",
      clientEmail: "",
      clientCompany: "",
      brandId: MOCK_BRANDS[0].id,
      gateway: "Stripe",
      currency: "USD",
      taxRate: 0,
      discountAmount: 0,
      dueDate: "2026-11-25",
      notes: "Net-14 milestone billing. Includes responsive QA verification.",
      lineItems: [
        {
          description: "Website Redesign & Component Library",
          quantity: 1,
          unitPrice: 3200,
        },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lineItems",
  })

  const watchItems = useWatch({ control: form.control, name: "lineItems" })
  const watchTaxRate = useWatch({ control: form.control, name: "taxRate" }) ?? 0
  const watchDiscount =
    useWatch({ control: form.control, name: "discountAmount" }) ?? 0
  const watchCurrency = (useWatch({
    control: form.control,
    name: "currency",
  }) ?? "USD") as CurrencyCode

  const liveSubtotal = React.useMemo(
    () =>
      (watchItems ?? []).reduce(
        (sum, item) =>
          sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
        0
      ),
    [watchItems]
  )
  const liveTaxAmount =
    Math.round(liveSubtotal * (Number(watchTaxRate) / 100) * 100) / 100
  const liveTotal = Math.max(
    0,
    liveSubtotal + liveTaxAmount - Number(watchDiscount)
  )

  function onSubmit(values: InvoiceFormValues) {
    const brand =
      MOCK_BRANDS.find((b) => b.id === values.brandId) ?? MOCK_BRANDS[0]
    const invoiceNumber = `INV-2026-${1060 + invoiceCount}`
    const created: Invoice = {
      id: `inv-new-${invoiceCount + 1}`,
      invoiceNumber,
      clientName: values.clientName,
      clientEmail: values.clientEmail,
      clientCompany: values.clientCompany,
      brandId: brand.id,
      brandName: brand.name,
      gateway: values.gateway,
      currency: values.currency,
      lineItems: values.lineItems.map((item, idx) => ({
        id: `li-new-${idx}`,
        ...item,
      })),
      subtotal: liveSubtotal,
      taxRate: values.taxRate,
      taxAmount: liveTaxAmount,
      discountAmount: values.discountAmount,
      total: liveTotal,
      status: "Created",
      dueDate: values.dueDate,
      issuedAt: "2026-11-11",
      salesRepId: "usr-2",
      attachments: [
        {
          id: "att-new-1",
          name: `${invoiceNumber}-proposal.pdf`,
          size: "380 KB",
          type: "application/pdf",
          uploadedBy: "Elena Rostova",
          uploadedAt: "2026-11-11",
        },
      ],
      notes: values.notes,
    }
    toast.success(
      `Invoice ${invoiceNumber} created (${formatCurrency(liveTotal, values.currency)})`
    )
    onCreate(created)
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="inv-client">Client Name</Label>
          <Input id="inv-client" {...form.register("clientName")} />
          {form.formState.errors.clientName ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.clientName.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="inv-company">Company</Label>
          <Input id="inv-company" {...form.register("clientCompany")} />
          {form.formState.errors.clientCompany ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.clientCompany.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="inv-email">Client Email</Label>
          <Input
            id="inv-email"
            type="email"
            {...form.register("clientEmail")}
          />
          {form.formState.errors.clientEmail ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.clientEmail.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="space-y-1.5">
          <Label>Brand</Label>
          <Controller
            control={form.control}
            name="brandId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
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
            )}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Payment Gateway</Label>
          <Controller
            control={form.control}
            name="gateway"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
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

      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Line Items
          </Label>
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() =>
              append({
                description: "Additional Deliverable",
                quantity: 1,
                unitPrice: 500,
              })
            }
          >
            <Plus className="mr-1 size-3" />
            Add Row
          </Button>
        </div>

        <div className="space-y-2 rounded-lg border border-border p-3">
          {fields.map((fieldItem, idx) => (
            <div
              key={fieldItem.id}
              className="grid grid-cols-12 items-end gap-2"
            >
              <div className="col-span-12 sm:col-span-6 space-y-1">
                {idx === 0 ? (
                  <Label className="text-[11px] text-muted-foreground">
                    Description
                  </Label>
                ) : null}
                <Input
                  placeholder="Deliverable description"
                  {...form.register(`lineItems.${idx}.description`)}
                />
              </div>
              <div className="col-span-4 sm:col-span-2 space-y-1">
                {idx === 0 ? (
                  <Label className="text-[11px] text-muted-foreground">
                    Qty
                  </Label>
                ) : null}
                <Input
                  type="number"
                  min={1}
                  {...form.register(`lineItems.${idx}.quantity`, {
                    valueAsNumber: true,
                  })}
                />
              </div>
              <div className="col-span-6 sm:col-span-3 space-y-1">
                {idx === 0 ? (
                  <Label className="text-[11px] text-muted-foreground">
                    Unit Price
                  </Label>
                ) : null}
                <Input
                  type="number"
                  min={1}
                  {...form.register(`lineItems.${idx}.unitPrice`, {
                    valueAsNumber: true,
                  })}
                />
              </div>
              <div className="col-span-2 sm:col-span-1 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={fields.length <= 1}
                  onClick={() => remove(idx)}
                  aria-label="Remove line item"
                >
                  <Trash2 className="size-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="inv-tax">Tax (%)</Label>
            <Input
              id="inv-tax"
              type="number"
              min={0}
              max={30}
              {...form.register("taxRate", { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inv-discount">Discount</Label>
            <Input
              id="inv-discount"
              type="number"
              min={0}
              {...form.register("discountAmount", { valueAsNumber: true })}
            />
          </div>
        </div>

        <div className="space-y-1 rounded-lg border border-border bg-muted/30 p-3 text-sm">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="tabular-nums">
              {formatCurrency(liveSubtotal, watchCurrency)}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">
              Tax ({watchTaxRate}%)
            </span>
            <span className="tabular-nums">
              {formatCurrency(liveTaxAmount, watchCurrency)}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Discount</span>
            <span className="tabular-nums">
              -{formatCurrency(watchDiscount, watchCurrency)}
            </span>
          </div>
          <Separator className="my-1" />
          <div className="flex justify-between font-bold">
            <span>Live Total</span>
            <span className="tabular-nums text-primary">
              {formatUsdEquivalent(liveTotal, watchCurrency)}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="inv-notes">Terms & Notes</Label>
        <Textarea id="inv-notes" rows={2} {...form.register("notes")} />
      </div>

      <SheetFooter className="px-0">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">Generate Invoice</Button>
      </SheetFooter>
    </form>
  )
}
