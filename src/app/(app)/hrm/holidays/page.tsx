"use client"

import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { CalendarHeart, Plus, Trash2 } from "lucide-react"
import {
  DataTable,
  DataTableColumnHeader,
  type FacetedFilterConfig,
} from "@/components/data-table"
import { ConfirmDeleteDialog, PageHeader } from "@/components/shared"
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
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { useStore } from "@/lib/store"
import type { Holiday } from "@/types"

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  date: z.string().min(8, "Enter valid date"),
  type: z.enum(["Public", "Company", "Optional"]),
  region: z.string().min(2, "Enter region"),
  description: z.string().min(3, "Enter description"),
})

export default function HolidaysPage() {
  const { holidays, createHoliday, deleteHoliday, isLoaded } = useStore()
  const [open, setOpen] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<Holiday | null>(null)

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      date: "2026-12-31",
      type: "Company",
      region: "Global (US / UK / CA)",
      description: "Early closure / agency celebration day.",
    },
  })

  function onSubmit(values: z.infer<typeof schema>) {
    const created = createHoliday({
      name: values.name,
      date: values.date,
      type: values.type,
      region: values.region,
      description: values.description,
    })
    toast.success(`Added holiday: ${created.name}`)
    form.reset()
    setOpen(false)
  }

  const promptDelete = React.useCallback((hol: Holiday) => {
    setDeleteTarget(hol)
  }, [])

  function handleConfirmDelete() {
    if (!deleteTarget) return
    deleteHoliday(deleteTarget.id)
    toast.success(`Removed holiday: ${deleteTarget.name}`)
    setDeleteTarget(null)
  }

  const columns = React.useMemo<ColumnDef<Holiday>[]>(
    () => [
      {
        accessorKey: "date",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Date" />
        ),
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1.5 font-mono text-xs font-medium">
            <CalendarHeart className="size-3.5 text-primary" />
            {row.original.date}
          </span>
        ),
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Holiday" />
        ),
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.name}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.description}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => (
          <Badge
            variant={
              row.original.type === "Public"
                ? "default"
                : row.original.type === "Company"
                  ? "secondary"
                  : "outline"
            }
          >
            {row.original.type}
          </Badge>
        ),
      },
      {
        accessorKey: "region",
        header: "Region",
      },
      {
        id: "actions",
        header: "",
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end">
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => promptDelete(row.original)}
              aria-label="Delete holiday"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    [promptDelete]
  )

  const facetedFilters = React.useMemo<FacetedFilterConfig[]>(
    () => [
      {
        columnId: "type",
        title: "Type",
        options: [
          { label: "Public", value: "Public" },
          { label: "Company", value: "Company" },
          { label: "Optional", value: "Optional" },
        ],
      },
    ],
    []
  )

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
        title="Agency Holidays"
        description="Regional bank holidays and paid company-wide recharge days synced with payroll attendance."
        badge={<Badge variant="secondary">{holidays.length} holidays</Badge>}
        actions={
          <Button
            type="button"
            onClick={() => setOpen(true)}
            className="gap-1.5"
          >
            <Plus className="size-4" />
            Add Holiday
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={holidays}
        searchPlaceholder="Search holidays by name or region..."
        facetedFilters={facetedFilters}
        dateField="date"
        exportModule="Holidays"
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Holiday</DialogTitle>
            <DialogDescription>
              Add a paid public or company holiday to the 2026 calendar.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="hol-name">Holiday Name</Label>
              <Input id="hol-name" {...form.register("name")} />
              {form.formState.errors.name ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.name.message}
                </p>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="hol-date">Date</Label>
                <Input id="hol-date" type="date" {...form.register("date")} />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Controller
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Public">Public</SelectItem>
                        <SelectItem value="Company">Company</SelectItem>
                        <SelectItem value="Optional">Optional</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hol-region">Region</Label>
              <Input id="hol-region" {...form.register("region")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hol-desc">Notes</Label>
              <Textarea
                id="hol-desc"
                rows={2}
                {...form.register("description")}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Add Holiday</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open: boolean) => !open && setDeleteTarget(null)}
        title={`Delete Holiday "${deleteTarget?.name}"`}
        description={`Are you sure you want to remove the holiday scheduled for ${deleteTarget?.date}?`}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
