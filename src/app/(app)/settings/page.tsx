"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Building2, ShieldCheck, Upload } from "lucide-react"
import { PageHeader } from "@/components/shared"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const settingsSchema = z.object({
  companyName: z.string().min(2),
  legalEntity: z.string().min(2),
  supportEmail: z.string().email(),
  phone: z.string().min(6),
  baseCurrency: z.enum(["USD", "GBP", "CAD"]),
  payrollCutoffDay: z.string(),
  address: z.string().min(5),
})

export default function GeneralSettingsPage() {
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null)

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      companyName: "AgencyOps Digital",
      legalEntity: "AgencyOps Digital Holdings LLC",
      supportEmail: "ops@agencyops.io",
      phone: "+1 (212) 555-0100",
      baseCurrency: "USD",
      payrollCutoffDay: "25th (26th-to-25th cycle)",
      address: "350 Fifth Avenue, Suite 4210, New York, NY 10118",
    },
  })

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setLogoPreview(reader.result)
        toast.success(`Updated company logo preview (${file.name})`)
      }
    }
    reader.readAsDataURL(file)
  }

  function onSubmit() {
    toast.success("Company profile & operational defaults saved")
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="General Settings"
        description="Configure agency organization profile, headquarters logo, and multi-currency payroll defaults."
        actions={
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href="/settings/security">
              <ShieldCheck className="size-4 text-primary" />
              Security & 2FA
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="size-4 text-primary" />
              Organization Logo
            </CardTitle>
            <CardDescription>
              Displayed on internal headers and default invoice footers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center">
              {logoPreview ? (
                <Image
                  src={logoPreview}
                  alt="Company logo"
                  width={80}
                  height={80}
                  unoptimized
                  className="size-20 rounded-xl border border-border object-cover"
                />
              ) : (
                <div className="flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1F63C8] to-[#0B3266] text-2xl font-bold text-white shadow-sm">
                  AO
                </div>
              )}
              <Label htmlFor="org-logo" className="cursor-pointer">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted">
                  <Upload className="size-3.5 text-primary" />
                  Upload Company Logo
                </span>
              </Label>
              <input
                id="org-logo"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleLogoUpload}
              />
              <p className="text-[11px] text-muted-foreground">
                Recommended: 256×256 SVG or transparent PNG
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-8">
          <CardHeader>
            <CardTitle>Company Profile</CardTitle>
            <CardDescription>
              Core legal entity details and reporting standards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="set-cname">Display Name</Label>
                  <Input id="set-cname" {...form.register("companyName")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="set-legal">Legal Entity</Label>
                  <Input id="set-legal" {...form.register("legalEntity")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="set-email">Operations Email</Label>
                  <Input
                    id="set-email"
                    type="email"
                    {...form.register("supportEmail")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="set-phone">Main Phone</Label>
                  <Input id="set-phone" {...form.register("phone")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Reporting Currency</Label>
                  <Controller
                    control={form.control}
                    name="baseCurrency"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
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
                  <Label htmlFor="set-cutoff">Payroll Cutoff Cycle</Label>
                  <Input
                    id="set-cutoff"
                    readOnly
                    {...form.register("payrollCutoffDay")}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="set-addr">Registered Office Address</Label>
                <Textarea
                  id="set-addr"
                  rows={2}
                  {...form.register("address")}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit">Save Settings</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
