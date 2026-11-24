"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ProgressBar } from "@/components/tremor"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import type { Project, Task, StaffUser } from "@/types"

interface ProjectTeamWorkloadProps {
  project: Project
  tasks: Task[]
  teamMembers: StaffUser[]
}

export function ProjectTeamWorkload({ project, tasks, teamMembers }: ProjectTeamWorkloadProps) {
  const [showTooltips, setShowTooltips] = React.useState(false)

  // Calculate team utilization metrics
  const teamMetrics = React.useMemo(() => {
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.status === "Complete").length
    const completionRate = Math.round((completedTasks / (totalTasks || 1)) * 100)

    return {
      totalTasks,
      completedTasks,
      completionRate,
      averageWorkload: Math.round(totalTasks / (teamMembers.length || 1)),
    }
  }, [tasks, teamMembers])

  // Calculate individual member workload
  const memberWorkloads = React.useMemo(() => {
    return teamMembers.map(member => {
      const memberTasks = tasks.filter(t => t.assigneeIds.includes(member.id))
      const completed = memberTasks.filter(t => t.status === "Complete").length
      const completionRate = Math.round((completed / (memberTasks.length || 1)) * 100)

      return {
        member,
        totalTasks: memberTasks.length,
        completed,
        completionRate,
        isOverloaded: memberTasks.length > 5,
      }
    })
  }, [tasks, teamMembers])

  const getCompletionColor = (rate: number) => {
    if (rate >= 80) return "emerald"
    if (rate >= 50) return "amber"
    return "rose" // Use tremor color names
  }

  const getBadgeVariant = (rate: number) => {
    if (rate >= 80) return "default"
    if (rate >= 50) return "secondary"
    return "destructive"
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-semibold">Team Workload</CardTitle>
          <p className="text-xs text-muted-foreground">Current capacity & performance</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowTooltips(!showTooltips)}
          title={showTooltips ? "Hide tooltips" : "Show help"}
        >
          ℹ️
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Team Capacity Summary */}
        {showTooltips && (
          <div className="rounded-lg border bg-muted/20 p-2 text-xs text-muted-foreground">
            Completion rate shows progress towards task completion. Higher is better!
          </div>
        )}

        {/* Individual Member Workloads */}
        {memberWorkloads.map(({ member, totalTasks, completed, completionRate, isOverloaded }) => (
          <div key={member.id} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className={`text-[10px] font-bold text-white ${member.avatarColor}`}>
                    {member.avatarInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{member.name.split(" ")[0]}</span>
                {isOverloaded && (
                  <Badge variant="destructive" className="text-[10px] px-2">Heavy Load</Badge>
                )}
              </div>
              <Badge variant={getBadgeVariant(completionRate)} className="text-xs">
                {completionRate}%
              </Badge>
            </div>
            <ProgressBar
              value={completionRate}
              color={getCompletionColor(completionRate)}
            />
          </div>
        ))}

        {/* Team Utilization Summary */}
        <div className="mt-3 rounded-lg border bg-muted/20 p-3 text-xs">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Team Capacity</span>
              <span className="font-semibold tabular-nums">{teamMetrics.completionRate}%</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span>Active Tasks: {teamMetrics.totalTasks}</span>
              <span>•</span>
              <span>Avg. Load: {teamMetrics.averageWorkload} per person</span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>80%+ Excellent</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-amber-500" />
            <span>50-79% Good</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-rose-500" />
            <span>{`< 50% Needs Attention`}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
