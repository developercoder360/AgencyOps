"use client"

import * as React from "react"
import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  AlertCircle,
  CalendarDays,
  ExternalLink,
  LayoutGrid,
  List,
  Plus,
  Trash2,
} from "lucide-react"
import {
  DataTable,
  DataTableColumnHeader,
  type FacetedFilterConfig,
} from "@/components/data-table"
import {
  AvatarGroup,
  ConfirmDeleteDialog,
  PageHeader,
  StatusBadge,
} from "@/components/shared"
import { ProgressBar } from "@/components/tremor"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { Textarea } from "@/components/ui/textarea"
import { formatUsdEquivalent } from "@/lib/currency"
import { useStore } from "@/lib/store"
import type { Project, ProjectStatus } from "@/types"
import { cn } from "cn"

const PROJECT_STATUSES: ProjectStatus[] = [
  "Open",
  "Progress",
  "Re-Draw",
  "Complete",
  "Overdue",
]

const CATEGORIES: Project["category"][] = [
  "Web Design",
  "Logo & Branding",
  "SEO",
  "Performance Marketing",
  "Full Stack App",
]

const projectSchema = z.object({
  name: z.string().min(3, "Project name is required"),
  clientName: z.string().min(2, "Client name is required"),
  clientCompany: z.string().min(2, "Company is required"),
  brandId: z.string().min(1, "Select a brand"),
  category: z.enum([
    "Web Design",
    "Logo & Branding",
    "SEO",
    "Performance Marketing",
    "Full Stack App",
  ]),
  priority: z.enum(["Regular", "High", "Urgent"]),
  budget: z.number().min(500, "Minimum budget 500"),
  currency: z.enum(["USD", "GBP", "CAD"]),
  deadline: z.string().min(8),
  description: z.string().optional(),
})

type ProjectFormValues = z.infer<typeof projectSchema>

function isDeadlineOverdue(project: Project): boolean {
  const today = new Date().toISOString().slice(0, 10)
  return (
    project.status === "Overdue" ||
    (project.status !== "Complete" && project.deadline < today)
  )
}

