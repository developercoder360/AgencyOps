"use client"

import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Clock, Plus } from "lucide-react"
import { DataTable, DataTableColumnHeader } from "@/components/data-table"
import { PageHeader } from "@/components/shared"
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
import { Switch } from "@/components/ui/switch"
import { MOCK_SHIFTS } from "@/mocks/hrm"
import type { ShiftSchedule } from "@/types"

const schema = z.object({
  name: z.string().min(3),
  code: z.string().min(2).max(10),
  startTime: z.string().min(4),
  endTime: z.string().min(4),
  graceMinutes: z.number().min(0).max(60),
  timezone: z.string().min(3),
})

export default function ShiftSchedulingPage() {
  const [shifts, setShifts] = React.useState<ShiftSchedule[]>(MOCK_SHIFTS)
  const [open, setOpen] = React.useState(false)
  const [isNight, setIsNight] = React.useState(false)

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      code: "EMEA-10",
      startTime: "10:00",
      endTime: "19:00",
      graceMinutes: 15,
      timezone: "Europe/London",
    },
  })

  function onSubmit(values: z.infer<typeof schema>) {
    const created: ShiftSchedule = {
      id: `sh-new-${shifts.length + 1}`,
      name: values.name,
      code: values.code.toUpperCase(),
      startTime: values.startTime,
      endTime: values.endTime,
      graceMinutes: values.graceMinutes,
      timezone: values.timezone,
      workDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      assignedCount: 0,
      isNightShift: isNight,
    }
    setShifts((prev) => [created, ...prev])
    toast.success(`Created shift ${created.name}`)
    form.reset()
    setOpen(false)
  }

  const columns = React.useMemo<ColumnDef<ShiftSchedule>[]>(
    () => [
      {
        accessorKey: "code",
        header: "Code",
        cell: ({ row }) => (
          <Badge variant="outline" className="font-mono">
            {row.original.code}
          </Badge>
        ),
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Shift Name" />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2 font-medium">
            <span>{row.original.name}</span>
            {row.original.isNightShift ? (
              <Badge variant="secondary" className="text-[10px]">
                Night Shift
              </Badge>
            ) : null}
          </div>
        ),
      },
      {
        id: "hours",
        header: "Timing",
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1.5 font-mono text-xs">
            <Clock className="size-3.5 text-muted-foreground" />
            {row.original.startTime} – {row.original.endTime}
          </span>
        ),
      },
      {
        accessorKey: "graceMinutes",
        header: "Grace Window",
        cell: ({ row }) => (
          <span className="text-xs tabular-nums">
            {row.original.graceMinutes} mins
          </span>
        ),
      },
      {
        accessorKey: "timezone",
        header: "Timezone",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.timezone}
          </span>
        ),
      },
      {
        accessorKey: "assignedCount",
        header: "Staff Assigned",
        cell: ({ row }) => (
          <Badge variant="secondary" className="tabular-nums">
            {row.original.assignedCount} members
          </Badge>
        ),
      },
    ],
    []
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shift Scheduling"
        description="Manage global office shifts, grace windows, and regional timezone alignments."
        actions={
          <Button
            type="button"
            onClick={() => setOpen(true)}
            className="gap-1.5"
          >
            <Plus className="size-4" />
            New Shift
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={shifts}
        searchPlaceholder="Search shifts or timezones..."
        exportModule="Shift Schedules"
      />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader className="border-b border-border pb-3">
            <SheetTitle>Create Shift Schedule</SheetTitle>
            <SheetDescription>
              Configure work window, grace period, and regional timezone.
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="sh-name">Shift Name</Label>
                <Input id="sh-name" {...form.register("name")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sh-code">Code</Label>
                <Input id="sh-code" {...form.register("code")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="sh-start">Start Time</Label>
                <Input
                  id="sh-start"
                  type="time"
                  {...form.register("startTime")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sh-end">End Time</Label>
                <Input id="sh-end" type="time" {...form.register("endTime")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="sh-grace">Grace (mins)</Label>
                <Input
                  id="sh-grace"
                  type="number"
                  {...form.register("graceMinutes", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sh-tz">Timezone</Label>
                <Input id="sh-tz" {...form.register("timezone")} />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label htmlFor="sh-night">Overnight / Night Shift</Label>
              <Switch
                id="sh-night"
                checked={isNight}
                onCheckedChange={setIsNight}
              />
            </div>
            <SheetFooter className="px-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save Shift</Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
