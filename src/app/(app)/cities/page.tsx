"use client"

import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Edit3, MapPin, Plus, Trash2 } from "lucide-react"
import { DataTable, DataTableColumnHeader } from "@/components/data-table"
import { ConfirmDeleteDialog, PageHeader, StatusBadge } from "@/components/shared"
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
import { useStore } from "@/lib/store"
import type { City, CurrencyCode } from "@/types"

const citySchema = z.object({
  name: z.string().min(2, "City name must be at least 2 characters"),
  state: z.string().min(2, "State / Region required"),
  country: z.string().min(2, "Country required"),
  timezone: z.string().min(3, "Timezone required"),
  currency: z.enum(["USD", "GBP", "CAD"]),
})

export default function CitiesPage() {
  const { cities, createCity, updateCity, deleteCity, checkCityDeletion } = useStore()
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<City | null>(null)

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = React.useState<City | null>(null)
  const [deleteWarning, setDeleteWarning] = React.useState<string | undefined>()

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

  function openCreate() {
    setEditing(null)
    form.reset({
      name: "",
      state: "",
      country: "United States",
      timezone: "America/New_York",
      currency: "USD",
    })
    setOpen(true)
  }

  const openEdit = React.useCallback(
    (city: City) => {
      setEditing(city)
      form.reset({
        name: city.name,
        state: city.state,
        country: city.country,
        timezone: city.timezone,
        currency: city.currency,
      })
      setOpen(true)
    },
    [form]
  )

  const promptDelete = React.useCallback(
    (city: City) => {
      const check = checkCityDeletion(city.id)
      if (!check.allowed) {
        toast.error(check.reason || "Cannot delete this city territory.")
        return
      }
      setDeleteWarning(undefined)
      setDeleteTarget(city)
    },
    [checkCityDeletion]
  )

  function handleConfirmDelete() {
    if (!deleteTarget) return
    const res = deleteCity(deleteTarget.id)
    if (!res.allowed) {
      toast.error(res.reason || "Failed to delete city.")
    } else {
      toast.success(`Removed city territory ${deleteTarget.name}`)
      if (editing?.id === deleteTarget.id) {
        setOpen(false)
      }
    }
    setDeleteTarget(null)
  }

  function onSubmit(values: z.infer<typeof citySchema>) {
    if (editing) {
      updateCity(editing.id, {
        name: values.name,
        state: values.state,
        country: values.country,
        timezone: values.timezone,
        currency: values.currency as CurrencyCode,
      })
      toast.success(`Updated territory: ${values.name}`)
    } else {
      const created = createCity({
        name: values.name,
        state: values.state,
        country: values.country,
        timezone: values.timezone,
        currency: values.currency as CurrencyCode,
      })
      toast.success(`Added city territory: ${created.name}`)
    }
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
              onClick={() => openEdit(row.original)}
              title="Edit city"
            >
              <Edit3 className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => promptDelete(row.original)}
              title="Delete city"
              className="text-destructive hover:bg-destructive/10"
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
        title="Cities & Territories"
        description="Regional sales markets, local currency defaults, and timezone routing."
        badge={<Badge variant="secondary">{cities.length} territories</Badge>}
        actions={
          <Button
            type="button"
            onClick={openCreate}
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
            <DialogTitle>{editing ? `Edit ${editing.name}` : "Add Territory City"}</DialogTitle>
            <DialogDescription>
              Configure default currency and timezone for a regional market.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cit-name">City</Label>
                <Input id="cit-name" {...form.register("name")} />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cit-state">State / Region</Label>
                <Input id="cit-state" {...form.register("state")} />
                {form.formState.errors.state && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.state.message}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cit-country">Country</Label>
                <Input id="cit-country" {...form.register("country")} />
                {form.formState.errors.country && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.country.message}
                  </p>
                )}
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
              {form.formState.errors.timezone && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.timezone.message}
                </p>
              )}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editing ? "Save Territory" : "Add City"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title={`Delete City Territory "${deleteTarget?.name}"?`}
        description="Are you sure you want to remove this city territory? This action cannot be undone."
        warningMessage={deleteWarning}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
