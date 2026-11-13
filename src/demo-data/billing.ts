import type {
  CurrencyCode,
  Invoice,
  InvoiceLineItem,
  PaymentGateway,
  PaymentStatus,
  Transaction,
} from "@/types"
import { toUsd } from "@/lib/currency"
import { MOCK_BRANDS } from "./brands"
import { MOCK_USERS } from "./users"
import { createSeededRandom, intBetween, pickFrom } from "./seed"

const GATEWAYS: PaymentGateway[] = [
  "Stripe",
  "Square",
  "Authorize.Net",
  "NMI",
  "Bank Transfer",
]

const STATUSES: PaymentStatus[] = [
  "Success",
  "Success",
  "Success",
  "Success",
  "Processing",
  "Viewed",
  "Created",
  "Denied",
  "Refund Requested",
  "Refunded",
  "Chargeback",
]

const CURRENCIES: CurrencyCode[] = ["USD", "USD", "USD", "GBP", "CAD"]

const CLIENTS = [
  { name: "Olivia Sterling", company: "Harborline Logistics" },
  { name: "Liam Mercer", company: "Kestrel Biotech" },
  { name: "Charlotte Holloway", company: "Brightleaf Dental" },
  { name: "Noah Kensington", company: "Vanguard Legal LLP" },
  { name: "Ava Thorne", company: "Crestview Hospitality" },
  { name: "Mason Bennett", company: "Oakridge Wealth" },
  { name: "Harper Callahan", company: "Redwood Architecture" },
  { name: "Ethan Delgado", company: "PulseFit Athletics" },
  { name: "Mia Whitmore", company: "Clearwater Energy" },
  { name: "Lucas Sinclair", company: "Meridian Freight" },
  { name: "Isabella Kowalski", company: "Atlas Robotics" },
  { name: "Henry Beaumont", company: "Cobalt Cloud Systems" },
]

const LINE_TEMPLATES = [
  "Discovery, UX Wireframes & Design System",
  "Responsive Web Application Frontend Build",
  "Logo Concept Suite & Brand Guidelines Book",
  "Technical SEO Audit & Schema Implementation",
  "Paid Search Campaign Setup & Creative Pack",
  "Monthly Retainer — Optimization & Support",
]

const SALES_IDS = MOCK_USERS.filter(
  (u) => u.role === "Sales/Account Manager" || u.role === "Super Admin"
).map((u) => u.id)

function makeDateOffset(daysBack: number): string {
  const base = Date.UTC(2026, 10, 11)
  return new Date(base - daysBack * 86400000).toISOString().slice(0, 10)
}

