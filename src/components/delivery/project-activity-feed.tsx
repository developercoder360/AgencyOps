"use client"

import * as React from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { FileText, MessageSquare, Clock, Edit3, ArrowRight, MoreHorizontal, Download } from "lucide-react"
import type { Project, Task, ActivityComment, ProjectFile } from "@/types"

interface ProjectActivityFeedProps {
  project: Project
  tasks: Task[]
  comments: ActivityComment[]
  files: ProjectFile[]
}

export function ProjectActivityFeed({ project, tasks, comments, files }: ProjectActivityFeedProps) {
  const [showExport, setShowExport] = React.useState(false)

  // Combine all activity sources
  const activities = React.useMemo(() => {
    const activityItems = [] as Array<{
      id: string
      type: "comment" | "file" | "status-change" | "task-update"
      timestamp: string
      data: any
      label: string
    }>

    // Comments
    comments.forEach(comment => {
      activityItems.push({
        id: `comment-${comment.id}`,
        type: "comment",
        timestamp: comment.createdAt,
        data: comment,
        label: "Comment added",
      })
    })

    // Files
    files.forEach(file => {
      activityItems.push({
        id: `file-${file.id}`,
        type: "file",
        timestamp: file.uploadedAt,
        data: file,
        label: "File uploaded",
      })
    })

    // Status changes (simplified - use project deadline as reference)
    activityItems.push({
      id: `status-progress`,
      type: "status-change",
      timestamp: new Date().toISOString(),
      data: { status: project.status },
      label: `Status: ${project.status}`,
    })

    // Task updates - completed tasks
    tasks.forEach(task => {
      if (task.status === "Complete") {
        activityItems.push({
          id: `task-complete-${task.id}`,
          type: "task-update",
          timestamp: new Date().toISOString(),
          data: { task, status: "Complete" },
          label: `${task.title} completed`,
        })
      }
    })

    // Sort by timestamp (most recent first)
    return activityItems.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }, [project, tasks, comments, files])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "comment":
        return <MessageSquare className="h-4 w-4" />
      case "file":
        return <FileText className="h-4 w-4" />
      case "status-change":
        return <Edit3 className="h-4 w-4" />
      case "task-update":
        return <Clock className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case "comment":
        return "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
      case "file":
        return "bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400"
      case "status-change":
        return "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400"
      case "task-update":
        return "bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400"
      default:
        return "bg-gray-100 text-gray-600 dark:bg-gray-900/50 dark:text-gray-400"
    }
  }

  const getTimestampDisplay = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-semibold">Project Activity Feed</CardTitle>
          <Badge variant="outline" className="font-normal">
            {activities.length} events
          </Badge>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowExport(!showExport)}
            title={showExport ? "Hide export options" : "Show export options"}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {showExport && (
        <CardContent className="pb-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Export activity log:</span>
            <Button variant="outline" size="sm" asChild>
              <a href="#" onClick={(e) => e.preventDefault()}>
                <Download className="mr-1 h-3 w-3" />
                Download CSV
              </a>
            </Button>
            <Button variant="outline" size="sm">PDF</Button>
          </div>
        </CardContent>
      )}

      <CardContent className="space-y-0 pt-0">
        {activities.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/20 p-8 text-center">
            <Clock className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium text-foreground">No activity yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Start collaborating on this project to see activity here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity, index) => (
              <React.Fragment key={activity.id}>
                <div className="group flex items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50">
                  {/* Icon badge */}
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${getActivityColor(activity.type)}`}>
                    {getActivityIcon(activity.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{activity.label}</span>
                          {activity.type === "file" && (
                            <Badge variant="outline" className="text-[10px]">
                              {(activity.data as ProjectFile).folder || "Upload"}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {(() => {
                            switch (activity.type) {
                              case "comment":
                                return (activity.data as ActivityComment).content?.substring(0, 80) || "Comment"
                              case "file":
                                return `${(activity.data as ProjectFile).name} • Uploaded by ${(activity.data as ProjectFile).uploadedBy}`
                              case "status-change":
                                return `Status: ${(activity.data as any).status}`
                              case "task-update":
                                return (activity.data as any).task?.title || "Task completed"
                              default:
                                return ""
                            }
                          })()}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {getTimestampDisplay(activity.timestamp)}
                      </span>
                    </div>

                    {/* Related task link */}
                    {activity.type === "task-update" && (activity.data as any).task?.id && (
                      <Link
                        href={`/tasks?projectId=${project.id}`}
                        className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        View Task →
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}

                    {/* Comment author */}
                    {activity.type === "comment" && (
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>{(activity.data as ActivityComment).authorName || "User"}</span>
                      </div>
                    )}
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
