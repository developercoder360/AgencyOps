"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  ArrowDownAZ,
  ArrowUpAZ,
  ChevronDown,
  ChevronRight,
  Eye,
  FilterX,
  FolderOpen,
  HardDrive,
  LayoutGrid,
  List,
  Lock,
  Search,
  Upload,
} from "lucide-react"
import { useAppState } from "@/components/providers/app-state-provider"
import { ProgressBar } from "@/components/tremor"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  getClientDetailHref,
  resolveClientProfile,
  resolveTaskClientKey,
} from "@/lib/files/client-resolver"
import {
  downloadFilesAsMockZip,
  downloadSingleFile,
  formatFileSize,
  getFileCategory,
  getFileTypeLabel,
  isImageFileItem,
} from "@/lib/files/format"
import { useStore } from "@/lib/store"
import type {
  FileItem,
  FileScope,
  FileSortDirection,
  FileSortField,
  FileTypeCategory,
} from "@/types/files"
import { cn } from "cn"
import { FileBulkBar } from "./FileBulkBar"
import { FileGrid, type FileDisplayEntry } from "./FileGrid"
import { FilePreviewDialog } from "./FilePreviewDialog"
import { FileTable } from "./FileTable"
import {
  FileUploadDialog,
  type UploadDestinationOption,
} from "./FileUploadDialog"

export interface FilesTabProps {
  scope: FileScope
  scopeId: string
  compact?: boolean
  onOpenTask?: (taskId: string) => void
}

type ScopeFilterOption = "all" | FileScope

const SCOPE_COPY: Record<
  FileScope,
  {
    primaryTitle: string
    emptyTitle: string
    emptyDescription: string
    contextTitle: string
  }
> = {
  task: {
    primaryTitle: "Task Files",
    emptyTitle: "No files attached to this task",
    emptyDescription:
      "Upload briefs, design mocks, revisions, or QA assets directly to this task.",
    contextTitle: "Parent Project & Client Files",
  },
  project: {
    primaryTitle: "Project Files",
    emptyTitle: "No project-level files yet",
    emptyDescription:
      "Upload shared project briefs, contracts, wireframes, or final deliverables.",
    contextTitle: "Task Files in This Project",
  },
  client: {
    primaryTitle: "Client Files",
    emptyTitle: "No files uploaded for this client",
    emptyDescription:
      "Store client brand guidelines, MSAs, onboarding questionnaires, and shared assets.",
    contextTitle: "Project Files for This Client",
  },
}

function FilesTabSkeleton({ compact }: { compact?: boolean }) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-20 w-full rounded-xl" />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-48" />
      </div>
      <div
        className={cn(
          "grid grid-cols-2 gap-3",
          compact ? "sm:grid-cols-3" : "sm:grid-cols-3 lg:grid-cols-4"
        )}
      >
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
        {!compact && <Skeleton className="h-48 rounded-xl" />}
      </div>
    </div>
  )
}

export function FilesTab(props: FilesTabProps) {
  return <FilesTabInner key={`${props.scope}:${props.scopeId}`} {...props} />
}

