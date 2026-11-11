import type { ExportLog, ExportStatus } from "@/types"
import { createSeededRandom, intBetween, pickFrom } from "./seed"

const MODULES = [
  "Leads",
  "Invoices",
  "Transactions",
  "Projects",
  "Tasks",
  "Monthly Attendance",
  "Marketing Spendings",
  "Users Directory",
]

const REQUESTERS = [
  "Marcus Vance",
  "Elena Rostova",
  "Nadia Kapoor",
  "Devon Brooks",
  "Tariq Al-Mansoor",
]

const STATUSES: ExportStatus[] = [
  "completed",
  "completed",
  "completed",
  "completed",
  "processing",
  "queued",
  "failed",
]

function generateExportLogs(): ExportLog[] {
  const rng = createSeededRandom(51515)
  const items: ExportLog[] = []

  for (let i = 0; i < 42; i++) {
    const mod = MODULES[i % MODULES.length]
    const format = i % 3 === 0 ? "CSV" : "XLSX"
    const status = STATUSES[i % STATUSES.length]
    const day = String(Math.max(1, 11 - (i % 10))).padStart(2, "0")
    const requestedAt = `2026-11-${day} ${String(9 + (i % 9)).padStart(
      2,
      "0"
    )}:${String((i * 7) % 60).padStart(2, "0")}`
    const rowCount = intBetween(rng, 24, 480)

    items.push({
      id: `exp-${i + 1}`,
      module: mod,
      fileName: `${mod.toLowerCase().replace(/\s+/g, "-")}-2026-11-${day}.${format.toLowerCase()}`,
      format,
      rowCount,
      columns: ["id", "name", "brand", "status", "amount", "createdAt"],
      status,
      requestedBy: pickFrom(rng, REQUESTERS),
      requestedAt,
      completedAt:
        status === "completed" ? `2026-11-${day} 10:15` : undefined,
      fileSize:
        status === "completed"
          ? `${intBetween(rng, 18, 240)} KB`
          : "—",
      errorMessage:
        status === "failed"
          ? "Worker timeout while serializing wide date range (>90 days)."
          : undefined,
    })
  }

  return items
}

export const MOCK_EXPORT_LOGS: ExportLog[] = generateExportLogs()
