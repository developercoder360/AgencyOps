import * as React from "react"
import { DashboardClient } from "@/components/dashboard/dashboard-client"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardPage() {
  return (
    <React.Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-14 w-full" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      }
    >
      <DashboardClient />
    </React.Suspense>
  )
}
