import { Suspense } from "react"
import { AppShell } from "@/components/layout/app-shell"

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={<div className="h-full w-full bg-background" />}>
      <AppShell>{children}</AppShell>
    </Suspense>
  )
}
