import type { Task, TaskPriority, TaskStatus } from "@/types"
import { MOCK_PROJECTS } from "./projects"
import { MOCK_USERS } from "./users"
import { createSeededRandom, intBetween, pickFrom } from "./seed"

const TASK_STATUSES: TaskStatus[] = [
  "Open",
  "Progress",
  "Progress",
  "QA Review",
  "On Hold",
  "Re-Draw",
  "Complete",
]

const PRIORITIES: TaskPriority[] = ["Regular", "High", "Urgent"]

const TASK_TITLES = [
  "Responsive hero section & conversion CTA",
  "Vector logo refinements & monochrome lockups",
  "Technical Core Web Vitals & LCP optimization",
  "Checkout form validation & gateway error UI",
  "Dark mode token audit across dashboard cards",
  "Meta & Google Ads dynamic retargeting creatives",
  "Header mega-menu keyboard navigation",
  "Schema markup & XML sitemap validation",
  "Client brand guideline PDF export",
  "Pricing matrix & currency toggle interaction",
  "Email onboarding sequence HTML templates",
  "Final pre-launch cross-browser QA sweep",
]

const DEVS = MOCK_USERS.filter((u) => u.role === "Designer/Developer")
const REVIEWERS = MOCK_USERS.filter((u) => u.role === "QA Reviewer")

function makeDateOffset(daysDelta: number): string {
  const base = Date.UTC(2026, 10, 11)
  return new Date(base + daysDelta * 86400000).toISOString().slice(0, 10)
}

function generateTasks(): Task[] {
  const rng = createSeededRandom(72905)
  const items: Task[] = []

  for (let i = 0; i < 52; i++) {
    const project = MOCK_PROJECTS[i % MOCK_PROJECTS.length]
    const status = TASK_STATUSES[i % TASK_STATUSES.length]
    const priority = pickFrom(rng, PRIORITIES)
    const dev1 = DEVS[i % DEVS.length]
    const dev2 = rng() > 0.6 ? DEVS[(i + 1) % DEVS.length] : null
    const reviewer = REVIEWERS[i % REVIEWERS.length]

    // Ensure realistic tasks due soon (0 to +5 days) and overdue (-1 to -9 days)
    let dueOffset: number
    if (i < 10) {
      dueOffset = intBetween(rng, 0, 5) // due soon!
    } else if (i >= 10 && i < 16) {
      dueOffset = -intBetween(rng, 1, 9) // overdue!
    } else {
      dueOffset = intBetween(rng, -4, 24)
    }

    const dueDate = makeDateOffset(dueOffset)
    const createdAt = makeDateOffset(dueOffset - intBetween(rng, 5, 16))
    const code = `TSK-${101 + i}`

    const subtasks = [
      {
        id: `st-${i}-1`,
        title: "Review client brief & design tokens",
        completed: status !== "Open",
        assigneeId: dev1.id,
      },
      {
        id: `st-${i}-2`,
        title: "Implement responsive breakpoints (375px / 768px / 1280px)",
        completed: ["QA Review", "Re-Draw", "Complete"].includes(status),
        assigneeId: dev1.id,
      },
      {
        id: `st-${i}-3`,
        title: "Run accessibility & QA checklist verification",
        completed: status === "Complete",
        assigneeId: reviewer.id,
      },
    ]

    const qaHistory =
      status === "Re-Draw"
        ? [
            {
              id: `qa-${i}-1`,
              outcome: "Fail" as const,
              reviewerName: reviewer.name,
              category: "Responsive / Visual Regression",
              reason:
                "CTA button clips at 375px viewport and contrast ratio on dark card subtitle falls below 4.5:1.",
              evidenceNames: [`${code}-mobile-overflow.png`],
              redFlagUserIds: [dev1.id],
              timestamp: `${makeDateOffset(-1)} 14:20`,
            },
          ]
        : status === "Complete"
          ? [
              {
                id: `qa-${i}-1`,
                outcome: "Pass" as const,
                reviewerName: reviewer.name,
                evidenceNames: [`${code}-qa-signoff.png`],
                redFlagUserIds: [],
                timestamp: `${makeDateOffset(-1)} 17:05`,
              },
            ]
          : []

    items.push({
      id: `tsk-${i + 1}`,
      code,
      title: `${TASK_TITLES[i % TASK_TITLES.length]}`,
      description: `Deliverable for ${project.name}. Ensure brand consistency, zero console errors, and annotated handoff evidence prior to QA submission.`,
      projectId: project.id,
      projectName: project.name,
      brandId: project.brandId,
      brandName: project.brandName,
      status,
      priority,
      assigneeIds: dev2 ? [dev1.id, dev2.id] : [dev1.id],
      reviewerId: reviewer.id,
      dueDate,
      estimatedHours: intBetween(rng, 4, 24),
      loggedHours:
        status === "Open" ? 0 : intBetween(rng, 2, 18),
      subtasks,
      comments: [
        {
          id: `tc-${i}-1`,
          authorId: dev1.id,
          authorName: dev1.name,
          content:
            "Started implementation against approved Figma frame. Will tag QA once staging preview builds.",
          createdAt: `${createdAt} 11:30`,
        },
      ],
      evidenceFiles: [
        {
          id: `ev-${i}-1`,
          name: `${code}-staging-capture.png`,
          size: "860 KB",
          type: "image/png",
          uploadedBy: dev1.name,
          uploadedAt: makeDateOffset(Math.min(0, dueOffset - 1)),
        },
      ],
      onHoldReason:
        status === "On Hold"
          ? "Awaiting final copy approval and high-res product photos from client stakeholder."
          : undefined,
      qaHistory,
      redFlaggedUserIds: status === "Re-Draw" ? [dev1.id] : [],
      createdAt,
    })
  }

  return items
}

export const MOCK_TASKS: Task[] = generateTasks()
