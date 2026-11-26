import type {
  Invoice,
  PaymentGateway,
  PaymentStatus,
  Transaction,
} from "@/types"
import crmSnapshot from "./crm-real-snapshot.json"
import marketingRealData from "./marketing-real-data.json"
import { MOCK_BRANDS } from "./brands"
import { MOCK_USERS } from "./users"

function mapGateway(raw: string): PaymentGateway {
  const g = raw.toLowerCase()
  if (g.includes("square")) return "Square"
  if (g.includes("auth")) return "Authorize.Net"
  if (g.includes("nmi")) return "NMI"
  if (g.includes("bank")) return "Bank Transfer"
  return "Stripe"
}

function mapStatus(raw: string): PaymentStatus {
  const s = raw.toLowerCase()
  if (s.includes("success")) return "Success"
  if (s.includes("chargeback")) return "Chargeback"
  if (s.includes("refund")) return "Refunded"
  if (s.includes("view")) return "Viewed"
  if (s.includes("process")) return "Processing"
  if (s.includes("denied")) return "Denied"
  return "Created"
}

export const MOCK_INVOICES: Invoice[] = crmSnapshot.invoices.map((inv, idx) => {
  const brand = MOCK_BRANDS[idx % MOCK_BRANDS.length]
  const creator = MOCK_USERS[idx % MOCK_USERS.length]
  const amount = inv.amount > 0 ? inv.amount : 1200
  const status = mapStatus(inv.status)

  return {
    id: inv.id,
    invoiceNumber: `INV-${inv.rawId}`,
    clientName: `Lead #${inv.leadRawId}`,
    clientEmail: `billing-${inv.leadRawId}@client.com`,
    clientCompany: brand.name,
    brandId: brand.id,
    brandName: brand.name,
    gateway: mapGateway(inv.paymentMethod),
    currency: "USD",
    lineItems: [
      {
        id: `li-${inv.rawId}`,
        description: `${inv.saleType} Invoice #${inv.rawId}`,
        quantity: 1,
        unitPrice: amount,
      },
    ],
    subtotal: amount,
    taxRate: 0,
    taxAmount: 0,
    discountAmount: 0,
    total: amount,
    status,
    dueDate: inv.dueDate,
    issuedAt: inv.createdAt,
    paidAt: status === "Success" ? inv.createdAt : undefined,
    salesRepId: creator?.id ?? "usr-1",
    attachments: [],
    notes: `${inv.saleType} billing via ${inv.paymentMethod}`,
  }
})

export const MOCK_TRANSACTIONS: Transaction[] = marketingRealData.transactions
  .slice(0, 60)
  .map((t, idx) => {
    const brand =
      MOCK_BRANDS.find((b) => b.id === t.brandId) ??
      MOCK_BRANDS[idx % MOCK_BRANDS.length]
    const invoice = MOCK_INVOICES[idx % MOCK_INVOICES.length]
    const status: PaymentStatus =
      t.saleType === "Chargeback"
        ? "Chargeback"
        : t.status === "Refunded"
          ? "Refunded"
          : "Success"
    const timestamp = `${t.date} 14:30`

    return {
      id: t.id,
      txRef: `TXN-${10000 + idx}`,
      invoiceId: invoice?.id ?? "inv-1",
      invoiceNumber: invoice?.invoiceNumber ?? `INV-${idx + 1001}`,
      clientName: t.clientName,
      brandId: brand.id,
      brandName: brand.name,
      gateway: "Stripe",
      currency: "USD",
      amount: t.amount,
      amountUsd: t.amount,
      status,
      createdAt: timestamp,
      events: [
        {
          id: `evt-${t.id}-1`,
          status,
          title: `Payment ${status}`,
          detail: `${t.saleType} via ${t.source} ($${t.amount.toLocaleString()})`,
          actor: "Payment Gateway",
          timestamp,
        },
      ],
    }
  })
