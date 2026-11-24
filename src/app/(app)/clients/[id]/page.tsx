"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { ClientDetailClient } from "@/components/clients/client-detail-client"
import { Skeleton } from "@/components/ui/skeleton"
import { useStore } from "@/lib/store"

function ClientDetailContent() {
  const params = useParams()
  const id =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
        ? params.id[0]
        : ""
  const { isLoaded } = useStore()

  if (!isLoaded) {
    return (
      <div className="space-y-6 p-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    )
  }

  return <ClientDetailClient clientKey={id} />
}

export default function ClientDetailPage() {
  return (
    <React.Suspense
      fallback={
        <div className="space-y-6 p-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-full" />
        </div>
      }
    >
      <ClientDetailContent />
    </React.Suspense>
  )
}
