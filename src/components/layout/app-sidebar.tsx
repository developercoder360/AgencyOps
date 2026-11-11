"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  CalendarHeart,
  CalendarOff,
  CalendarRange,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  CreditCard,
  Download,
  FileText,
  FolderKanban,
  HeartHandshake,
  LayoutDashboard,
  MapPin,
  Megaphone,
  MessageSquare,
  Scale,
  Settings,
  ShieldCheck,
  Sparkles,
  Tags,
  Timer,
  UserPlus,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react"
import { cn } from "cn"
import { useAppState } from "@/components/providers/app-state-provider"
import { canAccessModule, SIDEBAR_GROUPS } from "@/lib/permissions"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Sparkles,
  UserPlus,
  ClipboardList,
  FileText,
  CreditCard,
  Megaphone,
  FolderKanban,
  CheckSquare,
  MessageSquare,
  HeartHandshake,
  Clock,
  CalendarRange,
  Scale,
  CalendarOff,
  Tags,
  Timer,
  CalendarHeart,
  Users,
  UsersRound,
  MapPin,
  Download,
  Settings,
  ShieldCheck,
}

interface SidebarContentProps {
  collapsed?: boolean
  onToggleCollapse?: () => void
  onNavigate?: () => void
}

export function SidebarContent({
  collapsed = false,
  onToggleCollapse,
  onNavigate,
}: SidebarContentProps) {
  const pathname = usePathname()
  const { role, unreadMessagesCount } = useAppState()

  const visibleGroups = React.useMemo(
    () =>
      SIDEBAR_GROUPS.map((group) => ({
        ...group,
        items: group.items.filter((item) => canAccessModule(role, item.module)),
      })).filter((group) => group.items.length > 0),
    [role]
  )

  return (
    <div className="flex h-full flex-col [background:var(--sidebar-bg)] text-(--sidebar-ink) select-none">
      {/* Brand header */}
      <div
        className={cn(
          "flex h-16 shrink-0 items-center border-b border-(--sidebar-divider) px-3",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-2.5 overflow-hidden rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--sidebar-focus-ring)"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-(--radius-control) [background:var(--sidebar-logo-bg)] font-bold text-(--brand-mark-fg) ring-1 ring-(--sidebar-logo-ring)">
            AO
          </div>
          {!collapsed ? (
            <div className="min-w-0">
              <div className="font-display truncate text-sm font-semibold tracking-tight text-(--sidebar-ink)">
                AgencyOps
              </div>
              <div className="truncate text-[11px] text-(--sidebar-ink-muted)">
                Multi-Brand CRM
              </div>
            </div>
          ) : null}
        </Link>

        {onToggleCollapse && !collapsed ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onToggleCollapse}
            aria-label="Collapse sidebar"
            className="text-(--sidebar-item-fg) hover:bg-(--sidebar-item-hover-bg) hover:text-(--sidebar-item-hover-fg)"
          >
            <ChevronLeft className="size-4" />
          </Button>
        ) : null}
      </div>

      {/* Expand trigger when collapsed */}
      {onToggleCollapse && collapsed ? (
        <div className="flex justify-center border-b border-(--sidebar-divider) py-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onToggleCollapse}
            aria-label="Expand sidebar"
            className="text-(--sidebar-item-fg) hover:bg-(--sidebar-item-hover-bg) hover:text-(--sidebar-item-hover-fg)"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      ) : null}

      {/* Navigation groups */}
      <ScrollArea className="flex-1 min-h-0 px-2.5 py-3">
        <nav aria-label="Primary navigation" className="space-y-5 pb-4">
          {visibleGroups.map((group) => (
            <div key={group.id} className="space-y-1">
              {!collapsed ? (
                <div className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-(--sidebar-ink-muted)">
                  {group.label}
                </div>
              ) : (
                <div className="mx-auto my-1 h-px w-6 bg-(--sidebar-divider)" />
              )}

              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = ICON_MAP[item.iconName] ?? LayoutDashboard
                  const isActive =
                    item.href === "/settings"
                      ? pathname === "/settings"
                      : pathname === item.href ||
                        pathname.startsWith(`${item.href}/`)
                  const showChatBadge =
                    item.href === "/chats" && unreadMessagesCount > 0

                  const linkEl = (
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={isActive ? "page" : undefined}
                      data-active={isActive ? "true" : undefined}
                      className={cn(
                        "group relative flex items-center gap-2.5 rounded-(--radius-control) px-2.5 py-2 text-sm transition-[background-color,color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--sidebar-focus-ring)",
                        collapsed && "justify-center px-0",
                        isActive
                          ? "bg-(--sidebar-item-active-bg) font-medium text-(--sidebar-item-active-fg) ring-1 ring-(--sidebar-item-active-ring)"
                          : "text-(--sidebar-item-fg) hover:bg-(--sidebar-item-hover-bg) hover:text-(--sidebar-item-hover-fg)"
                      )}
                    >
                      {isActive && !collapsed ? (
                        <span
                          aria-hidden="true"
                          className="absolute top-1.5 bottom-1.5 left-0 w-[3px] rounded-full bg-(--sidebar-item-active-bar)"
                        />
                      ) : null}
                      <Icon className="size-4 shrink-0" aria-hidden="true" />
                      {!collapsed ? (
                        <span className="flex-1 truncate">{item.label}</span>
                      ) : null}
                      {!collapsed && showChatBadge ? (
                        <span className="rounded-full bg-(--sidebar-badge-bg) px-1.5 py-0.5 text-[10px] font-bold leading-none text-(--sidebar-badge-fg)">
                          {unreadMessagesCount}
                        </span>
                      ) : null}
                    </Link>
                  )

                  return (
                    <li key={item.href}>
                      {collapsed ? (
                        <Tooltip>
                          <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
                          <TooltipContent side="right" className="text-xs">
                            {item.label}
                            {showChatBadge
                              ? ` (${unreadMessagesCount} unread)`
                              : ""}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        linkEl
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Active role footer */}
      <div className="shrink-0 border-t border-(--sidebar-divider) p-3">
        {!collapsed ? (
          <div className="rounded-(--radius-control) bg-(--sidebar-footer-bg) px-2.5 py-2 text-xs">
            <div className="text-[10px] uppercase tracking-wider text-(--sidebar-ink-muted)">
              Active Demo Role
            </div>
            <div className="truncate font-medium text-(--sidebar-ink)">
              {role}
            </div>
          </div>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="mx-auto flex size-8 items-center justify-center rounded-(--radius-control) bg-(--sidebar-footer-bg) text-[10px] font-bold text-(--sidebar-ink)">
                {role
                  .split(/[\s/]+/)
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)}
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              Role: {role}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  )
}
