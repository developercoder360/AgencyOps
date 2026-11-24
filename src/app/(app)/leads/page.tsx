"use client"

import * as React from "react"
import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import {
  Building2,
  Copy,
  Edit3,
  Eye,
  EyeOff,
  FileText,
  FolderKanban,
  KeyRound,
  Layers,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone,
  Plus,
  Trash2,
  UserCheck,
} from "lucide-react"
import {
  DataTable,
  DataTableColumnHeader,
  type FacetedFilterConfig,
} from "@/components/data-table"
import { LEAD_SOURCES, LeadFormSheet } from "@/components/leads/lead-form-sheet"
import {
  AvatarGroup,
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency } from "@/lib/currency"
import { useStore } from "@/lib/store"
import type { Lead } from "@/types"

export default function LeadsPage() {
  const {
    leads,
    brands,
    cities,
    users,
    invoices,
    projects,
    deleteLead,
    checkLeadDeletion,
  } = useStore()

  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null)
  const [formOpen, setFormOpen] = React.useState(false)
  const [editingLead, setEditingLead] = React.useState<Lead | null>(null)
  const [showDrawerPassword, setShowDrawerPassword] = React.useState(false)

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = React.useState<Lead | null>(null)
  const [deleteWarning, setDeleteWarning] = React.useState<string | undefined>()

  function openCreateSheet() {
    setEditingLead(null)
    setFormOpen(true)
  }

  const openEditSheet = React.useCallback((lead: Lead) => {
    setEditingLead(lead)
    setFormOpen(true)
  }, [])

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
        id: "id",
        accessorFn: (row) => row.code,
        meta: { label: "ID" },
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
        cell: ({ row }) => (
          <BrandBadge
            brandId={row.original.brandId}
            brandName={row.original.brandName}
            brands={brands}
          />
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
        accessorFn: (row) => {
          const staff = users.filter((u) =>
            row.assignedStaffIds.includes(u.id)
          )
          return staff.length > 0
            ? staff.map((u) => u.name).join(", ")
            : "Unassigned"
        },
        enableGlobalFilter: false,
        getUniqueValues: (row) => row.assignedStaffIds,
        filterFn: (row, _columnId, filterValue: string[]) => {
          if (!Array.isArray(filterValue) || filterValue.length === 0) {
            return true
          }
          return filterValue.some((userId) =>
            row.original.assignedStaffIds.includes(userId)
          )
        },
        header: "Assigned",
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
      {
        columnId: "assigned",
        title: "Assigned User",
        options: [],
        requireSearch: true,
        searchPlaceholder: "Search users by name or email...",
        onSearch: async (query) => {
          const q = query.trim().toLowerCase()
          if (!q) return []
          await new Promise((resolve) => setTimeout(resolve, 180))
          return users
            .filter(
              (u) =>
                u.name.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q) ||
                u.role.toLowerCase().includes(q)
            )
            .map((u) => ({
              label: u.name,
              value: u.id,
              sublabel: u.role,
            }))
        },
      },
    ],
    [brands, users]
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
                  <BrandBadge
                    brandId={selectedLead.brandId}
                    brandName={selectedLead.brandName}
                    brands={brands}
                  />
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
      <LeadFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        editingLead={editingLead}
        onSaved={(savedLead) => {
          if (editingLead) {
            setSelectedLead((prev) =>
              prev && prev.id === editingLead.id ? savedLead : prev
            )
          }
        }}
      />

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
