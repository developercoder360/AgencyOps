"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Flag,
  Layers,
  LayoutGrid,
  List,
  MessageSquare,
  Paperclip,
  Plus,
  RotateCcw,
  Search,
  Send,
  UserPlus,
  Users,
  X,
  Building2,
  ExternalLink,
  FolderKanban,
  Mail,
  Phone,
  ShieldCheck,
  Tag,
  User,
} from "lucide-react"
import {
  getTodayIsoFromNow,
  PRIORITY_META,
  TaskDetailPanel,
  useClientNow,
  useTaskDeepLink,
} from "@/components/delivery/task-detail"
import { ProjectActivityFeed } from "@/components/delivery/project-activity-feed"
import { FilesTab } from "@/components/files"
import { TasksTab, type TaskStatusFilter } from "@/components/tasks"
import { getClientDetailHref } from "@/lib/files/client-resolver"
import {
  AvatarGroup,
  PageHeader,
  StatusBadge,
} from "@/components/shared"
import { cn } from "cn"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useStore } from "@/lib/store"
import type { Project } from "@/types"

export function ProjectDetailClient({
  initialProject,
}: {
  initialProject: Project
}) {
  const {
    tasks,
    files: storeFiles,
    users,
    signups,
    leads,
    getProjectById,
    updateProject,
    addProjectComment,
  } = useStore()

  const project = getProjectById(initialProject.id) ?? initialProject
  const [activeTab, setActiveTab] = React.useState<string>("overview")
  const [newComment, setNewComment] = React.useState("")
  const [taskSearchQuery, setTaskSearchQuery] = React.useState("")
  const [taskStatusFilter, setTaskStatusFilter] = React.useState("all")
  const [addMemberOpen, setAddMemberOpen] = React.useState(false)
  const [memberSearchQuery, setMemberSearchQuery] = React.useState("")
  const [changeLeadOpen, setChangeLeadOpen] = React.useState(false)
  const [leadSearchQuery, setLeadSearchQuery] = React.useState("")
  const [memberListFilter, setMemberListFilter] = React.useState("")
  const [memberViewMode, setMemberViewMode] = React.useState<"list" | "chips">("list")
  const [allMembersModalOpen, setAllMembersModalOpen] = React.useState(false)

  const { activeTaskId, openTask, closeTask } = useTaskDeepLink()
  const todayIso = getTodayIsoFromNow(useClientNow())

  const files = project.files || []
  const projectScopedFilesCount = React.useMemo(
    () =>
      storeFiles.filter(
        (f) => f.scope === "project" && f.scopeId === project.id
      ).length,
    [storeFiles, project.id]
  )
  const comments = project.comments || []

  const projectTasks = React.useMemo(
    () => tasks.filter((t) => t.projectId === project.id),
    [tasks, project.id]
  )

  const teamMembers = React.useMemo(
    () => users.filter((u) => (project.memberIds || []).includes(u.id)),
    [users, project.memberIds]
  )

  const filteredTeamMembers = React.useMemo(() => {
    const q = memberListFilter.trim().toLowerCase()
    if (!q) return teamMembers
    return teamMembers.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q) ||
        (m.email || "").toLowerCase().includes(q) ||
        (m.department || "").toLowerCase().includes(q)
    )
  }, [teamMembers, memberListFilter])

  const manager = React.useMemo(
    () => users.find((u) => u.id === project.managerId),
    [users, project.managerId]
  )

  const matchedClient = React.useMemo(() => {
    const cName = (project.clientName || "").trim().toLowerCase()
    const cComp = (project.clientCompany || "").trim().toLowerCase()

    const foundSignup = signups.find(
      (s) => cName && s.name.toLowerCase() === cName
    )
    if (foundSignup) {
      return {
        name: foundSignup.name,
        company: project.clientCompany,
        email: foundSignup.email,
        phone: foundSignup.phone,
        city: foundSignup.city,
      }
    }

    const foundLead = leads.find(
      (l) =>
        (cName && l.name.toLowerCase() === cName) ||
        (cComp && l.company && l.company.toLowerCase() === cComp)
    )
    if (foundLead) {
      return {
        name: foundLead.name,
        company: foundLead.company || project.clientCompany,
        email: foundLead.email,
        phone: foundLead.phone,
        city: foundLead.city,
      }
    }

    return {
      name: project.clientName,
      company: project.clientCompany,
      email: `${project.clientName.toLowerCase().replace(/\s+/g, ".")}@${(project.clientCompany || "client").toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
      phone: "+1 (555) 019-2834",
      city: "New York, USA",
    }
  }, [signups, leads, project.clientName, project.clientCompany])

  const taskStats = React.useMemo(() => {
    const total = projectTasks.length
    const open = projectTasks.filter((t) => t.status === "Open").length
    const inProgress = projectTasks.filter((t) => t.status === "Progress").length
    const inReview = projectTasks.filter((t) => t.status === "QA Review").length
    const onHold = projectTasks.filter((t) => t.status === "On Hold").length
    const redraw = projectTasks.filter((t) => t.status === "Re-Draw").length
    const completed = projectTasks.filter((t) => t.status === "Complete").length
    const overdue = projectTasks.filter(
      (t) => t.status !== "Complete" && t.dueDate < todayIso
    ).length
    const flagged = projectTasks.filter(
      (t) => (t.redFlaggedUserIds || []).length > 0
    ).length
    const totalRevisions = projectTasks.reduce(
      (acc, t) => acc + (t.revisions?.length || 0),
      0
    )
    const openRevisions = projectTasks.reduce(
      (acc, t) =>
        acc +
        (t.revisions?.filter(
          (r) => r.status !== "approved" && r.status !== "rejected"
        ).length || 0),
      0
    )
    const redrawCount = projectTasks.reduce(
      (acc, t) =>
        acc + (t.revisions?.filter((r) => r.type === "redraw").length || 0),
      0
    )
    const completionPercentage =
      total > 0 ? Math.round((completed / total) * 100) : 0

    return {
      total,
      open,
      inProgress,
      inReview,
      onHold,
      redraw,
      completed,
      overdue,
      flagged,
      totalRevisions,
      openRevisions,
      redrawCount,
      completionPercentage,
    }
  }, [projectTasks, todayIso])

  const deadlineInfo = React.useMemo(() => {
    let spanDays: number | null = null
    if (project.startDate && project.deadline) {
      const startMs = new Date(project.startDate).getTime()
      const endMs = new Date(project.deadline).getTime()
      const rawSpan = Math.round((endMs - startMs) / (1000 * 60 * 60 * 24))
      if (!isNaN(rawSpan) && rawSpan >= 0) spanDays = rawSpan
    }

    if (!project.deadline) {
      return { text: "No deadline set", isOverdue: false, days: null, spanDays }
    }
    try {
      const today = new Date(todayIso).getTime()
      const due = new Date(project.deadline).getTime()
      const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24))
      if (isNaN(diffDays)) {
        return { text: project.deadline, isOverdue: false, days: null, spanDays }
      }
      if (diffDays < 0) {
        return {
          text: `${Math.abs(diffDays)}d overdue`,
          isOverdue: true,
          days: diffDays,
          spanDays,
        }
      }
      if (diffDays === 0) return { text: "Due today", isOverdue: false, days: 0, spanDays }
      return {
        text: `${diffDays}d remaining`,
        isOverdue: false,
        days: diffDays,
        spanDays,
      }
    } catch {
      return { text: project.deadline, isOverdue: false, days: null, spanDays }
    }
  }, [project.startDate, project.deadline, todayIso])

  const taskMetricPills = React.useMemo(
    () => [
      {
        key: "Open",
        label: "Open",
        count: taskStats.open,
        title: "Filter Open Tasks",
        labelClass: "text-muted-foreground",
        countClass: "text-foreground",
        boxClass:
          "border-border/60 bg-muted/20 hover:border-primary/50 hover:bg-muted/50",
      },
      {
        key: "Progress",
        label: "In Progress",
        count: taskStats.inProgress,
        title: "Filter In Progress Tasks",
        labelClass: "text-blue-600 dark:text-blue-400",
        countClass: "text-blue-600 dark:text-blue-400",
        boxClass:
          "border-border/60 bg-blue-50/25 hover:border-blue-400 hover:bg-blue-50/50 dark:bg-blue-950/20",
      },
      {
        key: "QA Review",
        label: "QA Review",
        count: taskStats.inReview,
        title: "Filter QA Review Tasks",
        labelClass: "text-purple-600 dark:text-purple-400",
        countClass: "text-purple-600 dark:text-purple-400",
        boxClass:
          "border-border/60 bg-purple-50/25 hover:border-purple-400 hover:bg-purple-50/50 dark:bg-purple-950/20",
      },
      {
        key: "On Hold",
        label: "On Hold",
        count: taskStats.onHold,
        title: "Filter On Hold Tasks",
        labelClass: "text-slate-600 dark:text-slate-400",
        countClass: "text-slate-700 dark:text-slate-300",
        boxClass:
          "border-border/60 bg-slate-50/30 hover:border-slate-400 hover:bg-slate-100/50 dark:bg-slate-900/30",
      },
      {
        key: "Re-Draw",
        label: "Re-Draw",
        count: taskStats.redraw,
        title: "Filter Re-Draw Tasks",
        labelClass: "text-amber-600 dark:text-amber-400",
        countClass: "text-amber-600 dark:text-amber-400",
        boxClass:
          "border-border/60 bg-amber-50/25 hover:border-amber-400 hover:bg-amber-50/50 dark:bg-amber-950/20",
      },
      {
        key: "Complete",
        label: "Complete",
        count: taskStats.completed,
        title: "Filter Complete Tasks",
        labelClass: "text-emerald-600 dark:text-emerald-400",
        countClass: "text-emerald-600 dark:text-emerald-400",
        boxClass:
          "border-border/60 bg-emerald-50/25 hover:border-emerald-400 hover:bg-emerald-50/50 dark:bg-emerald-950/20",
      },
      {
        key: "overdue",
        label: "Overdue",
        count: taskStats.overdue,
        title: "Filter Overdue Tasks",
        labelClass:
          taskStats.overdue > 0
            ? "font-semibold text-rose-600 dark:text-rose-400"
            : "text-muted-foreground",
        countClass:
          taskStats.overdue > 0
            ? "text-rose-600 dark:text-rose-400"
            : "text-foreground",
        boxClass:
          taskStats.overdue > 0
            ? "border-rose-300 bg-rose-50/40 hover:border-rose-400 hover:bg-rose-100/60 dark:border-rose-800 dark:bg-rose-950/30"
            : "border-border/60 bg-muted/20 hover:bg-muted/50",
      },
    ],
    [taskStats]
  )

  const progressSegments = React.useMemo(
    () => [
      { key: "Complete", label: "Complete", count: taskStats.completed, barClass: "bg-emerald-500" },
      { key: "QA Review", label: "QA Review", count: taskStats.inReview, barClass: "bg-purple-500" },
      { key: "Progress", label: "In Progress", count: taskStats.inProgress, barClass: "bg-blue-500" },
      { key: "Re-Draw", label: "Re-Draw", count: taskStats.redraw, barClass: "bg-amber-500" },
      { key: "On Hold", label: "On Hold", count: taskStats.onHold, barClass: "bg-slate-400" },
      { key: "Open", label: "Open", count: taskStats.open, barClass: "bg-muted-foreground/25" },
    ],
    [taskStats]
  )

  const filteredTasks = React.useMemo(() => {
    return projectTasks.filter((task) => {
      if (taskSearchQuery.trim()) {
        const q = taskSearchQuery.toLowerCase()
        const matchCode = task.code.toLowerCase().includes(q)
        const matchTitle = task.title.toLowerCase().includes(q)
        if (!matchCode && !matchTitle) return false
      }
      if (taskStatusFilter === "all") return true
      if (taskStatusFilter === "overdue") {
        return task.status !== "Complete" && task.dueDate < todayIso
      }
      if (taskStatusFilter === "flagged") {
        return (task.redFlaggedUserIds || []).length > 0
      }
      return task.status === taskStatusFilter
    })
  }, [projectTasks, taskSearchQuery, taskStatusFilter, todayIso])

  function handleAddComment(e: React.FormEvent) {
    e.preventDefault()
    if (!newComment.trim()) return
    addProjectComment(project.id, newComment.trim())
    setNewComment("")
    toast.success("Comment posted to project feed")
  }

  function handleToggleStatus() {
    const next = project.status === "Complete" ? "Progress" : "Complete"
    updateProject(project.id, { status: next })
    toast.success(`Project status marked as ${next === "Complete" ? "Complete" : "In Progress"}`)
  }

  const availableUsersToAdd = React.useMemo(() => {
    const assignedIds = new Set([project.managerId, ...(project.memberIds || [])])
    const q = memberSearchQuery.trim().toLowerCase()
    return users.filter((u) => {
      if (assignedIds.has(u.id)) return false
      if (!q) return true
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        (u.department || "").toLowerCase().includes(q)
      )
    })
  }, [users, project.managerId, project.memberIds, memberSearchQuery])

  const availableLeads = React.useMemo(() => {
    const q = leadSearchQuery.trim().toLowerCase()
    return users.filter((u) => {
      if (!q) return true
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
      )
    })
  }, [users, leadSearchQuery])

  function handleAddMember(userId: string) {
    const user = users.find((u) => u.id === userId)
    if (!user) return
    const currentMembers = project.memberIds || []
    if (currentMembers.includes(userId)) return
    const nextMembers = [...currentMembers, userId]
    updateProject(project.id, { memberIds: nextMembers })
    toast.success(`Added ${user.name} to project team`)
  }

  function handleRemoveMember(userId: string) {
    const user = users.find((u) => u.id === userId)
    const currentMembers = project.memberIds || []
    const nextMembers = currentMembers.filter((id) => id !== userId)
    updateProject(project.id, { memberIds: nextMembers })
    toast.success(`Removed ${user?.name || "Member"} from project team`)
  }

  function handleChangeManager(userId: string) {
    const user = users.find((u) => u.id === userId)
    if (!user) return
    const nextMembers = (project.memberIds || []).filter((id) => id !== userId)
    updateProject(project.id, { managerId: userId, memberIds: nextMembers })
    setChangeLeadOpen(false)
    toast.success(`Assigned ${user.name} as Project Lead`)
  }

  return (
    <div className="space-y-6">
      {/* 1. Header with Metadata & Navigation */}
      <PageHeader
        title={project.name}
        description={`${project.code} • ${project.clientName} (${project.clientCompany}) • ${project.brandName}`}
        badge={
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge status={project.status} />
            <StatusBadge status={project.priority} showDot={false} />
            <Badge variant="outline" className="text-xs">
              {project.category}
            </Badge>
          </div>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href="/projects">
                <ArrowLeft className="size-4" />
                All Projects
              </Link>
            </Button>
            <Button
              type="button"
              variant={project.status === "Complete" ? "outline" : "default"}
              size="sm"
              onClick={handleToggleStatus}
              className="gap-1.5"
            >
              {project.status === "Complete" ? (
                <>
                  <RotateCcw className="size-3.5" />
                  Reopen Project
                </>
              ) : (
                <>
                  <Check className="size-3.5" />
                  Mark Complete
                </>
              )}
            </Button>
            <Button asChild size="sm" variant="secondary" className="gap-1.5">
              <Link href="/chats">
                <MessageSquare className="size-3.5" />
                Project Chat
              </Link>
            </Button>
          </div>
        }
      />

      {/* 2. Executive KPI Ribbon: Unified Delivery & Task Metrics + Project Timeline */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:gap-4">
        {/* Metric 1: Unified Delivery Progress & Task Status Metrics */}
        <Card className="flex flex-col justify-between p-4 shadow-xs lg:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-medium text-muted-foreground">
                Delivery & Task Metrics
              </span>
              <span className="text-border">|</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold tracking-tight tabular-nums text-foreground">
                  {project.progress}%
                </span>
                <span className="text-[11px] text-muted-foreground">Overall</span>
              </div>
              <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0">
                {taskStats.total} Tasks
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              {taskStats.flagged > 0 ? (
                <Badge variant="destructive" className="text-[10px]">
                  {taskStats.flagged} Flagged
                </Badge>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="size-3.5" />
                  QA Clean
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-foreground gap-0.5"
                onClick={() => {
                  setActiveTab("tasks")
                  setTaskStatusFilter("all")
                }}
              >
                View Tasks
                <ChevronRight className="size-3" />
              </Button>
            </div>
          </div>

          {/* Interactive Workflow Status Breakdown */}
          <div className="my-2.5 flex flex-wrap gap-1.5">
            {taskMetricPills.map((item) => {
              const isSelectedFilter =
                activeTab === "tasks" && taskStatusFilter === item.key
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setActiveTab("tasks")
                    setTaskStatusFilter(item.key)
                  }}
                  title={item.title}
                  className={cn(
                    "flex min-w-[74px] flex-1 flex-col items-center justify-center rounded-md border py-1.5 px-1.5 text-center transition-all cursor-pointer",
                    item.boxClass,
                    isSelectedFilter && "ring-1 ring-primary border-primary/60"
                  )}
                >
                  <span className={cn("text-[10px] font-medium truncate w-full", item.labelClass)}>
                    {item.label}
                  </span>
                  <span className={cn("text-sm font-bold tabular-nums", item.countClass)}>
                    {item.count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Single Unified Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted/60">
              {taskStats.total > 0 ? (
                progressSegments.map((seg) =>
                  seg.count > 0 ? (
                    <div
                      key={seg.key}
                      style={{ width: `${(seg.count / taskStats.total) * 100}%` }}
                      className={cn(seg.barClass, "transition-all")}
                      title={`${seg.label}: ${seg.count}`}
                    />
                  ) : null
                )
              ) : (
                <div
                  style={{ width: `${Math.min(100, Math.max(0, project.progress))}%` }}
                  className={cn(
                    project.status === "Complete" ? "bg-emerald-500" : "bg-blue-500",
                    "transition-all"
                  )}
                  title={`Project Progress: ${project.progress}%`}
                />
              )}
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>
                {taskStats.completed}/{taskStats.total} completed ({taskStats.completionPercentage}%)
              </span>
              <span>
                {taskStats.openRevisions > 0
                  ? `${taskStats.openRevisions} open revision${taskStats.openRevisions === 1 ? "" : "s"}`
                  : "No open revisions"}
              </span>
            </div>
          </div>
        </Card>

        {/* Metric 2: Project Timeline */}
        <Card className="flex flex-col justify-between p-4 shadow-xs lg:col-span-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Clock className="size-3.5 text-primary" />
              Project Timeline
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                deadlineInfo.isOverdue
                  ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
              )}
            >
              <Clock className="size-3" />
              {deadlineInfo.text}
            </span>
          </div>

          <div className="my-2.5 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-md border border-border/50 bg-muted/20 p-2.5">
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Calendar className="size-3 text-muted-foreground" />
                <span>Kickoff</span>
              </div>
              <div className="mt-1 font-semibold tabular-nums text-foreground">
                {project.startDate || "N/A"}
              </div>
            </div>

            <div className="rounded-md border border-border/50 bg-muted/20 p-2.5">
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock className="size-3 text-muted-foreground" />
                <span>Target Deadline</span>
              </div>
              <div className="mt-1 font-semibold tabular-nums text-foreground">
                {project.deadline || "N/A"}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>
              {deadlineInfo.spanDays !== null
                ? `${deadlineInfo.spanDays}d project window`
                : `Status: ${project.status}`}
            </span>
            <span
              className={cn(
                "font-medium",
                deadlineInfo.isOverdue
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-emerald-600 dark:text-emerald-400"
              )}
            >
              {deadlineInfo.isOverdue ? "Behind schedule" : "On schedule"}
            </span>
          </div>
        </Card>
      </div>

      {/* 3. Main Navigation Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="inline-flex h-10 items-center justify-start rounded-lg bg-muted/70 p-1 text-muted-foreground border border-border/50 shadow-xs">
            <TabsTrigger
              value="overview"
              className="flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs data-[state=active]:font-semibold"
            >
              <Layers className="size-4 text-muted-foreground group-data-[state=active]:text-foreground" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger
              value="tasks"
              className="flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs data-[state=active]:font-semibold"
            >
              <CheckCircle2 className="size-4 text-muted-foreground group-data-[state=active]:text-foreground" />
              <span>Tasks</span>
              <span className="rounded-full bg-muted-foreground/15 px-1.5 py-0.2 font-mono text-[11px] font-semibold text-foreground">
                {projectTasks.length}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="files"
              className="flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs data-[state=active]:font-semibold"
            >
              <FileText className="size-4 text-muted-foreground group-data-[state=active]:text-foreground" />
              <span>Files</span>
              <span className="rounded-full bg-muted-foreground/15 px-1.5 py-0.2 font-mono text-[11px] font-semibold text-foreground">
                {projectScopedFilesCount}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs data-[state=active]:font-semibold"
            >
              <MessageSquare className="size-4 text-muted-foreground group-data-[state=active]:text-foreground" />
              <span>Activity Feed</span>
              <span className="rounded-full bg-muted-foreground/15 px-1.5 py-0.2 font-mono text-[11px] font-semibold text-foreground">
                {comments.length}
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TAB 1: OVERVIEW */}
        <TabsContent value="overview" className="space-y-4">
          {/* Proactive Risk / Blockers Banner if issues exist */}
          {(taskStats.overdue > 0 || taskStats.flagged > 0 || taskStats.openRevisions > 0) && (
            <div className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50/60 p-4 text-amber-900 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="size-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold">
                    Delivery Attention Items Detected
                  </div>
                  <div className="mt-0.5 text-xs text-amber-800 dark:text-amber-300">
                    This project has{" "}
                    {taskStats.overdue > 0 && (
                      <span className="font-semibold">{taskStats.overdue} overdue task(s)</span>
                    )}
                    {taskStats.overdue > 0 && taskStats.flagged > 0 && ", "}
                    {taskStats.flagged > 0 && (
                      <span className="font-semibold">{taskStats.flagged} red-flagged deliverable(s)</span>
                    )}
                    {(taskStats.overdue > 0 || taskStats.flagged > 0) &&
                      taskStats.openRevisions > 0 &&
                      ", and "}
                    {taskStats.openRevisions > 0 && (
                      <span className="font-semibold">{taskStats.openRevisions} open revision(s)</span>
                    )}
                    . Immediate action is recommended.
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-amber-300 bg-white hover:bg-amber-100 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200 dark:hover:bg-amber-900"
                  onClick={() => {
                    setActiveTab("tasks")
                    if (taskStats.overdue > 0) setTaskStatusFilter("overdue")
                    else if (taskStats.flagged > 0) setTaskStatusFilter("flagged")
                  }}
                >
                  Inspect Tasks
                  <ChevronRight className="size-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* Left 8 Cols: Project Details */}
            <div className="space-y-4 lg:col-span-8">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Project Details</CardTitle>
                      <CardDescription>
                        Core specifications, client relationship, and delivery scope
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {project.code}
                      </Badge>
                      <StatusBadge status={project.status} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Scope / Description */}
                  {project.description && (
                    <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                      {project.description}
                    </p>
                  )}

                  {/* 3-Column Specifications Grid */}
                  <div className="grid grid-cols-1 gap-4 rounded-lg border border-border bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-3">
                    {/* 1. Project Type */}
                    <div className="space-y-1">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <FolderKanban className="size-3.5 text-primary" />
                        <span>Project Type</span>
                      </span>
                      <p className="text-sm font-semibold text-foreground">
                        {project.category}
                      </p>
                      <span className="text-[11px] text-muted-foreground">
                        {project.brandName || "Agency Deliverable"}
                      </span>
                    </div>

                    {/* 2. Status */}
                    <div className="space-y-1">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <ShieldCheck className="size-3.5 text-primary" />
                        <span>Status</span>
                      </span>
                      <div className="pt-0.5">
                        <StatusBadge status={project.status} />
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {project.status === "Complete" ? "Finished & handed over" : "Active production phase"}
                      </span>
                    </div>

                    {/* 3. Company */}
                    <div className="space-y-1">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Building2 className="size-3.5 text-primary" />
                        <span>Company</span>
                      </span>
                      <p className="text-sm font-semibold truncate text-foreground">
                        {project.clientCompany || project.clientName}
                      </p>
                      <span className="text-[11px] text-muted-foreground">
                        Client Organization
                      </span>
                    </div>

                    {/* 4. Client Details */}
                    <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <User className="size-3.5 text-primary" />
                        <span>Client Details</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <Avatar className="size-6 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                            {project.clientName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <Link
                            href={getClientDetailHref(
                              project.clientCompany || project.clientName
                            )}
                            className="inline-flex items-center gap-1 text-sm font-semibold truncate text-foreground hover:text-primary hover:underline"
                          >
                            <span className="truncate">{project.clientName}</span>
                            <ExternalLink className="size-3 shrink-0" />
                          </Link>
                        </div>
                      </div>
                      <div className="flex flex-col gap-0.5 pt-0.5 text-[11px] text-muted-foreground">
                        {matchedClient?.email && (
                          <div className="flex items-center gap-1 truncate">
                            <Mail className="size-3 shrink-0" />
                            <span className="truncate">{matchedClient.email}</span>
                          </div>
                        )}
                        {matchedClient?.phone && (
                          <div className="flex items-center gap-1 truncate">
                            <Phone className="size-3 shrink-0" />
                            <span>{matchedClient.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 5. Labels & Tags */}
                    <div className="space-y-1.5 sm:col-span-2 lg:col-span-2">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Tag className="size-3.5 text-primary" />
                        <span>Labels</span>
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <StatusBadge status={project.priority} showDot={false} />
                        <Badge variant="outline" className="text-xs">
                          {project.brandName}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {project.category}
                        </Badge>
                        <Badge variant="outline" className="font-mono text-xs">
                          {project.currency}
                        </Badge>
                        {project.budget > 50000 && (
                          <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 text-xs">
                            Enterprise
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right 4 Cols: Leadership, Team, Client Card & Fast Actions */}
            <div className="space-y-4 lg:col-span-4">
              {/* Project Members & Assignees Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">Project Members</CardTitle>
                      <Badge variant="secondary" className="text-[11px] font-normal">
                        {(manager ? 1 : 0) + teamMembers.length}
                      </Badge>
                    </div>
                    <CardDescription>
                      Assignees and specialist contributors
                    </CardDescription>
                  </div>

                  {/* Add Member Popover */}
                  <Popover open={addMemberOpen} onOpenChange={setAddMemberOpen}>
                    <PopoverTrigger asChild>
                      <Button size="sm" className="h-8 gap-1.5 text-xs">
                        <UserPlus className="size-3.5" />
                        <span>Add Member</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-80 p-3">
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-foreground">
                            Add Project Member
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {availableUsersToAdd.length} available
                          </span>
                        </div>

                        <div className="relative">
                          <Search className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
                          <Input
                            placeholder="Search staff by name or role..."
                            value={memberSearchQuery}
                            onChange={(e) => setMemberSearchQuery(e.target.value)}
                            className="h-7 pl-8 text-xs"
                            autoFocus
                          />
                        </div>

                        <div className="max-h-56 space-y-1 overflow-y-auto pt-1">
                          {availableUsersToAdd.length === 0 ? (
                            <p className="py-4 text-center text-xs text-muted-foreground">
                              {memberSearchQuery
                                ? "No matching staff found."
                                : "All staff members are already assigned to this project."}
                            </p>
                          ) : (
                            availableUsersToAdd.map((u) => (
                              <button
                                key={u.id}
                                type="button"
                                onClick={() => handleAddMember(u.id)}
                                className="flex w-full items-center justify-between rounded-md p-1.5 text-left text-xs hover:bg-muted transition-colors cursor-pointer"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <Avatar className="size-7 shrink-0">
                                    <AvatarFallback
                                      className={`text-[10px] font-bold text-white ${u.avatarColor}`}
                                    >
                                      {u.avatarInitials}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0">
                                    <div className="truncate font-medium text-foreground">
                                      {u.name}
                                    </div>
                                    <div className="truncate text-[10px] text-muted-foreground">
                                      {u.role}
                                    </div>
                                  </div>
                                </div>
                                <Badge
                                  variant="outline"
                                  className="text-[10px] gap-1 shrink-0 ml-2"
                                >
                                  <Plus className="size-2.5" />
                                  Add
                                </Badge>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Project Lead / Manager */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      Project Lead
                    </span>
                    {manager ? (
                      <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar className="size-8 shrink-0">
                            <AvatarFallback
                              className={`text-xs font-bold text-white ${manager.avatarColor}`}
                            >
                              {manager.avatarInitials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">
                              {manager.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {manager.role}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge variant="outline" className="text-[10px]">
                            Lead
                          </Badge>
                          <Popover open={changeLeadOpen} onOpenChange={setChangeLeadOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
                              >
                                Change
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-72 p-2.5">
                              <div className="space-y-2">
                                <span className="text-xs font-semibold">
                                  Reassign Project Lead
                                </span>
                                <Input
                                  placeholder="Search staff..."
                                  value={leadSearchQuery}
                                  onChange={(e) => setLeadSearchQuery(e.target.value)}
                                  className="h-7 text-xs"
                                />
                                <div className="max-h-48 space-y-0.5 overflow-y-auto">
                                  {availableLeads.map((u) => (
                                    <button
                                      key={u.id}
                                      type="button"
                                      onClick={() => handleChangeManager(u.id)}
                                      className={cn(
                                        "flex w-full items-center justify-between rounded p-1.5 text-xs hover:bg-muted text-left",
                                        u.id === project.managerId &&
                                          "bg-muted font-medium"
                                      )}
                                    >
                                      <div className="flex items-center gap-2 truncate">
                                        <Avatar className="size-6 shrink-0">
                                          <AvatarFallback
                                            className={`text-[9px] font-bold text-white ${u.avatarColor}`}
                                          >
                                            {u.avatarInitials}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="truncate">{u.name}</span>
                                      </div>
                                      {u.id === project.managerId && (
                                        <Check className="size-3 text-primary shrink-0" />
                                      )}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed p-2 text-center text-xs text-muted-foreground">
                        No project lead assigned.
                      </div>
                    )}
                  </div>

                  {/* Assigned Team Specialists */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                        Assigned Specialists ({teamMembers.length})
                      </span>
                      {teamMembers.length > 0 && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setMemberViewMode("list")}
                            title="List view"
                            className={cn(
                              "p-1 rounded text-muted-foreground hover:text-foreground transition-colors",
                              memberViewMode === "list" && "bg-muted text-foreground"
                            )}
                          >
                            <List className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setMemberViewMode("chips")}
                            title="Compact chips view"
                            className={cn(
                              "p-1 rounded text-muted-foreground hover:text-foreground transition-colors",
                              memberViewMode === "chips" && "bg-muted text-foreground"
                            )}
                          >
                            <LayoutGrid className="size-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Inline filter if 4+ members */}
                    {teamMembers.length >= 4 && (
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
                        <Input
                          placeholder={`Filter ${teamMembers.length} members...`}
                          value={memberListFilter}
                          onChange={(e) => setMemberListFilter(e.target.value)}
                          className="h-7 pl-8 text-xs"
                        />
                      </div>
                    )}

                    {teamMembers.length === 0 ? (
                      <div className="rounded-lg border border-dashed p-4 text-center">
                        <Users className="mx-auto size-6 text-muted-foreground" />
                        <p className="mt-1 text-xs font-medium text-foreground">
                          No specialists assigned
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Add team members to collaborate on deliverables
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2.5 h-7 text-xs gap-1"
                          onClick={() => setAddMemberOpen(true)}
                        >
                          <UserPlus className="size-3" />
                          Add Member
                        </Button>
                      </div>
                    ) : filteredTeamMembers.length === 0 ? (
                      <div className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
                        No members matching &quot;{memberListFilter}&quot;
                        <div className="mt-1">
                          <button
                            type="button"
                            onClick={() => setMemberListFilter("")}
                            className="text-primary hover:underline font-medium"
                          >
                            Clear search filter
                          </button>
                        </div>
                      </div>
                    ) : memberViewMode === "chips" ? (
                      /* Compact Chips View: 20+ members fit in just 2-3 neat rows */
                      <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto pr-1">
                        {filteredTeamMembers.map((member) => {
                          const memberTasksCount = projectTasks.filter((t) =>
                            (t.assigneeIds || []).includes(member.id)
                          ).length

                          return (
                            <div
                              key={member.id}
                              className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/30 py-0.5 pl-1 pr-1.5 text-xs hover:border-primary/40 hover:bg-muted/60 transition-colors"
                              title={`${member.name} (${member.role}) • ${memberTasksCount} tasks`}
                            >
                              <Avatar className="size-5 shrink-0">
                                <AvatarFallback
                                  className={`text-[9px] font-bold text-white ${member.avatarColor}`}
                                >
                                  {member.avatarInitials}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium truncate max-w-[110px]">
                                {member.name}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                ({memberTasksCount})
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveMember(member.id)}
                                title={`Remove ${member.name}`}
                                className="text-muted-foreground hover:text-destructive opacity-70 group-hover:opacity-100 transition-opacity ml-0.5"
                              >
                                <X className="size-3" />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      /* List View: Bounded height container so it NEVER stretches the page */
                      <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                        {filteredTeamMembers.map((member) => {
                          const memberTasksCount = projectTasks.filter((t) =>
                            (t.assigneeIds || []).includes(member.id)
                          ).length

                          return (
                            <div
                              key={member.id}
                              className="group flex items-center justify-between rounded-lg border border-border p-2 transition-colors hover:bg-muted/40"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Avatar className="size-7 shrink-0">
                                  <AvatarFallback
                                    className={`text-[10px] font-bold text-white ${member.avatarColor}`}
                                  >
                                    {member.avatarInitials}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <div className="truncate text-xs font-medium">
                                    {member.name}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                    <span className="truncate">{member.role}</span>
                                    <span>•</span>
                                    <span className="tabular-nums">
                                      {memberTasksCount}{" "}
                                      {memberTasksCount === 1 ? "task" : "tasks"}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveMember(member.id)}
                                title={`Remove ${member.name} from project`}
                                className="size-6 p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive opacity-80 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="size-3" />
                                <span className="sr-only">
                                  Remove {member.name}
                                </span>
                              </Button>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* View All Dialog trigger if 6+ members */}
                    {teamMembers.length > 5 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full text-xs h-7.5 gap-1.5 mt-2"
                        onClick={() => setAllMembersModalOpen(true)}
                      >
                        <Users className="size-3.5" />
                        <span>View All {teamMembers.length} Members</span>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: TASKS */}
        {/* TAB 2: TASKS */}
        <TabsContent value="tasks" className="space-y-4">
          <TasksTab
            scope="project"
            scopeId={project.id}
            onOpenTask={openTask}
            initialStatusFilter={taskStatusFilter as TaskStatusFilter}
          />
        </TabsContent>

        {/* TAB 3: FILES */}
        <TabsContent value="files" className="space-y-4">
          <FilesTab
            scope="project"
            scopeId={project.id}
            onOpenTask={openTask}
          />
        </TabsContent>

        {/* TAB 5: ACTIVITY FEED & COMMENT COMPOSER */}
        <TabsContent value="activity" className="space-y-4">
          {/* Post a Note / Comment Composer */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="size-4 text-primary" />
                <CardTitle className="text-sm font-semibold">
                  Post Project Note or Update
                </CardTitle>
              </div>
              <CardDescription>
                Add internal notes, client call updates, or delivery logs directly to this project feed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddComment} className="space-y-3">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share a milestone update, client note, or QA review memo..."
                  className="min-h-[85px] resize-y text-xs sm:text-sm"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Posting to {project.code} feed as {manager?.name || "Project Lead"}
                  </span>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!newComment.trim()}
                    className="gap-1.5"
                  >
                    <Send className="size-3.5" />
                    Post Update
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Full Activity Feed Component */}
          <ProjectActivityFeed
            project={project}
            tasks={projectTasks}
            comments={comments}
            files={files}
          />
        </TabsContent>
      </Tabs>

      {/* Full Team Modal for large teams (20+ members) */}
      <Dialog open={allMembersModalOpen} onOpenChange={setAllMembersModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-6">
          <DialogHeader className="pb-2 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-lg">Project Team & Assignees</DialogTitle>
                <Badge variant="secondary" className="font-mono">
                  {(manager ? 1 : 0) + teamMembers.length}
                </Badge>
              </div>
            </div>
            <DialogDescription>
              All collaborators and assigned specialists working on {project.code} • {project.name}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between gap-3 pt-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, role, email, or department..."
                value={memberListFilter}
                onChange={(e) => setMemberListFilter(e.target.value)}
                className="pl-9 text-xs sm:text-sm"
              />
            </div>
            <Popover open={addMemberOpen} onOpenChange={setAddMemberOpen}>
              <PopoverTrigger asChild>
                <Button size="sm" className="gap-1.5 text-xs shrink-0">
                  <UserPlus className="size-3.5" />
                  <span>Add Member</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-3">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">
                      Add Project Member
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {availableUsersToAdd.length} available
                    </span>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search staff..."
                      value={memberSearchQuery}
                      onChange={(e) => setMemberSearchQuery(e.target.value)}
                      className="h-7 pl-8 text-xs"
                    />
                  </div>

                  <div className="max-h-56 space-y-1 overflow-y-auto pt-1">
                    {availableUsersToAdd.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleAddMember(u.id)}
                        className="flex w-full items-center justify-between rounded-md p-1.5 text-left text-xs hover:bg-muted transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar className="size-7 shrink-0">
                            <AvatarFallback
                              className={`text-[10px] font-bold text-white ${u.avatarColor}`}
                            >
                              {u.avatarInitials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="truncate font-medium text-foreground">{u.name}</div>
                            <div className="truncate text-[10px] text-muted-foreground">{u.role}</div>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px] gap-1 shrink-0 ml-2">
                          <Plus className="size-2.5" />
                          Add
                        </Badge>
                      </button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pt-2 pr-1 max-h-[50vh]">
            {/* Lead Row */}
            {manager && (
              <div className="flex items-center justify-between rounded-lg border border-primary/25 bg-primary/5 p-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="size-9 shrink-0">
                    <AvatarFallback
                      className={`text-xs font-bold text-white ${manager.avatarColor}`}
                    >
                      {manager.avatarInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm truncate">{manager.name}</span>
                      <Badge variant="default" className="text-[10px]">Project Lead</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {manager.role} • {manager.email}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Specialist Members Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredTeamMembers.map((member) => {
                const memberTasksCount = projectTasks.filter((t) =>
                  (t.assigneeIds || []).includes(member.id)
                ).length

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-lg border border-border p-2.5 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="size-8 shrink-0">
                        <AvatarFallback
                          className={`text-xs font-bold text-white ${member.avatarColor}`}
                        >
                          {member.avatarInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="font-medium text-xs truncate">{member.name}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{member.role}</div>
                        <div className="text-[10px] text-muted-foreground tabular-nums">
                          {memberTasksCount} tasks assigned
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.id)}
                      className="size-7 p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      title={`Remove ${member.name}`}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Task Drawer Panel */}
      <TaskDetailPanel
        taskId={activeTaskId}
        onClose={closeTask}
        onSelectTask={openTask}
        orderedTaskIds={projectTasks.map((t) => t.id)}
      />
    </div>
  )
}
