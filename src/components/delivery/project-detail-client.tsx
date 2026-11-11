"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  ArrowLeft,
  Calendar,
  Eye,
  EyeOff,
  FileText,
  MessageSquare,
  Send,
  Upload,
} from "lucide-react"
import {
  AvatarGroup,
  PageHeader,
  StatusBadge,
} from "@/components/shared"
import { ProgressBar } from "@/components/tremor"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { formatUsdEquivalent } from "@/lib/currency"
import { MOCK_TASKS } from "@/mocks/tasks"
import { MOCK_USERS } from "@/mocks/users"
import type { ActivityComment, Project, ProjectFile } from "@/types"

export function ProjectDetailClient({
  initialProject,
}: {
  initialProject: Project
}) {
  const [project, setProject] = React.useState<Project>(initialProject)
  const [files, setFiles] = React.useState<ProjectFile[]>(initialProject.files)
  const [comments, setComments] = React.useState<ActivityComment[]>(
    initialProject.comments
  )
  const [newComment, setNewComment] = React.useState("")

  const projectTasks = React.useMemo(
    () => MOCK_TASKS.filter((t) => t.projectId === project.id),
    [project.id]
  )

  const teamMembers = React.useMemo(
    () => MOCK_USERS.filter((u) => project.memberIds.includes(u.id)),
    [project.memberIds]
  )

  const manager = React.useMemo(
    () => MOCK_USERS.find((u) => u.id === project.managerId),
    [project.managerId]
  )

  function toggleFileVisibility(fileId: string) {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id !== fileId) return f
        const next = !f.clientVisible
        toast.success(
          `${f.name} is now ${next ? "visible to client" : "internal only"}`
        )
        return { ...f, clientVisible: next }
      })
    )
  }

  function handleAddComment(e: React.FormEvent) {
    e.preventDefault()
    if (!newComment.trim()) return
    const item: ActivityComment = {
      id: `pc-new-${comments.length + 1}`,
      authorId: "usr-1",
      authorName: "Marcus Vance",
      authorRole: "Super Admin",
      content: newComment.trim(),
      createdAt: "2026-11-11 18:30",
      type: "comment",
    }
    setComments((prev) => [...prev, item])
    setNewComment("")
    toast.success("Comment posted to project feed")
  }

  function handleMockUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const added: ProjectFile = {
      id: `pf-new-${files.length + 1}`,
      name: file.name,
      size: `${Math.max(120, Math.round(file.size / 1024))} KB`,
      type: file.type || "application/octet-stream",
      folder: "Deliverables",
      clientVisible: false,
      uploadedBy: "Marcus Vance",
      uploadedAt: "2026-11-11",
    }
    setFiles((prev) => [added, ...prev])
    toast.success(`Uploaded ${file.name} (internal visibility by default)`)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={project.name}
        description={`${project.code} • ${project.clientName} (${project.clientCompany}) • ${project.brandName}`}
        badge={<StatusBadge status={project.status} />}
        actions={
          <>
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href="/projects">
                <ArrowLeft className="size-4" />
                All Projects
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/chats">Open Project Chat</Link>
            </Button>
          </>
        }
      />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="w-full flex-wrap justify-start gap-1 group-data-horizontal/tabs:h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">
            Tasks ({projectTasks.length})
          </TabsTrigger>
          <TabsTrigger value="files">Files ({files.length})</TabsTrigger>
          <TabsTrigger value="activity">
            Comments & Activity ({comments.length})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <Card className="lg:col-span-8">
              <CardHeader>
                <CardTitle>Scope & Milestone Progress</CardTitle>
                <CardDescription>{project.category}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <p className="text-sm text-muted-foreground">
                  {project.description}
                </p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-muted-foreground">
                      Delivery Progress
                    </span>
                    <span className="font-semibold tabular-nums">
                      {project.progress}%
                    </span>
                  </div>
                  <ProgressBar
                    value={project.progress}
                    color={project.status === "Complete" ? "emerald" : "blue"}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-muted/20 p-4 text-xs sm:grid-cols-4">
                  <div>
                    <div className="text-muted-foreground">Budget</div>
                    <div className="mt-1 font-semibold tabular-nums">
                      {formatUsdEquivalent(project.budget, project.currency)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Start Date</div>
                    <div className="mt-1 flex items-center gap-1 tabular-nums">
                      <Calendar className="size-3.5 text-muted-foreground" />
                      {project.startDate}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Deadline</div>
                    <div className="mt-1 flex items-center gap-1 tabular-nums font-medium">
                      <Calendar className="size-3.5 text-muted-foreground" />
                      {project.deadline}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Priority</div>
                    <div className="mt-1">
                      <StatusBadge status={project.priority} showDot={false} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle>Assigned Team</CardTitle>
                <CardDescription>
                  Project lead & delivery specialists
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {manager ? (
                  <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-2.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-8">
                        <AvatarFallback
                          className={`text-xs font-bold text-white ${manager.avatarColor}`}
                        >
                          {manager.avatarInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">
                          {manager.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Project Admin (Lead)
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline">Owner</Badge>
                  </div>
                ) : null}

                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-lg border border-border p-2.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-8">
                        <AvatarFallback
                          className={`text-xs font-bold text-white ${member.avatarColor}`}
                        >
                          {member.avatarInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">{member.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {member.role}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      const next =
                        project.status === "Progress" ? "Complete" : "Progress"
                      setProject({ ...project, status: next })
                      toast.success(`Project status toggled to ${next}`)
                    }}
                  >
                    Mark as{" "}
                    {project.status === "Progress" ? "Complete" : "In Progress"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Deliverable Tasks</CardTitle>
                <CardDescription>
                  Tasks linked to {project.code}
                </CardDescription>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href="/tasks">Open Kanban Board</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {projectTasks.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No tasks currently assigned to this project.
                </p>
              ) : (
                projectTasks.map((task) => {
                  const assignees = MOCK_USERS.filter((u) =>
                    task.assigneeIds.includes(u.id)
                  )
                  return (
                    <div
                      key={task.id}
                      className="flex flex-col gap-3 rounded-lg border border-border p-3.5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-primary">
                            {task.code}
                          </span>
                          <StatusBadge status={task.status} />
                          <StatusBadge status={task.priority} showDot={false} />
                        </div>
                        <div className="font-medium text-foreground">
                          {task.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Due {task.dueDate} • {task.loggedHours}/
                          {task.estimatedHours} hrs logged
                        </div>
                      </div>
                      <AvatarGroup people={assignees} max={3} />
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Files Tab with client-visibility toggle */}
        <TabsContent value="files">
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Project Files & Client Visibility</CardTitle>
                <CardDescription>
                  Toggle which files are exposed in client-facing delivery packs
                  vs internal QA assets.
                </CardDescription>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted">
                <Upload className="size-3.5 text-primary" />
                <span>Upload File</span>
                <input
                  type="file"
                  className="sr-only"
                  onChange={handleMockUpload}
                />
              </label>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {files.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No files uploaded yet.
                </p>
              ) : (
                files.map((file) => (
                  <div
                    key={file.id}
                    className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <FileText className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">
                            {file.name}
                          </span>
                          <Badge variant="outline" className="text-[10px]">
                            {file.folder}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {file.size} • Uploaded by {file.uploadedBy} on{" "}
                          {file.uploadedAt}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        {file.clientVisible ? (
                          <>
                            <Eye className="size-3.5 text-(--tone-emerald-text)" />
                            Client Visible
                          </>
                        ) : (
                          <>
                            <EyeOff className="size-3.5" />
                            Internal Only
                          </>
                        )}
                      </span>
                      <Switch
                        checked={file.clientVisible}
                        onCheckedChange={() => toggleFileVisibility(file.id)}
                        aria-label={`Toggle client visibility for ${file.name}`}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comments & Activity Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="size-4 text-primary" />
                Comments & Activity
              </CardTitle>
              <CardDescription>
                Internal team notes, handoff updates, and client review logs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleAddComment} className="space-y-2">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write an update or @mention a teammate..."
                  rows={2}
                />
                <div className="flex justify-end">
                  <Button type="submit" size="sm" className="gap-1.5">
                    <Send className="size-3.5" />
                    Post Comment
                  </Button>
                </div>
              </form>

              <div className="space-y-3 pt-2">
                {comments.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-(--radius-control) border border-border bg-muted/20 p-3.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {c.authorName}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {c.authorRole}
                        </Badge>
                      </div>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {c.createdAt}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      {c.content}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
