"use client"

import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { MapPin, Plus } from "lucide-react"
import { DataTable, DataTableColumnHeader } from "@/components/data-table"
import { PageHeader, StatusBadge } from "@/components/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { MOCK_CITIES } from "@/mocks/brands"
import type { City, CurrencyCode } from "@/types"

const citySchema = z.object({
  name: z.string().min(2),
  state: z.string().min(2),
  country: z.string().min(2),
  timezone: z.string().min(3),
  currency: z.enum(["USD", "GBP", "CAD"]),
})

export default function CitiesPage() {
  const [cities, setCities] = React.useState<City[]>(MOCK_CITIES)
  const [open, setOpen] = React.useState(false)

  const form = useForm<z.infer<typeof citySchema>>({
    resolver: zodResolver(citySchema),
    defaultValues: {
      name: "",
      state: "",
      country: "United States",
      timezone: "America/New_York",
      currency: "USD",
    },
  })

  function onSubmit(values: z.infer<typeof citySchema>) {
    const created: City = {
      id: `cit-new-${cities.length + 1}`,
      name: values.name,
      state: values.state,
      country: values.country,
      timezone: values.timezone,
      currency: values.currency as CurrencyCode,
      activeClients: 0,
      leadCount: 0,
      status: "Active",
    }
    setCities((prev) => [created, ...prev])
    toast.success(`Added city territory: ${created.name}`)
    form.reset()
    setOpen(false)
  }

  const columns = React.useMemo<ColumnDef<City>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="City" />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2 font-medium">
            <MapPin className="size-3.5 text-primary" />
            <span>
              {row.original.name}, {row.original.state}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "country",
        header: "Country",
      },
      {
        accessorKey: "currency",
        header: "Billing Currency",
        cell: ({ row }) => (
          <Badge variant="outline">{row.original.currency}</Badge>
        ),
      },
      {
        accessorKey: "timezone",
        header: "Timezone",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.timezone}
          </span>
        ),
      },
      {
        accessorKey: "activeClients",
        header: "Clients",
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.activeClients}</span>
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
        title="Cities & Territories"
        description="Regional sales markets, local currency defaults, and timezone routing."
        actions={
          <Button
            type="button"
            onClick={() => setOpen(true)}
            className="gap-1.5"
          >
            <Plus className="size-4" />
            Add City
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={cities}
        searchPlaceholder="Search cities, countries, currencies..."
        exportModule="Cities"
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Territory City</DialogTitle>
            <DialogDescription>
              Configure default currency and timezone for a new market.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cit-name">City</Label>
                <Input id="cit-name" {...form.register("name")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cit-state">State / Region</Label>
                <Input id="cit-state" {...form.register("state")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cit-country">Country</Label>
                <Input id="cit-country" {...form.register("country")} />
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
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="CAD">CAD</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cit-tz">Timezone</Label>
              <Input id="cit-tz" {...form.register("timezone")} />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Add City</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
