"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Link2,
  Maximize2,
  Minimize2,
  RotateCcw,
  Trash2,
  ZoomIn,
  ZoomOut,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  formatFileDateTime,
  formatFileSize,
  getFileTypeLabel,
  isImageFileItem,
  isPdfFileItem,
} from "@/lib/files/format"
import type { FileItem } from "@/types/files"
import type { StaffUser } from "@/types"
import { cn } from "cn"
import { FileTypeIcon } from "./FileTypeIcon"
import { FileVisibilityBadge } from "./FileVisibilityBadge"

export interface FilePreviewDialogProps {
  file: FileItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  imageList: FileItem[]
  onSelectFile: (file: FileItem) => void
  users: StaffUser[]
  canDownload: boolean
  canDelete: boolean
  canManageVisibility: boolean
  isReadOnlyFile?: boolean
  sourceLabel?: string
  onDownload: (file: FileItem) => void
  onRequestVisibilityToggle: (file: FileItem, nextVisible: boolean) => void
  onRequestDelete: (file: FileItem) => void
}

const MIN_ZOOM = 0.25
const MAX_ZOOM = 3
const ZOOM_STEP = 0.25

export function FilePreviewDialog(props: FilePreviewDialogProps) {
  if (!props.file) return null
  return (
    <FilePreviewDialogInner
      key={props.file.id}
      {...props}
      file={props.file}
    />
  )
}

