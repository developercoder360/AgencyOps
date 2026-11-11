import { Suspense } from "react"
import { ProjectDetailClient } from "@/components/delivery/project-detail-client"
import { MOCK_PROJECTS } from "@/mocks/projects"

export function generateStaticParams() {
  return MOCK_PROJECTS.map((p) => ({ id: p.id }))
}

async function ProjectResolver({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const project =
    MOCK_PROJECTS.find((p) => p.id === id) ?? MOCK_PROJECTS[0]
  return <ProjectDetailClient initialProject={project} />
}

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-sm text-muted-foreground">
          Loading project workspace...
        </div>
      }
    >
      <ProjectResolver params={params} />
    </Suspense>
  )
}
