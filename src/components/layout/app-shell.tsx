"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { SidebarContent } from "./app-sidebar"
import { AppTopbar } from "./app-topbar"
import { AppBreadcrumbs } from "./app-breadcrumbs"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { cn } from "cn"

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const pathname = usePathname()

  React.useEffect(() => {
    window.dispatchEvent(new Event("agencyops:route-change"))
  }, [pathname])

  return (
    <div className="flex min-h-dvh w-full bg-muted/30">
      {/* Desktop collapsible sidebar */}
      <aside
        className={cn(
          "sticky top-0 hidden h-dvh shrink-0 border-r border-border/40 transition-all duration-200 lg:block",
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
          className="w-64 border-r-0 p-0"
        >
          <SheetTitle className="sr-only">Navigation menu</SheetTitle>
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main content area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar onOpenMobileSidebar={() => setMobileOpen(true)} />
        <main className="flex-1 min-w-0 px-3 py-5 sm:px-6">
          <div className="mx-auto w-full max-w-[1440px]">
            <AppBreadcrumbs />
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
