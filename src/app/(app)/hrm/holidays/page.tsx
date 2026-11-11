"use client"

import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { CalendarHeart, Plus } from "lucide-react"
import {
  DataTable,
  DataTableColumnHeader,
  type FacetedFilterConfig,
} from "@/components/data-table"
import { PageHeader } from "@/components/shared"
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
import { Textarea } from "@/components/ui/textarea"
import { MOCK_HOLIDAYS } from "@/mocks/hrm"
import type { Holiday } from "@/types"

const schema = z.object({
  name: z.string().min(2),
  date: z.string().min(8),
  type: z.enum(["Public", "Company", "Optional"]),
  region: z.string().min(2),
  description: z.string().min(3),
})

export default function HolidaysPage() {
  const [holidays, setHolidays] = React.useState<Holiday[]>(MOCK_HOLIDAYS)
  const [open, setOpen] = React.useState(false)

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
    const created: Holiday = {
      id: `hol-new-${holidays.length + 1}`,
      ...values,
    }
    setHolidays((prev) =>
      [...prev, created].sort((a, b) => a.date.localeCompare(b.date))
    )
    toast.success(`Added holiday: ${created.name}`)
    form.reset()
    setOpen(false)
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
    ],
    []
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agency Holidays"
        description="Regional bank holidays and paid company-wide recharge days synced with payroll attendance."
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
    </div>
  )
}
