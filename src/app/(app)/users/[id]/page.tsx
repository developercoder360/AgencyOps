"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, UserX } from "lucide-react"
import { useStore } from "@/lib/store"
import { User360Client } from "@/components/admin/user-360-client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

function UserDetailContent() {
  const params = useParams()
  const id =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
        ? params.id[0]
        : ""
  const { isLoaded, getUserById } = useStore()

  if (!isLoaded) {
    return (
      <div className="space-y-6 p-4">
        <div className="flex items-center gap-4">
          <Skeleton className="size-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    )
  }

  const user = getUserById(id)

  if (!user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center py-12">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-2">
              <UserX className="size-6" />
            </div>
            <CardTitle>Staff Member Not Found</CardTitle>
            <CardDescription>
              The user with ID &ldquo;{id}&rdquo; was not found in your team directory.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="gap-2">
              <Link href="/users">
                <ArrowLeft className="size-4" />
                Return to Directory
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <User360Client user={user} />
}

export default function UserDetailPage() {
  return (
    <React.Suspense
      fallback={
        <div className="space-y-6 p-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-full" />
        </div>
      }
    >
      <UserDetailContent />
    </React.Suspense>
  )
}
