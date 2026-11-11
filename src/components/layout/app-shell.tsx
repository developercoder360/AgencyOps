"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowLeft, ShieldAlert } from "lucide-react"
import { SidebarContent } from "./app-sidebar"
import { AppTopbar } from "./app-topbar"
import { AppBreadcrumbs } from "./app-breadcrumbs"
import { useAppState } from "@/components/providers/app-state-provider"
import { canAccessModule, getModuleForPathname } from "@/lib/permissions"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { cn } from "cn"

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const pathname = usePathname()
  const { role } = useAppState()

  const requiredModule = getModuleForPathname(pathname)
  const hasAccess = !requiredModule || canAccessModule(role, requiredModule)

  return (
    <div className="flex min-h-screen w-full bg-(--shell-bg)">
      {/* Desktop collapsible sidebar */}
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 border-r border-(--sidebar-shell-border) transition-[width] duration-150 lg:block",
          collapsed ? "w-[68px]" : "w-64"
        )}
      >
        <SidebarContent
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((c) => !c)}
        />
      </aside>

      {/* Mobile Sheet sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-64 border-r border-(--sidebar-shell-border) p-0"
        >
          <SheetTitle className="sr-only">Navigation menu</SheetTitle>
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main content area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar onOpenMobileSidebar={() => setMobileOpen(true)} />
        <main className="flex-1 min-w-0 px-3 py-5 sm:px-6 [[data-theme=studio]_&]:lg:px-8 [[data-theme=studio]_&]:lg:py-6">
          <div className="mx-auto w-full max-w-[1440px]">
            <AppBreadcrumbs />
            {hasAccess ? (
              children
            ) : (
              <Card className="mx-auto mt-8 max-w-lg text-center">
                <CardHeader className="justify-items-center text-center">
                  <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-(--tone-rose-bg) text-(--tone-rose-fg) border border-(--tone-rose-border)">
                    <ShieldAlert className="size-6" />
                  </div>
                  <CardTitle className="text-xl">No access</CardTitle>
                  <CardDescription>
                    Your active demo role (
                    <span className="font-medium text-foreground">{role}</span>)
                    does not have permission to view{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                      {pathname}
                    </code>
                    .
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Switch back to Super Admin or another authorized role via the
                    Demo Role Switcher in the top-right user menu.
                  </p>
                  <Button asChild size="sm" className="gap-1.5">
                    <Link href="/dashboard">
                      <ArrowLeft className="size-4" />
                      Back to Dashboard
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
