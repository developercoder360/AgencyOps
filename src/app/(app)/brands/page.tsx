"use client"

import * as React from "react"
import Image from "next/image"
import type { ColumnDef } from "@tanstack/react-table"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  Edit3,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  Mail,
  MapPin,
  Phone,
  Plus,
  Upload,
} from "lucide-react"
import { DataTable, DataTableColumnHeader } from "@/components/data-table"
import { GatewayBadge, PageHeader } from "@/components/shared"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useStore } from "@/lib/store"
import type { Brand } from "@/types"

const brandSchema = z.object({
  name: z.string().min(2, "Brand name must be at least 2 characters"),
  domain: z.string().min(4, "Domain required"),
  address: z.string().min(3, "Business address required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(6, "Phone number required"),
  primaryColor: z.string().min(4),
  merchantKeys: z
    .object({
      stripe: z
        .object({
          publishableKey: z.string().optional(),
          secretKey: z.string().optional(),
        })
        .optional(),
      authorizeNet: z
        .object({
          merchantId: z.string().optional(),
          transactionKey: z.string().optional(),
          loginId: z.string().optional(),
        })
        .optional(),
      nmi: z
        .object({
          dataTokenizationKey: z.string().optional(),
          securityKey: z.string().optional(),
        })
        .optional(),
      square: z
        .object({
          applicationId: z.string().optional(),
          accessToken: z.string().optional(),
          locationId: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
})

export default function BrandsPage() {
  const { brands, createBrand, updateBrand } = useStore()

  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Brand | null>(null)
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null)
  const [showSecrets, setShowSecrets] = React.useState<Record<string, boolean>>({})

  const toggleSecret = (field: string) => {
    setShowSecrets((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  const form = useForm<z.infer<typeof brandSchema>>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: "",
      domain: "",
      address: "",
      email: "",
      phone: "",
      primaryColor: "#2563EB",
      merchantKeys: {
        stripe: { publishableKey: "", secretKey: "" },
        authorizeNet: { merchantId: "", transactionKey: "", loginId: "" },
        nmi: { dataTokenizationKey: "", securityKey: "" },
        square: { applicationId: "", accessToken: "", locationId: "" },
      },
    },
  })

  const watchName = useWatch({ control: form.control, name: "name" }) ?? ""
  const watchColor =
    useWatch({ control: form.control, name: "primaryColor" }) ?? "#2563EB"
  const watchMerchantKeys = useWatch({ control: form.control, name: "merchantKeys" })

  const hasStripe = Boolean(
    watchMerchantKeys?.stripe?.publishableKey || watchMerchantKeys?.stripe?.secretKey
  )
  const hasAuthNet = Boolean(
    watchMerchantKeys?.authorizeNet?.merchantId ||
      watchMerchantKeys?.authorizeNet?.transactionKey ||
      watchMerchantKeys?.authorizeNet?.loginId
  )
  const hasNmi = Boolean(
    watchMerchantKeys?.nmi?.dataTokenizationKey || watchMerchantKeys?.nmi?.securityKey
  )
  const hasSquare = Boolean(
    watchMerchantKeys?.square?.applicationId ||
      watchMerchantKeys?.square?.accessToken ||
      watchMerchantKeys?.square?.locationId
  )

  function openCreate() {
    setEditing(null)
    setLogoPreview(null)
    setShowSecrets({})
    form.reset({
      name: "",
      domain: "",
      address: "",
      email: "",
      phone: "",
      primaryColor: "#2563EB",
      merchantKeys: {
        stripe: { publishableKey: "", secretKey: "" },
        authorizeNet: { merchantId: "", transactionKey: "", loginId: "" },
        nmi: { dataTokenizationKey: "", securityKey: "" },
        square: { applicationId: "", accessToken: "", locationId: "" },
      },
    })
    setOpen(true)
  }

  const openEdit = React.useCallback(
    (brand: Brand) => {
      setEditing(brand)
      setLogoPreview(brand.logoUrl ?? null)
      setShowSecrets({})
      form.reset({
        name: brand.name,
        domain: brand.domain,
        address: brand.address || "",
        email: brand.email,
        phone: brand.phone,
        primaryColor: brand.primaryColor,
        merchantKeys: {
          stripe: {
            publishableKey: brand.merchantKeys?.stripe?.publishableKey || "",
            secretKey: brand.merchantKeys?.stripe?.secretKey || "",
          },
          authorizeNet: {
            merchantId: brand.merchantKeys?.authorizeNet?.merchantId || "",
            transactionKey: brand.merchantKeys?.authorizeNet?.transactionKey || "",
            loginId: brand.merchantKeys?.authorizeNet?.loginId || "",
          },
          nmi: {
            dataTokenizationKey:
              brand.merchantKeys?.nmi?.dataTokenizationKey || "",
            securityKey: brand.merchantKeys?.nmi?.securityKey || "",
          },
          square: {
            applicationId: brand.merchantKeys?.square?.applicationId || "",
            accessToken: brand.merchantKeys?.square?.accessToken || "",
            locationId: brand.merchantKeys?.square?.locationId || "",
          },
        },
      })
      setOpen(true)
    },
    [form]
  )

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
        name: values.name,
        domain: values.domain,
        address: values.address,
        primaryColor: values.primaryColor,
        email: values.email,
        phone: values.phone,
        logoText: initials || editing.logoText,
        logoUrl: logoPreview ?? undefined,
        merchantKeys: values.merchantKeys,
      })
      toast.success(`Updated brand ${values.name}`)
    } else {
      const created = createBrand({
        name: values.name,
        slug: values.name.toLowerCase().replace(/\s+/g, "-"),
        domain: values.domain,
        address: values.address,
        primaryColor: values.primaryColor,
        logoText: initials || "BR",
        logoUrl: logoPreview ?? undefined,
        email: values.email,
        phone: values.phone,
        activeLeads: 0,
        monthlyRevenueUsd: 0,
        status: "Active",
        merchantKeys: values.merchantKeys,
      })
      toast.success(`Added agency brand ${created.name}`)
    }
    setOpen(false)
  }

  const columns = React.useMemo<ColumnDef<Brand>[]>(
    () => [
      {
        accessorKey: "id",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Hash ID" />
        ),
        cell: ({ row }) => (
          <span className="inline-flex items-center rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 font-mono text-xs font-semibold text-primary">
            #{row.original.id.replace(/^#/, "")}
          </span>
        ),
      },
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
            <div className="min-w-0 space-y-0.5">
              <div className="truncate font-medium leading-none">
                {row.original.name}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground line-clamp-1 max-w-[260px]">
                <MapPin className="size-3 shrink-0 text-muted-foreground/70" />
                <span className="truncate">
                  {row.original.address || "No address configured"}
                </span>
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
        id: "contactInfo",
        header: "Contact Info",
        cell: ({ row }) => (
          <div className="space-y-1 text-xs">
            {row.original.email && (
              <div className="flex items-center gap-1.5 text-foreground">
                <Mail className="size-3 shrink-0 text-muted-foreground" />
                <a
                  href={`mailto:${row.original.email}`}
                  className="max-w-[190px] truncate hover:text-primary hover:underline transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {row.original.email}
                </a>
              </div>
            )}
            {row.original.phone && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Phone className="size-3 shrink-0 text-muted-foreground/70" />
                <a
                  href={`tel:${row.original.phone}`}
                  className="hover:text-foreground hover:underline transition-colors truncate"
                  onClick={(e) => e.stopPropagation()}
                >
                  {row.original.phone}
                </a>
              </div>
            )}
          </div>
        ),
      },
      {
        id: "merchantGateways",
        header: "Merchant Gateways",
        cell: ({ row }) => {
          const keys = row.original.merchantKeys
          const configured: ("Stripe" | "Authorize.Net" | "NMI" | "Square")[] = []
          if (keys?.stripe?.publishableKey || keys?.stripe?.secretKey) {
            configured.push("Stripe")
          }
          if (
            keys?.authorizeNet?.merchantId ||
            keys?.authorizeNet?.transactionKey ||
            keys?.authorizeNet?.loginId
          ) {
            configured.push("Authorize.Net")
          }
          if (keys?.nmi?.dataTokenizationKey || keys?.nmi?.securityKey) {
            configured.push("NMI")
          }
          if (
            keys?.square?.applicationId ||
            keys?.square?.accessToken ||
            keys?.square?.locationId
          ) {
            configured.push("Square")
          }

          if (configured.length === 0) {
            return (
              <span className="text-xs text-muted-foreground/60 italic">
                None configured
              </span>
            )
          }

          return (
            <div className="flex flex-wrap items-center gap-1.5">
              {configured.map((gateway) => (
                <GatewayBadge key={gateway} gateway={gateway} />
              ))}
            </div>
          )
        },
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
          </div>
        ),
      },
    ],
    [openEdit]
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agency Brands"
        description="Manage agency storefronts, domain identities, brand accent colors, address, and merchant API gateway credentials."
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
        searchPlaceholder="Search brands, domains, address or ID..."
        exportModule="Brands"
        onRowClick={openEdit}
      />

      {/* Brand Create/Edit Sheet with Logo Upload Preview & Merchant API Keys */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-full max-w-[100vw] overflow-y-auto sm:max-w-xl"
        >
          <SheetHeader className="border-b border-border pb-3">
            <SheetTitle>
              {editing ? `Edit ${editing.name}` : "Add Agency Brand"}
            </SheetTitle>
            <SheetDescription>
              Configure brand identity, address, and merchant payment gateway API credentials.
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 p-4">
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

            {/* Address */}
            <div className="space-y-1.5">
              <Label htmlFor="br-address">Business Address</Label>
              <Input
                id="br-address"
                placeholder="e.g. 100 Montgomery St, Suite 1200, San Francisco, CA 94104"
                {...form.register("address")}
              />
              {form.formState.errors.address && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.address.message}
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

            {/* Responsive Merchant API Keys Section */}
            <div className="space-y-3 rounded-xl border border-border bg-muted/10 p-3.5 sm:p-4">
              <div className="flex items-center gap-2">
                <KeyRound className="size-4 text-primary" />
                <h4 className="text-sm font-semibold tracking-tight">
                  Merchants API Keys
                </h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Configure payment gateway credentials for live payment links, hosted checkout, and client invoices.
              </p>

              {/* Fully responsive Tabs container for all screen sizes */}
              <Tabs defaultValue="stripe" className="w-full pt-1">
                <TabsList className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 w-full !h-auto bg-muted/70 rounded-xl">
                  <TabsTrigger
                    value="stripe"
                    className="h-8.5 px-2 text-xs font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all flex items-center justify-center gap-1.5 truncate"
                  >
                    <span>Stripe</span>
                    {hasStripe && (
                      <span
                        className="size-1.5 rounded-full bg-emerald-500 shrink-0"
                        title="Stripe configured"
                      />
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="authorizeNet"
                    className="h-8.5 px-2 text-xs font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all flex items-center justify-center gap-1.5 truncate"
                  >
                    <span>Authorize.Net</span>
                    {hasAuthNet && (
                      <span
                        className="size-1.5 rounded-full bg-emerald-500 shrink-0"
                        title="Authorize.Net configured"
                      />
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="nmi"
                    className="h-8.5 px-2 text-xs font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all flex items-center justify-center gap-1.5 truncate"
                  >
                    <span>NMI</span>
                    {hasNmi && (
                      <span
                        className="size-1.5 rounded-full bg-emerald-500 shrink-0"
                        title="NMI configured"
                      />
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="square"
                    className="h-8.5 px-2 text-xs font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all flex items-center justify-center gap-1.5 truncate"
                  >
                    <span>Square</span>
                    {hasSquare && (
                      <span
                        className="size-1.5 rounded-full bg-emerald-500 shrink-0"
                        title="Square configured"
                      />
                    )}
                  </TabsTrigger>
                </TabsList>

                {/* Stripe */}
                <TabsContent value="stripe" className="space-y-3 pt-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="stripe-pub-key" className="text-xs">
                      Publishable Key
                    </Label>
                    <Input
                      id="stripe-pub-key"
                      placeholder="pk_live_..."
                      className="font-mono text-xs w-full min-w-0"
                      {...form.register("merchantKeys.stripe.publishableKey")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="stripe-sec-key" className="text-xs truncate">
                        Secret Key
                      </Label>
                      <button
                        type="button"
                        onClick={() => toggleSecret("stripe_sec")}
                        className="shrink-0 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                      >
                        {showSecrets["stripe_sec"] ? (
                          <>
                            <EyeOff className="size-3" /> Hide
                          </>
                        ) : (
                          <>
                            <Eye className="size-3" /> Show
                          </>
                        )}
                      </button>
                    </div>
                    <Input
                      id="stripe-sec-key"
                      type={showSecrets["stripe_sec"] ? "text" : "password"}
                      placeholder="sk_live_..."
                      className="font-mono text-xs w-full min-w-0"
                      {...form.register("merchantKeys.stripe.secretKey")}
                    />
                  </div>
                </TabsContent>

                {/* Authorize.Net */}
                <TabsContent value="authorizeNet" className="space-y-3 pt-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="authnet-mid" className="text-xs">
                      Merchant ID
                    </Label>
                    <Input
                      id="authnet-mid"
                      placeholder="e.g. authnet_92810"
                      className="font-mono text-xs w-full min-w-0"
                      {...form.register("merchantKeys.authorizeNet.merchantId")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="authnet-tx-key" className="text-xs truncate">
                        Transaction Key
                      </Label>
                      <button
                        type="button"
                        onClick={() => toggleSecret("authnet_tx")}
                        className="shrink-0 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                      >
                        {showSecrets["authnet_tx"] ? (
                          <>
                            <EyeOff className="size-3" /> Hide
                          </>
                        ) : (
                          <>
                            <Eye className="size-3" /> Show
                          </>
                        )}
                      </button>
                    </div>
                    <Input
                      id="authnet-tx-key"
                      type={showSecrets["authnet_tx"] ? "text" : "password"}
                      placeholder="e.g. 8aB9c7D6e5F4g3H2"
                      className="font-mono text-xs w-full min-w-0"
                      {...form.register("merchantKeys.authorizeNet.transactionKey")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="authnet-login-id" className="text-xs">
                      Login ID
                    </Label>
                    <Input
                      id="authnet-login-id"
                      placeholder="e.g. apx_pf_live_login"
                      className="font-mono text-xs w-full min-w-0"
                      {...form.register("merchantKeys.authorizeNet.loginId")}
                    />
                  </div>
                </TabsContent>

                {/* NMI */}
                <TabsContent value="nmi" className="space-y-3 pt-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="nmi-token-key" className="text-xs">
                      Data Tokenization Key
                    </Label>
                    <Input
                      id="nmi-token-key"
                      placeholder="e.g. tok_nmi_live_..."
                      className="font-mono text-xs w-full min-w-0"
                      {...form.register(
                        "merchantKeys.nmi.dataTokenizationKey"
                      )}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="nmi-sec-key" className="text-xs truncate">
                        Security Key
                      </Label>
                      <button
                        type="button"
                        onClick={() => toggleSecret("nmi_sec")}
                        className="shrink-0 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                      >
                        {showSecrets["nmi_sec"] ? (
                          <>
                            <EyeOff className="size-3" /> Hide
                          </>
                        ) : (
                          <>
                            <Eye className="size-3" /> Show
                          </>
                        )}
                      </button>
                    </div>
                    <Input
                      id="nmi-sec-key"
                      type={showSecrets["nmi_sec"] ? "text" : "password"}
                      placeholder="e.g. sec_nmi_key_..."
                      className="font-mono text-xs w-full min-w-0"
                      {...form.register("merchantKeys.nmi.securityKey")}
                    />
                  </div>
                </TabsContent>

                {/* Square */}
                <TabsContent value="square" className="space-y-3 pt-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="square-app-id" className="text-xs">
                      Square Application ID
                    </Label>
                    <Input
                      id="square-app-id"
                      placeholder="e.g. sq0idp-..."
                      className="font-mono text-xs w-full min-w-0"
                      {...form.register("merchantKeys.square.applicationId")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="square-access-token" className="text-xs truncate">
                        Square Access Token
                      </Label>
                      <button
                        type="button"
                        onClick={() => toggleSecret("square_token")}
                        className="shrink-0 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                      >
                        {showSecrets["square_token"] ? (
                          <>
                            <EyeOff className="size-3" /> Hide
                          </>
                        ) : (
                          <>
                            <Eye className="size-3" /> Show
                          </>
                        )}
                      </button>
                    </div>
                    <Input
                      id="square-access-token"
                      type={showSecrets["square_token"] ? "text" : "password"}
                      placeholder="e.g. EAAAEOw_..."
                      className="font-mono text-xs w-full min-w-0"
                      {...form.register("merchantKeys.square.accessToken")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="square-loc-id" className="text-xs">
                      Square Location ID
                    </Label>
                    <Input
                      id="square-loc-id"
                      placeholder="e.g. LOC_MAIN_01"
                      className="font-mono text-xs w-full min-w-0"
                      {...form.register("merchantKeys.square.locationId")}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <SheetFooter className="mt-6 border-t border-border pt-4">
              <div className="flex w-full items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editing ? "Save Changes" : "Create Brand"}
                </Button>
              </div>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
