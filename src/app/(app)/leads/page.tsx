"use client"

import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  Building2,
  Edit3,
  History,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone,
  Plus,
  UserCheck,
} from "lucide-react"
import {
  DataTable,
  DataTableColumnHeader,
  type FacetedFilterConfig,
} from "@/components/data-table"
import {
  AvatarGroup,
  PageHeader,
  StatusBadge,
} from "@/components/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { formatCurrency } from "@/lib/currency"
import { MOCK_BRANDS, MOCK_CITIES } from "@/mocks/brands"
import { MOCK_LEADS } from "@/mocks/leads"
import { MOCK_USERS } from "@/mocks/users"
import type { CurrencyCode, Lead, LeadSource, LeadStatus } from "@/types"

const LEAD_SOURCES: LeadSource[] = [
  "Google Ads",
  "Bing Ads",
  "Website",
  "Organic SEO",
  "Referral",
  "Social Media",
  "Email Campaign",
]

const LEAD_STATUSES: LeadStatus[] = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal Sent",
  "Converted",
  "Lost",
]

const leadSchema = z.object({
  name: z.string().min(2, "Contact name is required"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().min(6, "Phone number is required"),
  company: z.string().min(2, "Company name is required"),
  brandId: z.string().min(1, "Select a brand"),
  source: z.enum([
    "Google Ads",
    "Bing Ads",
    "Website",
    "Organic SEO",
    "Referral",
    "Social Media",
    "Email Campaign",
  ]),
  city: z.string().min(1, "Select a city"),
  currency: z.enum(["USD", "GBP", "CAD"]),
  estimatedValue: z.number().min(100, "Minimum value is 100"),
  status: z.enum([
    "New",
    "Contacted",
    "Qualified",
    "Proposal Sent",
    "Converted",
    "Lost",
  ]),
  assignedStaffId: z.string().min(1, "Assign a staff owner"),
  notes: z.string().optional(),
})

type LeadFormValues = z.infer<typeof leadSchema>

const STAFF_OPTIONS = MOCK_USERS.filter((u) => u.status === "Active")

export default function LeadsPage() {
  const [leads, setLeads] = React.useState<Lead[]>(MOCK_LEADS)
  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null)
  const [formOpen, setFormOpen] = React.useState(false)
  const [editingLead, setEditingLead] = React.useState<Lead | null>(null)

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      brandId: MOCK_BRANDS[0].id,
      source: "Google Ads",
      city: MOCK_CITIES[0].name,
      currency: "USD",
      estimatedValue: 5000,
      status: "New",
      assignedStaffId: STAFF_OPTIONS[1]?.id ?? STAFF_OPTIONS[0].id,
      notes: "",
    },
  })

  function openCreateSheet() {
    setEditingLead(null)
    form.reset({
      name: "",
      email: "",
      phone: "+1 (555) 201-9900",
      company: "",
      brandId: MOCK_BRANDS[0].id,
      source: "Google Ads",
      city: MOCK_CITIES[0].name,
      currency: "USD",
      estimatedValue: 5000,
      status: "New",
      assignedStaffId: STAFF_OPTIONS[1]?.id ?? STAFF_OPTIONS[0].id,
      notes: "",
    })
    setFormOpen(true)
  }

  const openEditSheet = React.useCallback(
    (lead: Lead) => {
      setEditingLead(lead)
      form.reset({
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        brandId: lead.brandId,
        source: lead.source,
        city: lead.city,
        currency: lead.currency,
        estimatedValue: lead.estimatedValue,
        status: lead.status,
        assignedStaffId: lead.assignedStaffIds[0] ?? STAFF_OPTIONS[0].id,
        notes: lead.notes,
      })
      setFormOpen(true)
    },
    [form]
  )

  function onSubmit(values: LeadFormValues) {
    const brand =
      MOCK_BRANDS.find((b) => b.id === values.brandId) ?? MOCK_BRANDS[0]
    const cityObj =
      MOCK_CITIES.find((c) => c.name === values.city) ?? MOCK_CITIES[0]
    const owner =
      MOCK_USERS.find((u) => u.id === values.assignedStaffId) ?? MOCK_USERS[0]

    if (editingLead) {
      const updated: Lead = {
        ...editingLead,
        name: values.name,
        email: values.email,
        phone: values.phone,
        company: values.company,
        brandId: brand.id,
        brandName: brand.name,
        source: values.source,
        city: cityObj.name,
        country: cityObj.country,
        currency: values.currency as CurrencyCode,
        estimatedValue: values.estimatedValue,
        status: values.status,
        assignedStaffIds: [values.assignedStaffId],
        notes: values.notes ?? "",
        assignmentHistory:
          editingLead.assignedStaffIds[0] !== values.assignedStaffId
            ? [
                ...editingLead.assignmentHistory,
                {
                  id: `hist-${editingLead.assignmentHistory.length + 1}`,
                  fromStaffName:
                    MOCK_USERS.find(
                      (u) => u.id === editingLead.assignedStaffIds[0]
                    )?.name ?? null,
                  toStaffName: owner.name,
                  assignedBy: "Current User",
                  timestamp: "2026-11-11 18:10",
                  note: "Updated owner via Lead Edit drawer",
                },
              ]
            : editingLead.assignmentHistory,
      }
      setLeads((prev) =>
        prev.map((l) => (l.id === editingLead.id ? updated : l))
      )
      setSelectedLead(updated)
      toast.success(`Lead ${updated.code} updated`)
    } else {
      const created: Lead = {
        id: `lead-new-${leads.length + 1}`,
        code: `LD-${2090 + leads.length}`,
        name: values.name,
        email: values.email,
        phone: values.phone,
        company: values.company,
        brandId: brand.id,
        brandName: brand.name,
        source: values.source,
        city: cityObj.name,
        country: cityObj.country,
        currency: values.currency as CurrencyCode,
        estimatedValue: values.estimatedValue,
        status: values.status,
        assignedStaffIds: [values.assignedStaffId],
        createdAt: "2026-11-11",
        notes: values.notes ?? "",
        assignmentHistory: [
          {
            id: `hist-new-1`,
            fromStaffName: null,
            toStaffName: owner.name,
            assignedBy: "Manual Intake",
            timestamp: "2026-11-11 18:00",
            note: `Lead created under ${brand.name}`,
          },
        ],
      }
      setLeads((prev) => [created, ...prev])
      toast.success(`Lead ${created.code} created`)
    }
    setFormOpen(false)
  }

  const columns = React.useMemo<ColumnDef<Lead>[]>(
    () => [
      {
        accessorKey: "code",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="ID" />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold text-primary">
            {row.original.code}
          </span>
        ),
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Lead & Company" />
        ),
        cell: ({ row }) => (
          <div className="min-w-[160px]">
            <div className="font-medium text-foreground">{row.original.name}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.company}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.email}
          </span>
        ),
      },
      {
        accessorKey: "brandName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Brand" />
        ),
        cell: ({ row }) => (
          <Badge variant="outline" className="font-normal">
            {row.original.brandName}
          </Badge>
        ),
      },
      {
        accessorKey: "source",
        header: "Source",
        cell: ({ row }) => (
          <span className="text-xs text-foreground">{row.original.source}</span>
        ),
      },
      {
        accessorKey: "city",
        header: "City",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.city}
          </span>
        ),
      },
      {
        id: "assigned",
        header: "Assigned Staff",
        cell: ({ row }) => {
          const staff = MOCK_USERS.filter((u) =>
            row.original.assignedStaffIds.includes(u.id)
          )
          return <AvatarGroup people={staff} max={3} />
        },
      },
      {
        accessorKey: "estimatedValue",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Est. Value" />
        ),
        cell: ({ row }) => (
          <span className="font-medium tabular-nums">
            {formatCurrency(row.original.estimatedValue, row.original.currency)}
          </span>
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
          <DataTableColumnHeader column={column} title="Created" />
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Actions for ${row.original.code}`}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setSelectedLead(row.original)}>
                View Details & History
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => openEditSheet(row.original)}>
                Edit Lead
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [openEditSheet]
  )

  const facetedFilters = React.useMemo<FacetedFilterConfig[]>(
    () => [
      {
        columnId: "status",
        title: "Status",
        options: LEAD_STATUSES.map((s) => ({ label: s, value: s })),
      },
      {
        columnId: "brandName",
        title: "Brand",
        options: MOCK_BRANDS.map((b) => ({ label: b.name, value: b.name })),
      },
      {
        columnId: "source",
        title: "Source",
        options: LEAD_SOURCES.map((s) => ({ label: s, value: s })),
      },
    ],
    []
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description="Track inbound inquiries across brands, acquisition channels, and sales assignment history."
        badge={<Badge variant="secondary">{leads.length} total</Badge>}
        actions={
          <Button type="button" onClick={openCreateSheet} className="gap-1.5">
            <Plus className="size-4" />
            New Lead
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={leads}
        searchPlaceholder="Search leads..."
        facetedFilters={facetedFilters}
        dateField="createdAt"
        exportModule="Leads"
        onRowClick={(lead) => setSelectedLead(lead)}
      />

      {/* Show Lead Details Sheet with Assignment History Timeline */}
      <Sheet
        open={Boolean(selectedLead)}
        onOpenChange={(open) => !open && setSelectedLead(null)}
      >
        <SheetContent side="right" className="overflow-y-auto sm:max-w-xl">
          {selectedLead ? (
            <>
              <SheetHeader className="border-b border-border pb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="font-mono">
                    {selectedLead.code}
                  </Badge>
                  <StatusBadge status={selectedLead.status} />
                </div>
                <SheetTitle className="mt-1 text-xl">
                  {selectedLead.name}
                </SheetTitle>
                <SheetDescription>{selectedLead.company}</SheetDescription>
              </SheetHeader>

              <div className="space-y-6 p-4">
                {/* Summary details */}
                <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-muted/30 p-3.5 text-sm sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <Mail className="size-4 text-muted-foreground" />
                    <span className="truncate">{selectedLead.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="size-4 text-muted-foreground" />
                    <span>{selectedLead.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="size-4 text-muted-foreground" />
                    <span>{selectedLead.brandName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4 text-muted-foreground" />
                    <span>
                      {selectedLead.city}, {selectedLead.country}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Source: </span>
                    <span className="font-medium">{selectedLead.source}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Est. Value:{" "}
                    </span>
                    <span className="font-semibold tabular-nums">
                      {formatCurrency(
                        selectedLead.estimatedValue,
                        selectedLead.currency
                      )}
                    </span>
                  </div>
                </div>

                {/* Assigned Staff */}
                <div className="space-y-2">
                  <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <UserCheck className="size-3.5" />
                    Assigned Owners
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {MOCK_USERS.filter((u) =>
                      selectedLead.assignedStaffIds.includes(u.id)
                    ).map((staff) => (
                      <div
                        key={staff.id}
                        className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-1.5 text-xs"
                      >
                        <span
                          className={`flex size-6 items-center justify-center rounded-full text-[10px] font-bold text-white ${staff.avatarColor}`}
                        >
                          {staff.avatarInitials}
                        </span>
                        <div>
                          <div className="font-medium">{staff.name}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {staff.role}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Intake Notes
                  </h3>
                  <p className="rounded-lg border border-border p-3 text-sm text-muted-foreground">
                    {selectedLead.notes}
                  </p>
                </div>

                {/* Assignment History Timeline */}
                <div className="space-y-3">
                  <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <History className="size-3.5" />
                    Assignment History Timeline
                  </h3>
                  <ol className="relative ml-2 space-y-4 border-l border-border pl-5">
                    {selectedLead.assignmentHistory.map((evt) => (
                      <li key={evt.id} className="relative space-y-1">
                        <span className="absolute -left-[25px] top-1 size-2.5 rounded-full border-2 border-background bg-primary [[data-theme=studio]_&]:ring-4 [[data-theme=studio]_&]:ring-primary/15" />
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-sm font-medium text-foreground">
                            {evt.fromStaffName
                              ? `${evt.fromStaffName} → ${evt.toStaffName}`
                              : `Assigned to ${evt.toStaffName}`}
                          </span>
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {evt.timestamp}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {evt.note}
                        </p>
                        <p className="text-[11px] text-muted-foreground/80">
                          By {evt.assignedBy}
                        </p>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              <SheetFooter className="border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => openEditSheet(selectedLead)}
                  className="gap-1.5"
                >
                  <Edit3 className="size-4" />
                  Edit Lead
                </Button>
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* Create / Edit Lead Sheet */}
      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent side="right" className="overflow-y-auto sm:max-w-lg">
          <SheetHeader className="border-b border-border pb-3">
            <SheetTitle>
              {editingLead ? `Edit ${editingLead.code}` : "Create New Lead"}
            </SheetTitle>
            <SheetDescription>
              Capture client contact details, brand assignment, and estimated
              deal value.
            </SheetDescription>
          </SheetHeader>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 p-4"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="lead-name">Contact Name</Label>
                <Input id="lead-name" {...form.register("name")} />
                {form.formState.errors.name ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lead-company">Company</Label>
                <Input id="lead-company" {...form.register("company")} />
                {form.formState.errors.company ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.company.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lead-email">Email</Label>
                <Input
                  id="lead-email"
                  type="email"
                  {...form.register("email")}
                />
                {form.formState.errors.email ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.email.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lead-phone">Phone</Label>
                <Input id="lead-phone" {...form.register("phone")} />
                {form.formState.errors.phone ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.phone.message}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                <Label>Source</Label>
                <Controller
                  control={form.control}
                  name="source"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LEAD_SOURCES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label>City</Label>
                <Controller
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MOCK_CITIES.map((c) => (
                          <SelectItem key={c.id} value={c.name}>
                            {c.name} ({c.currency})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Status</Label>
                <Controller
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LEAD_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
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
                <Label htmlFor="lead-value">Estimated Value</Label>
                <Input
                  id="lead-value"
                  type="number"
                  {...form.register("estimatedValue", { valueAsNumber: true })}
                />
                {form.formState.errors.estimatedValue ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.estimatedValue.message}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Assign Owner</Label>
              <Controller
                control={form.control}
                name="assignedStaffId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STAFF_OPTIONS.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name} — {u.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lead-notes">Notes</Label>
              <Textarea id="lead-notes" rows={3} {...form.register("notes")} />
            </div>

            <SheetFooter className="px-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingLead ? "Save Changes" : "Create Lead"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
