import type {
  CurrencyCode,
  Project,
  ProjectStatus,
  TaskPriority,
} from "@/types"
import { MOCK_BRANDS } from "./brands"
import { MOCK_USERS } from "./users"
import { createSeededRandom, intBetween, pickFrom } from "./seed"

const PROJECT_STATUSES: ProjectStatus[] = [
  "Open",
  "Progress",
  "Progress",
  "Re-Draw",
  "Complete",
  "Overdue",
]

const CATEGORIES: Project["category"][] = [
  "Web Design",
  "Logo & Branding",
  "SEO",
  "Performance Marketing",
  "Full Stack App",
]

const PRIORITIES: TaskPriority[] = ["Regular", "High", "Urgent"]
const CURRENCIES: CurrencyCode[] = ["USD", "USD", "GBP", "CAD"]

const PROJECT_TITLES = [
  "Enterprise SaaS Marketing Site",
  "Rebrand & Visual Identity System",
  "E-Commerce Storefront Migration",
  "Technical SEO & Schema Overhaul",
  "Paid Acquisition Funnel Refresh",
  "Customer Portal & Billing Hub",
  "Multi-Region Landing Page Suite",
  "Logo Concept & Packaging Kit",
  "Analytics & Attribution Dashboard",
  "Mobile App Marketing Microsite",
  "B2B Lead Capture Revamp",
]

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
]

const PM_IDS = MOCK_USERS.filter(
  (u) => u.role === "Project Admin" || u.role === "Super Admin"
).map((u) => u.id)

const DELIVERY_IDS = MOCK_USERS.filter(
  (u) => u.role === "Designer/Developer" || u.role === "QA Reviewer"
).map((u) => u.id)

function makeDateOffset(daysDelta: number): string {
  const base = Date.UTC(2026, 10, 11)
  return new Date(base + daysDelta * 86400000).toISOString().slice(0, 10)
}

function generateProjects(): Project[] {
  const rng = createSeededRandom(63421)
  const items: Project[] = []

  for (let i = 0; i < 44; i++) {
    const brand = MOCK_BRANDS[i % MOCK_BRANDS.length]
    const client = CLIENTS[i % CLIENTS.length]
    const status = PROJECT_STATUSES[i % PROJECT_STATUSES.length]
    const category = CATEGORIES[i % CATEGORIES.length]
    const priority = pickFrom(rng, PRIORITIES)
    const currency = CURRENCIES[i % CURRENCIES.length]
    const budget = intBetween(rng, 35, 280) * 100
    const startOffset = -intBetween(rng, 14, 95)
    const deadlineOffset =
      status === "Overdue"
        ? -intBetween(rng, 2, 18)
        : status === "Complete"
          ? -intBetween(rng, 1, 20)
          : intBetween(rng, 2, 42)
    const progress =
      status === "Complete"
        ? 100
        : status === "Open"
          ? intBetween(rng, 5, 20)
          : status === "Re-Draw"
            ? intBetween(rng, 55, 80)
            : intBetween(rng, 30, 88)

    const managerId = PM_IDS[i % PM_IDS.length]
    const memberIds = [
      DELIVERY_IDS[i % DELIVERY_IDS.length],
      DELIVERY_IDS[(i + 2) % DELIVERY_IDS.length],
      DELIVERY_IDS[(i + 4) % DELIVERY_IDS.length],
    ]

    const startDate = makeDateOffset(startOffset)
    const deadline = makeDateOffset(deadlineOffset)
    const code = `PRJ-${301 + i}`

    items.push({
      id: `prj-${i + 1}`,
      code,
      name: `${client.company} — ${PROJECT_TITLES[i % PROJECT_TITLES.length]}`,
      clientName: client.name,
      clientCompany: client.company,
      brandId: brand.id,
      brandName: brand.name,
      category,
      status,
      priority,
      budget,
      currency,
      progress,
      startDate,
      deadline,
      managerId,
      memberIds,
      description: `Full-cycle ${category.toLowerCase()} delivery for ${client.company} under ${brand.name}, including stakeholder workshops, milestone QA sign-off, and production handoff.`,
      files: [
        {
          id: `pf-${i}-1`,
          name: `${code}-creative-brief.pdf`,
          size: "1.4 MB",
          type: "application/pdf",
          folder: "Briefs",
          clientVisible: true,
          uploadedBy: "Devon Brooks",
          uploadedAt: startDate,
        },
        {
          id: `pf-${i}-2`,
          name: `${code}-figma-tokens.fig`,
          size: "6.8 MB",
          type: "application/octet-stream",
          folder: "Designs",
          clientVisible: i % 2 === 0,
          uploadedBy: "Aria Chen",
          uploadedAt: makeDateOffset(startOffset + 7),
        },
        {
          id: `pf-${i}-3`,
          name: `${code}-internal-qa-notes.docx`,
          size: "340 KB",
          type: "application/msword",
          folder: "Deliverables",
          clientVisible: false,
          uploadedBy: "Tariq Al-Mansoor",
          uploadedAt: makeDateOffset(startOffset + 12),
        },
      ],
      comments: [
        {
          id: `pc-${i}-1`,
          authorId: managerId,
          authorName:
            MOCK_USERS.find((u) => u.id === managerId)?.name ?? "Devon Brooks",
          authorRole: "Project Admin",
          content:
            "Kickoff notes finalized. Please keep hero accessibility and mobile breakpoints aligned with brand guidelines.",
          createdAt: `${startDate} 10:15`,
          type: "comment",
        },
        {
          id: `pc-${i}-2`,
          authorId: memberIds[0],
          authorName:
            MOCK_USERS.find((u) => u.id === memberIds[0])?.name ?? "Aria Chen",
          authorRole: "Designer/Developer",
          content:
            "Uploaded v2 layout comps and component specs. Ready for internal QA pass tomorrow.",
          createdAt: `${makeDateOffset(startOffset + 8)} 16:42`,
          type: "comment",
        },
      ],
    })
  }

  return items
}

export const MOCK_PROJECTS: Project[] = generateProjects()
