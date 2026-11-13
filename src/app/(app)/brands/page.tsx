"use client"

import * as React from "react"
import Image from "next/image"
import type { ColumnDef } from "@tanstack/react-table"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Edit3, Globe, Plus, Trash2, Upload } from "lucide-react"
import { DataTable, DataTableColumnHeader } from "@/components/data-table"
import { ConfirmDeleteDialog, PageHeader, StatusBadge } from "@/components/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { formatCurrency } from "@/lib/currency"
import { useStore } from "@/lib/store"
import type { Brand } from "@/types"

const brandSchema = z.object({
  name: z.string().min(2, "Brand name must be at least 2 characters"),
  domain: z.string().min(4, "Domain required"),
  tagline: z.string().min(4, "Tagline required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(6, "Phone number required"),
  primaryColor: z.string().min(4),
})

export default function BrandsPage() {
  const { brands, createBrand, updateBrand, deleteBrand, checkBrandDeletion } = useStore()

  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Brand | null>(null)
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null)

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = React.useState<Brand | null>(null)
  const [deleteWarning, setDeleteWarning] = React.useState<string | undefined>()

  const form = useForm<z.infer<typeof brandSchema>>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: "",
      domain: "",
      tagline: "",
      email: "",
      phone: "",
      primaryColor: "#2563EB",
    },
  })

  const watchName = useWatch({ control: form.control, name: "name" }) ?? ""
  const watchColor =
    useWatch({ control: form.control, name: "primaryColor" }) ?? "#2563EB"

  function openCreate() {
    setEditing(null)
    setLogoPreview(null)
    form.reset({
      name: "",
      domain: "",
      tagline: "",
      email: "",
      phone: "",
      primaryColor: "#2563EB",
    })
    setOpen(true)
  }

  const openEdit = React.useCallback(
    (brand: Brand) => {
      setEditing(brand)
      setLogoPreview(brand.logoUrl ?? null)
      form.reset({
        name: brand.name,
        domain: brand.domain,
        tagline: brand.tagline,
        email: brand.email,
        phone: brand.phone,
        primaryColor: brand.primaryColor,
      })
      setOpen(true)
    },
    [form]
  )

  const promptDelete = React.useCallback(
    (brand: Brand) => {
      const check = checkBrandDeletion(brand.id)
      if (!check.allowed) {
        toast.error(check.reason || "Cannot delete this brand because other records depend on it.")
        return
      }
      setDeleteWarning(undefined)
      setDeleteTarget(brand)
    },
    [checkBrandDeletion]
  )

  function handleConfirmDelete() {
    if (!deleteTarget) return
    const res = deleteBrand(deleteTarget.id)
    if (!res.allowed) {
      toast.error(res.reason || "Failed to delete brand.")
    } else {
      toast.success(`Removed brand ${deleteTarget.name}`)
      if (editing?.id === deleteTarget.id) {
        setOpen(false)
      }
    }
    setDeleteTarget(null)
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setLogoPreview(reader.result)
        toast.success(`Loaded preview for ${file.name}`)
      }
    }
    reader.readAsDataURL(file)
  }

  function onSubmit(values: z.infer<typeof brandSchema>) {
    const initials = values.name
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)

    if (editing) {
      updateBrand(editing.id, {
        ...values,
        logoText: initials || editing.logoText,
        logoUrl: logoPreview ?? undefined,
      })
      toast.success(`Updated brand ${values.name}`)
    } else {
      const created = createBrand({
        name: values.name,
        slug: values.name.toLowerCase().replace(/\s+/g, "-"),
        domain: values.domain,
        tagline: values.tagline,
        primaryColor: values.primaryColor,
        logoText: initials || "BR",
        logoUrl: logoPreview ?? undefined,
        email: values.email,
        phone: values.phone,
        activeLeads: 0,
        monthlyRevenueUsd: 0,
        status: "Active",
      })
      toast.success(`Added agency brand ${created.name}`)
    }
    setOpen(false)
  }

  const columns = React.useMemo<ColumnDef<Brand>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Brand" />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            {row.original.logoUrl ? (
              <Image
                src={row.original.logoUrl}
                alt={row.original.name}
                width={36}
                height={36}
                unoptimized
                className="size-9 rounded-lg border border-border object-cover"
              />
            ) : (
              <div
                className="flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                style={{ backgroundColor: row.original.primaryColor }}
              >
                {row.original.logoText}
              </div>
            )}
            <div>
              <div className="font-medium">{row.original.name}</div>
              <div className="text-xs text-muted-foreground">
                {row.original.tagline}
              </div>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "domain",
        header: "Domain",
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Globe className="size-3.5" />
            {row.original.domain}
          </span>
        ),
      },
      {
        accessorKey: "activeLeads",
        header: "Active Leads",
        cell: ({ row }) => (
          <Badge variant="secondary" className="tabular-nums">
            {row.original.activeLeads}
          </Badge>
        ),
      },
      {
        accessorKey: "monthlyRevenueUsd",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Monthly Target" />
        ),
        cell: ({ row }) => (
          <span className="font-medium tabular-nums">
            {formatCurrency(row.original.monthlyRevenueUsd)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div
            className="flex items-center justify-end gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => openEdit(row.original)}
              aria-label={`Edit ${row.original.name}`}
            >
              <Edit3 className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-destructive hover:text-destructive"
              onClick={() => promptDelete(row.original)}
              aria-label={`Delete ${row.original.name}`}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    [openEdit, promptDelete]
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agency Brands"
        description="Manage agency storefronts, domain identities, brand accent colors, and logo assets."
        actions={
          <Button type="button" onClick={openCreate} className="gap-1.5">
            <Plus className="size-4" />
            Add Brand
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={brands}
        searchPlaceholder="Search brands or domains..."
        exportModule="Brands"
        onRowClick={openEdit}
      />

      {/* Brand Create/Edit Sheet with Logo Upload Preview */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="overflow-y-auto sm:max-w-lg">
          <SheetHeader className="border-b border-border pb-3">
            <SheetTitle>
              {editing ? `Edit ${editing.name}` : "Add Agency Brand"}
            </SheetTitle>
            <SheetDescription>
              Upload a brand logo and configure customer-facing invoice identity.
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
            {/* Logo Upload Preview */}
            <div className="flex items-center gap-4 rounded-xl border border-border bg-muted/20 p-3.5">
              {logoPreview ? (
                <Image
                  src={logoPreview}
                  alt="Brand logo preview"
                  width={64}
                  height={64}
                  unoptimized
                  className="size-16 rounded-xl border border-border object-cover"
                />
              ) : (
                <div
                  className="flex size-16 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white"
                  style={{ backgroundColor: watchColor || "#2563EB" }}
                >
                  {(watchName || "BR")
                    .split(/\s+/)
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2) || "BR"}
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="brand-logo-file" className="cursor-pointer">
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted">
                    <Upload className="size-3.5 text-primary" />
                    Upload Logo Asset
                  </span>
                </Label>
                <input
                  id="brand-logo-file"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleLogoChange}
                />
                <p className="text-[11px] text-muted-foreground">
                  Accepts PNG, JPG, or SVG. Stored in browser.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="br-name">Brand Name</Label>
              <Input
                id="br-name"
                placeholder="e.g. Apex Studio"
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="br-domain">Domain</Label>
                <Input
                  id="br-domain"
                  placeholder="apexstudio.com"
                  {...form.register("domain")}
                />
                {form.formState.errors.domain && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.domain.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="br-color">Primary Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    className="size-8 cursor-pointer rounded border border-border"
                    {...form.register("primaryColor")}
                  />
                  <Input
                    id="br-color"
                    className="font-mono text-xs uppercase"
                    {...form.register("primaryColor")}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="br-tagline">Tagline</Label>
              <Input
                id="br-tagline"
                placeholder="High-converting digital branding & web design"
                {...form.register("tagline")}
              />
              {form.formState.errors.tagline && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.tagline.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="br-email">Support Email</Label>
                <Input
                  id="br-email"
                  type="email"
                  placeholder="hello@brand.com"
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="br-phone">Inquiry Phone</Label>
                <Input
                  id="br-phone"
                  placeholder="+1 (555) 012-3456"
                  {...form.register("phone")}
                />
                {form.formState.errors.phone && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.phone.message}
                  </p>
                )}
              </div>
            </div>

            <SheetFooter className="mt-6 border-t border-border pt-4">
              {editing ? (
                <div className="flex w-full items-center justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => promptDelete(editing)}
                  >
                    <Trash2 className="mr-1.5 size-4" />
                    Delete Brand
                  </Button>
                  <Button type="submit">Save Changes</Button>
                </div>
              ) : (
                <Button type="submit" className="w-full">
                  Create Brand
                </Button>
              )}
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title={`Delete Brand "${deleteTarget?.name}"?`}
        description="Are you sure you want to delete this agency brand storefront? This cannot be undone."
        warningMessage={deleteWarning}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
