import { formatCurrency } from "./currency"
import type { Invoice } from "@/types"

function toPdfAscii(text: string): string {
  return text
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
}

function buildMinimalPdf(lines: { text: string; bold?: boolean; size?: number }[]): Uint8Array {
  const ops: string[] = []
  let y = 760

  for (const line of lines) {
    if (y < 50) break
    const font = line.bold ? "/F2" : "/F1"
    const size = line.size ?? 10
    ops.push(`BT ${font} ${size} Tf 50 ${y} Td (${toPdfAscii(line.text)}) Tj ET`)
    y -= size + 6
  }

  const streamContent = ops.join("\n")
  const encoder = new TextEncoder()
  const streamBytes = encoder.encode(streamContent)

  const objects: string[] = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n",
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n",
    `6 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n${streamContent}\nendstream\nendobj\n`,
  ]

  const header = "%PDF-1.4\n"
  const chunks: Uint8Array[] = [encoder.encode(header)]
  const offsets: number[] = []
  let currentOffset = encoder.encode(header).length

  for (const obj of objects) {
    offsets.push(currentOffset)
    const bytes = encoder.encode(obj)
    chunks.push(bytes)
    currentOffset += bytes.length
  }

  const xrefOffset = currentOffset
  const xrefLines = [
    `xref\n0 ${objects.length + 1}\n`,
    "0000000000 65535 f \n",
    ...offsets.map((off) => `${String(off).padStart(10, "0")} 00000 n \n`),
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`,
  ]
  chunks.push(encoder.encode(xrefLines.join("")))

  const totalLen = chunks.reduce((sum, c) => sum + c.length, 0)
  const result = new Uint8Array(totalLen)
  let pos = 0
  for (const chunk of chunks) {
    result.set(chunk, pos)
    pos += chunk.length
  }
  return result
}

export function downloadInvoicePdf(invoice: Invoice): void {
  const lines: { text: string; bold?: boolean; size?: number }[] = [
    { text: `${invoice.brandName} - INVOICE`, bold: true, size: 16 },
    { text: `Invoice #: ${invoice.invoiceNumber}`, bold: true, size: 12 },
    {
      text: `Status: ${invoice.status}   |   Gateway: ${invoice.gateway}   |   Sale Type: ${invoice.saleType || "Sale"}`,
      size: 10,
    },
    { text: `Created At: ${invoice.createdAt || invoice.issuedAt}   |   Due Date: ${invoice.dueDate}`, size: 10 },
    { text: " ", size: 8 },
    { text: "Billed To:", bold: true, size: 11 },
    { text: `${invoice.clientName} (${invoice.clientCompany})`, size: 10 },
    { text: invoice.clientEmail, size: 10 },
    { text: " ", size: 8 },
    { text: "Line Items:", bold: true, size: 11 },
    ...invoice.lineItems.map((item) => ({
      text: `- ${item.description}  |  Qty ${item.quantity} x ${formatCurrency(item.unitPrice, invoice.currency)} = ${formatCurrency(item.quantity * item.unitPrice, invoice.currency)}`,
      size: 10,
    })),
    { text: " ", size: 8 },
    { text: `Subtotal: ${formatCurrency(invoice.subtotal, invoice.currency)}`, size: 10 },
    {
      text: `${invoice.taxRate > 0 ? `Tax (${invoice.taxRate}%)` : "Tax"}: ${formatCurrency(invoice.taxAmount, invoice.currency)}`,
      size: 10,
    },
    { text: `Discount: -${formatCurrency(invoice.discountAmount, invoice.currency)}`, size: 10 },
    { text: `Total: ${formatCurrency(invoice.total, invoice.currency)} (${invoice.currency})`, bold: true, size: 12 },
  ]

  if (invoice.notes) {
    lines.push({ text: " ", size: 8 })
    lines.push({ text: `Notes: ${invoice.notes}`, size: 9 })
  }

  const pdfBytes = buildMinimalPdf(lines)
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], {
    type: "application/pdf",
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${invoice.invoiceNumber}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}
