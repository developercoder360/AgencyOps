"use client"

import * as React from "react"
import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  Building2,
  Check,
  ChevronsUpDown,
  Copy,
  Edit3,
  Eye,
  EyeOff,
  FileText,
  FolderKanban,
  KeyRound,
  Layers,
  Lock,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone,
  Plus,
  Trash2,
  UserCheck,
  Users,
  X,
} from "lucide-react"
import {
  DataTable,
  DataTableColumnHeader,
  type FacetedFilterConfig,
} from "@/components/data-table"
import {
  AvatarGroup,
  ConfirmDeleteDialog,
  GatewayBadge,
  PageHeader,
  StatusBadge,
} from "@/components/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { AVAILABLE_SERVICES } from "@/demo-data/leads"
import { formatCurrency } from "@/lib/currency"
import { useStore } from "@/lib/store"
import type { CurrencyCode, Lead, LeadSource, StaffUser } from "@/types"

const LEAD_SOURCES: LeadSource[] = [
  "Google Ads",
  "Bing Ads",
  "Website",
  "Organic SEO",
  "Referral",
  "Social Media",
  "Email Campaign",
]

const leadSchema = z
  .object({
    name: z.string().min(2, "Contact name is required"),
    email: z.string().email("Enter a valid email address"),
    phone: z.string().min(6, "Phone number is required"),
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
    address: z.string().optional(),
    city: z.string().min(1, "Select a city"),
    zipCode: z.string().optional(),
    services: z.array(z.string()),
    assignedStaffIds: z.array(z.string()).min(1, "Assign at least one user"),
    clientPassword: z.string().optional(),
    confirmPassword: z.string().optional(),
    description: z.string().optional(),
  })
  .refine(
    (data) => {
      const pwd = data.clientPassword || ""
      const cpwd = data.confirmPassword || ""
      if (pwd || cpwd) {
        return pwd === cpwd
      }
      return true
    },
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }
  )

type LeadFormValues = z.infer<typeof leadSchema>

