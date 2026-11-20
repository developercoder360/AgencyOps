"use client"

import * as React from "react"
import {
  ChevronDown,
  ChevronRight,
  FileArchive,
  FileCode2,
  FileImage,
  FileSpreadsheet,
  FileText,
  Paperclip,
  Trash2,
  Upload,
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
import type { AttachmentFile } from "@/types"
import { cn } from "cn"

interface TaskAttachmentsProps {
  files: AttachmentFile[]
  canUpload: boolean
  canDelete: boolean
  onUploadFiles: (
    files: { name: string; size: string; type: string; previewUrl?: string }[]
  ) => void
  onRemoveFile: (fileId: string) => void
}

function isImageFile(file: AttachmentFile): boolean {
  return (
    file.type.startsWith("image/") ||
    /\.(png|jpe?g|gif|webp|svg)$/i.test(file.name)
  )
}

function FileTypeIcon({ file }: { file: AttachmentFile }) {
  if (isImageFile(file)) {
    return <FileImage className="size-5 text-primary" />
  }
  if (/\.pdf$/i.test(file.name) || file.type.includes("pdf")) {
    return <FileText className="size-5 text-rose-600 dark:text-rose-400" />
  }
  if (/\.(csv|xlsx?|xls)$/i.test(file.name)) {
    return (
      <FileSpreadsheet className="size-5 text-emerald-600 dark:text-emerald-400" />
    )
  }
  if (/\.(zip|rar|tar|gz)$/i.test(file.name)) {
    return <FileArchive className="size-5 text-amber-600 dark:text-amber-400" />
  }
  if (/\.(tsx?|jsx?|json|css|html)$/i.test(file.name)) {
    return <FileCode2 className="size-5 text-violet-600 dark:text-violet-400" />
  }
  return <FileText className="size-5 text-muted-foreground" />
}

export function TaskAttachments({
  files,
  canUpload,
  canDelete,
  onUploadFiles,
  onRemoveFile,
}: TaskAttachmentsProps) {
  const [dragging, setDragging] = React.useState(false)
  const [collapsed, setCollapsed] = React.useState(false)
  const [previewFile, setPreviewFile] = React.useState<AttachmentFile | null>(
    null
  )
  const inputRef = React.useRef<HTMLInputElement | null>(null)

  function processFileList(list: FileList | null) {
    if (!list || list.length === 0) return
    const arr = Array.from(list)
    const pending = arr.map(
      (file) =>
        new Promise<{
          name: string
          size: string
          type: string
          previewUrl?: string
        }>((resolve) => {
          const sizeStr =
            file.size >= 1024 * 1024
              ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
              : `${Math.max(1, Math.round(file.size / 1024))} KB`
          if (file.type.startsWith("image/") && file.size < 1.5 * 1024 * 1024) {
            const reader = new FileReader()
            reader.onload = () => {
              resolve({
                name: file.name,
                size: sizeStr,
                type: file.type || "image/png",
                previewUrl:
                  typeof reader.result === "string" ? reader.result : undefined,
              })
            }
            reader.onerror = () => {
              resolve({
                name: file.name,
                size: sizeStr,
                type: file.type || "application/octet-stream",
              })
            }
            reader.readAsDataURL(file)
          } else {
            resolve({
              name: file.name,
              size: sizeStr,
              type: file.type || "application/octet-stream",
            })
          }
        })
    )
    Promise.all(pending).then((results) => {
      onUploadFiles(results)
    })
  }

  return (
    <section aria-label="Attachments and evidence" className="space-y-2.5">
      <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2">
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="flex items-center gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          {collapsed ? (
            <ChevronRight className="size-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-3.5 text-muted-foreground" />
          )}
          <h3 className="text-[13px] font-semibold text-foreground">
            Attachments & Evidence
          </h3>
          <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[11px] font-medium tabular-nums text-muted-foreground">
            {files.length}
          </span>
        </button>
        {canUpload ? (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => inputRef.current?.click()}
            className="gap-1 text-xs text-primary hover:text-primary"
          >
            <Upload className="size-3.5" />
            Upload
          </Button>
        ) : null}
        <input
          ref={inputRef}
          type="file"
          multiple
          className="sr-only"
          onChange={(e) => {
            processFileList(e.target.files)
            e.target.value = ""
          }}
        />
      </div>

      {!collapsed && (
        <>
          {/* File Grid or Empty State */}
          {files.length === 0 ? (
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragging(false)
                processFileList(e.dataTransfer.files)
              }}
              onClick={() => canUpload && inputRef.current?.click()}
              className={cn(
                "flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-2 text-xs transition-colors",
                dragging
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-muted/10 text-muted-foreground hover:bg-muted/20 hover:text-foreground"
              )}
            >
              <Upload className="size-3.5 shrink-0" />
              <span>No attachments yet. Drop files or click to upload.</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {files.map((file) => {
                const isImg = isImageFile(file)
                return (
                  <div
                    key={file.id}
                    className="group relative flex flex-col rounded-lg border border-border bg-card p-2 transition-colors hover:border-primary/40 hover:bg-muted/20"
                  >
                    <button
                      type="button"
                      onClick={() => setPreviewFile(file)}
                      aria-label={`Preview ${file.name}`}
                      className="flex flex-col items-center gap-1.5 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <div className="flex h-[76px] w-full items-center justify-center overflow-hidden rounded-md border border-border bg-muted/40">
                        {isImg && file.previewUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={file.previewUrl}
                            alt={file.name}
                            className="size-full object-cover"
                          />
                        ) : (
                          <FileTypeIcon file={file} />
                        )}
                      </div>
                      <div className="w-full min-w-0">
                        <div
                          className="truncate text-xs font-medium text-foreground"
                          title={file.name}
                        >
                          {file.name}
                        </div>
                        <div className="text-[10px] tabular-nums text-muted-foreground">
                          {file.size}
                        </div>
                      </div>
                    </button>
                    {canDelete ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => onRemoveFile(file.id)}
                        aria-label={`Remove ${file.name}`}
                        className="absolute top-1 right-1 size-5 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100"
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}

          {/* Drag-and-drop upload zone when files exist */}
          {canUpload && files.length > 0 ? (
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragging(false)
                processFileList(e.dataTransfer.files)
              }}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-2 text-xs transition-colors",
                dragging
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-muted/15 text-muted-foreground"
              )}
            >
              <Upload className="size-3.5 shrink-0" />
              <span>
                Drop files here or{" "}
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="font-medium text-primary underline underline-offset-2 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  browse
                </button>
              </span>
            </div>
          ) : null}
        </>
      )}

      {/* File / Image Preview Dialog */}
      <Dialog
        open={Boolean(previewFile)}
        onOpenChange={(open) => !open && setPreviewFile(null)}
      >
        <DialogContent className="sm:max-w-lg">
          {previewFile ? (
            <>
              <DialogHeader>
                <DialogTitle className="truncate pr-6 text-sm font-semibold">
                  {previewFile.name}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {previewFile.size} • Uploaded by {previewFile.uploadedBy} on{" "}
                  {previewFile.uploadedAt}
                </DialogDescription>
              </DialogHeader>
              <div className="overflow-hidden rounded-lg border border-border bg-muted/30">
                {previewFile.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewFile.previewUrl}
                    alt={previewFile.name}
                    className="max-h-[360px] w-full object-contain bg-background"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 p-10 text-center">
                    <div className="flex size-14 items-center justify-center rounded-xl border border-border bg-card shadow-2xs">
                      <FileTypeIcon file={previewFile} />
                    </div>
                    <div className="space-y-1">
                      <Badge variant="outline" className="font-mono text-[11px]">
                        {previewFile.type || "attachment"}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        Simulated preview for stored mockup attachment. Upload a
                        local image to inspect live thumbnail rendering.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  )
}
