"use client"

import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { SlidersHorizontal } from "lucide-react"
import { DataTable, DataTableColumnHeader } from "@/components/data-table"
import { PageHeader } from "@/components/shared"
import { ProgressBar } from "@/components/tremor"
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
import { MOCK_LEAVE_BALANCES } from "@/mocks/hrm"
import type { LeaveBalance } from "@/types"

const adjustSchema = z.object({
  annualTotal: z.number().min(0).max(60),
  annualUsed: z.number().min(0).max(60),
  sickTotal: z.number().min(0).max(30),
  carryForward: z.number().min(0).max(15),
})

export default function LeaveBalancesPage() {
  const [balances, setBalances] =
    React.useState<LeaveBalance[]>(MOCK_LEAVE_BALANCES)
  const [editing, setEditing] = React.useState<LeaveBalance | null>(null)

  const form = useForm<z.infer<typeof adjustSchema>>({
    resolver: zodResolver(adjustSchema),
    defaultValues: {
      annualTotal: 20,
      annualUsed: 0,
      sickTotal: 10,
      carryForward: 0,
    },
  })

  const openAdjust = React.useCallback(
    (row: LeaveBalance) => {
      setEditing(row)
      form.reset({
        annualTotal: row.annualTotal,
        annualUsed: row.annualUsed,
        sickTotal: row.sickTotal,
        carryForward: row.carryForward,
      })
    },
    [form]
  )

  function onSubmit(values: z.infer<typeof adjustSchema>) {
    if (!editing) return
    setBalances((prev) =>
      prev.map((b) => (b.id === editing.id ? { ...b, ...values } : b))
    )
    toast.success(`Adjusted leave quotas for ${editing.userName}`)
    setEditing(null)
  }

  const columns = React.useMemo<ColumnDef<LeaveBalance>[]>(
    () => [
      {
        accessorKey: "userName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Employee" />
        ),
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.userName}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.department}
            </div>
          </div>
        ),
      },
      {
        id: "annual",
        header: "Annual Leave",
        cell: ({ row }) => {
          const rem = Math.max(
            0,
            row.original.annualTotal - row.original.annualUsed
          )
          const pct = Math.round(
            (row.original.annualUsed / Math.max(1, row.original.annualTotal)) *
              100
          )
          return (
            <div className="w-36 space-y-1">
              <div className="flex justify-between text-xs tabular-nums">
                <span>
                  {rem} / {row.original.annualTotal} left
                </span>
                <span className="text-muted-foreground">
                  {row.original.annualUsed} used
                </span>
              </div>
              <ProgressBar value={pct} color="blue" />
            </div>
          )
        },
      },
      {
        id: "sick",
        header: "Sick Leave",
        cell: ({ row }) => (
          <span className="text-xs tabular-nums">
            {row.original.sickTotal - row.original.sickUsed} /{" "}
            {row.original.sickTotal} days
          </span>
        ),
      },
      {
        id: "casual",
        header: "Casual",
        cell: ({ row }) => (
          <span className="text-xs tabular-nums">
            {row.original.casualTotal - row.original.casualUsed} /{" "}
            {row.original.casualTotal} days
          </span>
        ),
      },
      {
        accessorKey: "carryForward",
        header: "Carry Forward",
        cell: ({ row }) => (
          <Badge variant="outline" className="tabular-nums">
            +{row.original.carryForward} days
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "",
        enableHiding: false,
        cell: ({ row }) => (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => openAdjust(row.original)}
            className="gap-1"
          >
            <SlidersHorizontal className="size-3" />
            Adjust
          </Button>
        ),
      },
    ],
    [openAdjust]
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Balances"
        description="View remaining annual, sick, casual, and carried-forward PTO quotas per staff member."
        badge={<Badge variant="secondary">{balances.length} staff</Badge>}
      />

      <DataTable
        columns={columns}
        data={balances}
        searchPlaceholder="Search employee or department..."
        exportModule="Leave Balances"
        onRowClick={openAdjust}
      />

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Quota — {editing?.userName}</DialogTitle>
            <DialogDescription>
              Update annual allocation, used count, or carried-forward days.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="lb-ann-tot">Annual Total</Label>
                <Input
                  id="lb-ann-tot"
                  type="number"
                  {...form.register("annualTotal", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lb-ann-used">Annual Used</Label>
                <Input
                  id="lb-ann-used"
                  type="number"
                  {...form.register("annualUsed", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lb-sick">Sick Total</Label>
                <Input
                  id="lb-sick"
                  type="number"
                  {...form.register("sickTotal", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lb-carry">Carry Forward</Label>
                <Input
                  id="lb-carry"
                  type="number"
                  {...form.register("carryForward", { valueAsNumber: true })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditing(null)}
              >
                Cancel
              </Button>
              <Button type="submit">Save Balances</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
