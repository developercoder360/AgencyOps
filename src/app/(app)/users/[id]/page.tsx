import { Suspense } from "react"
import { User360Client } from "@/components/admin/user-360-client"
import { MOCK_USERS } from "@/mocks/users"

export function generateStaticParams() {
  return MOCK_USERS.map((u) => ({ id: u.id }))
}

async function UserResolver({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = MOCK_USERS.find((u) => u.id === id) ?? MOCK_USERS[0]
  return <User360Client user={user} />
}

export default function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-sm text-muted-foreground">
          Loading user 360° profile...
        </div>
      }
    >
      <UserResolver params={params} />
    </Suspense>
  )
}
