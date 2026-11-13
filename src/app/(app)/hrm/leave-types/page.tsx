"use client"

import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Plus, Trash2 } from "lucide-react"
import { DataTable, DataTableColumnHeader } from "@/components/data-table"
import { ConfirmDeleteDialog, PageHeader } from "@/components/shared"
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
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useStore } from "@/lib/store"
import type { LeaveType } from "@/types"

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z.string().min(2, "Code must be at least 2 characters").max(5, "Code max 5 characters"),
  daysAllowedPerYear: z.number().min(1).max(120),
  carryForwardLimit: z.number().min(0).max(30),
  description: z.string().min(4, "Description must be at least 4 characters"),
})

export default function LeaveTypesPage() {
  const {
    leaveTypes,
    createLeaveType,
    deleteLeaveType,
    checkLeaveTypeDeletion,
    isLoaded,
  } = useStore()

  const [open, setOpen] = React.useState(false)
  const [paid, setPaid] = React.useState(true)
  const [requiresDoc, setRequiresDoc] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<{
    id: string
    name: string
    warning?: string
    blocked?: boolean
  } | null>(null)

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
    const created = createLeaveType({
      name: values.name,
      code: values.code.toUpperCase(),
      daysAllowedPerYear: values.daysAllowedPerYear,
      carryForwardLimit: values.carryForwardLimit,
      paid,
      requiresDocument: requiresDoc,
      color: "#2563EB",
      description: values.description,
    })
    toast.success(`Added leave policy: ${created.name}`)
    form.reset()
    setOpen(false)
  }

  const promptDelete = React.useCallback(
    (lt: LeaveType) => {
      const check = checkLeaveTypeDeletion(lt.id)
      setDeleteTarget({
        id: lt.id,
        name: lt.name,
        warning: check.reason,
        blocked: !check.allowed,
      })
    },
    [checkLeaveTypeDeletion]
  )

  function handleConfirmDelete() {
    if (!deleteTarget || deleteTarget.blocked) return
    deleteLeaveType(deleteTarget.id)
    toast.success(`Removed leave policy: ${deleteTarget.name}`)
    setDeleteTarget(null)
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
              aria-label="Delete leave type"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    [promptDelete]
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
        data={leaveTypes}
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
                {form.formState.errors.name ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lt-code">Code</Label>
                <Input id="lt-code" placeholder="BL" {...form.register("code")} />
                {form.formState.errors.code ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.code.message}
                  </p>
                ) : null}
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
              {form.formState.errors.description ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.description.message}
                </p>
              ) : null}
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

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open: boolean) => !open && setDeleteTarget(null)}
        title={`Delete Policy "${deleteTarget?.name}"`}
        description={deleteTarget?.warning || `Are you sure you want to delete ${deleteTarget?.name}?`}
        warningMessage={deleteTarget?.blocked ? deleteTarget.warning : undefined}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