function generateBilling() {
  const rng = createSeededRandom(91377)
  const invoices: Invoice[] = []
  const transactions: Transaction[] = []

  for (let i = 0; i < 48; i++) {
    const client = CLIENTS[i % CLIENTS.length]
    const brand = MOCK_BRANDS[i % MOCK_BRANDS.length]
    const gateway = GATEWAYS[i % GATEWAYS.length]
    const currency = CURRENCIES[i % CURRENCIES.length]
    const status = STATUSES[i % STATUSES.length]
    const daysBack = intBetween(rng, 0, 170)
    const issuedAt = makeDateOffset(daysBack)
    const dueDate = makeDateOffset(Math.max(-14, daysBack - 14))

    const lineCount = intBetween(rng, 1, 3)
    const lineItems: InvoiceLineItem[] = []
    for (let l = 0; l < lineCount; l++) {
      lineItems.push({
        id: `li-${i}-${l}`,
        description: LINE_TEMPLATES[(i + l) % LINE_TEMPLATES.length],
        quantity: l === 0 ? 1 : intBetween(rng, 1, 2),
        unitPrice: intBetween(rng, 8, 45) * 100,
      })
    }

    const subtotal = lineItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    )
    const taxRate = currency === "GBP" ? 20 : currency === "CAD" ? 13 : 0
    const taxAmount = Math.round(subtotal * (taxRate / 100) * 100) / 100
    const discountAmount = i % 4 === 0 ? 250 : 0
    const total = Math.max(200, subtotal + taxAmount - discountAmount)
    const invoiceNumber = `INV-2026-${1001 + i}`
    const invoiceId = `inv-${i + 1}`

    invoices.push({
      id: invoiceId,
      invoiceNumber,
      clientName: client.name,
      clientEmail: `${client.name.toLowerCase().replace(/\s+/g, ".")}@${client.company
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")}.com`,
      clientCompany: client.company,
      brandId: brand.id,
      brandName: brand.name,
      projectId: `prj-${(i % 44) + 1}`,
      projectName: `${client.company} Digital Rollout`,
      gateway,
      currency,
      lineItems,
      subtotal,
      taxRate,
      taxAmount,
      discountAmount,
      total,
      status,
      dueDate,
      issuedAt,
      paidAt: status === "Success" ? issuedAt : undefined,
      salesRepId: SALES_IDS[i % SALES_IDS.length],
      attachments: [
        {
          id: `att-${i}-1`,
          name: `${invoiceNumber}-signed-sow.pdf`,
          size: "420 KB",
          type: "application/pdf",
          uploadedBy: "Elena Rostova",
          uploadedAt: issuedAt,
        },
        ...(gateway === "Bank Transfer"
          ? [
              {
                id: `att-${i}-2`,
                name: `wire-receipt-${1001 + i}.png`,
                size: "1.1 MB",
                type: "image/png",
                uploadedBy: client.name,
                uploadedAt: issuedAt,
              },
            ]
          : []),
      ],
      notes: "Net-14 milestone invoice. Includes up to 2 revision rounds.",
    })

    if (status !== "Created") {
      const cardBrand = pickFrom(rng, ["Visa", "Mastercard", "Amex"])
      const cardLast4 = String(intBetween(rng, 1024, 9876))
      const events = [
        {
          id: `evt-${i}-1`,
          status: "Created" as PaymentStatus,
          title: "Invoice generated",
          detail: `Issued ${invoiceNumber} for ${client.company}`,
          actor: "Billing Engine",
          timestamp: `${issuedAt} 09:05`,
        },
        {
          id: `evt-${i}-2`,
          status: "Viewed" as PaymentStatus,
          title: "Hosted payment link opened",
          detail: `Client viewed checkout page via ${gateway}`,
          actor: client.name,
          timestamp: `${issuedAt} 11:22`,
        },
      ]

      if (status !== "Viewed") {
        events.push({
          id: `evt-${i}-3`,
          status: "Processing" as PaymentStatus,
          title: `Authorization submitted (${gateway})`,
          detail:
            gateway === "Bank Transfer"
              ? "ACH/Wire proof uploaded for treasury verification"
              : `${cardBrand} ending in ${cardLast4} 3DS verified`,
          actor: gateway,
          timestamp: `${issuedAt} 11:25`,
        })
      }

      if (
        ["Success", "Denied", "Refund Requested", "Refunded", "Chargeback"].includes(
          status
        )
      ) {
        events.push({
          id: `evt-${i}-4`,
          status,
          title:
            status === "Success"
              ? "Settlement captured"
              : status === "Denied"
                ? "Gateway declined card (Do Not Honor)"
                : status === "Refund Requested"
                  ? "Client refund ticket opened"
                  : status === "Refunded"
                    ? "Full refund settled back to card"
                    : "Dispute / chargeback notice received",
          detail:
            status === "Chargeback"
              ? "Evidence pack submitted to gateway risk desk"
              : `Transaction state updated to ${status}`,
          actor: status === "Success" ? gateway : "Marcus Vance",
          timestamp: `${issuedAt} 14:40`,
        })
      }

      transactions.push({
        id: `tx-${i + 1}`,
        txRef: `TXN-${88200 + i}`,
        invoiceId,
        invoiceNumber,
        clientName: client.name,
        brandId: brand.id,
        brandName: brand.name,
        gateway,
        currency,
        amount: total,
        amountUsd: toUsd(total, currency),
        status,
        cardLast4: gateway === "Bank Transfer" ? undefined : cardLast4,
        cardBrand: gateway === "Bank Transfer" ? undefined : cardBrand,
        createdAt: issuedAt,
        events,
      })
    }
  }

  return {
    invoices: invoices.sort((a, b) => b.issuedAt.localeCompare(a.issuedAt)),
    transactions: transactions.sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    ),
  }
}

const { invoices, transactions } = generateBilling()
export const MOCK_INVOICES: Invoice[] = invoices
export const MOCK_TRANSACTIONS: Transaction[] = transactions