function FilesTabInner({
  scope,
  scopeId,
  compact = false,
  onOpenTask,
}: FilesTabProps) {
  const {
    isLoaded,
    files,
    filesViewMode,
    projects,
    tasks,
    users,
    signups,
    leads,
    addFiles,
    renameFile,
    moveFile,
    deleteFiles,
    setVisibility,
    setFilesViewMode,
  } = useStore()

  const { activeUserId, hasPermission } = useAppState()

  const canView = hasPermission("files.view")
  const canUpload = hasPermission("files.upload")
  const canDownload = hasPermission("files.download")
  const canDelete = hasPermission("files.delete")
  const canManageVisibility = hasPermission("files.manage_visibility")

  // Filters & UI State
  const [scopeFilter, setScopeFilter] = React.useState<ScopeFilterOption>("all")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [typeFilter, setTypeFilter] = React.useState<FileTypeCategory>("all")
  const [onlyClientVisible, setOnlyClientVisible] = React.useState(false)
  const [sortField, setSortField] = React.useState<FileSortField>("date")
  const [sortDir, setSortDir] = React.useState<FileSortDirection>("desc")
  const [contextCollapsed, setContextCollapsed] = React.useState(false)
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(
    () => new Set()
  )

  // Modal / Dialog State
  const [uploadOpen, setUploadOpen] = React.useState(false)
  const [previewFileId, setPreviewFileId] = React.useState<string | null>(null)
  const [renameTarget, setRenameTarget] = React.useState<FileItem | null>(null)
  const [renameDraft, setRenameDraft] = React.useState("")
  const [moveTarget, setMoveTarget] = React.useState<FileItem | null>(null)
  const [moveDestKey, setMoveDestKey] = React.useState("")
  const [visibilityConfirm, setVisibilityConfirm] = React.useState<{
    ids: string[]
    fileName?: string
  } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = React.useState<{
    ids: string[]
    title: string
    description: string
  } | null>(null)

  // Entity Context Lookups
  const currentTask = React.useMemo(
    () => (scope === "task" ? tasks.find((t) => t.id === scopeId) : undefined),
    [scope, scopeId, tasks]
  )

  const currentProject = React.useMemo(() => {
    if (scope === "project") return projects.find((p) => p.id === scopeId)
    if (scope === "task" && currentTask) {
      return projects.find((p) => p.id === currentTask.projectId)
    }
    return undefined
  }, [scope, scopeId, projects, currentTask])

  const resolvedClient = React.useMemo(() => {
    if (scope === "client") {
      return resolveClientProfile(scopeId, { signups, leads, projects, tasks })
    }
    if (scope === "task" && currentTask) {
      const key = resolveTaskClientKey(currentTask, currentProject, signups, leads)
      return key
        ? resolveClientProfile(key, { signups, leads, projects, tasks })
        : null
    }
    if (scope === "project" && currentProject) {
      const key = currentProject.clientCompany || currentProject.clientName
      return key
        ? resolveClientProfile(key, { signups, leads, projects, tasks })
        : null
    }
    return null
  }, [scope, scopeId, signups, leads, projects, tasks, currentTask, currentProject])

  // Build Primary & Read-Only Context File Entries
  const { primaryEntries, contextEntries, allEntries } = React.useMemo(() => {
    const primary: FileDisplayEntry[] = []
    const context: FileDisplayEntry[] = []

    if (scope === "task") {
      const taskFiles = files.filter(
        (f) => f.scope === "task" && f.scopeId === scopeId
      )
      for (const file of taskFiles) {
        primary.push({
          file,
          readOnly: false,
          sourceBadge: currentTask ? `Task · ${currentTask.code}` : "Task",
          sourceTitle: currentTask?.title,
        })
      }

      if (currentProject) {
        const parentProjFiles = files.filter(
          (f) => f.scope === "project" && f.scopeId === currentProject.id
        )
        for (const file of parentProjFiles) {
          context.push({
            file,
            readOnly: true,
            sourceBadge: `Project · ${currentProject.code}`,
            sourceTitle: currentProject.name,
            sourceHref: `/projects/${currentProject.id}`,
          })
        }
      }

      if (resolvedClient) {
        const clientIdSet = new Set(resolvedClient.matchIds)
        const parentClientFiles = files.filter(
          (f) => f.scope === "client" && clientIdSet.has(f.scopeId)
        )
        for (const file of parentClientFiles) {
          context.push({
            file,
            readOnly: true,
            sourceBadge: `Client · ${resolvedClient.company}`,
            sourceTitle: `${resolvedClient.name} (${resolvedClient.company})`,
            sourceHref: getClientDetailHref(resolvedClient.canonicalId),
          })
        }
      }
    } else if (scope === "project") {
      const projectFiles = files.filter(
        (f) => f.scope === "project" && f.scopeId === scopeId
      )
      for (const file of projectFiles) {
        primary.push({
          file,
          readOnly: false,
          sourceBadge: currentProject ? `Project · ${currentProject.code}` : "Project",
          sourceTitle: currentProject?.name,
        })
      }

      const projectTasks = tasks.filter((t) => t.projectId === scopeId)
      const taskById = new Map(projectTasks.map((t) => [t.id, t]))
      for (const file of files) {
        if (file.scope === "task" && taskById.has(file.scopeId)) {
          const t = taskById.get(file.scopeId)!
          context.push({
            file,
            readOnly: true,
            sourceBadge: `${t.code} · ${t.title}`,
            sourceTitle: `${t.code}: ${t.title}`,
            sourceTaskId: t.id,
            sourceHref: `/tasks?task=${t.id}`,
          })
        }
      }

      if (resolvedClient) {
        const clientIdSet = new Set(resolvedClient.matchIds)
        for (const file of files) {
          if (file.scope === "client" && clientIdSet.has(file.scopeId)) {
            context.push({
              file,
              readOnly: true,
              sourceBadge: `Client · ${resolvedClient.company}`,
              sourceTitle: `${resolvedClient.name} (${resolvedClient.company})`,
              sourceHref: getClientDetailHref(resolvedClient.canonicalId),
            })
          }
        }
      }
    } else {
      // Client scope
      const clientIdSet = new Set(
        resolvedClient ? resolvedClient.matchIds : [scopeId]
      )
      const clientFiles = files.filter(
        (f) => f.scope === "client" && clientIdSet.has(f.scopeId)
      )
      for (const file of clientFiles) {
        primary.push({
          file,
          readOnly: false,
          sourceBadge: resolvedClient
            ? `Client · ${resolvedClient.company}`
            : "Client",
          sourceTitle: resolvedClient?.name,
        })
      }

      const clientProjects = resolvedClient?.projects ?? []
      const projectById = new Map(clientProjects.map((p) => [p.id, p]))
      for (const file of files) {
        if (file.scope === "project" && projectById.has(file.scopeId)) {
          const p = projectById.get(file.scopeId)!
          context.push({
            file,
            readOnly: true,
            sourceBadge: `${p.code} · ${p.name}`,
            sourceTitle: p.name,
            sourceHref: `/projects/${p.id}`,
          })
        }
      }

      const clientTasks = resolvedClient?.tasks ?? []
      const taskById = new Map(clientTasks.map((t) => [t.id, t]))
      for (const file of files) {
        if (file.scope === "task" && taskById.has(file.scopeId)) {
          const t = taskById.get(file.scopeId)!
          context.push({
            file,
            readOnly: true,
            sourceBadge: `Task · ${t.code}`,
            sourceTitle: t.title,
            sourceTaskId: t.id,
            sourceHref: `/tasks?task=${t.id}`,
          })
        }
      }
    }

    return {
      primaryEntries: primary,
      contextEntries: context,
      allEntries: [...primary, ...context],
    }
  }, [
    scope,
    scopeId,
    files,
    tasks,
    currentTask,
    currentProject,
    resolvedClient,
  ])

  // Upload Destinations (Task & Client locked; Project allows Project or its Tasks)
  const uploadDestinations = React.useMemo<UploadDestinationOption[]>(() => {
    if (scope === "task") {
      return [
        {
          key: `task:${scopeId}`,
          scope: "task",
          scopeId,
          label: currentTask
            ? `${currentTask.code} — ${currentTask.title}`
            : "Current Task",
          badge: "Task Files",
          taskId: scopeId,
          projectId: currentTask?.projectId,
          clientId: resolvedClient?.canonicalId,
        },
      ]
    }
    if (scope === "project") {
      const projectTasks = tasks.filter((t) => t.projectId === scopeId)
      return [
        {
          key: `project:${scopeId}`,
          scope: "project",
          scopeId,
          label: currentProject
            ? `${currentProject.code} — ${currentProject.name}`
            : "Current Project",
          badge: "Project",
          projectId: scopeId,
          clientId: resolvedClient?.canonicalId,
        },
        ...projectTasks.map((t) => ({
          key: `task:${t.id}`,
          scope: "task" as const,
          scopeId: t.id,
          label: `${t.code} — ${t.title}`,
          badge: "Task",
          taskId: t.id,
          projectId: scopeId,
          clientId: t.clientId ?? resolvedClient?.canonicalId,
        })),
      ]
    }
    const clientCanonical = resolvedClient?.canonicalId ?? scopeId
    return [
      {
        key: `client:${clientCanonical}`,
        scope: "client",
        scopeId: clientCanonical,
        label: resolvedClient
          ? `${resolvedClient.name} (${resolvedClient.company})`
          : "Current Client",
        badge: "Client Files",
        clientId: clientCanonical,
      },
    ]
  }, [scope, scopeId, currentTask, currentProject, resolvedClient, tasks])

  const defaultDestinationKey = uploadDestinations[0]?.key ?? `${scope}:${scopeId}`

  // Valid Move Destinations for a given FileItem
  const getMoveDestinations = React.useCallback(
    (file: FileItem): UploadDestinationOption[] => {
      const options: UploadDestinationOption[] = []

      if (scope === "project" && currentProject) {
        options.push({
          key: `project:${currentProject.id}`,
          scope: "project",
          scopeId: currentProject.id,
          label: `${currentProject.code} — ${currentProject.name}`,
          badge: "Project",
          projectId: currentProject.id,
          clientId: resolvedClient?.canonicalId,
        })
        for (const t of tasks.filter((item) => item.projectId === currentProject.id)) {
          options.push({
            key: `task:${t.id}`,
            scope: "task",
            scopeId: t.id,
            label: `${t.code} — ${t.title}`,
            badge: "Task",
            taskId: t.id,
            projectId: currentProject.id,
            clientId: resolvedClient?.canonicalId,
          })
        }
        if (resolvedClient) {
          options.push({
            key: `client:${resolvedClient.canonicalId}`,
            scope: "client",
            scopeId: resolvedClient.canonicalId,
            label: `${resolvedClient.name} (${resolvedClient.company})`,
            badge: "Client",
            clientId: resolvedClient.canonicalId,
          })
        }
      } else if (scope === "task" && currentTask) {
        if (currentProject) {
          options.push({
            key: `project:${currentProject.id}`,
            scope: "project",
            scopeId: currentProject.id,
            label: `${currentProject.code} — ${currentProject.name}`,
            badge: "Project",
            projectId: currentProject.id,
            clientId: resolvedClient?.canonicalId,
          })
        }
        if (resolvedClient) {
          options.push({
            key: `client:${resolvedClient.canonicalId}`,
            scope: "client",
            scopeId: resolvedClient.canonicalId,
            label: `${resolvedClient.name} (${resolvedClient.company})`,
            badge: "Client",
            clientId: resolvedClient.canonicalId,
          })
        }
      } else if (scope === "client" && resolvedClient) {
        for (const p of resolvedClient.projects) {
          options.push({
            key: `project:${p.id}`,
            scope: "project",
            scopeId: p.id,
            label: `${p.code} — ${p.name}`,
            badge: "Project",
            projectId: p.id,
            clientId: resolvedClient.canonicalId,
          })
        }
      }

      const currentKey = `${file.scope}:${file.scopeId}`
      return options.filter((opt) => opt.key !== currentKey)
    },
    [scope, currentProject, currentTask, resolvedClient, tasks]
  )

  const hasMoveTargets = React.useCallback(
    (entry: FileDisplayEntry) =>
      !entry.readOnly && getMoveDestinations(entry.file).length > 0,
    [getMoveDestinations]
  )

  // Filtering & Sorting helper
  const filterAndSort = React.useCallback(
    (list: FileDisplayEntry[]): FileDisplayEntry[] => {
      const q = searchQuery.trim().toLowerCase()
      const filtered = list.filter(({ file }) => {
        if (scopeFilter !== "all" && file.scope !== scopeFilter) return false
        if (q) {
          const nameMatch = file.name.toLowerCase().includes(q)
          const noteMatch = (file.note || "").toLowerCase().includes(q)
          if (!nameMatch && !noteMatch) return false
        }
        if (typeFilter !== "all") {
          if (getFileCategory(file.mimeType, file.name) !== typeFilter) {
            return false
          }
        }
        if (onlyClientVisible && !file.clientVisible) return false
        return true
      })

      const factor = sortDir === "asc" ? 1 : -1
      return [...filtered].sort((a, b) => {
        if (sortField === "name") {
          return a.file.name.localeCompare(b.file.name) * factor
        }
        if (sortField === "size") {
          return (a.file.size - b.file.size) * factor
        }
        if (sortField === "type") {
          return (
            getFileTypeLabel(a.file.mimeType, a.file.name).localeCompare(
              getFileTypeLabel(b.file.mimeType, b.file.name)
            ) * factor
          )
        }
        return a.file.uploadedAt.localeCompare(b.file.uploadedAt) * factor
      })
    },
    [scopeFilter, searchQuery, typeFilter, onlyClientVisible, sortField, sortDir]
  )

  const filteredPrimary = React.useMemo(
    () => filterAndSort(primaryEntries),
    [filterAndSort, primaryEntries]
  )
  const filteredContext = React.useMemo(
    () => filterAndSort(contextEntries),
    [filterAndSort, contextEntries]
  )
  const visibleEntries = React.useMemo(
    () => [...filteredPrimary, ...filteredContext],
    [filteredPrimary, filteredContext]
  )

  const hasActiveFilters =
    scopeFilter !== "all" ||
    searchQuery.trim().length > 0 ||
    typeFilter !== "all" ||
    onlyClientVisible

  function clearFilters() {
    setScopeFilter("all")
    setSearchQuery("")
    setTypeFilter("all")
    setOnlyClientVisible(false)
  }

  // Storage Summary Stats (computed across this view's files)
  const summary = React.useMemo(() => {
    const base = allEntries.map((e) => e.file)
    const totalFiles = base.length
    const totalBytes = base.reduce((sum, f) => sum + f.size, 0)
    const clientVisibleCount = base.filter((f) => f.clientVisible).length
    const internalCount = totalFiles - clientVisibleCount
    return {
      totalFiles,
      totalBytes,
      clientVisibleCount,
      internalCount,
    }
  }, [allEntries])

  const clientVisiblePercent =
    summary.totalFiles > 0
      ? Math.round((summary.clientVisibleCount / summary.totalFiles) * 100)
      : 0

  const scopeCounts = React.useMemo(
    () => ({
      all: allEntries.length,
      task: allEntries.filter((e) => e.file.scope === "task").length,
      project: allEntries.filter((e) => e.file.scope === "project").length,
      client: allEntries.filter((e) => e.file.scope === "client").length,
    }),
    [allEntries]
  )

  // Filtered Image list for Lightbox Prev/Next navigation
  const filteredImages = React.useMemo(
    () => visibleEntries.map((e) => e.file).filter((f) => isImageFileItem(f)),
    [visibleEntries]
  )

  const previewEntry = React.useMemo(
    () =>
      previewFileId
        ? allEntries.find((e) => e.file.id === previewFileId) ?? null
        : null,
    [previewFileId, allEntries]
  )

  // Selection helpers
  function toggleSelect(fileId: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(fileId)
      else next.delete(fileId)
      return next
    })
  }

  function toggleSelectAllInList(entries: FileDisplayEntry[], checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      for (const e of entries) {
        if (checked) next.add(e.file.id)
        else next.delete(e.file.id)
      }
      return next
    })
  }

  const selectedEntries = React.useMemo(
    () => allEntries.filter((e) => selectedIds.has(e.file.id)),
    [allEntries, selectedIds]
  )
  const writableSelectedIds = React.useMemo(
    () => selectedEntries.filter((e) => !e.readOnly).map((e) => e.file.id),
    [selectedEntries]
  )

  // Handlers
  function handleDownload(file: FileItem) {
    if (!canDownload) {
      toast.error("You do not have files.download permission.")
      return
    }
    downloadSingleFile(file)
    toast.success(`Downloading "${file.name}"`)
  }

  function handleBulkDownload() {
    if (!canDownload) {
      toast.error("You do not have files.download permission.")
      return
    }
    if (selectedEntries.length === 0) return
    downloadFilesAsMockZip(
      selectedEntries.map((e) => e.file),
      `${scope}-${scopeId}`
    )
    toast.success(`Prepared ZIP download (${selectedEntries.length} files)`)
  }

  function handleRequestVisibilityToggle(file: FileItem, nextVisible: boolean) {
    if (!canManageVisibility) {
      toast.error("You do not have files.manage_visibility permission.")
      return
    }
    if (nextVisible) {
      setVisibilityConfirm({ ids: [file.id], fileName: file.name })
    } else {
      setVisibility([file.id], false)
      toast.success(`"${file.name}" is now Internal only`)
    }
  }

  function handleBulkSetVisibility(nextVisible: boolean) {
    if (!canManageVisibility) {
      toast.error("You do not have files.manage_visibility permission.")
      return
    }
    if (writableSelectedIds.length === 0) return
    if (nextVisible) {
      setVisibilityConfirm({ ids: writableSelectedIds })
    } else {
      setVisibility(writableSelectedIds, false)
      setSelectedIds(new Set())
      toast.success(
        `${writableSelectedIds.length} file${writableSelectedIds.length === 1 ? "" : "s"} set to Internal only`
      )
    }
  }

  function handleConfirmVisibility() {
    if (!visibilityConfirm) return
    setVisibility(visibilityConfirm.ids, true)
    toast.success(
      visibilityConfirm.fileName
        ? `"${visibilityConfirm.fileName}" is now visible to the client`
        : `${visibilityConfirm.ids.length} files are now visible to the client`
    )
    if (!visibilityConfirm.fileName) {
      setSelectedIds(new Set())
    }
    setVisibilityConfirm(null)
  }

  function handleRequestDelete(file: FileItem) {
    if (!canDelete) {
      toast.error("You do not have files.delete permission.")
      return
    }
    setDeleteConfirm({
      ids: [file.id],
      title: `Delete "${file.name}"?`,
      description:
        "This file will be permanently removed from this workspace. This action cannot be undone.",
    })
  }

  function handleBulkDelete() {
    if (!canDelete) {
      toast.error("You do not have files.delete permission.")
      return
    }
    if (writableSelectedIds.length === 0) return
    setDeleteConfirm({
      ids: writableSelectedIds,
      title: `Delete ${writableSelectedIds.length} selected file${writableSelectedIds.length === 1 ? "" : "s"}?`,
      description:
        "Selected files will be permanently removed. This action cannot be undone.",
    })
  }

  function handleConfirmDelete() {
    if (!deleteConfirm) return
    if (previewFileId && deleteConfirm.ids.includes(previewFileId)) {
      setPreviewFileId(null)
    }
    deleteFiles(deleteConfirm.ids)
    setSelectedIds((prev) => {
      const next = new Set(prev)
      for (const id of deleteConfirm.ids) next.delete(id)
      return next
    })
    toast.success(
      deleteConfirm.ids.length === 1
        ? "File deleted"
        : `Deleted ${deleteConfirm.ids.length} files`
    )
    setDeleteConfirm(null)
  }

  function handleOpenRename(file: FileItem) {
    if (!canUpload) return
    setRenameTarget(file)
    setRenameDraft(file.name)
  }

  function handleConfirmRename(e: React.FormEvent) {
    e.preventDefault()
    if (!renameTarget) return
    const trimmed = renameDraft.trim()
    if (!trimmed) {
      toast.error("Filename cannot be empty")
      return
    }
    renameFile(renameTarget.id, trimmed)
    toast.success(`Renamed to "${trimmed}"`)
    setRenameTarget(null)
  }

  function handleOpenMove(file: FileItem) {
    if (!canUpload) return
    const targets = getMoveDestinations(file)
    if (targets.length === 0) return
    setMoveTarget(file)
    setMoveDestKey(targets[0].key)
  }

  function handleConfirmMove(e: React.FormEvent) {
    e.preventDefault()
    if (!moveTarget) return
    const targets = getMoveDestinations(moveTarget)
    const dest = targets.find((d) => d.key === moveDestKey)
    if (!dest) return
    moveFile(moveTarget.id, dest.scope, dest.scopeId, {
      taskId: dest.taskId,
      projectId: dest.projectId,
      clientId: dest.clientId,
    })
    toast.success(`Moved "${moveTarget.name}" to ${dest.label}`)
    setMoveTarget(null)
  }

  if (!isLoaded) {
    return <FilesTabSkeleton compact={compact} />
  }

  if (!canView) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Lock className="size-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">
              File Access Restricted
            </h3>
            <p className="max-w-sm text-xs text-muted-foreground">
              You currently do not have the{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono">
                files.view
              </code>{" "}
              permission required to view files in this workspace.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const copy = SCOPE_COPY[scope]
  const uploadButton = canUpload ? (
    <Button
      type="button"
      size="sm"
      onClick={() => setUploadOpen(true)}
      className="gap-1.5"
    >
      <Upload className="size-3.5" />
      Upload files
    </Button>
  ) : (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex cursor-not-allowed">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled
            className="gap-1.5"
          >
            <Upload className="size-3.5" />
            Upload files
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent className="text-xs">
        Requires <code>files.upload</code> permission
      </TooltipContent>
    </Tooltip>
  )

  return (
    <div className="space-y-4">
      {/* Storage Summary Strip (Tremor Tracker + metrics) */}
      <Card className="p-3.5 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <HardDrive className="size-4" />
              </div>
              <div>
                <div className="text-[11px] font-medium text-muted-foreground">
                  Storage Summary
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-base font-bold tabular-nums text-foreground">
                    {summary.totalFiles}{" "}
                    {summary.totalFiles === 1 ? "file" : "files"}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground tabular-nums">
                    • {formatFileSize(summary.totalBytes)}
                  </span>
                </div>
              </div>
            </div>

            <div className="hidden h-7 w-px bg-border sm:block" />

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-500" />
                <span className="font-semibold tabular-nums">
                  {summary.clientVisibleCount}
                </span>
                <span className="text-muted-foreground">Client visible</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-slate-400 dark:bg-slate-600" />
                <span className="font-semibold tabular-nums">
                  {summary.internalCount}
                </span>
                <span className="text-muted-foreground">Internal</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:min-w-60">
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground whitespace-nowrap">
                <span>Client visibility ratio</span>
                <span className="font-mono tabular-nums">{clientVisiblePercent}%</span>
              </div>
              <ProgressBar value={clientVisiblePercent} color="emerald" />
            </div>
            {uploadButton}
          </div>
        </div>
      </Card>

      {/* Filter & View Controls */}
      <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-card p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Scope Segmented Control: All | Task | Project | Client */}
          <div
            role="group"
            aria-label="Filter by file category"
            className="inline-flex flex-wrap items-center rounded-lg border border-border bg-muted/60 p-0.5"
          >
            {(
              [
                { id: "all", label: "All", count: scopeCounts.all },
                { id: "task", label: "Task", count: scopeCounts.task },
                { id: "project", label: "Project", count: scopeCounts.project },
                { id: "client", label: "Client", count: scopeCounts.client },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setScopeFilter(opt.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer",
                  scopeFilter === opt.id
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span>{opt.label}</span>
                <span className="rounded-full bg-muted px-1.5 font-mono text-[10px] tabular-nums">
                  {opt.count}
                </span>
              </button>
            ))}
          </div>

          {/* Sort & Grid/List View Toggle */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Select
              value={sortField}
              onValueChange={(v) => setSortField(v as FileSortField)}
            >
              <SelectTrigger
                aria-label="Sort files by"
                className="h-8 w-28 text-xs"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="size">Size</SelectItem>
                <SelectItem value="type">Type</SelectItem>
              </SelectContent>
            </Select>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() =>
                    setSortDir((d) => (d === "asc" ? "desc" : "asc"))
                  }
                  aria-label={`Sort direction: ${sortDir === "asc" ? "ascending" : "descending"}`}
                >
                  {sortDir === "asc" ? (
                    <ArrowUpAZ className="size-3.5" />
                  ) : (
                    <ArrowDownAZ className="size-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">
                {sortDir === "asc" ? "Ascending" : "Descending"}
              </TooltipContent>
            </Tooltip>

            <div className="inline-flex items-center rounded-md border border-border bg-muted/50 p-0.5">
              <Button
                type="button"
                variant={filesViewMode === "grid" ? "secondary" : "ghost"}
                size="icon-xs"
                onClick={() => setFilesViewMode("grid")}
                aria-label="Grid view"
                aria-pressed={filesViewMode === "grid"}
                className="h-6.5 w-7"
              >
                <LayoutGrid className="size-3.5" />
              </Button>
              <Button
                type="button"
                variant={filesViewMode === "list" ? "secondary" : "ghost"}
                size="icon-xs"
                onClick={() => setFilesViewMode("list")}
                aria-label="List table view"
                aria-pressed={filesViewMode === "list"}
                className="h-6.5 w-7"
              >
                <List className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Search, Type Filter & Client-visible Filter */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files by filename or note..."
              aria-label="Search files by filename"
              className="h-8 pl-8 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Select
              value={typeFilter}
              onValueChange={(v) => setTypeFilter(v as FileTypeCategory)}
            >
              <SelectTrigger
                aria-label="Filter by file type"
                className="h-8 w-36 text-xs"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="images">Images</SelectItem>
                <SelectItem value="documents">Documents</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant={onlyClientVisible ? "default" : "outline"}
              size="sm"
              onClick={() => setOnlyClientVisible((v) => !v)}
              aria-pressed={onlyClientVisible}
              className="h-8 gap-1.5 text-xs"
            >
              <Eye className="size-3.5" />
              Client visible
            </Button>

            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <FilterX className="size-3.5" />
                Clear filters
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Empty States or Content Sections */}
      {allEntries.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FolderOpen className="size-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">
                {copy.emptyTitle}
              </h3>
              <p className="max-w-md text-xs text-muted-foreground">
                {copy.emptyDescription}
              </p>
            </div>
            {uploadButton}
          </CardContent>
        </Card>
      ) : visibleEntries.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <div className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Search className="size-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">
                No files match your filters
              </h3>
              <p className="text-xs text-muted-foreground">
                Try adjusting your search query, category, file type, or visibility filter.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="gap-1.5"
            >
              <FilterX className="size-3.5" />
              Clear filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {/* Primary Section for Current Scope */}
          {(scopeFilter === "all" || scopeFilter === scope) && (
            <section className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {copy.primaryTitle}
                  </h3>
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    {filteredPrimary.length}
                  </Badge>
                </div>
              </div>

              {filteredPrimary.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/10 p-6 text-center">
                  <p className="text-xs text-muted-foreground">
                    {hasActiveFilters
                      ? `No ${copy.primaryTitle.toLowerCase()} match the active filters.`
                      : copy.emptyTitle}
                  </p>
                  {!hasActiveFilters && uploadButton}
                </div>
              ) : filesViewMode === "grid" ? (
                <FileGrid
                  entries={filteredPrimary}
                  users={users}
                  selectedIds={selectedIds}
                  compact={compact}
                  canDownload={canDownload}
                  canUpload={canUpload}
                  canDelete={canDelete}
                  canManageVisibility={canManageVisibility}
                  hasMoveTargets={hasMoveTargets}
                  onToggleSelect={toggleSelect}
                  onPreview={(f) => setPreviewFileId(f.id)}
                  onDownload={handleDownload}
                  onRename={handleOpenRename}
                  onMove={handleOpenMove}
                  onToggleVisibility={handleRequestVisibilityToggle}
                  onDelete={handleRequestDelete}
                  onOpenTask={onOpenTask}
                />
              ) : (
                <FileTable
                  entries={filteredPrimary}
                  users={users}
                  selectedIds={selectedIds}
                  canDownload={canDownload}
                  canUpload={canUpload}
                  canDelete={canDelete}
                  canManageVisibility={canManageVisibility}
                  hasMoveTargets={hasMoveTargets}
                  onToggleSelect={toggleSelect}
                  onToggleSelectAll={(checked) =>
                    toggleSelectAllInList(filteredPrimary, checked)
                  }
                  onPreview={(f) => setPreviewFileId(f.id)}
                  onDownload={handleDownload}
                  onRename={handleOpenRename}
                  onMove={handleOpenMove}
                  onToggleVisibility={handleRequestVisibilityToggle}
                  onDelete={handleRequestDelete}
                  onOpenTask={onOpenTask}
                />
              )}
            </section>
          )}

          {/* Read-Only Contextual / Aggregated Section */}
          {filteredContext.length > 0 && (
            <section className="space-y-2.5">
              <button
                type="button"
                onClick={() => setContextCollapsed((v) => !v)}
                className="flex w-full items-center justify-between rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-left transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  {contextCollapsed ? (
                    <ChevronRight className="size-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="size-4 text-muted-foreground" />
                  )}
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {copy.contextTitle}
                  </span>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {filteredContext.length}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px]">
                    Read-only
                  </Badge>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {contextCollapsed ? "Show" : "Hide"}
                </span>
              </button>

              {!contextCollapsed &&
                (filesViewMode === "grid" ? (
                  <FileGrid
                    entries={filteredContext}
                    users={users}
                    selectedIds={selectedIds}
                    compact={compact}
                    canDownload={canDownload}
                    canUpload={canUpload}
                    canDelete={canDelete}
                    canManageVisibility={canManageVisibility}
                    hasMoveTargets={() => false}
                    onToggleSelect={toggleSelect}
                    onPreview={(f) => setPreviewFileId(f.id)}
                    onDownload={handleDownload}
                    onRename={handleOpenRename}
                    onMove={handleOpenMove}
                    onToggleVisibility={handleRequestVisibilityToggle}
                    onDelete={handleRequestDelete}
                    onOpenTask={onOpenTask}
                  />
                ) : (
                  <FileTable
                    entries={filteredContext}
                    users={users}
                    selectedIds={selectedIds}
                    canDownload={canDownload}
                    canUpload={canUpload}
                    canDelete={canDelete}
                    canManageVisibility={canManageVisibility}
                    hasMoveTargets={() => false}
                    onToggleSelect={toggleSelect}
                    onToggleSelectAll={(checked) =>
                      toggleSelectAllInList(filteredContext, checked)
                    }
                    onPreview={(f) => setPreviewFileId(f.id)}
                    onDownload={handleDownload}
                    onRename={handleOpenRename}
                    onMove={handleOpenMove}
                    onToggleVisibility={handleRequestVisibilityToggle}
                    onDelete={handleRequestDelete}
                    onOpenTask={onOpenTask}
                  />
                ))}
            </section>
          )}
        </div>
      )}

      {/* Bulk Action Floating Bar */}
      <FileBulkBar
        selectedCount={selectedIds.size}
        writableSelectedCount={writableSelectedIds.length}
        canDownload={canDownload}
        canDelete={canDelete}
        canManageVisibility={canManageVisibility}
        onClearSelection={() => setSelectedIds(new Set())}
        onBulkDownload={handleBulkDownload}
        onBulkSetVisibility={handleBulkSetVisibility}
        onBulkDelete={handleBulkDelete}
      />

      {/* Upload Dialog */}
      <FileUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        destinations={uploadDestinations}
        defaultDestinationKey={defaultDestinationKey}
        canManageVisibility={canManageVisibility}
        currentUserId={activeUserId}
        onUploadComplete={(items) => addFiles(items)}
      />

      {/* Lightbox / Preview Dialog */}
      <FilePreviewDialog
        file={previewEntry?.file ?? null}
        open={Boolean(previewEntry)}
        onOpenChange={(open) => !open && setPreviewFileId(null)}
        imageList={filteredImages}
        onSelectFile={(f) => setPreviewFileId(f.id)}
        users={users}
        canDownload={canDownload}
        canDelete={canDelete}
        canManageVisibility={canManageVisibility}
        isReadOnlyFile={previewEntry?.readOnly ?? false}
        sourceLabel={previewEntry?.sourceBadge}
        onDownload={handleDownload}
        onRequestVisibilityToggle={handleRequestVisibilityToggle}
        onRequestDelete={handleRequestDelete}
      />

      {/* Rename File Dialog */}
      <Dialog
        open={Boolean(renameTarget)}
        onOpenChange={(open) => !open && setRenameTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename File</DialogTitle>
            <DialogDescription>
              Enter an updated display name for {renameTarget?.originalName}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleConfirmRename} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="rename-file-input">Filename</Label>
              <Input
                id="rename-file-input"
                value={renameDraft}
                onChange={(e) => setRenameDraft(e.target.value)}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRenameTarget(null)}
              >
                Cancel
              </Button>
              <Button type="submit">Save Name</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Move File Dialog */}
      <Dialog
        open={Boolean(moveTarget)}
        onOpenChange={(open) => !open && setMoveTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Move File</DialogTitle>
            <DialogDescription>
              Move &ldquo;{moveTarget?.name}&rdquo; to another related destination.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleConfirmMove} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="move-file-dest">Destination</Label>
              <Select value={moveDestKey} onValueChange={setMoveDestKey}>
                <SelectTrigger id="move-file-dest" className="w-full">
                  <SelectValue placeholder="Choose destination" />
                </SelectTrigger>
                <SelectContent>
                  {moveTarget
                    ? getMoveDestinations(moveTarget).map((dest) => (
                        <SelectItem key={dest.key} value={dest.key}>
                          {dest.label} ({dest.badge})
                        </SelectItem>
                      ))
                    : null}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setMoveTarget(null)}
              >
                Cancel
              </Button>
              <Button type="submit">Move File</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Client Visible Confirmation AlertDialog */}
      <AlertDialog
        open={Boolean(visibilityConfirm)}
        onOpenChange={(open) => !open && setVisibilityConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Make file visible to client?</AlertDialogTitle>
            <AlertDialogDescription>
              This file will be visible to the client in the client portal.
              {visibilityConfirm?.fileName
                ? ` (${visibilityConfirm.fileName})`
                : ` (${visibilityConfirm?.ids.length ?? 0} selected files)`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmVisibility}>
              Confirm Client Visible
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog
        open={Boolean(deleteConfirm)}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{deleteConfirm?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleConfirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
