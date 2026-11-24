"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  FileText,
  FolderKanban,
  Layers,
  Mail,
  MapPin,
  Phone,
  Sparkles,
} from "lucide-react"
import { TaskDetailPanel, useTaskDeepLink } from "@/components/delivery/task-detail"
import { FilesTab } from "@/components/files"
import { TasksTab } from "@/components/tasks"
import { PageHeader, StatusBadge } from "@/components/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { resolveClientProfile } from "@/lib/files/client-resolver"
import { useStore } from "@/lib/store"

export function ClientDetailClient({ clientKey }: { clientKey: string }) {
  const { signups, leads, projects, tasks, files } = useStore()
  const { activeTaskId, openTask, closeTask } = useTaskDeepLink()

  const client = React.useMemo(
    () => resolveClientProfile(clientKey, { signups, leads, projects, tasks }),
    [clientKey, signups, leads, projects, tasks]
  )

  const clientFileCount = React.useMemo(() => {
    if (!client) return 0
    const idSet = new Set(client.matchIds)
    return files.filter(
      (f) => f.scope === "client" && idSet.has(f.scopeId)
    ).length
  }, [client, files])

  if (!client) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center py-12">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Building2 className="size-6" />
            </div>
            <CardTitle>Client Not Found</CardTitle>
            <CardDescription>
              No client profile matched &ldquo;{decodeURIComponent(clientKey)}&rdquo;.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center gap-2">
            <Button asChild variant="outline" className="gap-2">
              <Link href="/sign-ups">
                <ArrowLeft className="size-4" />
                Back to Sign Ups
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/projects">View Projects</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={client.name}
        description={`${client.company}${client.brandName ? ` • ${client.brandName}` : ""}${client.city ? ` • ${client.city}` : ""}`}
        badge={
          <div className="flex flex-wrap items-center gap-1.5">
            {client.brandName ? (
              <Badge variant="outline" className="text-xs">
                {client.brandName}
              </Badge>
            ) : null}
            <Badge variant="secondary" className="text-xs">
              {client.projects.length} Project{client.projects.length === 1 ? "" : "s"}
            </Badge>
          </div>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href="/sign-ups">
                <ArrowLeft className="size-4" />
                Sign Ups
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href="/projects">
                <FolderKanban className="size-4" />
                All Projects
              </Link>
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="files" className="space-y-4">
        <TabsList className="inline-flex h-10 items-center justify-start rounded-lg border border-border/50 bg-muted/70 p-1 text-muted-foreground shadow-xs">
          <TabsTrigger
            value="overview"
            className="flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs sm:text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs"
          >
            <Layers className="size-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger
            value="projects"
            className="flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs sm:text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs"
          >
            <FolderKanban className="size-4" />
            <span>Projects</span>
            <span className="rounded-full bg-muted-foreground/15 px-1.5 font-mono text-[11px] font-semibold text-foreground">
              {client.projects.length}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="tasks"
            className="flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs sm:text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs"
          >
            <CheckCircle2 className="size-4" />
            <span>Tasks</span>
            <span className="rounded-full bg-muted-foreground/15 px-1.5 font-mono text-[11px] font-semibold text-foreground">
              {client.tasks.length}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="files"
            className="flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs sm:text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs"
          >
            <FileText className="size-4" />
            <span>Files</span>
            <span className="rounded-full bg-muted-foreground/15 px-1.5 font-mono text-[11px] font-semibold text-foreground">
              {clientFileCount}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <Card className="lg:col-span-6">
              <CardHeader>
                <CardTitle className="text-base">Client Details</CardTitle>
                <CardDescription>
                  Organization profile and primary contact coordinates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-muted/20 p-3.5 sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="size-4 text-muted-foreground" />
                    <span className="font-medium">{client.company}</span>
                  </div>
                  {client.brandName ? (
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-4 text-muted-foreground" />
                      <span>{client.brandName}</span>
                    </div>
                  ) : null}
                  {client.email ? (
                    <div className="flex items-center gap-2">
                      <Mail className="size-4 text-muted-foreground" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  ) : null}
                  {client.phone ? (
                    <div className="flex items-center gap-2">
                      <Phone className="size-4 text-muted-foreground" />
                      <span>{client.phone}</span>
                    </div>
                  ) : null}
                  {client.city ? (
                    <div className="flex items-center gap-2">
                      <MapPin className="size-4 text-muted-foreground" />
                      <span>{client.city}</span>
                    </div>
                  ) : null}
                </div>
                {client.serviceInterest ? (
                  <div className="text-xs text-muted-foreground">
                    Service Interest:{" "}
                    <span className="font-medium text-foreground">
                      {client.serviceInterest}
                    </span>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="lg:col-span-6">
              <CardHeader>
                <CardTitle className="text-base">Linked Engagement</CardTitle>
                <CardDescription>
                  Projects and active tasks associated with {client.company}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {client.projects.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    No active projects linked to this client yet.
                  </p>
                ) : (
                  client.projects.map((p) => (
                    <Link
                      key={p.id}
                      href={`/projects/${p.id}`}
                      className="flex items-center justify-between rounded-lg border border-border p-2.5 text-xs transition-colors hover:bg-muted/40"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-primary">
                            {p.code}
                          </span>
                          <span className="truncate font-medium">{p.name}</span>
                        </div>
                        <div className="mt-0.5 text-[11px] text-muted-foreground">
                          {p.category} • Due {p.deadline}
                        </div>
                      </div>
                      <StatusBadge status={p.status} />
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Client Projects</CardTitle>
              <CardDescription>
                All delivery engagements linked to {client.company}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {client.projects.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  No projects linked to this client.
                </p>
              ) : (
                client.projects.map((p) => (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className="flex items-center justify-between rounded-lg border border-border p-3 text-sm transition-colors hover:bg-muted/40"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-primary">
                          {p.code}
                        </span>
                        <span className="truncate font-medium">{p.name}</span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {p.brandName} • {p.category} • {p.progress}% progress
                      </div>
                    </div>
                    <StatusBadge status={p.status} />
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <TasksTab
            scope="client"
            scopeId={client.canonicalId}
            onOpenTask={openTask}
          />
        </TabsContent>

        <TabsContent value="files" className="space-y-4">
          <FilesTab
            scope="client"
            scopeId={client.canonicalId}
            onOpenTask={openTask}
          />
        </TabsContent>
      </Tabs>

      <TaskDetailPanel
        taskId={activeTaskId}
        onClose={closeTask}
        onSelectTask={openTask}
        orderedTaskIds={client.tasks.map((t) => t.id)}
      />
    </div>
  )
}
