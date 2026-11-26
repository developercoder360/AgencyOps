import type { Project, ProjectStatus, TaskPriority } from "@/types"
import crmSnapshot from "./crm-real-snapshot.json"
import { MOCK_BRANDS } from "./brands"
import { MOCK_USERS } from "./users"

function normalizeProjectStatus(raw: string): ProjectStatus {
  const s = raw.toLowerCase()
  if (s.includes("complete")) return "Complete"
  if (s.includes("progress")) return "Progress"
  if (s.includes("draw")) return "Re-Draw"
  if (s.includes("overdue")) return "Overdue"
  return "Open"
}

export const MOCK_PROJECTS: Project[] = crmSnapshot.projects.map((p, idx) => {
  const brand =
    MOCK_BRANDS.find((b) => b.id === `brd-${p.brandRawId}`) ??
    MOCK_BRANDS[idx % MOCK_BRANDS.length]
  const manager = MOCK_USERS[idx % MOCK_USERS.length]
  const status = normalizeProjectStatus(p.status)
  const priorities: TaskPriority[] = ["Regular", "High", "Urgent"]

  return {
    id: p.id,
    code: `PRJ-${p.rawId.padStart(4, "0")}`,
    name: p.name,
    clientName: p.company,
    clientCompany: p.company,
    brandId: brand.id,
    brandName: brand.name,
    category: idx % 2 === 0 ? "Web Design" : "Logo & Branding",
    status,
    priority: priorities[idx % priorities.length],
    budget: 2500 + (idx % 6) * 1200,
    currency: "USD",
    progress: status === "Complete" ? 100 : status === "Progress" ? 55 : 15,
    startDate: p.startDate,
    deadline: p.deadline,
    managerId: manager?.id ?? "usr-1",
    memberIds: MOCK_USERS.slice(0, 3).map((u) => u.id),
    description: p.description || `${p.name} delivery workspace for ${p.company}.`,
    files: [],
    comments: [],
  }
})
