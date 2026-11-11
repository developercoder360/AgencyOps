"use client"

import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Plus } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { MOCK_LEAVE_TYPES } from "@/mocks/hrm"
import type { LeaveType } from "@/types"

const schema = z.object({
  name: z.string().min(2),
  code: z.string().min(2).max(5),
  daysAllowedPerYear: z.number().min(1).max(120),
  carryForwardLimit: z.number().min(0).max(30),
  description: z.string().min(4),
})

export default function LeaveTypesPage() {
  const [types, setTypes] = React.useState<LeaveType[]>(MOCK_LEAVE_TYPES)
  const [open, setOpen] = React.useState(false)
  const [paid, setPaid] = React.useState(true)
  const [requiresDoc, setRequiresDoc] = React.useState(false)

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      code: "",
      daysAllowedPerYear: 12,
      carryForwardLimit: 2,
      description: "",
    },
  })

  function onSubmit(values: z.infer<typeof schema>) {
    const created: LeaveType = {
      id: `lt-new-${types.length + 1}`,
      name: values.name,
      code: values.code.toUpperCase(),
      daysAllowedPerYear: values.daysAllowedPerYear,
      carryForwardLimit: values.carryForwardLimit,
      paid,
      requiresDocument: requiresDoc,
      color: "#2563EB",
      description: values.description,
    }
    setTypes((prev) => [created, ...prev])
    toast.success(`Added leave policy: ${created.name}`)
    form.reset()
    setOpen(false)
  }

  const columns = React.useMemo<ColumnDef<LeaveType>[]>(
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
          <DataTableColumnHeader column={column} title="Leave Policy" />
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
        accessorKey: "daysAllowedPerYear",
        header: "Annual Quota",
        cell: ({ row }) => (
          <span className="font-medium tabular-nums">
            {row.original.daysAllowedPerYear} days/yr
          </span>
        ),
      },
      {
        accessorKey: "paid",
        header: "Compensation",
        cell: ({ row }) => (
          <Badge variant={row.original.paid ? "default" : "secondary"}>
            {row.original.paid ? "Paid" : "Unpaid"}
          </Badge>
        ),
      },
      {
        accessorKey: "carryForwardLimit",
        header: "Carry Forward",
        cell: ({ row }) => (
          <span className="text-xs tabular-nums">
            Up to {row.original.carryForwardLimit} days
          </span>
        ),
      },
      {
        accessorKey: "requiresDocument",
        header: "Document",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.requiresDocument ? "Required" : "Optional"}
          </span>
        ),
      },
    ],
    []
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Types & Policies"
        description="Configure agency PTO entitlements, carry-forward limits, and medical documentation rules."
        actions={
          <Button
            type="button"
            onClick={() => setOpen(true)}
            className="gap-1.5"
          >
            <Plus className="size-4" />
            New Leave Type
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={types}
        searchPlaceholder="Search leave types..."
        exportModule="Leave Types"
      />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader className="border-b border-border pb-3">
            <SheetTitle>Add Leave Type</SheetTitle>
            <SheetDescription>
              Define accrual allowance and documentation rules.
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="lt-name">Policy Name</Label>
                <Input id="lt-name" {...form.register("name")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lt-code">Code</Label>
                <Input id="lt-code" placeholder="BL" {...form.register("code")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="lt-days">Days / Year</Label>
                <Input
                  id="lt-days"
                  type="number"
                  {...form.register("daysAllowedPerYear", {
                    valueAsNumber: true,
                  })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lt-carry">Carry Forward Max</Label>
                <Input
                  id="lt-carry"
                  type="number"
                  {...form.register("carryForwardLimit", {
                    valueAsNumber: true,
                  })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label htmlFor="lt-paid">Paid Leave</Label>
              <Switch id="lt-paid" checked={paid} onCheckedChange={setPaid} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label htmlFor="lt-doc">Requires Supporting Document</Label>
              <Switch
                id="lt-doc"
                checked={requiresDoc}
                onCheckedChange={setRequiresDoc}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lt-desc">Description</Label>
              <Textarea
                id="lt-desc"
                rows={3}
                {...form.register("description")}
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
              <Button type="submit">Create Leave Type</Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