export default function ProjectsPage() {
  const {
    projects,
    brands,
    users,
    createProject,
    deleteProject,
    checkProjectDeletion,
  } = useStore()

  const [viewMode, setViewMode] = React.useState<"list" | "card">("list")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [createOpen, setCreateOpen] = React.useState(false)

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = React.useState<Project | null>(null)
  const [deleteWarning, setDeleteWarning] = React.useState<string | undefined>()

  const promptDelete = React.useCallback(
    (project: Project) => {
      const check = checkProjectDeletion(project.id)
      setDeleteWarning(check.warningMessage)
      setDeleteTarget(project)
    },
    [checkProjectDeletion]
  )

  function handleConfirmDelete() {
    if (!deleteTarget) return
    const res = deleteProject(deleteTarget.id)
    if (!res.allowed) {
      toast.error(res.reason || "Failed to delete project.")
    } else {
      toast.success(`Removed project ${deleteTarget.code}`)
    }
    setDeleteTarget(null)
  }

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      clientName: "",
      clientCompany: "",
      brandId: brands[0]?.id ?? "",
      category: "Web Design",
      priority: "High",
      budget: 8500,
      currency: "USD",
      deadline: "2026-12-05",
      description: "",
    },
  })

  const filteredForCards = React.useMemo(
    () =>
      statusFilter === "all"
        ? projects
        : projects.filter((p) => p.status === statusFilter),
    [projects, statusFilter]
  )

  function onCreateProject(values: ProjectFormValues) {
    const brand = brands.find((b) => b.id === values.brandId) ?? brands[0]
    const brandName = brand ? brand.name : "Primary Brand"
    const today = new Date().toISOString().slice(0, 10)
    const code = `PRJ-${String(projects.length + 351).padStart(4, "0")}`

    const created = createProject({
      code,
      name: values.name,
      clientName: values.clientName,
      clientCompany: values.clientCompany,
      brandId: values.brandId,
      brandName,
      category: values.category,
      status: "Open",
      priority: values.priority,
      budget: values.budget,
      currency: values.currency,
      progress: 0,
      startDate: today,
      deadline: values.deadline,
      managerId: users[0]?.id ?? "usr-admin",
      memberIds: users.slice(0, 3).map((u) => u.id),
      description:
        values.description ||
        `${values.category} delivery for ${values.clientCompany}.`,
      files: [],
      comments: [],
    })
    toast.success(`Created project ${created.code}`)
    form.reset()
    setCreateOpen(false)
  }

  const columns = React.useMemo<ColumnDef<Project>[]>(
    () => [
      {
        accessorKey: "code",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Code" />
        ),
        cell: ({ row }) => (
          <Link
            href={`/projects/${row.original.id}`}
            className="font-mono text-xs font-semibold text-primary hover:underline"
          >
            {row.original.code}
          </Link>
        ),
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Project & Client" />
        ),
        cell: ({ row }) => (
          <div className="min-w-[220px] max-w-[300px]">
            <Link
              href={`/projects/${row.original.id}`}
              title={row.original.name}
              className="line-clamp-2 font-medium text-foreground hover:text-primary hover:underline"
            >
              {row.original.name}
            </Link>
            <div className="truncate text-xs text-muted-foreground">
              {row.original.clientName} • {row.original.category}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "brandName",
        header: "Brand",
        cell: ({ row }) => (
          <Badge variant="outline" className="font-normal">
            {row.original.brandName}
          </Badge>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "members",
        header: "Members",
        cell: ({ row }) => {
          const team = users.filter((u) =>
            row.original.memberIds.includes(u.id)
          )
          return team.length > 0 ? (
            <AvatarGroup people={team} max={3} />
          ) : (
            <span className="text-xs text-muted-foreground">Unassigned</span>
          )
        },
      },
      {
        accessorKey: "progress",
        header: "Progress",
        cell: ({ row }) => (
          <div className="w-28">
            <ProgressBar
              value={row.original.progress}
              label={`${row.original.progress}%`}
              color={
                row.original.status === "Complete"
                  ? "emerald"
                  : row.original.status === "Overdue"
                    ? "rose"
                    : "blue"
              }
            />
          </div>
        ),
      },
      {
        accessorKey: "deadline",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Deadline" />
        ),
        cell: ({ row }) => {
          const overdue = isDeadlineOverdue(row.original)
          return (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs tabular-nums",
                overdue
                  ? "font-semibold text-rose-600 dark:text-rose-400"
                  : "text-muted-foreground"
              )}
            >
              {overdue ? <AlertCircle className="size-3.5" /> : null}
              {row.original.deadline}
            </span>
          )
        },
      },
      {
        id: "actions",
        header: "",
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Button asChild variant="ghost" size="xs" className="gap-1">
              <Link href={`/projects/${row.original.id}`}>
                Open
                <ExternalLink className="size-3" />
              </Link>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => promptDelete(row.original)}
              title="Delete project"
              className="text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    [users, promptDelete]
  )

  const facetedFilters = React.useMemo<FacetedFilterConfig[]>(
    () => [
      {
        columnId: "status",
        title: "Status",
        options: PROJECT_STATUSES.map((s) => ({ label: s, value: s })),
      },
      {
        columnId: "brandName",
        title: "Brand",
        options: brands.map((b) => ({ label: b.name, value: b.name })),
      },
    ],
    [brands]
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery Projects"
        description="Client creative and technical deliverable workspaces with real-time tasks, subtasks, files, and chats."
        badge={<Badge variant="secondary">{projects.length} active</Badge>}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-border p-0.5">
              <Button
                type="button"
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon-xs"
                onClick={() => setViewMode("list")}
                aria-label="List view"
              >
                <List className="size-4" />
              </Button>
              <Button
                type="button"
                variant={viewMode === "card" ? "secondary" : "ghost"}
                size="icon-xs"
                onClick={() => setViewMode("card")}
                aria-label="Card view"
              >
                <LayoutGrid className="size-4" />
              </Button>
            </div>
            <Button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="gap-1.5"
            >
              <Plus className="size-4" />
              New Project
            </Button>
          </div>
        }
      />

      {viewMode === "list" ? (
        <DataTable
          columns={columns}
          data={projects}
          searchPlaceholder="Search projects by title, client, category..."
          facetedFilters={facetedFilters}
          dateField="deadline"
          exportModule="Projects"
        />
      ) : (
        <div className="space-y-4">
          {/* Card View Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              type="button"
              size="xs"
              variant={statusFilter === "all" ? "default" : "outline"}
              onClick={() => setStatusFilter("all")}
            >
              All ({projects.length})
            </Button>
            {PROJECT_STATUSES.map((st) => {
              const count = projects.filter((p) => p.status === st).length
              return (
                <Button
                  key={st}
                  type="button"
                  size="xs"
                  variant={statusFilter === st ? "default" : "outline"}
                  onClick={() => setStatusFilter(st)}
                >
                  {st} ({count})
                </Button>
              )
            })}
          </div>

          {filteredForCards.length === 0 ? (
            <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
              No projects found. Click &quot;New Project&quot; to begin delivery.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredForCards.map((prj) => {
                const assignedUsers = users.filter((u) =>
                  prj.memberIds.includes(u.id)
                )
                const overdue = isDeadlineOverdue(prj)
                return (
                  <Card
                    key={prj.id}
                    className="flex flex-col justify-between transition-colors hover:border-primary/50"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Badge variant="outline" className="font-mono text-[11px]">
                            {prj.code}
                          </Badge>
                          <CardTitle className="mt-1.5 line-clamp-1 text-base">
                            <Link
                              href={`/projects/${prj.id}`}
                              className="hover:text-primary hover:underline"
                            >
                              {prj.name}
                            </Link>
                          </CardTitle>
                          <CardDescription className="line-clamp-1">
                            {prj.clientCompany} • {prj.category}
                          </CardDescription>
                        </div>
                        <StatusBadge status={prj.status} />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 pb-3 text-xs">
                      <div>
                        <div className="mb-1 flex justify-between text-muted-foreground">
                          <span>Progress</span>
                          <span className="font-medium text-foreground">
                            {prj.progress}%
                          </span>
                        </div>
                        <ProgressBar
                          value={prj.progress}
                          color={
                            prj.status === "Complete"
                              ? "emerald"
                              : prj.status === "Overdue"
                                ? "rose"
                                : "blue"
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="font-semibold tabular-nums text-foreground">
                          {formatUsdEquivalent(prj.budget, prj.currency)}
                        </span>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 font-mono tabular-nums",
                            overdue
                              ? "font-semibold text-rose-600 dark:text-rose-400"
                              : "text-muted-foreground"
                          )}
                        >
                          <CalendarDays className="size-3.5" />
                          {prj.deadline}
                        </span>
                      </div>
                    </CardContent>
                    <CardFooter className="flex items-center justify-between border-t border-border pt-3">
                      <AvatarGroup people={assignedUsers} max={3} />
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => promptDelete(prj)}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                        <Button asChild variant="outline" size="xs">
                          <Link href={`/projects/${prj.id}`}>
                            Details
                            <ExternalLink className="ml-1 size-3" />
                          </Link>
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Create Project Sheet */}
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent side="right" className="overflow-y-auto sm:max-w-lg">
          <SheetHeader className="border-b border-border pb-3">
            <SheetTitle>Create Project</SheetTitle>
            <SheetDescription>
              Kick off a new client deliverable workspace.
            </SheetDescription>
          </SheetHeader>
          <form
            onSubmit={form.handleSubmit(onCreateProject)}
            className="space-y-4 p-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="prj-name">Project Title</Label>
              <Input id="prj-name" placeholder="Brand Replatforming" {...form.register("name")} />
              {form.formState.errors.name ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.name.message}
                </p>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="prj-client">Client Name</Label>
                <Input id="prj-client" placeholder="John Smith" {...form.register("clientName")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prj-company">Company</Label>
                <Input id="prj-company" placeholder="Acme Inc" {...form.register("clientCompany")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Brand</Label>
                {brands.length === 0 ? (
                  <div className="rounded-md border border-dashed border-border p-2 text-xs text-muted-foreground">
                    <Link href="/brands" className="text-primary underline">
                      Add a brand first
                    </Link>
                  </div>
                ) : (
                  <Controller
                    control={form.control}
                    name="brandId"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select brand" />
                        </SelectTrigger>
                        <SelectContent>
                          {brands.map((b) => (
                            <SelectItem key={b.id} value={b.id}>
                              {b.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Controller
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Controller
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Regular">Regular</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prj-deadline">Deadline</Label>
                <Input
                  id="prj-deadline"
                  type="date"
                  {...form.register("deadline")}
                />
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
              <div className="space-y-1.5">
                <Label htmlFor="prj-budget">Budget</Label>
                <Input
                  id="prj-budget"
                  type="number"
                  {...form.register("budget", { valueAsNumber: true })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prj-desc">Scope Description</Label>
              <Textarea id="prj-desc" rows={3} {...form.register("description")} />
            </div>
            <SheetFooter className="px-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={brands.length === 0}>
                Create Project
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title={`Delete Project "${deleteTarget?.name}" (${deleteTarget?.code})?`}
        description="Are you sure you want to delete this project workspace?"
        warningMessage={deleteWarning}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
