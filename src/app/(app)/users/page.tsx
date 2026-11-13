"use client"

import * as React from "react"
import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  Edit3,
  ExternalLink,
  Flag,
  Plus,
  ShieldCheck,
  Trash2,
  Users as UsersIcon,
} from "lucide-react"
import {
  DataTable,
  DataTableColumnHeader,
  type FacetedFilterConfig,
} from "@/components/data-table"
import { ConfirmDeleteDialog, PageHeader, StatusBadge } from "@/components/shared"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { DEMO_ROLES } from "@/lib/permissions"
import { buildPermissions, useStore } from "@/lib/store"
import type {
  ModulePermissions,
  PermissionModule,
  Role,
  StaffUser,
} from "@/types"

type UserStatus = StaffUser["status"]

const PERMISSION_GROUPS: {
  group: string
  modules: { id: PermissionModule; label: string }[]
}[] = [
  {
    group: "Inquiry & Sales",
    modules: [
      { id: "dashboard", label: "Dashboard" },
      { id: "brands", label: "Brands" },
      { id: "leads", label: "Leads" },
      { id: "signups", label: "Sign Ups" },
    ],
  },
  {
    group: "Billing & Marketing",
    modules: [
      { id: "invoices", label: "Invoices" },
      { id: "transactions", label: "Transactions" },
      { id: "marketing", label: "Marketing Spendings" },
    ],
  },
  {
    group: "Delivery",
    modules: [
      { id: "projects", label: "Projects" },
      { id: "tasks", label: "Tasks & QA" },
      { id: "chats", label: "Project Chats" },
    ],
  },
  {
    group: "HR & Administration",
    modules: [
      { id: "hrm", label: "HR Management" },
      { id: "users", label: "Users" },
      { id: "teams", label: "Teams" },
      { id: "cities", label: "Cities" },
      { id: "exports", label: "Export Logs" },
      { id: "settings", label: "Settings & Security" },
    ],
  },
]

const ACTIONS: (keyof ModulePermissions)[] = [
  "view",
  "create",
  "edit",
  "delete",
  "export",
]

const userFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Valid email required"),
  role: z.enum([
    "Super Admin",
    "Sales/Account Manager",
    "Project Admin",
    "Designer/Developer",
    "QA Reviewer",
    "HR Manager",
  ]),
  teamId: z.string().min(1, "Select a team"),
  city: z.string().min(1, "Select a city"),
  phone: z.string().min(5, "Phone number required"),
  status: z.enum(["Active", "On Leave", "Inactive"]),
})

type UserFormValues = z.infer<typeof userFormSchema>

