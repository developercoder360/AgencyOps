"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  FolderUp,
  Lock,
  MessageSquarePlus,
  RotateCw,
  Upload,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatFileSize, isImageFileItem } from "@/lib/files/format"
import {
  ACCEPTED_FILE_INPUT,
  MAX_FILE_SIZE_BYTES,
  processUploadedFile,
  resolveMimeType,
  validateUploadFile,
} from "@/lib/files/validators"
import type { FileItem, FileScope } from "@/types/files"
import { cn } from "cn"
import { FileTypeIcon } from "./FileTypeIcon"

export interface UploadDestinationOption {
  key: string
  scope: FileScope
  scopeId: string
  label: string
  badge?: string
  taskId?: string
  projectId?: string
  clientId?: string
}

interface StagedUploadItem {
  localId: string
  file: File
  name: string
  mimeType: string
  size: number
  isImage: boolean
  previewObjectUrl?: string
  error?: string
  note: string
  noteExpanded: boolean
  clientVisibleOverride: boolean | null
  progress: number
  status: "ready" | "uploading" | "done" | "failed"
  uploadError?: string
}

export interface FileUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  destinations: UploadDestinationOption[]
  defaultDestinationKey: string
  canManageVisibility: boolean
  currentUserId: string
  onUploadComplete: (items: FileItem[]) => void
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function FileUploadDialog(props: FileUploadDialogProps) {
  if (!props.open) return null
  return <FileUploadDialogInner {...props} />
}

