"use client"

import * as React from "react"
import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Edit3, Plus, Trash2, Users as UsersIcon } from "lucide-react"
import { DataTable, DataTableColumnHeader } from "@/components/data-table"
import { AvatarGroup, ConfirmDeleteDialog, PageHeader } from "@/components/shared"
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
import { useStore } from "@/lib/store"
import type { Team } from "@/types"

const teamSchema = z.object({
  name: z.string().min(2, "Team name must be at least 2 characters"),
  department: z.string().min(2, "Department is required"),
  leadId: z.string().min(1, "Please assign a team lead"),
})

export default function TeamsPage() {
  const { teams, users, createTeam, updateTeam, deleteTeam, checkTeamDeletion } = useStore()
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Team | null>(null)

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = React.useState<Team | null>(null)
  const [deleteWarning, setDeleteWarning] = React.useState<string | undefined>()

  const activeUsers = React.useMemo(() => users.filter((u) => u.status === "Active"), [users])

  const form = useForm<z.infer<typeof teamSchema>>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: "",
      department: "Design & Engineering",
      leadId: activeUsers[0]?.id ?? "",
    },
  })

  function openCreate() {
    setEditing(null)
    form.reset({
      name: "",
      department: "Design & Engineering",
      leadId: activeUsers[0]?.id ?? "",
    })
    setOpen(true)
  }

  const openEdit = React.useCallback(
    (team: Team) => {
      setEditing(team)
      form.reset({
        name: team.name,
        department: team.department,
        leadId: team.leadId,
      })
      setOpen(true)
    },
    [form]
  )

  const promptDelete = React.useCallback(
    (team: Team) => {
      const check = checkTeamDeletion(team.id)
      if (!check.allowed) {
        toast.error(check.reason || "Cannot delete this team because active records depend on it.")
        return
      }
      setDeleteWarning(undefined)
      setDeleteTarget(team)
    },
    [checkTeamDeletion]
  )

  function handleConfirmDelete() {
    if (!deleteTarget) return
    const res = deleteTeam(deleteTarget.id)
    if (!res.allowed) {
      toast.error(res.reason || "Failed to delete team.")
    } else {
      toast.success(`Removed team ${deleteTarget.name}`)
      if (editing?.id === deleteTarget.id) {
        setOpen(false)
      }
    }
    setDeleteTarget(null)
  }

  function onSubmit(values: z.infer<typeof teamSchema>) {
    const lead = users.find((u) => u.id === values.leadId)
    const leadName = lead ? lead.name : "Unassigned"

    if (editing) {
      updateTeam(editing.id, {
        name: values.name,
        department: values.department,
        leadId: values.leadId,
        leadName,
      })
      toast.success(`Updated team ${values.name}`)
    } else {
      const created = createTeam({
        name: values.name,
        department: values.department,
        leadId: values.leadId,
        leadName,
        memberIds: values.leadId ? [values.leadId] : [],
        brandIds: [],
        activeProjects: 0,
      })
      toast.success(`Created team ${created.name}`)
    }
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
          const members = users.filter((u) =>
            row.original.memberIds.includes(u.id)
          )
          return members.length > 0 ? (
            <AvatarGroup people={members} max={4} />
          ) : (
            <span className="text-xs text-muted-foreground">None</span>
          )
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
              title="Edit team"
            >
              <Edit3 className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => promptDelete(row.original)}
              title="Delete team"
              className="text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    [users, openEdit, promptDelete]
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teams"
        description="Organize delivery pods, creative studios, QA squads, and revenue account teams."
        badge={<Badge variant="secondary">{teams.length} teams</Badge>}
        actions={
          <Button
            type="button"
            onClick={openCreate}
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
            <SheetTitle>{editing ? `Edit Team "${editing.name}"` : "Create Delivery Team"}</SheetTitle>
            <SheetDescription>
              Group specialists under a department lead.
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
            <div className="space-y-1.5">
              <Label htmlFor="tm-name">Team Name</Label>
              <Input id="tm-name" placeholder="E.g. Creative Pod Alpha" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tm-dept">Department</Label>
              <Input id="tm-dept" placeholder="Design & Engineering" {...form.register("department")} />
              {form.formState.errors.department && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.department.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Team Lead</Label>
              {activeUsers.length === 0 ? (
                <div className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5 font-medium text-foreground">
                    <UsersIcon className="size-3.5 text-primary" />
                    No staff members available.
                  </div>
                  <p className="mt-1">
                    Add staff members in the{" "}
                    <Link href="/users" className="text-primary underline">
                      Users Directory
                    </Link>{" "}
                    first.
                  </p>
                </div>
              ) : (
                <Controller
                  control={form.control}
                  name="leadId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select team lead" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeUsers.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name} ({u.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
              {form.formState.errors.leadId && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.leadId.message}
                </p>
              )}
            </div>
            <SheetFooter className="px-0 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editing ? "Save Changes" : "Create Team"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title={`Delete Team "${deleteTarget?.name}"?`}
        description="Are you sure you want to remove this delivery team? Staff assignments will be cleared."
        warningMessage={deleteWarning}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
