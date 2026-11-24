"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ProgressBar } from "@/components/tremor"
import { Flag, Clock, RotateCcw, FileText } from "lucide-react"
import { cn } from "cn"
import type { Task } from "@/types"

interface ProjectRiskSummaryProps {
  project: any // Will receive actual Project type once updated
  tasks: Task[]
}

export function ProjectRiskSummary({ project, tasks }: ProjectRiskSummaryProps) {
  const todayIso = React.useMemo(
    () => new Date().toISOString().split("T")[0],
    []
  )

  // Get deadline date from project
  const deadlineDate = project.deadline || ""

  // Calculate overdue tasks (tasks past their due date that aren't complete)
  const overdueTasks = React.useMemo(
    () => {
      if (!deadlineDate) return 0
      try {
        return tasks.filter(t => t.status !== "Complete" && new Date(t.dueDate || "") < new Date(deadlineDate)).length
      } catch {
        return 0
      }
    },
    [tasks, deadlineDate]
  )

  const redFlagTasks = React.useMemo(
    () => tasks.filter(t => t.redFlaggedUserIds?.length > 0).length,
    [tasks]
  )

  const highRedrawProjects = React.useMemo(
    () => tasks.filter(t => {
      const redrawCount = (t.revisions?.filter(r => r.type === "redraw").length ?? 0)
      return redrawCount > 2
    }).length,
    [tasks]
  )

  const riskScore = Math.min(100, (overdueTasks * 15) + (redFlagTasks * 20) + (highRedrawProjects * 25))

  const getRiskColor = (score: number) => {
    if (score > 70) return "rose" // Use tremor color names
    if (score > 40) return "amber"
    return "emerald"
  }

  const getRiskLevel = (score: number) => {
    if (score > 70) return "Critical"
    if (score > 40) return "High"
    if (score > 20) return "Medium"
    return "Low"
  }

  const isAtRisk = riskScore > 20

  return (
    <Card className={cn("border-rose-200 bg-rose-50 dark:bg-rose-950/20", riskScore > 60 && "border-rose-500")}>
      <CardHeader>
        <CardTitle className={cn("flex items-center gap-2", isAtRisk && "text-rose-700 dark:text-rose-400")}>
          <Flag className="h-4 w-4" /> Risk Assessment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Risk Score */}
        <div className="flex items-center gap-2">
          <ProgressBar
            value={riskScore}
            color={getRiskColor(riskScore)}
            className="flex-1"
          />
          <span className={`font-semibold tabular-nums ${
            riskScore > 70 ? "text-rose-600" : riskScore > 40 ? "text-amber-600" : "text-emerald-600"
          }`}>
            {riskScore}/100
          </span>
        </div>

        {/* Risk Level Badge */}
        <Badge variant={riskScore > 70 ? "destructive" : riskScore > 40 ? "secondary" : "default"} className="w-fit">
          {getRiskLevel(riskScore)} Risk
        </Badge>

        {/* Risk Indicators */}
        <div className="space-y-2 pt-2">
          <div className={cn("flex items-center gap-2 text-xs", overdueTasks > 0 && "font-medium")}>
            <Clock className="h-3 w-3" />
            <span>{overdueTasks} overdue task{overdueTasks !== 1 ? "s" : ""}</span>
          </div>
          <div className={cn("flex items-center gap-2 text-xs", redFlagTasks > 0 && "font-medium")}>
            <Flag className="h-3 w-3" />
            <span>{redFlagTasks} task{redFlagTasks !== 1 ? "s" : ""} flagged for review</span>
          </div>
          <div className={cn("flex items-center gap-2 text-xs", highRedrawProjects > 0 && "font-medium")}>
            <RotateCcw className="h-3 w-3" />
            <span>{highRedrawProjects} project{highRedrawProjects !== 1 ? "s" : ""} with excessive revisions</span>
          </div>
        </div>

        {/* Action Button */}
        {riskScore > 50 && (
          <button className="mt-2 w-full rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:bg-rose-950/50 dark:hover:bg-rose-900/50">
            Generate Risk Report
          </button>
        )}

        {/* No Risk State */}
        {!isAtRisk && (
          <div className="mt-2 rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-sm font-medium text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
            ✓ No significant risks detected
          </div>
        )}
      </CardContent>
    </Card>
  )
}
