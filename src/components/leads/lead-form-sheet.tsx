"use client"

import * as React from "react"
import Link from "next/link"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  Check,
  ChevronsUpDown,
  Eye,
  EyeOff,
  KeyRound,
  Layers,
  Lock,
  MapPin,
  Users,
  X,
} from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { AVAILABLE_SERVICES } from "@/demo-data/leads"
import { useStore } from "@/lib/store"
import type { CurrencyCode, Lead, LeadSource, StaffUser } from "@/types"

export const LEAD_SOURCES: LeadSource[] = [
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

export type LeadFormValues = z.infer<typeof leadSchema>

export interface LeadInitialValues {
  name?: string
  email?: string
  phone?: string
  brandId?: string
  source?: LeadSource
  address?: string
  city?: string
  zipCode?: string
  services?: string[]
  assignedStaffIds?: string[]
  description?: string
}

interface LeadFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingLead?: Lead | null
  initialValues?: LeadInitialValues | null
  formKey?: string
  intakeNote?: string
  suppressSuccessToast?: boolean
  onSaved?: (lead: Lead, values: LeadFormValues) => void
}

function ServicesMultiSelect({
  selected,
  onChange,
}: {
  selected: string[]
  onChange: (val: string[]) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const allOptions = React.useMemo(() => {
    const extras = selected.filter((s) => !AVAILABLE_SERVICES.includes(s))
    return extras.length > 0 ? [...extras, ...AVAILABLE_SERVICES] : AVAILABLE_SERVICES
  }, [selected])

  const filtered = React.useMemo(() => {
    if (!search.trim()) return allOptions
    const q = search.toLowerCase()
    return allOptions.filter((s) => s.toLowerCase().includes(q))
  }, [search, allOptions])

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

export function LeadFormSheet({
  open,
  onOpenChange,
  editingLead = null,
  initialValues = null,
  formKey,
  intakeNote,
  suppressSuccessToast = false,
  onSaved,
}: LeadFormSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-[100vw] overflow-y-auto sm:max-w-lg">
        {open ? (
          <LeadFormSheetBody
            key={editingLead?.id ?? formKey ?? "new"}
            editingLead={editingLead}
            initialValues={initialValues}
            intakeNote={intakeNote}
            suppressSuccessToast={suppressSuccessToast}
            onClose={() => onOpenChange(false)}
            onSaved={onSaved}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function LeadFormSheetBody({
  editingLead,
  initialValues,
  intakeNote,
  suppressSuccessToast,
  onClose,
  onSaved,
}: {
  editingLead: Lead | null
  initialValues: LeadInitialValues | null
  intakeNote?: string
  suppressSuccessToast: boolean
  onClose: () => void
  onSaved?: (lead: Lead, values: LeadFormValues) => void
}) {
  const { brands, cities, users, createLead, updateLead } = useStore()
  const [showClientPassword, setShowClientPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)

  const activeStaff = React.useMemo(
    () => users.filter((u) => u.status === "Active"),
    [users]
  )

  const defaultAssignedIds = React.useMemo(() => {
    if (editingLead?.assignedStaffIds && editingLead.assignedStaffIds.length > 0) {
      return editingLead.assignedStaffIds
    }
    if (initialValues?.assignedStaffIds && initialValues.assignedStaffIds.length > 0) {
      const validIds = initialValues.assignedStaffIds.filter((id) =>
        activeStaff.some((u) => u.id === id)
      )
      if (validIds.length > 0) return validIds
    }
    return activeStaff[0]?.id ? [activeStaff[0].id] : []
  }, [editingLead, initialValues, activeStaff])

  const defaultCity = React.useMemo(() => {
    if (editingLead?.city) return editingLead.city
    if (initialValues?.city) {
      const match = cities.find(
        (c) => c.name.toLowerCase() === initialValues.city?.toLowerCase()
      )
      if (match) return match.name
    }
    return cities[0]?.name ?? ""
  }, [editingLead, initialValues, cities])

  const defaultBrandId = React.useMemo(() => {
    if (editingLead?.brandId) return editingLead.brandId
    if (initialValues?.brandId) {
      const match = brands.find((b) => b.id === initialValues.brandId)
      if (match) return match.id
    }
    return brands[0]?.id ?? ""
  }, [editingLead, initialValues, brands])

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: editingLead
      ? {
          name: editingLead.name,
          email: editingLead.email,
          phone: editingLead.phone,
          brandId: editingLead.brandId,
          source: editingLead.source,
          address: editingLead.address || "",
          city: editingLead.city,
          zipCode: editingLead.zipCode || "",
          services: editingLead.services || [],
          assignedStaffIds: defaultAssignedIds,
          clientPassword: editingLead.clientPassword || "",
          confirmPassword: editingLead.clientPassword || "",
          description: editingLead.description || editingLead.notes || "",
        }
      : {
          name: initialValues?.name ?? "",
          email: initialValues?.email ?? "",
          phone: initialValues?.phone ?? "+1 (555) 201-9900",
          brandId: defaultBrandId,
          source: initialValues?.source ?? "Google Ads",
          address: initialValues?.address ?? "",
          city: defaultCity,
          zipCode: initialValues?.zipCode ?? "",
          services: initialValues?.services ?? [],
          assignedStaffIds: defaultAssignedIds,
          clientPassword: "",
          confirmPassword: "",
          description: initialValues?.description ?? "",
        },
  })

  function onSubmit(values: LeadFormValues) {
    const brandId = editingLead ? editingLead.brandId : values.brandId
    const brand = brands.find((b) => b.id === brandId) ?? brands[0]
    const cityObj = cities.find((c) => c.name === values.city) ?? cities[0]

    const brandName = editingLead
      ? editingLead.brandName
      : brand
      ? brand.name
      : "Primary Brand"
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
                  prevIds
                    .map((id) => users.find((u) => u.id === id)?.name || "Staff")
                    .join(", ") || null,
                toStaffName: assignedNames || "Staff",
                assignedBy: "Current User",
                timestamp: now,
                note: "Updated assigned users via Lead Edit drawer",
              },
            ]
          : editingLead.assignmentHistory,
      }
      updateLead(editingLead.id, updated)
      if (!suppressSuccessToast) {
        toast.success(`Lead ${editingLead.code} updated`)
      }
      onSaved?.({ ...editingLead, ...updated }, values)
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
            note: intakeNote || `Lead created under ${brandName}`,
          },
        ],
      })
      if (!suppressSuccessToast) {
        toast.success(`Lead ${created.code} created`)
      }
      onSaved?.(created, values)
    }
    onClose()
  }

  return (
    <>
      <SheetHeader className="border-b border-border pb-3">
        <SheetTitle>
          {editingLead ? `Edit ${editingLead.code}` : "Create New Lead"}
        </SheetTitle>
        <SheetDescription>
          Capture client contact details, services requested, brand storefront, and location.
        </SheetDescription>
      </SheetHeader>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
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

        {editingLead && (
          <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <KeyRound className="size-3.5 text-primary" />
                Change Client Password
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
                <Label htmlFor="lead-password">Change Password</Label>
                <div className="relative">
                  <Input
                    id="lead-password"
                    type={showClientPassword ? "text" : "password"}
                    placeholder="Enter new password"
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
              Enter and confirm a new password to update portal credentials, or keep unchanged.
            </p>
          </div>
        )}

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
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {editingLead ? "Save Changes" : "Create Lead"}
          </Button>
        </SheetFooter>
      </form>
    </>
  )
}
