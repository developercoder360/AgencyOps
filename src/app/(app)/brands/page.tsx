"use client"

import * as React from "react"
import Image from "next/image"
import type { ColumnDef } from "@tanstack/react-table"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Globe, Plus, Upload } from "lucide-react"
import { DataTable, DataTableColumnHeader } from "@/components/data-table"
import { PageHeader, StatusBadge } from "@/components/shared"
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
import { MOCK_BRANDS } from "@/mocks/brands"
import type { Brand } from "@/types"

const brandSchema = z.object({
  name: z.string().min(2),
  domain: z.string().min(4),
  tagline: z.string().min(4),
  email: z.string().email(),
  phone: z.string().min(6),
  primaryColor: z.string().min(4),
})

export default function BrandsPage() {
  const [brands, setBrands] = React.useState<Brand[]>(MOCK_BRANDS)
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Brand | null>(null)
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null)

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

  function openEdit(brand: Brand) {
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
      setBrands((prev) =>
        prev.map((b) =>
          b.id === editing.id
            ? {
                ...b,
                ...values,
                logoText: initials || b.logoText,
                logoUrl: logoPreview ?? undefined,
              }
            : b
        )
      )
      toast.success(`Updated brand ${values.name}`)
    } else {
      const created: Brand = {
        id: `brd-new-${brands.length + 1}`,
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
        createdAt: "2026-11-11",
      }
      setBrands((prev) => [created, ...prev])
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
    ],
    []
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
                  className="flex size-16 shrink-0 items-center justify-center rounded-(--radius-surface) text-lg font-bold text-white"
                  style={{ backgroundColor: watchColor || "var(--brand-fallback-bg)" }}
                >
                  {(watchName || "BR")
                    .split(/\s+/)
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="brand-logo-upload" className="cursor-pointer">
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted">
                    <Upload className="size-3.5 text-primary" />
                    Upload Logo Preview
                  </span>
                </Label>
                <input
                  id="brand-logo-upload"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleLogoChange}
                />
                <p className="text-[11px] text-muted-foreground">
                  PNG, SVG, or JPG • Instant client-side preview
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="brd-name">Brand Name</Label>
                <Input id="brd-name" {...form.register("name")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="brd-color">Accent Color</Label>
                <Input
                  id="brd-color"
                  type="color"
                  className="h-9 cursor-pointer p-1"
                  {...form.register("primaryColor")}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="brd-domain">Website Domain</Label>
              <Input
                id="brd-domain"
                placeholder="studio.example.com"
                {...form.register("domain")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="brd-tag">Tagline</Label>
              <Input id="brd-tag" {...form.register("tagline")} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="brd-email">Support Email</Label>
                <Input
                  id="brd-email"
                  type="email"
                  {...form.register("email")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="brd-phone">Phone</Label>
                <Input id="brd-phone" {...form.register("phone")} />
              </div>
            </div>
            <SheetFooter className="px-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editing ? "Save Brand" : "Create Brand"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
