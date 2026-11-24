"use client"

import * as React from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { FileText, Users, TrendingUp, Star } from "lucide-react"
import { getClientDetailHref } from "@/lib/files/client-resolver"
import type { Project, SignUp, Lead } from "@/types"

interface ProjectClientIntelligenceProps {
  project: Project
  signups: SignUp[]
  leads: Lead[]
}

export function ProjectClientIntelligence({ project, signups, leads }: ProjectClientIntelligenceProps) {
  const [showDetails, setShowDetails] = React.useState(false)

  // Engagement score based on budget and progress
  const engagementScore = React.useMemo(() => {
    const baseScore = project.budget > 50000 ? 70 : project.budget > 30000 ? 60 : 40
    const progressScore = project.progress > 70 ? 20 : project.progress > 40 ? 15 : 10
    return Math.min(100, baseScore + progressScore)
  }, [project])

  const getEngagementColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 dark:text-emerald-400"
    if (score >= 60) return "text-amber-600 dark:text-amber-400"
    return "text-rose-600 dark:text-rose-400"
  }

  const getEngagementBadge = (score: number) => {
    if (score >= 80) return "default"
    if (score >= 60) return "secondary"
    return "destructive"
  }

  // Find signups from same company
  const similarSignups = React.useMemo(
    () => signups.filter(s => s.brandId === project.brandId).slice(0, 3),
    [signups, project.brandId]
  )

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Client Intelligence</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setShowDetails(!showDetails)}>
            {showDetails ? "Less" : "More"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Client Company Info */}
        <div className="rounded-lg border bg-muted/20 p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className={`text-sm font-bold text-white ${project.clientCompany?.charAt(0) === 'A' ? 'bg-purple-600' : project.clientCompany?.charAt(0) === 'G' ? 'bg-blue-600' : 'bg-indigo-600'}`}>
                {project.clientCompany?.substring(0, 2).toUpperCase() || "CP"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{project.clientName}</div>
              <div className="text-xs text-muted-foreground truncate">{project.clientCompany}</div>
              <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
                  {project.category}
                </span>
              </div>
            </div>
          </div>

          {/* Client Info Stats */}
          {showDetails && (
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <FileText className="h-3 w-3" />
                <span>Brand: {project.brandName}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>{project.memberIds.length} members</span>
              </div>
            </div>
          )}
        </div>

        {/* Engagement Metrics */}
        {showDetails && (
          <div className="rounded-lg border bg-muted/20 p-3">
            <div className="space-y-2">
              {/* Engagement Score */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  <span>Engagement</span>
                </div>
                <Badge variant={getEngagementBadge(engagementScore)} className={`font-semibold ${getEngagementColor(engagementScore)}`}>
                  {engagementScore}/100
                </Badge>
              </div>

              {/* Satisfaction Rating (simplified from progress) */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="h-3 w-3" />
                  <span>Satisfaction</span>
                </div>
                <Badge variant="outline">
                  {Math.round(project.progress / 20)}/5
                </Badge>
              </div>

              {/* Budget */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Project Budget</span>
                <span className={`font-semibold ${getEngagementColor(project.budget)}`}>
                  {project.budget.toLocaleString()}
                </span>
              </div>

              {/* Progress */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Completion</span>
                <span className="font-semibold tabular-nums">{project.progress}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Related Signups */}
        {similarSignups.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>Similar Projects</span>
              <Badge variant="outline">{similarSignups.length}</Badge>
            </div>
            <div className="space-y-1.5">
              {similarSignups.map(signup => (
                <Link
                  key={signup.id}
                  href={`/signups/${signup.id}`}
                  className="block rounded-lg border bg-muted/20 p-2 hover:bg-muted"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium truncate">{signup.name}</span>
                    <Badge variant={signup.convertedToLead ? "default" : "secondary"} className="text-xs">
                      {signup.convertedToLead ? "Converted" : "New"}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Call to Action */}
        <Button variant="outline" size="sm" asChild className="w-full">
          <Link href={getClientDetailHref(project.clientCompany || project.clientName)}>
            View Full Profile →
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