function FilePreviewDialogInner({
  file,
  open,
  onOpenChange,
  imageList,
  onSelectFile,
  users,
  canDownload,
  canDelete,
  canManageVisibility,
  isReadOnlyFile = false,
  sourceLabel,
  onDownload,
  onRequestVisibilityToggle,
  onRequestDelete,
}: Omit<FilePreviewDialogProps, "file"> & { file: FileItem }) {
  const [zoom, setZoom] = React.useState(1)
  const [fitToScreen, setFitToScreen] = React.useState(true)
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const stageRef = React.useRef<HTMLDivElement | null>(null)

  const isImage = isImageFileItem(file)
  const isPdf = isPdfFileItem(file)

  const imageIndex = isImage
    ? imageList.findIndex((item) => item.id === file.id)
    : -1
  const prevImage =
    imageIndex > 0 ? imageList[imageIndex - 1] : null
  const nextImage =
    imageIndex >= 0 && imageIndex < imageList.length - 1
      ? imageList[imageIndex + 1]
      : null

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setIsFullscreen(false)
    }
    onOpenChange(nextOpen)
  }

  React.useEffect(() => {
    if (!open || !file) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" && prevImage) {
        e.preventDefault()
        onSelectFile(prevImage)
      } else if (e.key === "ArrowRight" && nextImage) {
        e.preventDefault()
        onSelectFile(nextImage)
      } else if ((e.key === "+" || e.key === "=") && isImage) {
        e.preventDefault()
        setFitToScreen(false)
        setZoom((z) => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2)))
      } else if (e.key === "-" && isImage) {
        e.preventDefault()
        setFitToScreen(false)
        setZoom((z) => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2)))
      } else if (e.key === "0" && isImage) {
        e.preventDefault()
        setZoom(1)
        setFitToScreen(true)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, file, prevImage, nextImage, onSelectFile, isImage])

  async function toggleFullscreen() {
    const el = stageRef.current
    try {
      if (!document.fullscreenElement && el?.requestFullscreen) {
        await el.requestFullscreen()
        setIsFullscreen(true)
      } else if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen()
        setIsFullscreen(false)
      } else {
        setIsFullscreen((v) => !v)
      }
    } catch {
      setIsFullscreen((v) => !v)
    }
  }

  React.useEffect(() => {
    function onFsChange() {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener("fullscreenchange", onFsChange)
    return () => document.removeEventListener("fullscreenchange", onFsChange)
  }, [])

  const uploader = users.find((u) => u.id === file.uploadedBy)
  const uploaderName = uploader?.name || file.uploadedBy || "Unknown User"
  const imageSrc = file.url || file.thumbnailUrl || ""
  const canRenderImage = isImage && Boolean(imageSrc)
  const canRenderPdf =
    isPdf && Boolean(file.url) && (file.url.startsWith("data:") || file.url.startsWith("blob:"))

  function handleCopyLink() {
    if (!file) return
    try {
      const shareUrl = `${window.location.origin}${window.location.pathname}?file=${encodeURIComponent(file.id)}`
      navigator.clipboard.writeText(shareUrl)
      toast.success("File link copied to clipboard")
    } catch {
      toast.error("Unable to copy link")
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "flex flex-col gap-0 overflow-hidden p-0",
          isFullscreen
            ? "h-dvh w-screen max-w-none rounded-none sm:max-w-none"
            : "max-h-[92dvh] w-[95vw] sm:max-w-5xl"
        )}
      >
        <DialogHeader className="flex flex-row items-center justify-between gap-3 border-b border-border px-4 py-3 pr-11">
          <div className="flex min-w-0 items-center gap-2.5">
            <FileTypeIcon name={file.name} mimeType={file.mimeType} />
            <div className="min-w-0">
              <DialogTitle className="truncate text-sm font-semibold">
                {file.name}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {getFileTypeLabel(file.mimeType, file.name)} •{" "}
                {formatFileSize(file.size)}
                {file.width && file.height
                  ? ` • ${file.width} × ${file.height}px`
                  : ""}
              </DialogDescription>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {isImage && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={zoom <= MIN_ZOOM && !fitToScreen}
                      onClick={() => {
                        setFitToScreen(false)
                        setZoom((z) =>
                          Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2))
                        )
                      }}
                      aria-label="Zoom out"
                    >
                      <ZoomOut className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">Zoom out (-)</TooltipContent>
                </Tooltip>

                <span className="min-w-11 text-center font-mono text-[11px] tabular-nums text-muted-foreground">
                  {fitToScreen ? "Fit" : `${Math.round(zoom * 100)}%`}
                </span>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={!fitToScreen && zoom >= MAX_ZOOM}
                      onClick={() => {
                        setFitToScreen(false)
                        setZoom((z) =>
                          Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2))
                        )
                      }}
                      aria-label="Zoom in"
                    >
                      <ZoomIn className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">Zoom in (+)</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant={fitToScreen ? "secondary" : "ghost"}
                      size="icon-sm"
                      onClick={() => {
                        setZoom(1)
                        setFitToScreen(true)
                      }}
                      aria-label="Fit to screen"
                    >
                      <RotateCcw className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">
                    Fit to screen (0)
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={toggleFullscreen}
                      aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                    >
                      {isFullscreen ? (
                        <Minimize2 className="size-4" />
                      ) : (
                        <Maximize2 className="size-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">
                    {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                  </TooltipContent>
                </Tooltip>
              </>
            )}
          </div>
        </DialogHeader>

        {/* Main Viewer Stage */}
        <div
          ref={stageRef}
          className="relative flex min-h-[340px] flex-1 items-center justify-center overflow-auto bg-muted/40 p-4 sm:min-h-[440px]"
        >
          {canRenderImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageSrc}
              alt={file.name}
              style={
                fitToScreen
                  ? undefined
                  : {
                      transform: `scale(${zoom})`,
                      transformOrigin: "center center",
                    }
              }
              className={cn(
                "rounded-md transition-transform duration-150 select-none",
                fitToScreen
                  ? "max-h-[60dvh] max-w-full object-contain"
                  : "max-h-none max-w-none"
              )}
            />
          ) : canRenderPdf ? (
            <div className="flex h-[60dvh] w-full flex-col gap-2">
              <object
                data={file.url}
                type="application/pdf"
                className="h-full w-full rounded-lg border border-border bg-background"
                aria-label={`PDF preview of ${file.name}`}
              >
                <iframe
                  src={file.url}
                  title={file.name}
                  className="h-full w-full rounded-lg border border-border bg-background"
                />
              </object>
            </div>
          ) : (
            <div className="flex max-w-sm flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 text-center shadow-xs">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
                <FileTypeIcon
                  name={file.name}
                  mimeType={file.mimeType}
                  className="size-7"
                />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-semibold text-foreground">
                  {file.name}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isPdf
                    ? "PDF inline preview is unavailable for this cached file session. Download to view locally."
                    : `Preview is not available for ${getFileTypeLabel(file.mimeType, file.name)}.`}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                disabled={!canDownload}
                onClick={() => onDownload(file)}
                className="gap-1.5"
              >
                <Download className="size-3.5" />
                Download File
              </Button>
            </div>
          )}

          {/* Prev / Next Navigation Buttons for Image Gallery */}
          {isImage && imageList.length > 1 && (
            <>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                disabled={!prevImage}
                onClick={() => prevImage && onSelectFile(prevImage)}
                aria-label="Previous image"
                className="absolute top-1/2 left-3 -translate-y-1/2 rounded-full shadow-md"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                disabled={!nextImage}
                onClick={() => nextImage && onSelectFile(nextImage)}
                aria-label="Next image"
                className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full shadow-md"
              >
                <ChevronRight className="size-4" />
              </Button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-background/90 px-2.5 py-0.5 font-mono text-[11px] font-medium shadow-xs ring-1 ring-border">
                {imageIndex + 1} / {imageList.length}
              </div>
            </>
          )}
        </div>

        {/* Metadata Info & Actions Bar */}
        <div className="flex flex-col gap-3 border-t border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
            <Badge variant="outline" className="capitalize text-[11px]">
              {sourceLabel || file.scope}
            </Badge>
            <FileVisibilityBadge
              clientVisible={file.clientVisible}
              canManageVisibility={canManageVisibility}
              showSwitch={!isReadOnlyFile}
              readOnly={isReadOnlyFile}
              onToggle={(next) => onRequestVisibilityToggle(file, next)}
            />
            <span>Uploaded by {uploaderName}</span>
            <span>•</span>
            <span className="tabular-nums">
              {formatFileDateTime(file.uploadedAt)}
            </span>
            {file.note ? (
              <>
                <span>•</span>
                <span className="max-w-xs truncate text-foreground">
                  Note: {file.note}
                </span>
              </>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="gap-1.5"
            >
              <Link2 className="size-3.5" />
              Copy link
            </Button>

            {canRenderPdf && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                asChild
                className="gap-1.5"
              >
                <a href={file.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-3.5" />
                  Open
                </a>
              </Button>
            )}

            {canDownload ? (
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => onDownload(file)}
                className="gap-1.5"
              >
                <Download className="size-3.5" />
                Download
              </Button>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex cursor-not-allowed">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled
                      className="gap-1.5"
                    >
                      <Download className="size-3.5" />
                      Download
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent className="text-xs">
                  Requires <code>files.download</code> permission
                </TooltipContent>
              </Tooltip>
            )}

            {!isReadOnlyFile &&
              (canDelete ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRequestDelete(file)}
                  className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  aria-label={`Delete ${file.name}`}
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </Button>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex cursor-not-allowed">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled
                        className="gap-1.5 text-muted-foreground"
                      >
                        <Trash2 className="size-3.5" />
                        Delete
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">
                    Requires <code>files.delete</code> permission
                  </TooltipContent>
                </Tooltip>
              ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
