"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, FileX } from "lucide-react"
import { useStore } from "@/lib/store"
import { HostedInvoiceClient } from "@/components/billing/hosted-invoice-client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

function HostedInvoiceContent() {
  const params = useParams()
  const id =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
        ? params.id[0]
        : ""
  const { isLoaded, getInvoiceById } = useStore()

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 bg-muted/20">
        <div className="w-full max-w-2xl space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  const invoice = getInvoiceById(id)

  if (!invoice) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 bg-muted/20">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-2">
              <FileX className="size-6" />
            </div>
            <CardTitle>Invoice Not Found</CardTitle>
            <CardDescription>
              The invoice &ldquo;{id}&rdquo; was not found in this browser&rsquo;s store.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="gap-2">
              <Link href="/invoices">
                <ArrowLeft className="size-4" />
                Return to Invoices
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <HostedInvoiceClient invoice={invoice} />
}

export default function HostedInvoicePage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center p-6 bg-muted/20">
          <div className="w-full max-w-2xl space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      }
    >
      <HostedInvoiceContent />
    </React.Suspense>
  )
}
