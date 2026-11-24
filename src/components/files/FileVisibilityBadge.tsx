"use client"

import { Eye, Lock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "cn"

interface FileVisibilityBadgeProps {
  clientVisible: boolean
  canManageVisibility?: boolean
  showSwitch?: boolean
  readOnly?: boolean
  onToggle?: (next: boolean) => void
  compact?: boolean
}

export function FileVisibilityBadge({
  clientVisible,
  canManageVisibility = true,
  showSwitch = false,
  readOnly = false,
  onToggle,
  compact = false,
}: FileVisibilityBadgeProps) {
  const badge = (
    <Badge
      variant={clientVisible ? "outline" : "secondary"}
      className={cn(
        "gap-1 font-medium",
        compact ? "h-5 px-1.5 text-[10px]" : "h-5 px-2 text-[11px]",
        clientVisible
          ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300"
          : "text-muted-foreground"
      )}
    >
      {clientVisible ? (
        <Eye className="size-3 shrink-0" aria-hidden="true" />
      ) : (
        <Lock className="size-3 shrink-0" aria-hidden="true" />
      )}
      <span>{clientVisible ? "Client visible" : "Internal"}</span>
    </Badge>
  )

  if (!showSwitch || readOnly || !onToggle) {
    return badge
  }

  const switchEl = (
    <Switch
      size="sm"
      checked={clientVisible}
      disabled={!canManageVisibility}
      onCheckedChange={(checked) => {
        if (!canManageVisibility) return
        onToggle(checked)
      }}
      aria-label={
        canManageVisibility
          ? `Set file visibility (${clientVisible ? "currently client visible" : "currently internal"})`
          : "Client visibility locked (missing files.manage_visibility permission)"
      }
    />
  )

  return (
    <div className="inline-flex items-center gap-2">
      {badge}
      {!canManageVisibility ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex cursor-not-allowed">{switchEl}</span>
          </TooltipTrigger>
          <TooltipContent className="text-xs">
            Requires <code>files.manage_visibility</code> permission
          </TooltipContent>
        </Tooltip>
      ) : (
        switchEl
      )}
    </div>
  )
}