export default function UsersPage() {
  const {
    users,
    teams,
    cities,
    createUser,
    updateUser,
    deleteUser,
    checkUserDeletion,
  } = useStore()

  const [permUser, setPermUser] = React.useState<StaffUser | null>(null)
  const [draftPerms, setDraftPerms] = React.useState<
    Record<PermissionModule, ModulePermissions> | null
  >(null)

  const [formOpen, setFormOpen] = React.useState(false)
  const [editingUser, setEditingUser] = React.useState<StaffUser | null>(null)

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = React.useState<StaffUser | null>(null)
  const [deleteWarning, setDeleteWarning] = React.useState<string | undefined>()

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "Designer/Developer",
      teamId: teams[0]?.id ?? "",
      city: cities[0]?.name ?? "",
      phone: "+1 (555) 204-8811",
      status: "Active",
    },
  })

  function openCreate() {
    setEditingUser(null)
    form.reset({
      name: "",
      email: "",
      role: "Designer/Developer",
      teamId: teams[0]?.id ?? "",
      city: cities[0]?.name ?? "",
      phone: "+1 (555) 204-8811",
      status: "Active",
    })
    setFormOpen(true)
  }

  const openEdit = React.useCallback(
    (user: StaffUser) => {
      setEditingUser(user)
      form.reset({
        name: user.name,
        email: user.email,
        role: user.role,
        teamId: user.teamId,
        city: user.city,
        phone: user.phone,
        status: user.status,
      })
      setFormOpen(true)
    },
    [form]
  )

  const promptDelete = React.useCallback(
    (user: StaffUser) => {
      const check = checkUserDeletion(user.id)
      if (!check.allowed) {
        toast.error(check.reason || "Cannot delete this user.")
        return
      }
      setDeleteWarning(undefined)
      setDeleteTarget(user)
    },
    [checkUserDeletion]
  )

  function handleConfirmDelete() {
    if (!deleteTarget) return
    const res = deleteUser(deleteTarget.id)
    if (!res.allowed) {
      toast.error(res.reason || "Failed to delete user.")
    } else {
      toast.success(`Removed staff user ${deleteTarget.name}`)
      if (editingUser?.id === deleteTarget.id) {
        setFormOpen(false)
      }
    }
    setDeleteTarget(null)
  }

  function openPermissionsSheet(user: StaffUser) {
    setPermUser(user)
    setDraftPerms(JSON.parse(JSON.stringify(user.permissions)))
  }

  function togglePerm(mod: PermissionModule, action: keyof ModulePermissions) {
    setDraftPerms((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        [mod]: {
          ...prev[mod],
          [action]: !prev[mod][action],
        },
      }
    })
  }

  function savePermissions() {
    if (!permUser || !draftPerms) return
    updateUser(permUser.id, { permissions: draftPerms })
    toast.success(`Saved module permissions for ${permUser.name}`)
    setPermUser(null)
  }

  function onFormSubmit(values: UserFormValues) {
    const team = teams.find((t) => t.id === values.teamId)
    const teamName = team ? team.name : "General"
    const department = team ? team.department : "General"

    if (editingUser) {
      updateUser(editingUser.id, {
        name: values.name,
        email: values.email,
        role: values.role as Role,
        department,
        teamId: values.teamId,
        teamName,
        phone: values.phone,
        city: values.city,
        status: values.status as UserStatus,
      })
      toast.success(`Updated staff details for ${values.name}`)
    } else {
      const initials = values.name
        .split(/\s+/)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)

      const created = createUser({
        name: values.name,
        email: values.email,
        role: values.role as Role,
        department,
        teamId: values.teamId,
        teamName,
        avatarInitials: initials || "ST",
        avatarColor: "bg-blue-600",
        phone: values.phone,
        city: values.city,
        status: values.status as UserStatus,
        joinedAt: new Date().toISOString().slice(0, 10),
        redFlagCount: 0,
        permissions: buildPermissions(values.role as Role),
      })
      toast.success(`Invited staff member ${created.name}`)
    }
    form.reset()
    setFormOpen(false)
  }

  const columns = React.useMemo<ColumnDef<StaffUser>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Staff Member" />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <Avatar className="size-8">
              <AvatarFallback
                className={`text-xs font-bold text-white ${row.original.avatarColor}`}
              >
                {row.original.avatarInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <Link
                href={`/users/${row.original.id}`}
                className="font-medium text-foreground hover:text-primary hover:underline"
              >
                {row.original.name}
              </Link>
              <div className="text-xs text-muted-foreground">
                {row.original.email}
              </div>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => (
          <Badge variant="outline" className="font-normal">
            {row.original.role}
          </Badge>
        ),
      },
      {
        accessorKey: "teamName",
        header: "Team",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.teamName}
          </span>
        ),
      },
      {
        accessorKey: "city",
        header: "City",
      },
      {
        accessorKey: "redFlagCount",
        header: "QA Flags",
        cell: ({ row }) =>
          row.original.redFlagCount > 0 ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
              <Flag className="size-3.5" />
              {row.original.redFlagCount}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">0</span>
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
              size="xs"
              onClick={() => openPermissionsSheet(row.original)}
              className="gap-1"
            >
              <ShieldCheck className="size-3.5 text-primary" />
              Perms
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => openEdit(row.original)}
              title="Edit staff details"
            >
              <Edit3 className="size-3.5" />
            </Button>
            <Button asChild variant="ghost" size="xs" className="gap-1">
              <Link href={`/users/${row.original.id}`}>
                360°
                <ExternalLink className="size-3" />
              </Link>
            </Button>
            {row.original.id !== "usr-admin" && (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => promptDelete(row.original)}
                title="Remove staff member"
                className="text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [openEdit, promptDelete]
  )

  const facetedFilters = React.useMemo<FacetedFilterConfig[]>(
    () => [
      {
        columnId: "role",
        title: "Role",
        options: DEMO_ROLES.map((r) => ({ label: r, value: r })),
      },
      {
        columnId: "status",
        title: "Status",
        options: [
          { label: "Active", value: "Active" },
          { label: "On Leave", value: "On Leave" },
          { label: "Inactive", value: "Inactive" },
        ],
      },
    ],
    []
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Directory & Permissions"
        description="Manage internal users, role assignments, granular module permissions, and User 360 profiles."
        badge={<Badge variant="secondary">{users.length} members</Badge>}
        actions={
          <Button
            type="button"
            onClick={openCreate}
            className="gap-1.5"
          >
            <Plus className="size-4" />
            Invite User
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={users}
        searchPlaceholder="Search staff by name, email, role, city..."
        facetedFilters={facetedFilters}
        exportModule="Users Directory"
        onRowClick={openPermissionsSheet}
      />

      {/* Permissions Assignment Sheet */}
      <Sheet
        open={Boolean(permUser)}
        onOpenChange={(open) => !open && setPermUser(null)}
      >
        <SheetContent side="right" className="overflow-y-auto sm:max-w-2xl">
          {permUser && draftPerms ? (
            <>
              <SheetHeader className="border-b border-border pb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-primary" />
                  <Badge variant="outline">{permUser.role}</Badge>
                </div>
                <SheetTitle className="mt-1">
                  Module Permissions — {permUser.name}
                </SheetTitle>
                <SheetDescription>
                  Toggle View, Create, Edit, Delete, and Export access grouped
                  by platform module.
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-5 p-4">
                {PERMISSION_GROUPS.map((grp) => (
                  <div
                    key={grp.group}
                    className="overflow-hidden rounded-lg border border-border"
                  >
                    <div className="border-b border-border bg-muted/50 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {grp.group}
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border text-muted-foreground">
                            <th className="px-3.5 py-2 text-left font-medium">
                              Module
                            </th>
                            {ACTIONS.map((a) => (
                              <th
                                key={a}
                                className="px-2.5 py-2 text-center font-medium capitalize"
                              >
                                {a}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {grp.modules.map((mod) => (
                            <tr key={mod.id} className="hover:bg-muted/20">
                              <td className="px-3.5 py-2.5 font-medium text-foreground">
                                {mod.label}
                              </td>
                              {ACTIONS.map((act) => (
                                <td key={act} className="px-2.5 py-2 text-center">
                                  <Checkbox
                                    checked={draftPerms[mod.id]?.[act] ?? false}
                                    onCheckedChange={() =>
                                      togglePerm(mod.id, act)
                                    }
                                    aria-label={`${mod.label} ${act}`}
                                  />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>

              <SheetFooter className="border-t border-border sm:flex-row sm:justify-between">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/users/${permUser.id}`}>Open User 360°</Link>
                </Button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPermUser(null)}
                  >
                    Cancel
                  </Button>
                  <Button type="button" onClick={savePermissions}>
                    Save Permissions
                  </Button>
                </div>
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* Invite / Edit User Sheet */}
      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader className="border-b border-border pb-3">
            <SheetTitle>{editingUser ? `Edit ${editingUser.name}` : "Invite Internal Staff"}</SheetTitle>
            <SheetDescription>
              {editingUser ? "Update staff member role, team, and contact information." : "Provision a staff account and assign their primary team & role."}
            </SheetDescription>
          </SheetHeader>
          <form
            onSubmit={form.handleSubmit(onFormSubmit)}
            className="space-y-4 p-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="usr-name">Full Name</Label>
              <Input id="usr-name" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="usr-email">Work Email</Label>
              <Input id="usr-email" type="email" {...form.register("email")} />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Controller
                control={form.control}
                name="role"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEMO_ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Team</Label>
              {teams.length === 0 ? (
                <div className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5 font-medium text-foreground">
                    <UsersIcon className="size-3.5 text-primary" />
                    No teams configured yet.
                  </div>
                  <p className="mt-1">
                    <Link href="/teams" className="text-primary underline">
                      Create a team first
                    </Link>{" "}
                    to organize staff pods.
                  </p>
                </div>
              ) : (
                <Controller
                  control={form.control}
                  name="teamId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
              {form.formState.errors.teamId && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.teamId.message}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>City</Label>
                {cities.length === 0 ? (
                  <div className="rounded-md border border-dashed border-border p-2 text-xs text-muted-foreground">
                    <Link href="/cities" className="text-primary underline">
                      Add a city first
                    </Link>
                  </div>
                ) : (
                  <Controller
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select city" />
                        </SelectTrigger>
                        <SelectContent>
                          {cities.map((c) => (
                            <SelectItem key={c.id} value={c.name}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                )}
                {form.formState.errors.city && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.city.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="usr-phone">Phone</Label>
                <Input id="usr-phone" {...form.register("phone")} />
              </div>
            </div>
            {editingUser && (
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Controller
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="On Leave">On Leave</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}
            <SheetFooter className="px-0 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingUser ? "Save Changes" : "Send Invite"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title={`Delete Staff Member "${deleteTarget?.name}"?`}
        description="Are you sure you want to remove this staff user account? This cannot be undone."
        warningMessage={deleteWarning}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
