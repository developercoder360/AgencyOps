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
    <div className="flex h-full flex-col bg-gradient-to-b from-[#1F63C8] to-[#0B3266] text-white select-none">
      {/* Brand header */}
      <div
        className={cn(
          "flex h-16 shrink-0 items-center border-b border-white/15 px-3",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-2.5 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded-md"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/15 font-bold text-white ring-1 ring-white/25 backdrop-blur-xs">
            AO
          </div>
          {!collapsed ? (
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold tracking-tight text-white">
                AgencyOps
              </div>
              <div className="truncate text-[11px] text-white/70">
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
            className="text-white/80 hover:bg-white/15 hover:text-white"
          >
            <ChevronLeft className="size-4" />
          </Button>
        ) : null}
      </div>

      {/* Expand trigger when collapsed */}
      {onToggleCollapse && collapsed ? (
        <div className="flex justify-center border-b border-white/10 py-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onToggleCollapse}
            aria-label="Expand sidebar"
            className="text-white/80 hover:bg-white/15 hover:text-white"
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
                <div className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-white/55">
                  {group.label}
                </div>
              ) : (
                <div className="mx-auto my-1 h-px w-6 bg-white/15" />
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
                      className={cn(
                        "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
                        collapsed && "justify-center px-0",
                        isActive
                          ? "bg-white/18 font-medium text-white shadow-xs ring-1 ring-white/20"
                          : "text-white/75 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden="true" />
                      {!collapsed ? (
                        <span className="flex-1 truncate">{item.label}</span>
                      ) : null}
                      {!collapsed && showChatBadge ? (
                        <span className="rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold leading-none text-slate-950">
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
      <div className="shrink-0 border-t border-white/15 p-3">
        {!collapsed ? (
          <div className="rounded-lg bg-white/10 px-2.5 py-2 text-xs">
            <div className="text-[10px] uppercase tracking-wider text-white/60">
              Active Demo Role
            </div>
            <div className="truncate font-medium text-white">{role}</div>
          </div>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="mx-auto flex size-8 items-center justify-center rounded-lg bg-white/10 text-[10px] font-bold">
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
