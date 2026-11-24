"use client"

import * as React from "react"
import { TaskDetailPanel, useTaskDeepLink } from "@/components/delivery/task-detail"
import { PageHeader } from "@/components/shared"
import { TasksTab } from "@/components/tasks"
import { Skeleton } from "@/components/ui/skeleton"
import { useStore } from "@/lib/store"

function TasksPageContent() {
  const { tasks } = useStore()
  const { activeTaskId, openTask, closeTask } = useTaskDeepLink()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description="Manage deliverables across projects and clients with board, grouped list, and table views."
      />

      <TasksTab scope="all" onOpenTask={openTask} />

      <TaskDetailPanel
        taskId={activeTaskId}
        onClose={closeTask}
        onSelectTask={openTask}
        orderedTaskIds={tasks.map((t) => t.id)}
      />
    </div>
  )
}

export default function TasksPage() {
  return (
    <React.Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
      }
    >
      <TasksPageContent />
    </React.Suspense>
  )
}
