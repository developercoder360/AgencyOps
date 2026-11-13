"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  AlertTriangle,
  Building2,
  Database,
  Download,
  FolderArchive,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react"
import { PageHeader } from "@/components/shared"
import { ProgressBar } from "@/components/tremor"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { useStore, type StorageEstimate } from "@/lib/store"

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
  const {
    exportBackup,
    importBackup,
    loadDemoData,
    clearAllData,
    getStorageUsage,
    isLoaded,
  } = useStore()

  const [logoPreview, setLogoPreview] = React.useState<string | null>(null)
  const [loadDemoOpen, setLoadDemoOpen] = React.useState(false)
  const [clearDataOpen, setClearDataOpen] = React.useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = React.useState("")

  const storageUsage: StorageEstimate = isLoaded
    ? getStorageUsage()
    : { usedBytes: 0, usedKb: 0, percent: 0 }

  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

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

  function handleExportBackup() {
    try {
      const json = exportBackup()
      const blob = new Blob([json], { type: "application/json;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      const dateStr = new Date().toISOString().slice(0, 10)
      a.href = url
      a.download = `agencyops-backup-${dateStr}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Downloaded store backup (JSON)")
    } catch {
      toast.error("Failed to generate backup JSON")
    }
  }

  function handleImportFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        const result = importBackup(reader.result)
        if (result.success) {
          toast.success(`Restored store from ${file.name}`)
        } else {
          toast.error(result.error || "Failed to restore backup")
        }
      }
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  function handleConfirmLoadDemo() {
    loadDemoData()
    setLoadDemoOpen(false)
    toast.success("Sample demo dataset loaded successfully!")
  }

  function handleConfirmClearData() {
    if (deleteConfirmText !== "DELETE") return
    clearAllData()
    setClearDataOpen(false)
    setDeleteConfirmText("")
    toast.success("All data cleared. AgencyOps is now in a fresh empty state.")
  }

  if (!isLoaded) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="General Settings"
        description="Configure agency organization profile, headquarters logo, and client-side data management."
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

        {/* Data Management Section */}
        <Card className="lg:col-span-12">
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Database className="size-4 text-primary" />
                  Client-Side Data Management
                </CardTitle>
                <CardDescription>
                  AgencyOps runs 100% in your browser. Export JSON backups, restore data, load sample records, or wipe local storage.
                </CardDescription>
              </div>
              <Badge variant="outline" className="w-fit font-mono text-xs">
                localStorage: v1
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Storage Usage Bar */}
            <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">
                  Browser Storage Utilization
                </span>
                <span className="font-mono text-muted-foreground">
                  {storageUsage.usedKb.toFixed(1)} KB / ~5,120 KB ({storageUsage.percent}%)
                </span>
              </div>
              <ProgressBar
                value={storageUsage.percent}
                color={storageUsage.percent > 80 ? "rose" : "blue"}
              />
              <p className="text-[11px] text-muted-foreground">
                All records persist automatically under browser key <code>agencyops:data:v1</code>. No external database is needed.
              </p>
            </div>

            {/* Actions Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Export Backup */}
              <div className="flex flex-col justify-between rounded-lg border border-border bg-card p-4 space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Download className="size-4 text-primary" />
                    <span className="font-semibold text-sm">Export Backup</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Download full JSON file containing brands, leads, invoices, tasks, and attendance.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleExportBackup}
                  className="w-full gap-1.5"
                >
                  <Download className="size-3.5" />
                  Export JSON
                </Button>
              </div>

              {/* Import Backup */}
              <div className="flex flex-col justify-between rounded-lg border border-border bg-card p-4 space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FolderArchive className="size-4 text-primary" />
                    <span className="font-semibold text-sm">Import Backup</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Restore a previously exported AgencyOps JSON backup file into your browser.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full gap-1.5"
                >
                  <Upload className="size-3.5" />
                  Upload Backup
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="sr-only"
                  onChange={handleImportFileChange}
                />
              </div>

              {/* Load Demo Data */}
              <div className="flex flex-col justify-between rounded-lg border border-border bg-card p-4 space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="size-4 text-blue-600 dark:text-blue-400" />
                    <span className="font-semibold text-sm">Load Demo Data</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Populate the app with a comprehensive mock dataset across all 29 routes.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setLoadDemoOpen(true)}
                  className="w-full gap-1.5 text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  <RefreshCw className="size-3.5" />
                  Load Demo Data
                </Button>
              </div>

              {/* Clear All Data */}
              <div className="flex flex-col justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-4 space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-destructive">
                    <Trash2 className="size-4" />
                    <span className="font-semibold text-sm">Clear All Data</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Wipe all records and reset AgencyOps back to a fresh, empty starting state.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setDeleteConfirmText("")
                    setClearDataOpen(true)
                  }}
                  className="w-full gap-1.5"
                >
                  <Trash2 className="size-3.5" />
                  Reset Store
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog: Load Demo Data */}
      <Dialog open={loadDemoOpen} onOpenChange={setLoadDemoOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="size-4 text-blue-600" />
              Load Sample Demo Dataset?
            </DialogTitle>
            <DialogDescription>
              This will populate your local browser storage with full sample agency brands, teams, clients, invoices, deliverables, and payroll records. Any existing manual records will be overwritten.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLoadDemoOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmLoadDemo}
            >
              Confirm & Load Demo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog: Clear All Data */}
      <Dialog open={clearDataOpen} onOpenChange={setClearDataOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertTriangle className="size-4" />
              </div>
              <DialogTitle className="text-base font-semibold">
                Reset All Agency Data?
              </DialogTitle>
            </div>
            <DialogDescription className="pt-2 text-xs text-muted-foreground">
              This action is permanent and cannot be undone. All custom brands, clients, leads, invoices, tasks, and attendance records stored in your browser will be completely deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="clear-confirm" className="text-xs">
              Type <strong>DELETE</strong> to confirm:
            </Label>
            <Input
              id="clear-confirm"
              placeholder="DELETE"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="font-mono text-sm"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setClearDataOpen(false)
                setDeleteConfirmText("")
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteConfirmText !== "DELETE"}
              onClick={handleConfirmClearData}
            >
              Permanently Clear Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
