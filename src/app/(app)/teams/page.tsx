"use client"

import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { DataTable, DataTableColumnHeader } from "@/components/data-table"
import { AvatarGroup, PageHeader } from "@/components/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { MOCK_TEAMS } from "@/mocks/brands"
import { MOCK_USERS } from "@/mocks/users"
import type { Team } from "@/types"

const teamSchema = z.object({
  name: z.string().min(2),
  department: z.string().min(2),
  leadId: z.string().min(1),
})

export default function TeamsPage() {
  const [teams, setTeams] = React.useState<Team[]>(MOCK_TEAMS)
  const [open, setOpen] = React.useState(false)

  const form = useForm<z.infer<typeof teamSchema>>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: "",
      department: "Design & Engineering",
      leadId: MOCK_USERS[3].id,
    },
  })

  function onSubmit(values: z.infer<typeof teamSchema>) {
    const lead =
      MOCK_USERS.find((u) => u.id === values.leadId) ?? MOCK_USERS[0]
    const created: Team = {
      id: `tm-new-${teams.length + 1}`,
      name: values.name,
      department: values.department,
      leadId: lead.id,
      leadName: lead.name,
      memberIds: [lead.id],
      brandIds: ["brd-1"],
      activeProjects: 0,
      createdAt: "2026-11-11",
    }
    setTeams((prev) => [created, ...prev])
    toast.success(`Created team ${created.name}`)
    form.reset()
    setOpen(false)
  }

  const columns = React.useMemo<ColumnDef<Team>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Team Name" />
        ),
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.name}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.department}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "leadName",
        header: "Team Lead",
      },
      {
        id: "members",
        header: "Members",
        cell: ({ row }) => {
          const members = MOCK_USERS.filter((u) =>
            row.original.memberIds.includes(u.id)
          )
          return <AvatarGroup people={members} max={4} />
        },
      },
      {
        accessorKey: "activeProjects",
        header: "Active Projects",
        cell: ({ row }) => (
          <Badge variant="secondary" className="tabular-nums">
            {row.original.activeProjects}
          </Badge>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => (
          <span className="text-xs tabular-nums text-muted-foreground">
            {row.original.createdAt}
          </span>
        ),
      },
    ],
    []
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teams"
        description="Organize delivery pods, creative studios, QA squads, and revenue account teams."
        actions={
          <Button
            type="button"
            onClick={() => setOpen(true)}
            className="gap-1.5"
          >
            <Plus className="size-4" />
            New Team
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={teams}
        searchPlaceholder="Search teams or department..."
        exportModule="Teams"
      />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader className="border-b border-border pb-3">
            <SheetTitle>Create Delivery Team</SheetTitle>
            <SheetDescription>
              Group specialists under a department lead.
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
            <div className="space-y-1.5">
              <Label htmlFor="tm-name">Team Name</Label>
              <Input id="tm-name" {...form.register("name")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tm-dept">Department</Label>
              <Input id="tm-dept" {...form.register("department")} />
            </div>
            <div className="space-y-1.5">
              <Label>Team Lead</Label>
              <Controller
                control={form.control}
                name="leadId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MOCK_USERS.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name} ({u.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
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
              <Button type="submit">Create Team</Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
