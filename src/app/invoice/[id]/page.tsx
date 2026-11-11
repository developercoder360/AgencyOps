import { Suspense } from "react"
import { HostedInvoiceClient } from "@/components/billing/hosted-invoice-client"
import { MOCK_INVOICES } from "@/mocks/billing"

export function generateStaticParams() {
  return MOCK_INVOICES.map((inv) => ({ id: inv.id }))
}

async function InvoicePageResolver({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const invoice =
    MOCK_INVOICES.find((inv) => inv.id === id) ?? MOCK_INVOICES[0]
  return <HostedInvoiceClient invoice={invoice} />
}

export default function HostedInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
          Loading checkout invoice...
        </div>
      }
    >
      <InvoicePageResolver params={params} />
    </Suspense>
  )
}
