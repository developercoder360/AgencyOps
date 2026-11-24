"use client"

import * as React from "react"
import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { toast } from "sonner"
import {
  ArrowUpRight,
  CalendarClock,
  ExternalLink,
  Globe,
  Layers,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Tag,
  Trash2,
  User,
  UserCheck,
} from "lucide-react"
import {
  DataTable,
  DataTableColumnHeader,
  type FacetedFilterConfig,
} from "@/components/data-table"
import {
  LeadFormSheet,
  type LeadInitialValues,
} from "@/components/leads/lead-form-sheet"
import {
  AvatarGroup,
  ConfirmDeleteDialog,
  PageHeader,
} from "@/components/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useStore } from "@/lib/store"
import type { Brand, SignUp } from "@/types"

function BrandBadge({
  brandId,
  brandName,
  brands,
}: {
  brandId: string
  brandName: string
  brands: Brand[]
}) {
  const brand = brands.find((b) => b.id === brandId || b.name === brandName)
  const color = brand?.primaryColor || "#2563EB"
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-xs font-medium"
      style={{
        backgroundColor: `${color}15`,
        color,
        borderColor: `${color}35`,
      }}
    >
      <span
        className="size-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      {brandName}
    </span>
  )
}

function formatSignupDateTime(value: string): string {
  if (!value) return "—"
  const normalized = value.includes("T")
    ? value
    : value.includes(" ")
      ? value.replace(" ", "T")
      : `${value}T09:00`
  const parsed = new Date(normalized)
  if (Number.isNaN(parsed.getTime())) return value
  return format(parsed, "MMM d, yyyy • h:mm a")
}