function FileUploadDialogInner({
  open,
  onOpenChange,
  destinations,
  defaultDestinationKey,
  canManageVisibility,
  currentUserId,
  onUploadComplete,
}: FileUploadDialogProps) {
  const [staged, setStaged] = React.useState<StagedUploadItem[]>([])
  const [dragging, setDragging] = React.useState(false)
  const [destinationKey, setDestinationKey] = React.useState(defaultDestinationKey)
  const [modalClientVisible, setModalClientVisible] = React.useState(false)
  const [isUploading, setIsUploading] = React.useState(false)

  const fileInputRef = React.useRef<HTMLInputElement | null>(null)
  const trackedObjectUrlsRef = React.useRef<Set<string>>(new Set())

  const revokeUrl = React.useCallback((url?: string) => {
    if (!url) return
    URL.revokeObjectURL(url)
    trackedObjectUrlsRef.current.delete(url)
  }, [])

  const revokeStagedUrls = React.useCallback(
    (items: StagedUploadItem[]) => {
      for (const item of items) {
        revokeUrl(item.previewObjectUrl)
      }
    },
    [revokeUrl]
  )

  // Clean up all staging object URLs when modal closes/unmounts
  React.useEffect(() => {
    const urls = trackedObjectUrlsRef.current
    return () => {
      for (const url of urls) {
        URL.revokeObjectURL(url)
      }
      urls.clear()
    }
  }, [])

  const appendBrowserFiles = React.useCallback((fileList: File[]) => {
    if (fileList.length === 0) return

    const nextItems: StagedUploadItem[] = fileList.map((file, idx) => {
      const mimeType = resolveMimeType(file)
      const isImage = isImageFileItem({ name: file.name, mimeType })
      const validation = validateUploadFile(file, MAX_FILE_SIZE_BYTES)
      const previewObjectUrl =
        isImage && validation.valid ? URL.createObjectURL(file) : undefined
      if (previewObjectUrl) {
        trackedObjectUrlsRef.current.add(previewObjectUrl)
      }

      return {
        localId: `stg-${crypto.randomUUID().slice(0, 8)}-${idx}`,
        file,
        name: file.name,
        mimeType,
        size: file.size,
        isImage,
        previewObjectUrl,
        error: validation.valid ? undefined : validation.error,
        note: "",
        noteExpanded: false,
        clientVisibleOverride: null,
        progress: 0,
        status: "ready",
      }
    })

    setStaged((prev) => [...prev, ...nextItems])
  }, [])

  // Paste-from-clipboard support for images while the modal is open
  React.useEffect(() => {
    if (!open) return

    function handlePaste(e: ClipboardEvent) {
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA") &&
        !e.clipboardData?.files?.length
      ) {
        return
      }

      const items = e.clipboardData?.items
      if (!items) return

      const pastedFiles: File[] = []
      for (const item of Array.from(items)) {
        if (item.kind === "file") {
          const blob = item.getAsFile()
          if (blob) {
            const ext = blob.type.split("/")[1]?.replace("svg+xml", "svg") || "png"
            const filename =
              blob.name && blob.name !== "image.png"
                ? blob.name
                : `pasted-image-${new Date().toISOString().slice(11, 19).replace(/:/g, "")}.${ext}`
            pastedFiles.push(
              new File([blob], filename, { type: blob.type || "image/png" })
            )
          }
        }
      }

      if (pastedFiles.length > 0) {
        e.preventDefault()
        appendBrowserFiles(pastedFiles)
        toast.success(
          pastedFiles.length === 1
            ? `Pasted ${pastedFiles[0].name} from clipboard`
            : `Pasted ${pastedFiles.length} files from clipboard`
        )
      }
    }

    window.addEventListener("paste", handlePaste)
    return () => window.removeEventListener("paste", handlePaste)
  }, [open, appendBrowserFiles])

  function handleRemoveStaged(localId: string) {
    setStaged((prev) => {
      const target = prev.find((i) => i.localId === localId)
      if (target?.previewObjectUrl) {
        revokeUrl(target.previewObjectUrl)
      }
      return prev.filter((i) => i.localId !== localId)
    })
  }

  function updateStagedItem(
    localId: string,
    patch: Partial<StagedUploadItem>
  ) {
    setStaged((prev) =>
      prev.map((item) =>
        item.localId === localId ? { ...item, ...patch } : item
      )
    )
  }

  const activeDestination =
    destinations.find((d) => d.key === destinationKey) ?? destinations[0]

  const validItems = staged.filter((item) => !item.error && item.status !== "done")
  const uploadableCount = validItems.length

  const overallProgress = React.useMemo(() => {
    const candidates = staged.filter((i) => !i.error)
    if (candidates.length === 0) return 0
    const total = candidates.reduce((sum, i) => sum + i.progress, 0)
    return Math.round(total / candidates.length)
  }, [staged])

  async function processQueue(itemsToUpload: StagedUploadItem[]) {
    if (!activeDestination || itemsToUpload.length === 0) return

    setIsUploading(true)
    const createdFiles: FileItem[] = []
    const failedIds = new Set<string>()

    for (const item of itemsToUpload) {
      updateStagedItem(item.localId, {
        status: "uploading",
        progress: 25,
        uploadError: undefined,
      })
      await wait(90)

      try {
        updateStagedItem(item.localId, { progress: 65 })
        const asset = await processUploadedFile(item.file)
        await wait(90)

        const resolvedVisible = canManageVisibility
          ? item.clientVisibleOverride !== null
            ? item.clientVisibleOverride
            : modalClientVisible
          : false

        const finalName = item.name.trim() || item.file.name

        const fileItem: FileItem = {
          id: `fil-${crypto.randomUUID().slice(0, 8)}`,
          name: finalName,
          originalName: item.file.name,
          mimeType: item.mimeType,
          size: item.size,
          scope: activeDestination.scope,
          scopeId: activeDestination.scopeId,
          taskId: activeDestination.taskId,
          projectId: activeDestination.projectId,
          clientId: activeDestination.clientId,
          clientVisible: resolvedVisible,
          note: item.note.trim() || undefined,
          url: asset.url,
          thumbnailUrl: asset.thumbnailUrl,
          width: asset.width,
          height: asset.height,
          uploadedBy: currentUserId,
          uploadedAt: new Date().toISOString(),
        }

        createdFiles.push(fileItem)
        updateStagedItem(item.localId, { progress: 100, status: "done" })
      } catch (err) {
        failedIds.add(item.localId)
        updateStagedItem(item.localId, {
          status: "failed",
          progress: 0,
          uploadError:
            err instanceof Error ? err.message : "Failed to process file.",
        })
      }
    }

    if (createdFiles.length > 0) {
      onUploadComplete(createdFiles)
      toast.success(
        createdFiles.length === 1
          ? `Uploaded "${createdFiles[0].name}"`
          : `Uploaded ${createdFiles.length} files to ${activeDestination.label}`
      )
    }

    setIsUploading(false)

    // Close modal automatically only if nothing failed and nothing invalid left behind,
    // otherwise remove completed items and keep failed/invalid rows so user can Retry or inspect
    const hasFailed = failedIds.size > 0
    if (!hasFailed) {
      onOpenChange(false)
    } else {
      setStaged((prev) => {
        const doneItems = prev.filter((p) => p.status === "done")
        revokeStagedUrls(doneItems)
        return prev.filter((p) => p.status !== "done")
      })
      toast.error("Some files failed to upload. You can retry them below.")
    }
  }

  function handleUploadAll() {
    const queue = staged.filter((i) => !i.error && i.status !== "done")
    if (queue.length === 0) return
    void processQueue(queue)
  }

  function handleRetryOne(item: StagedUploadItem) {
    void processQueue([item])
  }

  const destinationLocked = destinations.length <= 1

  return (
    <Dialog open={open} onOpenChange={(next) => !isUploading && onOpenChange(next)}>
      <DialogContent className="flex max-h-[90dvh] flex-col gap-0 p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base">
            <FolderUp className="size-4 text-primary" />
            Upload Files
          </DialogTitle>
          <DialogDescription>
            Drag &amp; drop, browse multiple files, or paste images directly with{" "}
            <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
              Ctrl+V
            </kbd>
            . Max {formatFileSize(MAX_FILE_SIZE_BYTES)} per file.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {/* Destination & Modal-level Visibility Controls */}
          <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-muted/20 p-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="upload-destination" className="text-xs font-medium">
                Destination
              </Label>
              {destinationLocked ? (
                <div className="flex h-8 items-center gap-2 rounded-md border border-border bg-background/70 px-2.5 text-xs">
                  <Lock className="size-3 shrink-0 text-muted-foreground" />
                  <span className="truncate font-medium">
                    {activeDestination?.label ?? "Current Scope"}
                  </span>
                  {activeDestination?.badge ? (
                    <Badge variant="secondary" className="ml-auto text-[10px]">
                      {activeDestination.badge}
                    </Badge>
                  ) : null}
                </div>
              ) : (
                <Select
                  value={destinationKey}
                  onValueChange={setDestinationKey}
                  disabled={isUploading}
                >
                  <SelectTrigger id="upload-destination" className="h-8 w-full text-xs">
                    <SelectValue placeholder="Choose destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {destinations.map((dest) => (
                      <SelectItem key={dest.key} value={dest.key}>
                        <span className="flex items-center gap-2">
                          <span className="truncate">{dest.label}</span>
                          {dest.badge ? (
                            <Badge variant="outline" className="text-[10px]">
                              {dest.badge}
                            </Badge>
                          ) : null}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-background/60 px-3 py-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-medium">
                  {modalClientVisible && canManageVisibility ? (
                    <Eye className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Lock className="size-3.5 text-muted-foreground" />
                  )}
                  <span>Client visible</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {canManageVisibility
                    ? "Applies to all queued files (override per file below)"
                    : "Requires files.manage_visibility permission"}
                </p>
              </div>
              {!canManageVisibility ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex cursor-not-allowed">
                      <Switch
                        checked={false}
                        disabled
                        aria-label="Client visible toggle disabled"
                      />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">
                    Requires <code>files.manage_visibility</code> permission
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Switch
                  checked={modalClientVisible}
                  disabled={isUploading}
                  onCheckedChange={setModalClientVisible}
                  aria-label="Apply client visible to all staged files"
                />
              )}
            </div>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragEnter={(e) => {
              e.preventDefault()
              if (!isUploading) setDragging(true)
            }}
            onDragOver={(e) => {
              e.preventDefault()
              if (!isUploading) setDragging(true)
            }}
            onDragLeave={(e) => {
              e.preventDefault()
              setDragging(false)
            }}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              if (isUploading) return
              const dropped = Array.from(e.dataTransfer.files || [])
              appendBrowserFiles(dropped)
            }}
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-5 text-center transition-colors",
              dragging
                ? "border-primary bg-primary/10"
                : "border-border bg-muted/15 hover:border-primary/40 hover:bg-muted/25"
            )}
          >
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Upload className="size-5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-foreground">
                {staged.length > 0
                  ? "Drop more files to add to queue"
                  : "Drag and drop files here"}
              </p>
              <p className="text-xs text-muted-foreground">
                Images, PDF, Office docs, ZIP, TXT, CSV, AI, PSD, EPS, FIG
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="mt-1 gap-1.5"
            >
              <Upload className="size-3.5" />
              Browse files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_FILE_INPUT}
              className="sr-only"
              onChange={(e) => {
                const selected = Array.from(e.target.files || [])
                appendBrowserFiles(selected)
                e.target.value = ""
              }}
            />
          </div>

          {/* Selected / Validated Files List */}
          {staged.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Selected files ({staged.length} total • {uploadableCount} valid)
                </span>
                {!isUploading && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    className="h-6 text-[11px] text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      revokeStagedUrls(staged)
                      setStaged([])
                    }}
                  >
                    Clear list
                  </Button>
                )}
              </div>

              <ScrollArea className="max-h-64 pr-1">
                <div className="space-y-2">
                  {staged.map((item) => {
                    const effectiveVisible = canManageVisibility
                      ? item.clientVisibleOverride !== null
                        ? item.clientVisibleOverride
                        : modalClientVisible
                      : false

                    return (
                      <div
                        key={item.localId}
                        className={cn(
                          "rounded-lg border p-2.5 transition-colors",
                          item.error || item.status === "failed"
                            ? "border-destructive/50 bg-destructive/5"
                            : "border-border bg-card"
                        )}
                      >
                        <div className="flex items-start gap-2.5">
                          {/* Thumbnail or Icon */}
                          <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted/40">
                            {item.isImage && item.previewObjectUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.previewObjectUrl}
                                alt={item.name}
                                className="size-full object-cover"
                              />
                            ) : (
                              <FileTypeIcon
                                name={item.name}
                                mimeType={item.mimeType}
                              />
                            )}
                          </div>

                          {/* Editable Filename + Size + Errors */}
                          <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="flex items-center gap-2">
                              <Input
                                value={item.name}
                                disabled={isUploading || Boolean(item.error) || item.status === "done"}
                                onChange={(e) =>
                                  updateStagedItem(item.localId, {
                                    name: e.target.value,
                                  })
                                }
                                aria-label={`Filename for ${item.file.name}`}
                                className="h-7 text-xs font-medium"
                              />
                              <span className="shrink-0 font-mono text-[11px] text-muted-foreground tabular-nums">
                                {formatFileSize(item.size)}
                              </span>
                            </div>

                            {item.error ? (
                              <div className="flex items-center gap-1.5 text-[11px] text-destructive">
                                <AlertCircle className="size-3.5 shrink-0" />
                                <span>{item.error}</span>
                              </div>
                            ) : null}

                            {item.status === "failed" && item.uploadError ? (
                              <div className="flex items-center justify-between gap-2 text-[11px] text-destructive">
                                <span className="flex items-center gap-1">
                                  <AlertCircle className="size-3.5 shrink-0" />
                                  {item.uploadError}
                                </span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="xs"
                                  onClick={() => handleRetryOne(item)}
                                  className="h-6 gap-1 text-[11px]"
                                >
                                  <RotateCw className="size-3" />
                                  Retry
                                </Button>
                              </div>
                            ) : null}

                            {/* Per-file progress bar during upload */}
                            {!item.error &&
                            (item.status === "uploading" || item.status === "done") ? (
                              <div className="space-y-0.5">
                                <Progress value={item.progress} className="h-1.5" />
                                <div className="text-right font-mono text-[10px] text-muted-foreground">
                                  {item.progress}%
                                </div>
                              </div>
                            ) : null}

                            {/* Optional collapsible description/note */}
                            {!item.error && item.noteExpanded ? (
                              <Textarea
                                value={item.note}
                                disabled={isUploading}
                                onChange={(e) =>
                                  updateStagedItem(item.localId, {
                                    note: e.target.value,
                                  })
                                }
                                placeholder="Add optional description or delivery note..."
                                rows={2}
                                className="min-h-14 text-xs"
                              />
                            ) : null}
                          </div>

                          {/* Row Controls: Visibility Eye Override, Note Toggle, Remove */}
                          <div className="flex shrink-0 items-center gap-1">
                            {!item.error && (
                              <>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon-xs"
                                      disabled={!canManageVisibility || isUploading}
                                      onClick={() =>
                                        updateStagedItem(item.localId, {
                                          clientVisibleOverride: !effectiveVisible,
                                        })
                                      }
                                      aria-label={`Toggle client visibility for ${item.name}`}
                                      className={cn(
                                        effectiveVisible
                                          ? "text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                                          : "text-muted-foreground"
                                      )}
                                    >
                                      {effectiveVisible ? (
                                        <Eye className="size-3.5" />
                                      ) : (
                                        <Lock className="size-3.5" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent className="text-xs">
                                    {canManageVisibility
                                      ? effectiveVisible
                                        ? "Client visible (click to make internal)"
                                        : "Internal only (click to make client visible)"
                                      : "Requires files.manage_visibility permission"}
                                  </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon-xs"
                                      disabled={isUploading}
                                      onClick={() =>
                                        updateStagedItem(item.localId, {
                                          noteExpanded: !item.noteExpanded,
                                        })
                                      }
                                      aria-label={`Toggle note for ${item.name}`}
                                      className={cn(
                                        item.note.trim()
                                          ? "text-primary"
                                          : "text-muted-foreground"
                                      )}
                                    >
                                      <MessageSquarePlus className="size-3.5" />
                                      {item.noteExpanded ? (
                                        <ChevronUp className="sr-only" />
                                      ) : (
                                        <ChevronDown className="sr-only" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent className="text-xs">
                                    {item.noteExpanded
                                      ? "Hide description/note"
                                      : "Add description/note"}
                                  </TooltipContent>
                                </Tooltip>
                              </>
                            )}

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              disabled={isUploading}
                              onClick={() => handleRemoveStaged(item.localId)}
                              aria-label={`Remove ${item.name}`}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <X className="size-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter className="mx-0 mb-0 rounded-b-xl border-t border-border bg-muted/40 px-5 py-3 sm:items-center sm:justify-between">
          <div className="w-full sm:w-44">
            {isUploading ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Uploading...</span>
                  <span className="font-mono tabular-nums">{overallProgress}%</span>
                </div>
                <Progress value={overallProgress} className="h-1.5" />
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isUploading}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={uploadableCount === 0 || isUploading}
              onClick={handleUploadAll}
              className="gap-1.5"
            >
              <Upload className="size-3.5" />
              {isUploading
                ? "Uploading..."
                : `Upload ${uploadableCount} file${uploadableCount === 1 ? "" : "s"}`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
