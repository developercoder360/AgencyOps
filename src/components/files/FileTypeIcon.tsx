"use client"

import {
  FileArchive,
  FileCode2,
  FileImage,
  FileSpreadsheet,
  FileText,
  Presentation,
} from "lucide-react"
import { getFileExtension, isImageFileItem, isPdfFileItem } from "@/lib/files/format"
import { cn } from "cn"

interface FileTypeIconProps {
  name: string
  mimeType: string
  className?: string
}

export function FileTypeIcon({ name, mimeType, className }: FileTypeIconProps) {
  const ext = getFileExtension(name)
  const sizeClass = cn("size-5 shrink-0", className)

  if (isImageFileItem({ name, mimeType })) {
    return <FileImage className={cn(sizeClass, "text-blue-600 dark:text-blue-400")} />
  }
  if (isPdfFileItem({ name, mimeType })) {
    return <FileText className={cn(sizeClass, "text-rose-600 dark:text-rose-400")} />
  }
  if (ext === "csv" || ext === "xls" || ext === "xlsx") {
    return (
      <FileSpreadsheet
        className={cn(sizeClass, "text-emerald-600 dark:text-emerald-400")}
      />
    )
  }
  if (ext === "ppt" || ext === "pptx") {
    return (
      <Presentation
        className={cn(sizeClass, "text-orange-600 dark:text-orange-400")}
      />
    )
  }
  if (ext === "zip") {
    return (
      <FileArchive className={cn(sizeClass, "text-amber-600 dark:text-amber-400")} />
    )
  }
  if (ext === "fig" || ext === "psd" || ext === "ai" || ext === "eps") {
    return (
      <FileCode2
        className={cn(sizeClass, "text-violet-600 dark:text-violet-400")}
      />
    )
  }
  return <FileText className={cn(sizeClass, "text-muted-foreground")} />
}