export default function SignUpsPage() {
  const { signUps, leads, brands, cities, users, updateSignUp, deleteSignUp } =
    useStore()
  const [selected, setSelected] = React.useState<SignUp | null>(null)
  const [convertingSignUp, setConvertingSignUp] = React.useState<SignUp | null>(
    null
  )

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = React.useState<SignUp | null>(null)

  const getSignUpStaffIds = React.useCallback(
    (item: SignUp): string[] => {
      if (item.assignedStaffIds && item.assignedStaffIds.length > 0) {
        return item.assignedStaffIds
      }
      if (item.leadId) {
        const linkedLead = leads.find((l) => l.id === item.leadId)
        if (linkedLead?.assignedStaffIds?.length) {
          return linkedLead.assignedStaffIds
        }
      }
      return []
    },
    [leads]
  )

  const openConvertDrawer = React.useCallback((item: SignUp) => {
    setConvertingSignUp(item)
  }, [])

  const convertingInitialValues = React.useMemo<LeadInitialValues | null>(() => {
    if (!convertingSignUp) return null
    const services =
      convertingSignUp.services && convertingSignUp.services.length > 0
        ? convertingSignUp.services
        : convertingSignUp.serviceInterest
          ? [convertingSignUp.serviceInterest]
          : []
    return {
      name: convertingSignUp.name,
      email: convertingSignUp.email,
      phone: convertingSignUp.phone,
      brandId: convertingSignUp.brandId,
      source: convertingSignUp.source,
      city: convertingSignUp.city,
      zipCode: convertingSignUp.zipCode || "",
      services,
      assignedStaffIds: getSignUpStaffIds(convertingSignUp),
      description: convertingSignUp.notes || "",
    }
  }, [convertingSignUp, getSignUpStaffIds])

  const promptDelete = React.useCallback((item: SignUp) => {
    setDeleteTarget(item)
  }, [])

  function handleConfirmDelete() {
    if (!deleteTarget) return
    const check = deleteSignUp(deleteTarget.id)
    if (!check.allowed) {
      toast.error(check.reason || "Cannot delete client.")
      setDeleteTarget(null)
      return
    }
    toast.success(`Removed submission ${deleteTarget.code}`)
    if (selected?.id === deleteTarget.id) {
      setSelected(null)
    }
    if (convertingSignUp?.id === deleteTarget.id) {
      setConvertingSignUp(null)
    }
    setDeleteTarget(null)
  }

  const columns = React.useMemo<ColumnDef<SignUp>[]>(
    () => [
      {
        accessorKey: "code",
        meta: { label: "Sign Up ID" },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Sign Up ID" />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold text-primary">
            {row.original.code}
          </span>
        ),
      },
      {
        accessorKey: "name",
        meta: { label: "Name" },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Name" />
        ),
        cell: ({ row }) => (
          <div className="font-medium text-foreground">{row.original.name}</div>
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
        accessorKey: "phone",
        header: "Phone",
        cell: ({ row }) => (
          <span className="text-xs tabular-nums text-muted-foreground whitespace-nowrap">
            {row.original.phone}
          </span>
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
        accessorKey: "serviceInterest",
        header: "Service",
        cell: ({ row }) => (
          <span className="text-xs">{row.original.serviceInterest}</span>
        ),
      },
      {
        accessorKey: "source",
        header: "Source",
      },
      {
        accessorKey: "city",
        header: "City",
      },
      {
        id: "assigned",
        header: "Assigned Users",
        cell: ({ row }) => {
          const staffIds = getSignUpStaffIds(row.original)
          const staff = users.filter((u) => staffIds.includes(u.id))
          return staff.length > 0 ? (
            <AvatarGroup people={staff} max={3} />
          ) : (
            <span className="text-xs text-muted-foreground">Unassigned</span>
          )
        },
      },
      {
        accessorKey: "createdAt",
        meta: { label: "Signup At" },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Signup At" />
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
              title="Delete submission"
              className="text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    [brands, users, getSignUpStaffIds, promptDelete]
  )

  const facetedFilters = React.useMemo<FacetedFilterConfig[]>(
    () => [
      {
        columnId: "brandName",
        title: "Brand",
        options: brands.map((b) => ({ label: b.name, value: b.name })),
      },
    ],
    [brands]
  )

  const selectedStaff = React.useMemo(() => {
    if (!selected) return []
    const staffIds = getSignUpStaffIds(selected)
    return users.filter((u) => staffIds.includes(u.id))
  }, [selected, users, getSignUpStaffIds])

  const selectedCityObj = React.useMemo(() => {
    if (!selected) return null
    return (
      cities.find(
        (c) => c.name.toLowerCase() === selected.city?.toLowerCase()
      ) ?? null
    )
  }, [selected, cities])

  const selectedBrandObj = React.useMemo(() => {
    if (!selected) return null
    return (
      brands.find(
        (b) => b.id === selected.brandId || b.name === selected.brandName
      ) ?? null
    )
  }, [selected, brands])

  const selectedServices = React.useMemo(() => {
    if (!selected) return []
    if (selected.services && selected.services.length > 0) {
      return selected.services
    }
    return selected.serviceInterest ? [selected.serviceInterest] : []
  }, [selected])

  const selectedReferralUrl = React.useMemo(() => {
    if (!selected) return ""
    if (selected.referralUrl) return selected.referralUrl
    const domain = selectedBrandObj?.domain || "agencyops.io"
    const sourceSlug = selected.source.toLowerCase().replace(/\s+/g, "-")
    return `https://${domain}/get-started?utm_source=${sourceSlug}&utm_campaign=${selected.utmCampaign}`
  }, [selected, selectedBrandObj])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Website Sign Ups"
        description="Raw landing-page form submissions awaiting sales qualification and CRM lead conversion."
        badge={<Badge variant="secondary">{signUps.length} submissions</Badge>}
      />

      <DataTable
        columns={columns}
        data={signUps}
        searchPlaceholder="Search sign ups by name, email, phone, campaign..."
        facetedFilters={facetedFilters}
        dateField="createdAt"
        exportModule="Sign Ups"
        onRowClick={setSelected}
      />

      <Sheet
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <SheetContent side="right" className="w-full max-w-[100vw] overflow-y-auto sm:max-w-lg">
          {selected ? (
            <>
              <SheetHeader className="border-b border-border pb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="font-mono">
                    {selected.code}
                  </Badge>
                  <BrandBadge
                    brandId={selected.brandId}
                    brandName={selected.brandName}
                    brands={brands}
                  />
                  <Badge variant={selected.convertedToLead ? "default" : "secondary"}>
                    {selected.convertedToLead ? "Converted to Lead" : "Pending"}
                  </Badge>
                </div>
                <SheetTitle className="mt-1 text-xl">{selected.name}</SheetTitle>
                <SheetDescription className="flex items-center gap-1.5 text-xs">
                  <CalendarClock className="size-3.5 text-muted-foreground" />
                  <span>Signed up {formatSignupDateTime(selected.createdAt)}</span>
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-4 p-4 text-xs">
                {/* Quick Actions */}
                <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Quick Actions
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selected.convertedToLead ? (
                      <Button asChild size="sm" variant="default" className="gap-1.5">
                        <Link href="/leads">
                          View in Leads
                          <ArrowUpRight className="size-3.5" />
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => openConvertDrawer(selected)}
                        className="gap-1.5"
                      >
                        Convert to Lead
                        <ArrowUpRight className="size-3.5" />
                      </Button>
                    )}
                    <Button asChild size="sm" variant="outline" className="gap-1.5">
                      <a href={`mailto:${selected.email}`}>
                        <Mail className="size-3.5" />
                        Send Email
                      </a>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="gap-1.5">
                      <a href={`tel:${selected.phone}`}>
                        <Phone className="size-3.5" />
                        Call
                      </a>
                    </Button>
                  </div>
                </div>

                {/* Contact & Sign Up Overview */}
                <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <User className="size-3.5 text-primary" />
                    Contact & Sign Up Info
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <span className="block text-[11px] text-muted-foreground">
                        Name
                      </span>
                      <span className="font-medium text-foreground">
                        {selected.name}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-muted-foreground">
                        Signup At
                      </span>
                      <span className="font-medium tabular-nums text-foreground">
                        {formatSignupDateTime(selected.createdAt)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-muted-foreground">
                        Email
                      </span>
                      <a
                        href={`mailto:${selected.email}`}
                        className="block truncate font-medium text-primary hover:underline"
                      >
                        {selected.email}
                      </a>
                    </div>
                    <div>
                      <span className="block text-[11px] text-muted-foreground">
                        Phone
                      </span>
                      <a
                        href={`tel:${selected.phone}`}
                        className="font-medium tabular-nums text-foreground hover:text-primary hover:underline"
                      >
                        {selected.phone}
                      </a>
                    </div>
                    <div>
                      <span className="mb-1 block text-[11px] text-muted-foreground">
                        Brand
                      </span>
                      <BrandBadge
                        brandId={selected.brandId}
                        brandName={selected.brandName}
                        brands={brands}
                      />
                    </div>
                    <div>
                      <span className="mb-1 block text-[11px] text-muted-foreground">
                        Services
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedServices.length > 0 ? (
                          selectedServices.map((svc) => (
                            <Badge
                              key={svc}
                              variant="secondary"
                              className="gap-1 border border-border/60 text-[11px] font-normal"
                            >
                              <Layers className="size-3 text-primary" />
                              {svc}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground italic">—</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <MapPin className="size-3.5 text-primary" />
                    Location
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="block text-[11px] text-muted-foreground">
                        Country
                      </span>
                      <span className="font-medium text-foreground">
                        {selected.country || selectedCityObj?.country || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-muted-foreground">
                        State
                      </span>
                      <span className="font-medium text-foreground">
                        {selected.state || selectedCityObj?.state || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-muted-foreground">
                        City
                      </span>
                      <span className="font-medium text-foreground">
                        {selected.city || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-muted-foreground">
                        Zip Code
                      </span>
                      <span className="font-mono font-medium text-foreground">
                        {selected.zipCode || "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Acquisition & Technical Details */}
                <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <Tag className="size-3.5 text-primary" />
                    Source & Tracking
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <span className="block text-[11px] text-muted-foreground">
                        From
                      </span>
                      <span className="font-medium text-foreground">
                        {selected.source}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-muted-foreground">
                        IP Address
                      </span>
                      <span className="inline-flex items-center gap-1.5 font-mono font-medium text-foreground">
                        <Globe className="size-3.5 text-muted-foreground" />
                        {selected.ipAddress}
                      </span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="block text-[11px] text-muted-foreground">
                        Referral URL
                      </span>
                      {selectedReferralUrl ? (
                        <a
                          href={selectedReferralUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-0.5 inline-flex max-w-full items-center gap-1 break-all font-mono text-[11px] text-primary hover:underline"
                        >
                          <span className="break-all">{selectedReferralUrl}</span>
                          <ExternalLink className="size-3 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Assigned Users */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <UserCheck className="size-3.5" />
                    Assigned Users ({selectedStaff.length})
                  </div>
                  {selectedStaff.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedStaff.map((staff) => (
                        <div
                          key={staff.id}
                          className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-2.5 py-1.5 text-xs"
                        >
                          <span
                            className={`flex size-6 items-center justify-center rounded-full text-[10px] font-bold text-white ${staff.avatarColor}`}
                          >
                            {staff.avatarInitials}
                          </span>
                          <div>
                            <div className="font-medium text-foreground">
                              {staff.name}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {staff.role}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">
                      Unassigned
                    </span>
                  )}
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <MessageSquare className="size-3.5 text-primary" />
                    Message
                  </div>
                  <p className="rounded-xl border border-border bg-background p-3 leading-relaxed text-muted-foreground whitespace-pre-line">
                    {selected.notes || "No message provided."}
                  </p>
                </div>
              </div>

              <SheetFooter className="flex-row justify-between border-t border-border pt-4 sm:justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => promptDelete(selected)}
                >
                  <Trash2 className="mr-1.5 size-4" />
                  Delete
                </Button>
                {selected.convertedToLead ? (
                  <Button asChild variant="outline">
                    <Link href="/leads">View in Leads</Link>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => openConvertDrawer(selected)}
                    className="gap-1.5"
                  >
                    Convert to Lead
                    <ArrowUpRight className="size-4" />
                  </Button>
                )}
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* Add New Lead drawer pre-filled with Sign Up data */}
      <LeadFormSheet
        open={Boolean(convertingSignUp)}
        onOpenChange={(open) => {
          if (!open) setConvertingSignUp(null)
        }}
        initialValues={convertingInitialValues}
        formKey={convertingSignUp?.id}
        intakeNote={
          convertingSignUp
            ? `Converted from Sign Up ${convertingSignUp.code}`
            : undefined
        }
        suppressSuccessToast
        onSaved={(createdLead, values) => {
          if (!convertingSignUp) return
          updateSignUp(convertingSignUp.id, {
            convertedToLead: true,
            leadId: createdLead.id,
            assignedStaffIds: values.assignedStaffIds,
          })
          setSelected((prev) =>
            prev && prev.id === convertingSignUp.id
              ? {
                  ...prev,
                  convertedToLead: true,
                  leadId: createdLead.id,
                  assignedStaffIds: values.assignedStaffIds,
                }
              : prev
          )
          toast.success(
            `Converted ${convertingSignUp.code} (${createdLead.name}) to CRM Lead ${createdLead.code}`
          )
          setConvertingSignUp(null)
        }}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title={`Delete Sign Up "${deleteTarget?.name}"?`}
        description="Are you sure you want to remove this submission record? This cannot be undone."
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
