"use client"

import * as React from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Landmark,
  Lock,
  ShieldCheck,
  Upload,
} from "lucide-react"
import { GatewayBadge, StatusBadge } from "@/components/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency, formatUsdEquivalent, toUsd } from "@/lib/currency"
import { useStore } from "@/lib/store"
import type { Invoice } from "@/types"

const cardSchema = z.object({
  cardholder: z.string().min(2, "Cardholder name required"),
  cardNumber: z
    .string()
    .min(12, "Enter a valid card number")
    .max(19, "Card number too long"),
  expiry: z.string().regex(/^\d{2}\/\d{2}$/, "Use MM/YY format"),
  cvc: z.string().min(3, "3–4 digits").max(4),
})

type CardFormValues = z.infer<typeof cardSchema>

export function HostedInvoiceClient({ invoice }: { invoice: Invoice }) {
  const { updateInvoice, createTransaction } = useStore()

  const [paymentOutcome, setPaymentOutcome] = React.useState<
    "idle" | "success" | "failed"
  >(invoice.status === "Success" ? "success" : "idle")
  const [simulateDecline, setSimulateDecline] = React.useState(false)
  const [uploadedProofName, setUploadedProofName] = React.useState<string | null>(
    null
  )
  const [proofSubmitted, setProofSubmitted] = React.useState(false)

  const form = useForm<CardFormValues>({
    resolver: zodResolver(cardSchema),
    defaultValues: {
      cardholder: invoice.clientName,
      cardNumber: "4242 4242 4242 4242",
      expiry: "08/29",
      cvc: "842",
    },
  })

  function onPayCard() {
    if (simulateDecline) {
      setPaymentOutcome("failed")
      updateInvoice(invoice.id, { status: "Denied" })
      toast.error("Card declined by issuing bank (simulated failure)")
    } else {
      setPaymentOutcome("success")
      updateInvoice(invoice.id, {
        status: "Success",
        paidAt: new Date().toISOString().slice(0, 10),
      })
      createTransaction({
        txRef: `TXN-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.clientName,
        brandId: invoice.brandId,
        brandName: invoice.brandName,
        gateway: invoice.gateway,
        currency: invoice.currency,
        amount: invoice.total,
        amountUsd: toUsd(invoice.total, invoice.currency),
        status: "Success",
        cardLast4: "4242",
        cardBrand: "Visa",
        events: [
          {
            id: `ev-${crypto.randomUUID().slice(0, 8)}`,
            status: "Success",
            title: "Payment Captured",
            detail: `Charged via ${invoice.gateway} hosted checkout (simulated).`,
            actor: "Client Self-Serve",
            timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
          },
        ],
      })
      toast.success(
        `Payment of ${formatCurrency(invoice.total, invoice.currency)} captured via ${invoice.gateway}`
      )
    }
  }

  function handleProofSubmit() {
    if (!uploadedProofName) {
      toast.error("Attach a wire receipt or screenshot first.")
      return
    }
    setProofSubmitted(true)
    updateInvoice(invoice.id, { status: "Processing" })
    toast.success("Bank transfer proof uploaded for treasury verification")
  }

  return (
    <div className="min-h-screen bg-muted/40 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Top brand bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#1F63C8] to-[#0B3266] text-sm font-bold text-white">
              AO
            </div>
            <div>
              <div className="text-base font-semibold text-foreground">
                {invoice.brandName}
              </div>
              <div className="text-xs text-muted-foreground">
                Secure Hosted Checkout • Powered by {invoice.gateway}
              </div>
            </div>
          </div>

          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href="/invoices">
              <ArrowLeft className="size-4" />
              Back to Admin Invoices
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left: Invoice Summary */}
          <Card className="lg:col-span-5">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge variant="outline" className="font-mono">
                  {invoice.invoiceNumber}
                </Badge>
                <StatusBadge
                  status={
                    paymentOutcome === "success"
                      ? "Success"
                      : paymentOutcome === "failed"
                        ? "Denied"
                        : invoice.status
                  }
                />
              </div>
              <CardTitle className="mt-2 text-2xl font-bold tabular-nums">
                {formatCurrency(invoice.total, invoice.currency)}
              </CardTitle>
              <CardDescription>
                Billed to {invoice.clientCompany} ({invoice.clientName}) • Due{" "}
                {invoice.dueDate}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Gateway</span>
                <GatewayBadge gateway={invoice.gateway} />
              </div>

              <Separator />

              <div className="space-y-2.5">
                {invoice.lineItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-3 text-sm"
                  >
                    <div>
                      <div className="font-medium text-foreground">
                        {item.description}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Qty {item.quantity} ×{" "}
                        {formatCurrency(item.unitPrice, invoice.currency)}
                      </div>
                    </div>
                    <span className="shrink-0 font-medium tabular-nums">
                      {formatCurrency(
                        item.quantity * item.unitPrice,
                        invoice.currency
                      )}
                    </span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums">
                    {formatCurrency(invoice.subtotal, invoice.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Tax ({invoice.taxRate}%)
                  </span>
                  <span className="tabular-nums">
                    {formatCurrency(invoice.taxAmount, invoice.currency)}
                  </span>
                </div>
                {invoice.discountAmount > 0 ? (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="tabular-nums text-emerald-600 dark:text-emerald-400">
                      -{formatCurrency(invoice.discountAmount, invoice.currency)}
                    </span>
                  </div>
                ) : null}
                <Separator className="my-1" />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span className="tabular-nums">
                    {formatUsdEquivalent(invoice.total, invoice.currency)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right: Payment Form & Bank Transfer Proof UI */}
          <Card className="lg:col-span-7">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="size-4 text-primary" />
                Complete Payment
              </CardTitle>
              <CardDescription>
                Interactive checkout prototype — toggle success/failure outcome
                or upload a wire receipt.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {paymentOutcome === "success" ? (
                <div className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-6 text-center dark:border-emerald-500/30 dark:bg-emerald-500/10">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-600 text-white">
                    <CheckCircle2 className="size-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-foreground">
                      Payment Confirmed
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(invoice.total, invoice.currency)} settled via{" "}
                      {invoice.gateway}. Receipt dispatched to{" "}
                      {invoice.clientEmail}.
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPaymentOutcome("idle")}
                    >
                      Reset Demo State
                    </Button>
                  </div>
                </div>
              ) : (
                <Tabs
                  defaultValue={
                    invoice.gateway === "Bank Transfer" ? "bank" : "card"
                  }
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="card" className="gap-1.5">
                      <CreditCard className="size-4" />
                      Card ({invoice.gateway})
                    </TabsTrigger>
                    <TabsTrigger value="bank" className="gap-1.5">
                      <Landmark className="size-4" />
                      Bank Transfer Proof
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="card" className="mt-4 space-y-4">
                    {paymentOutcome === "failed" ? (
                      <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-200">
                        <AlertCircle className="mt-0.5 size-4 shrink-0" />
                        <div>
                          <div className="font-semibold">
                            Authorization Declined (Code: do_not_honor)
                          </div>
                          <p className="text-xs opacity-90">
                            Your issuing bank declined this card charge. Retry
                            with another card or switch to Bank Transfer.
                          </p>
                        </div>
                      </div>
                    ) : null}

                    {/* Demo state switcher */}
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2 text-xs">
                      <span className="text-muted-foreground">
                        Demo Outcome Simulator:
                      </span>
                      <div className="flex gap-1.5">
                        <Button
                          type="button"
                          size="xs"
                          variant={!simulateDecline ? "default" : "outline"}
                          onClick={() => setSimulateDecline(false)}
                        >
                          Simulate Success
                        </Button>
                        <Button
                          type="button"
                          size="xs"
                          variant={simulateDecline ? "destructive" : "outline"}
                          onClick={() => setSimulateDecline(true)}
                        >
                          Simulate Decline
                        </Button>
                      </div>
                    </div>

                    <form
                      onSubmit={form.handleSubmit(onPayCard)}
                      className="space-y-4"
                    >
                      <div className="space-y-1.5">
                        <Label htmlFor="cardholder">Cardholder Name</Label>
                        <Input
                          id="cardholder"
                          {...form.register("cardholder")}
                        />
                        {form.formState.errors.cardholder ? (
                          <p className="text-xs text-destructive">
                            {form.formState.errors.cardholder.message}
                          </p>
                        ) : null}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="cardNumber">Card Number</Label>
                        <Input
                          id="cardNumber"
                          className="font-mono"
                          {...form.register("cardNumber")}
                        />
                        {form.formState.errors.cardNumber ? (
                          <p className="text-xs text-destructive">
                            {form.formState.errors.cardNumber.message}
                          </p>
                        ) : null}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="expiry">Expiry (MM/YY)</Label>
                          <Input
                            id="expiry"
                            placeholder="08/29"
                            {...form.register("expiry")}
                          />
                          {form.formState.errors.expiry ? (
                            <p className="text-xs text-destructive">
                              {form.formState.errors.expiry.message}
                            </p>
                          ) : null}
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="cvc">CVC</Label>
                          <Input
                            id="cvc"
                            placeholder="842"
                            {...form.register("cvc")}
                          />
                          {form.formState.errors.cvc ? (
                            <p className="text-xs text-destructive">
                              {form.formState.errors.cvc.message}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <Button type="submit" className="w-full gap-2" size="lg">
                        <ShieldCheck className="size-4" />
                        Pay {formatCurrency(invoice.total, invoice.currency)}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="bank" className="mt-4 space-y-4">
                    <div className="rounded-lg border border-border bg-muted/30 p-3.5 text-xs space-y-1.5">
                      <div className="font-semibold text-foreground">
                        Wire / ACH Settlement Instructions ({invoice.currency})
                      </div>
                      <p className="text-muted-foreground">
                        Beneficiary: AgencyOps Digital LLC • Routing: 021000021
                        • Acct: 9810 4429 1182 • Ref: {invoice.invoiceNumber}
                      </p>
                    </div>

                    {proofSubmitted ? (
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-200">
                        <div className="font-semibold">
                          Transfer proof submitted: {uploadedProofName}
                        </div>
                        <p className="mt-1 text-xs">
                          Finance team will verify settlement within 1 business
                          day.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Label
                          htmlFor="wire-proof-input"
                          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/20 p-6 text-center transition-colors hover:border-primary/50 hover:bg-muted/40"
                        >
                          <Upload className="size-6 text-primary" />
                          <div className="text-sm font-medium text-foreground">
                            {uploadedProofName ??
                              "Click to attach wire receipt (PDF, PNG, JPG)"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Max 10 MB • Include reference{" "}
                            {invoice.invoiceNumber}
                          </div>
                          <input
                            id="wire-proof-input"
                            type="file"
                            className="sr-only"
                            accept=".pdf,.png,.jpg,.jpeg"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              setUploadedProofName(
                                file?.name ?? "wire-transfer-receipt.pdf"
                              )
                            }}
                          />
                        </Label>

                        <Button
                          type="button"
                          onClick={handleProofSubmit}
                          className="w-full"
                        >
                          Submit Transfer Proof
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