function ServicesMultiSelect({
  selected,
  onChange,
}: {
  selected: string[]
  onChange: (val: string[]) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const filtered = React.useMemo(() => {
    if (!search.trim()) return AVAILABLE_SERVICES
    const q = search.toLowerCase()
    return AVAILABLE_SERVICES.filter((s) => s.toLowerCase().includes(q))
  }, [search])

  const toggleService = (service: string) => {
    if (selected.includes(service)) {
      onChange(selected.filter((s) => s !== service))
    } else {
      onChange([...selected, service])
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Requested Services</Label>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[11px] text-muted-foreground hover:text-foreground"
          >
            Clear all ({selected.length})
          </button>
        )}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between text-xs font-normal h-9 bg-background"
          >
            <span className="flex items-center gap-1.5 truncate">
              <Layers className="size-3.5 text-muted-foreground shrink-0" />
              {selected.length > 0
                ? `${selected.length} service${selected.length === 1 ? "" : "s"} selected`
                : "Select services..."}
            </span>
            <ChevronsUpDown className="size-3.5 opacity-50 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[340px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search services..."
              value={search}
              onValueChange={setSearch}
              className="text-xs"
            />
            <CommandList className="max-h-60 overflow-y-auto">
              {filtered.length === 0 ? (
                <CommandEmpty>No service found.</CommandEmpty>
              ) : (
                <CommandGroup>
                  {filtered.map((service) => {
                    const isSelected = selected.includes(service)
                    return (
                      <CommandItem
                        key={service}
                        onSelect={() => toggleService(service)}
                        className="cursor-pointer text-xs flex items-center justify-between py-1.5"
                      >
                        <span className="truncate">{service}</span>
                        {isSelected && (
                          <Check className="size-3.5 text-primary shrink-0" />
                        )}
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected badges display */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 rounded-lg border border-border bg-muted/20">
          {selected.map((s) => (
            <Badge
              key={s}
              variant="secondary"
              className="gap-1 text-[11px] font-normal py-0.5 pl-2 pr-1"
            >
              <span className="truncate max-w-[200px]">{s}</span>
              <button
                type="button"
                onClick={() => toggleService(s)}
                className="hover:bg-muted-foreground/20 rounded-full p-0.5"
                aria-label={`Remove ${s}`}
              >
                <X className="size-3 text-muted-foreground hover:text-foreground" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

function StaffMultiSelect({
  staffList,
  selectedIds,
  onChange,
}: {
  staffList: StaffUser[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const filtered = React.useMemo(() => {
    if (!search.trim()) return staffList
    const q = search.toLowerCase()
    return staffList.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.department.toLowerCase().includes(q)
    )
  }, [search, staffList])

  const toggleStaff = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((sId) => sId !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Assigned User</Label>
        {selectedIds.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[11px] text-muted-foreground hover:text-foreground"
          >
            Clear all ({selectedIds.length})
          </button>
        )}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between text-xs font-normal h-9 bg-background"
          >
            <span className="flex items-center gap-1.5 truncate">
              <Users className="size-3.5 text-muted-foreground shrink-0" />
              {selectedIds.length > 0
                ? `${selectedIds.length} user${selectedIds.length === 1 ? "" : "s"} assigned`
                : "Search and assign users..."}
            </span>
            <ChevronsUpDown className="size-3.5 opacity-50 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[360px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search user by name, role, email..."
              value={search}
              onValueChange={setSearch}
              className="text-xs"
            />
            <CommandList className="max-h-60 overflow-y-auto">
              {filtered.length === 0 ? (
                <CommandEmpty>No staff member found.</CommandEmpty>
              ) : (
                <CommandGroup>
                  {filtered.map((u) => {
                    const isSelected = selectedIds.includes(u.id)
                    return (
                      <CommandItem
                        key={u.id}
                        onSelect={() => toggleStaff(u.id)}
                        className="cursor-pointer text-xs flex items-center justify-between py-1.5 gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${u.avatarColor}`}
                          >
                            {u.avatarInitials}
                          </span>
                          <div className="truncate">
                            <p className="font-medium text-foreground truncate">{u.name}</p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {u.role} • {u.department}
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="size-3.5 text-primary shrink-0" />
                        )}
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected badges display */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 rounded-lg border border-border bg-muted/20">
          {selectedIds.map((id) => {
            const u = staffList.find((s) => s.id === id)
            if (!u) return null
            return (
              <Badge
                key={u.id}
                variant="secondary"
                className="gap-1.5 text-[11px] font-normal py-0.5 pl-1.5 pr-1 items-center"
              >
                <span
                  className={`flex size-4 shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-white ${u.avatarColor}`}
                >
                  {u.avatarInitials}
                </span>
                <span className="truncate max-w-[150px]">{u.name}</span>
                <button
                  type="button"
                  onClick={() => toggleStaff(u.id)}
                  className="hover:bg-muted-foreground/20 rounded-full p-0.5"
                  aria-label={`Remove ${u.name}`}
                >
                  <X className="size-3 text-muted-foreground hover:text-foreground" />
                </button>
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function LeadsPage() {
  const {
    leads,
    brands,
    cities,
    users,
    invoices,
    projects,
    createLead,
    updateLead,
    deleteLead,
    checkLeadDeletion,
  } = useStore()

  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null)
  const [formOpen, setFormOpen] = React.useState(false)
  const [editingLead, setEditingLead] = React.useState<Lead | null>(null)
  const [showClientPassword, setShowClientPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const [showDrawerPassword, setShowDrawerPassword] = React.useState(false)

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = React.useState<Lead | null>(null)
  const [deleteWarning, setDeleteWarning] = React.useState<string | undefined>()

  const activeStaff = React.useMemo(() => users.filter((u) => u.status === "Active"), [users])

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "+1 (555) 201-9900",
      brandId: brands[0]?.id ?? "",
      source: "Google Ads",
      address: "",
      city: cities[0]?.name ?? "",
      zipCode: "",
      services: [],
      assignedStaffIds: activeStaff[0]?.id ? [activeStaff[0].id] : [],
      clientPassword: "",
      confirmPassword: "",
      description: "",
    },
  })

  function openCreateSheet() {
    setEditingLead(null)
    setShowClientPassword(false)
    setShowConfirmPassword(false)
    form.reset({
      name: "",
      email: "",
      phone: "+1 (555) 201-9900",
      brandId: brands[0]?.id ?? "",
      source: "Google Ads",
      address: "",
      city: cities[0]?.name ?? "",
      zipCode: "",
      services: [],
      assignedStaffIds: activeStaff[0]?.id ? [activeStaff[0].id] : [],
      clientPassword: "",
      confirmPassword: "",
      description: "",
    })
    setFormOpen(true)
  }

  const openEditSheet = React.useCallback(
    (lead: Lead) => {
      setEditingLead(lead)
      setShowClientPassword(false)
      setShowConfirmPassword(false)
      form.reset({
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        brandId: lead.brandId,
        source: lead.source,
        address: lead.address || "",
        city: lead.city,
        zipCode: lead.zipCode || "",
        services: lead.services || [],
        assignedStaffIds:
          lead.assignedStaffIds && lead.assignedStaffIds.length > 0
            ? lead.assignedStaffIds
            : activeStaff[0]?.id
            ? [activeStaff[0].id]
            : [],
        clientPassword: lead.clientPassword || "",
        confirmPassword: lead.clientPassword || "",
        description: lead.description || lead.notes || "",
      })
      setFormOpen(true)
    },
    [form, activeStaff]
  )

  const promptDelete = React.useCallback(
    (lead: Lead) => {
      const check = checkLeadDeletion(lead.id)
      if (!check.allowed) {
        toast.error(check.reason || "Cannot delete this lead.")
        return
      }
      setDeleteWarning(undefined)
      setDeleteTarget(lead)
    },
    [checkLeadDeletion]
  )

  function handleConfirmDelete() {
    if (!deleteTarget) return
    const res = deleteLead(deleteTarget.id)
    if (!res.allowed) {
      toast.error(res.reason || "Failed to delete lead.")
    } else {
      toast.success(`Removed lead ${deleteTarget.code}`)
      if (selectedLead?.id === deleteTarget.id) {
        setSelectedLead(null)
      }
      if (editingLead?.id === deleteTarget.id) {
        setFormOpen(false)
      }
    }
    setDeleteTarget(null)
  }

  function onSubmit(values: LeadFormValues) {
    const brandId = editingLead ? editingLead.brandId : values.brandId
    const brand = brands.find((b) => b.id === brandId) ?? brands[0]
    const cityObj = cities.find((c) => c.name === values.city) ?? cities[0]

    const brandName = editingLead ? editingLead.brandName : (brand ? brand.name : "Primary Brand")
    const cityName = cityObj ? cityObj.name : values.city
    const stateName = cityObj?.state ?? ""
    const countryName = cityObj ? cityObj.country : "United States"
    const currency = (cityObj ? cityObj.currency : "USD") as CurrencyCode

    const assignedNames = values.assignedStaffIds
      .map((id) => users.find((u) => u.id === id)?.name || "Staff")
      .join(", ")

    const now = new Date().toISOString().replace("T", " ").slice(0, 16)

    if (editingLead) {
      const prevIds = editingLead.assignedStaffIds || []
      const hasStaffChanged =
        prevIds.length !== values.assignedStaffIds.length ||
        !values.assignedStaffIds.every((id) => prevIds.includes(id))

      const updated = {
        name: values.name,
        email: values.email,
        phone: values.phone,
        brandId: editingLead.brandId,
        brandName: editingLead.brandName,
        source: values.source,
        address: values.address || "",
        city: cityName,
        state: stateName,
        zipCode: values.zipCode || "",
        country: countryName,
        services: values.services || [],
        currency,
        assignedStaffIds: values.assignedStaffIds,
        clientPassword: values.clientPassword || undefined,
        description: values.description ?? "",
        notes: values.description ?? "",
        assignmentHistory: hasStaffChanged
          ? [
              ...editingLead.assignmentHistory,
              {
                id: `hist-${editingLead.assignmentHistory.length + 1}`,
                fromStaffName:
                  prevIds.map((id) => users.find((u) => u.id === id)?.name || "Staff").join(", ") || null,
                toStaffName: assignedNames || "Staff",
                assignedBy: "Current User",
                timestamp: now,
                note: "Updated assigned users via Lead Edit drawer",
              },
            ]
          : editingLead.assignmentHistory,
      }
      updateLead(editingLead.id, updated)
      setSelectedLead((prev) => (prev && prev.id === editingLead.id ? { ...prev, ...updated } : prev))
      toast.success(`Lead ${editingLead.code} updated`)
    } else {
      const created = createLead({
        name: values.name,
        email: values.email,
        phone: values.phone,
        brandId: values.brandId,
        brandName,
        source: values.source,
        address: values.address || "",
        city: cityName,
        state: stateName,
        zipCode: values.zipCode || "",
        country: countryName,
        services: values.services || [],
        currency,
        assignedStaffIds: values.assignedStaffIds,
        clientPassword: values.clientPassword || undefined,
        description: values.description ?? "",
        notes: values.description ?? "",
        assignmentHistory: [
          {
            id: `hist-1`,
            fromStaffName: null,
            toStaffName: assignedNames || "Staff",
            assignedBy: "Manual Intake",
            timestamp: now,
            note: `Lead created under ${brandName}`,
          },
        ],
      })
      toast.success(`Lead ${created.code} created`)
    }
    setFormOpen(false)
  }

  // Linked Invoices & Projects
  const leadInvoices = React.useMemo(() => {
    if (!selectedLead) return []
    const emailLower = selectedLead.email.toLowerCase().trim()
    const nameLower = selectedLead.name.toLowerCase().trim()
    return invoices.filter((inv) => {
      if (inv.leadId && inv.leadId === selectedLead.id) return true
      if (inv.clientEmail && inv.clientEmail.toLowerCase().trim() === emailLower) return true
      if (inv.clientName && inv.clientName.toLowerCase().trim() === nameLower) return true
      return false
    })
  }, [invoices, selectedLead])

  const leadProjects = React.useMemo(() => {
    if (!selectedLead) return []
    const nameLower = selectedLead.name.toLowerCase().trim()
    return projects.filter((p) => {
      if (p.leadId && p.leadId === selectedLead.id) return true
      if (p.clientName && p.clientName.toLowerCase().trim() === nameLower) return true
      return false
    })
  }, [projects, selectedLead])

  // Resolve Location for Selected Lead
  const selectedLeadCityObj = React.useMemo(() => {
    if (!selectedLead) return null
    return cities.find((c) => c.name.toLowerCase() === selectedLead.city?.toLowerCase()) ?? null
  }, [cities, selectedLead])

  const selectedLeadState = selectedLead?.state || selectedLeadCityObj?.state || ""
  const selectedLeadCountry = selectedLead?.country || selectedLeadCityObj?.country || "United States"

  const selectedLeadBrand = React.useMemo(() => {
    if (!selectedLead) return null
    return (
      brands.find(
        (b) => b.id === selectedLead.brandId || b.name === selectedLead.brandName
      ) ?? null
    )
  }, [brands, selectedLead])

  const selectedLeadBrandColor = selectedLeadBrand?.primaryColor || "#2563EB"

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
          <DataTableColumnHeader column={column} title="Lead Name" />
        ),
        cell: ({ row }) => (
          <div className="font-medium text-foreground">
            {row.original.name}
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
        cell: ({ row }) => {
          const brand = brands.find(
            (b) => b.id === row.original.brandId || b.name === row.original.brandName
          )
          const color = brand?.primaryColor || "#2563EB"
          return (
            <span
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs font-medium border"
              style={{
                backgroundColor: `${color}15`,
                color: color,
                borderColor: `${color}35`,
              }}
            >
              <span
                className="size-1.5 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
              {row.original.brandName}
            </span>
          )
        },
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
        header: "Location",
        cell: ({ row }) => {
          const cityObj = cities.find(
            (c) => c.name.toLowerCase() === row.original.city?.toLowerCase()
          )
          const state = row.original.state || cityObj?.state || ""
          const zip = row.original.zipCode ? ` ${row.original.zipCode}` : ""
          return (
            <span className="text-xs text-muted-foreground">
              {row.original.city}
              {state ? `, ${state}` : ""}
              {zip}
            </span>
          )
        },
      },
      {
        id: "assigned",
        header: "Assigned Users",
        cell: ({ row }) => {
          const staff = users.filter((u) =>
            row.original.assignedStaffIds.includes(u.id)
          )
          return staff.length > 0 ? (
            <AvatarGroup people={staff} max={3} />
          ) : (
            <span className="text-xs text-muted-foreground">Unassigned</span>
          )
        },
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
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => openEditSheet(row.original)}>
                Edit Lead
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => promptDelete(row.original)}
              >
                Delete Lead
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [brands, cities, users, openEditSheet, promptDelete]
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
        title: "Source",
        options: LEAD_SOURCES.map((s) => ({ label: s, value: s })),
      },
    ],
    [brands]
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description="Track inbound inquiries across brands, acquisition channels, and client engagements."
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
        searchPlaceholder="Search leads by name, email, or city..."
        facetedFilters={facetedFilters}
        dateField="createdAt"
        exportModule="Leads"
        onRowClick={(lead) => setSelectedLead(lead)}
      />

      {/* Show Lead Details Sheet with Location, Brand Badge & Tabs */}
      <Sheet
        open={Boolean(selectedLead)}
        onOpenChange={(open) => !open && setSelectedLead(null)}
      >
        <SheetContent side="right" className="w-full max-w-[100vw] overflow-y-auto sm:max-w-xl">
          {selectedLead ? (
            <>
              <SheetHeader className="border-b border-border pb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="font-mono">
                    {selectedLead.code}
                  </Badge>
                  {/* Brand as a badge with own primary color */}
                  <span
                    className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs font-medium border"
                    style={{
                      backgroundColor: `${selectedLeadBrandColor}15`,
                      color: selectedLeadBrandColor,
                      borderColor: `${selectedLeadBrandColor}35`,
                    }}
                  >
                    <span
                      className="size-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: selectedLeadBrandColor }}
                    />
                    {selectedLead.brandName}
                  </span>
                </div>
                <SheetTitle className="mt-1 text-xl">
                  {selectedLead.name}
                </SheetTitle>
                <SheetDescription>
                  Acquired via {selectedLead.source}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-5 p-4">
                {/* Contact & Brand info */}
                <div className="grid grid-cols-1 gap-2.5 rounded-xl border border-border bg-muted/20 p-3.5 text-xs sm:grid-cols-2">
                  <div className="flex items-center gap-2 text-foreground">
                    <Mail className="size-3.5 shrink-0 text-muted-foreground" />
                    <a
                      href={`mailto:${selectedLead.email}`}
                      className="truncate hover:text-primary hover:underline"
                    >
                      {selectedLead.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <Phone className="size-3.5 shrink-0 text-muted-foreground" />
                    <a
                      href={`tel:${selectedLead.phone}`}
                      className="hover:text-primary hover:underline"
                    >
                      {selectedLead.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <Building2 className="size-3.5 shrink-0 text-muted-foreground" />
                    <span
                      className="font-medium"
                      style={{ color: selectedLeadBrandColor }}
                    >
                      {selectedLead.brandName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <span className="text-muted-foreground">Source:</span>
                    <span className="font-medium">{selectedLead.source}</span>
                  </div>
                </div>

                {/* Client Password Display */}
                <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-3.5 py-2.5 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <KeyRound className="size-3.5 text-primary shrink-0" />
                    <span className="text-muted-foreground shrink-0 font-medium">Client Password:</span>
                    {selectedLead.clientPassword ? (
                      <span className="font-mono font-medium text-foreground truncate select-all">
                        {showDrawerPassword ? selectedLead.clientPassword : "••••••••••••"}
                      </span>
                    ) : (
                      <span className="text-muted-foreground italic">Not set</span>
                    )}
                  </div>
                  {selectedLead.clientPassword && (
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowDrawerPassword((v) => !v)}
                        title={showDrawerPassword ? "Hide password" : "Show password"}
                      >
                        {showDrawerPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedLead.clientPassword || "")
                          toast.success("Password copied to clipboard")
                        }}
                        title="Copy password"
                      >
                        <Copy className="size-3.5" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Location Details with Address and Zip Code */}
                <div className="space-y-2.5 rounded-xl border border-border bg-muted/25 p-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <MapPin className="size-3.5 text-primary" />
                    Location
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="sm:col-span-2">
                      <span className="block text-[11px] text-muted-foreground">Street Address</span>
                      <span className="font-medium text-foreground">
                        {selectedLead.address || "No street address provided"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-muted-foreground">City</span>
                      <span className="font-medium text-foreground">
                        {selectedLead.city || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-muted-foreground">State / Region</span>
                      <span className="font-medium text-foreground">
                        {selectedLeadState || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-muted-foreground">Zip / Postal Code</span>
                      <span className="font-medium text-foreground font-mono">
                        {selectedLead.zipCode || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-muted-foreground">Country</span>
                      <span className="font-medium text-foreground">
                        {selectedLeadCountry || "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Requested Services Badges */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <Layers className="size-3.5 text-primary" />
                      Services ({selectedLead.services?.length || 0})
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedLead.services && selectedLead.services.length > 0 ? (
                      selectedLead.services.map((svc) => (
                        <Badge
                          key={svc}
                          variant="secondary"
                          className="text-xs font-normal border border-border/60"
                        >
                          {svc}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        No services selected
                      </span>
                    )}
                  </div>
                </div>

                {/* Assigned Users */}
                <div className="space-y-2">
                  <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <UserCheck className="size-3.5" />
                    Assigned Users ({selectedLead.assignedStaffIds?.length || 0})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {users
                      .filter((u) => selectedLead.assignedStaffIds?.includes(u.id))
                      .map((staff) => (
                        <div
                          key={staff.id}
                          className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-1.5 text-xs bg-muted/20"
                        >
                          <span
                            className={`flex size-6 items-center justify-center rounded-full text-[10px] font-bold text-white ${staff.avatarColor}`}
                          >
                            {staff.avatarInitials}
                          </span>
                          <div>
                            <div className="font-medium text-foreground">{staff.name}</div>
                            <div className="text-[11px] text-muted-foreground">
                              {staff.role} • {staff.department}
                            </div>
                          </div>
                        </div>
                      ))}
                    {(!selectedLead.assignedStaffIds || selectedLead.assignedStaffIds.length === 0) && (
                      <span className="text-xs text-muted-foreground italic">
                        No assigned users
                      </span>
                    )}
                  </div>
                </div>

                {/* Description (renamed from Intake Notes) */}
                {selectedLead.description || selectedLead.notes ? (
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Description
                    </h3>
                    <p className="rounded-lg border border-border bg-background p-3 text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                      {selectedLead.description || selectedLead.notes}
                    </p>
                  </div>
                ) : null}

                {/* Tabs of Invoices and Projects */}
                <div className="space-y-2.5 pt-2">
                  <Tabs defaultValue="invoices" className="w-full space-y-3 grid">
                    <TabsList className="grid w-full grid-cols-2 !h-auto p-1 bg-muted/80 rounded-xl">
                      <TabsTrigger
                        value="invoices"
                        className="h-8.5 px-2 text-xs font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all flex items-center justify-center gap-1.5 truncate"
                      >
                        <FileText className="size-3.5" />
                        <span>Invoices</span>
                        <Badge variant="secondary" className="px-1.5 py-0 text-[10px] h-4 leading-none">
                          {leadInvoices.length}
                        </Badge>
                      </TabsTrigger>
                      <TabsTrigger
                        value="projects"
                        className="h-8.5 px-2 text-xs font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all flex items-center justify-center gap-1.5 truncate"
                      >
                        <FolderKanban className="size-3.5" />
                        <span>Projects</span>
                        <Badge variant="secondary" className="px-1.5 py-0 text-[10px] h-4 leading-none">
                          {leadProjects.length}
                        </Badge>
                      </TabsTrigger>
                    </TabsList>

                    {/* Invoices Tab Content */}
                    <TabsContent value="invoices" className="space-y-2 pt-1 focus-visible:outline-none">
                      {leadInvoices.length > 0 ? (
                        <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                          {leadInvoices.map((inv) => (
                            <div
                              key={inv.id}
                              className="flex items-center justify-between rounded-xl border border-border p-3 text-xs hover:bg-muted/30 transition-colors"
                            >
                              <div className="space-y-1 min-w-0 pr-3">
                                <div className="flex items-center gap-2">
                                  <Link
                                    href={`/invoice/${inv.id}`}
                                    className="font-mono font-semibold text-primary hover:underline truncate"
                                  >
                                    {inv.invoiceNumber}
                                  </Link>
                                  <StatusBadge status={inv.status} />
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                  <span>Due {inv.dueDate}</span>
                                  <span>•</span>
                                  <GatewayBadge gateway={inv.gateway} />
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="font-semibold tabular-nums text-sm text-foreground">
                                  {formatCurrency(inv.total, inv.currency)}
                                </div>
                                <div className="text-[10px] text-muted-foreground">
                                  {inv.currency}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                          <FileText className="size-8 mx-auto mb-2 text-muted-foreground/40" />
                          <p className="font-medium text-foreground">No invoices linked yet</p>
                          <p className="mt-1 text-[11px]">
                            Invoices billed to this client or lead ID will appear here.
                          </p>
                        </div>
                      )}
                    </TabsContent>

                    {/* Projects Tab Content */}
                    <TabsContent value="projects" className="space-y-2 pt-1 focus-visible:outline-none">
                      {leadProjects.length > 0 ? (
                        <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                          {leadProjects.map((p) => (
                            <div
                              key={p.id}
                              className="flex items-center justify-between rounded-xl border border-border p-3 text-xs hover:bg-muted/30 transition-colors"
                            >
                              <div className="space-y-1 min-w-0 pr-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[11px] text-muted-foreground">
                                    {p.code}
                                  </span>
                                  <span className="font-medium text-foreground truncate">
                                    {p.name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                  <StatusBadge status={p.status} />
                                  <span>•</span>
                                  <span>Target: {p.deadline}</span>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="font-semibold tabular-nums text-foreground">
                                  {formatCurrency(p.budget, p.currency)}
                                </div>
                                <div className="text-[10px] text-muted-foreground">
                                  {p.progress}% done
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                          <FolderKanban className="size-8 mx-auto mb-2 text-muted-foreground/40" />
                          <p className="font-medium text-foreground">No projects linked yet</p>
                          <p className="mt-1 text-[11px]">
                            Projects assigned to this lead will appear here.
                          </p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </div>

              <SheetFooter className="flex-row justify-between border-t border-border pt-4 sm:justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => promptDelete(selectedLead)}
                >
                  <Trash2 className="mr-1.5 size-4" />
                  Delete Lead
                </Button>
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
        <SheetContent side="right" className="w-full max-w-[100vw] overflow-y-auto sm:max-w-lg">
          <SheetHeader className="border-b border-border pb-3">
            <SheetTitle>
              {editingLead ? `Edit ${editingLead.code}` : "Create New Lead"}
            </SheetTitle>
            <SheetDescription>
              Capture client contact details, services requested, brand storefront, and location.
            </SheetDescription>
          </SheetHeader>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 p-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="lead-name">Contact Name</Label>
              <Input
                id="lead-name"
                placeholder="e.g. Alex Morgan"
                {...form.register("name")}
              />
              {form.formState.errors.name ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.name.message}
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="lead-email">Email Address</Label>
                <Input
                  id="lead-email"
                  type="email"
                  placeholder="alex@example.com"
                  {...form.register("email")}
                />
                {form.formState.errors.email ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.email.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lead-phone">Phone Number</Label>
                <Input
                  id="lead-phone"
                  placeholder="+1 (555) 000-0000"
                  {...form.register("phone")}
                />
                {form.formState.errors.phone ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.phone.message}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Brand Storefront</Label>
                  {Boolean(editingLead) && (
                    <span className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                      <Lock className="size-3" /> Locked in edit
                    </span>
                  )}
                </div>
                {Boolean(editingLead) ? (
                  <div className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-muted/50 px-3 py-1 text-xs opacity-80 cursor-not-allowed">
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2 rounded-full shrink-0"
                        style={{
                          backgroundColor:
                            brands.find((b) => b.id === editingLead?.brandId)?.primaryColor ||
                            "#2563EB",
                        }}
                      />
                      <span className="font-medium text-foreground">
                        {editingLead?.brandName ||
                          brands.find((b) => b.id === editingLead?.brandId)?.name}
                      </span>
                    </div>
                    <Lock className="size-3.5 text-muted-foreground" />
                  </div>
                ) : brands.length === 0 ? (
                  <div className="rounded-md border border-dashed border-border p-2 text-xs text-muted-foreground">
                    <Link href="/brands" className="text-primary underline">
                      Add a brand first
                    </Link>
                  </div>
                ) : (
                  <Controller
                    control={form.control}
                    name="brandId"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select brand" />
                        </SelectTrigger>
                        <SelectContent>
                          {brands.map((b) => (
                            <SelectItem key={b.id} value={b.id}>
                              <div className="flex items-center gap-2">
                                <span
                                  className="size-2 rounded-full shrink-0"
                                  style={{ backgroundColor: b.primaryColor || "#2563EB" }}
                                />
                                <span>{b.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                )}
                {Boolean(editingLead) ? (
                  <p className="text-[11px] text-muted-foreground">
                    Brand storefront cannot be changed once lead is created.
                  </p>
                ) : form.formState.errors.brandId ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.brandId.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label>Acquisition Source</Label>
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
            </div>

            {/* Multiple Services Select */}
            <Controller
              control={form.control}
              name="services"
              render={({ field }) => (
                <ServicesMultiSelect
                  selected={field.value || []}
                  onChange={field.onChange}
                />
              )}
            />

            {/* Location Section: Address, City, Zip Code */}
            <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <MapPin className="size-3.5 text-primary" />
                Location
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="lead-address">Street Address</Label>
                <Input
                  id="lead-address"
                  placeholder="e.g. 120 Broadway, Suite 1400"
                  {...form.register("address")}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>City</Label>
                  {cities.length === 0 ? (
                    <div className="rounded-md border border-dashed border-border p-2 text-xs text-muted-foreground">
                      <Link href="/cities" className="text-primary underline">
                        Add a city first
                      </Link>
                    </div>
                  ) : (
                    <Controller
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select city" />
                          </SelectTrigger>
                          <SelectContent>
                            {cities.map((c) => (
                              <SelectItem key={c.id} value={c.name}>
                                {c.name}
                                {c.state ? `, ${c.state}` : ""} ({c.country})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  )}
                  {form.formState.errors.city ? (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.city.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="lead-zip">Zip / Postal Code</Label>
                  <Input
                    id="lead-zip"
                    placeholder="e.g. 10005"
                    {...form.register("zipCode")}
                  />
                </div>
              </div>
            </div>

            {/* Client Password Section */}
            {
              editingLead && (
                <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <KeyRound className="size-3.5 text-primary" />
                      {editingLead ? "Change Client Password" : "Client Password"}
                    </div>
                    {editingLead?.clientPassword && (
                      <Badge
                        variant="outline"
                        className="text-[10px] font-normal text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                      >
                        Password Active
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="lead-password">
                        {editingLead ? "Change Password" : "Password"}
                      </Label>
                      <div className="relative">
                        <Input
                          id="lead-password"
                          type={showClientPassword ? "text" : "password"}
                          placeholder={editingLead ? "Enter new password" : "Enter client password"}
                          className="pr-10"
                          {...form.register("clientPassword")}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 size-7 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowClientPassword((v) => !v)}
                          tabIndex={-1}
                          title={showClientPassword ? "Hide password" : "Show password"}
                        >
                          {showClientPassword ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </Button>
                      </div>
                      {form.formState.errors.clientPassword ? (
                        <p className="text-xs text-destructive">
                          {form.formState.errors.clientPassword.message}
                        </p>
                      ) : null}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="lead-confirm-password">Confirm Password</Label>
                      <div className="relative">
                        <Input
                          id="lead-confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm password"
                          className="pr-10"
                          {...form.register("confirmPassword")}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 size-7 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowConfirmPassword((v) => !v)}
                          tabIndex={-1}
                          title={showConfirmPassword ? "Hide password" : "Show password"}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </Button>
                      </div>
                      {form.formState.errors.confirmPassword ? (
                        <p className="text-xs text-destructive">
                          {form.formState.errors.confirmPassword.message}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground">
                    {editingLead
                      ? "Enter and confirm a new password to update portal credentials, or keep unchanged."
                      : "Set client portal login password for invoice and deliverable access."}
                  </p>
                </div>
              )
            }

            {/* Assigned User Multi-Select */}
            <div className="space-y-1.5">
              {activeStaff.length === 0 ? (
                <div className="rounded-md border border-dashed border-border p-2 text-xs text-muted-foreground">
                  <Link href="/users" className="text-primary underline">
                    Add staff member first
                  </Link>
                </div>
              ) : (
                <Controller
                  control={form.control}
                  name="assignedStaffIds"
                  render={({ field }) => (
                    <StaffMultiSelect
                      staffList={activeStaff}
                      selectedIds={field.value || []}
                      onChange={field.onChange}
                    />
                  )}
                />
              )}
              {form.formState.errors.assignedStaffIds ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.assignedStaffIds.message}
                </p>
              ) : null}
            </div>

            {/* Description (renamed from Intake Notes) */}
            <div className="space-y-1.5">
              <Label htmlFor="lead-desc">Description</Label>
              <Textarea
                id="lead-desc"
                rows={3}
                placeholder="Lead description, project scope, client requirements..."
                {...form.register("description")}
              />
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

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title={`Delete Lead "${deleteTarget?.name}" (${deleteTarget?.code})?`}
        description="Are you sure you want to remove this CRM lead? This action cannot be undone."
        warningMessage={deleteWarning}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
