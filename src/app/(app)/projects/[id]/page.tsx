"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, FolderKanban } from "lucide-react"
import { useStore } from "@/lib/store"
import { ProjectDetailClient } from "@/components/delivery/project-detail-client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

function ProjectDetailContent() {
  const params = useParams()
  const id =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
        ? params.id[0]
        : ""
  const { isLoaded, getProjectById } = useStore()

  if (!isLoaded) {
    return (
      <div className="space-y-6 p-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Skeleton className="h-72 lg:col-span-8" />
          <Skeleton className="h-72 lg:col-span-4" />
        </div>
      </div>
    )
  }

  const project = getProjectById(id)

  if (!project) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center py-12">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-2">
              <FolderKanban className="size-6" />
            </div>
            <CardTitle>Project Not Found</CardTitle>
            <CardDescription>
              The project &ldquo;{id}&rdquo; does not exist in your store or has been removed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="gap-2">
              <Link href="/projects">
                <ArrowLeft className="size-4" />
                Return to Projects
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <ProjectDetailClient initialProject={project} />
}

export default function ProjectDetailPage() {
  return (
    <React.Suspense
      fallback={
        <div className="space-y-6 p-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-full" />
        </div>
      }
    >
      <ProjectDetailContent />
    </React.Suspense>
  )
}
