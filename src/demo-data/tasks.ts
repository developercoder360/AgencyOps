import type {
  RevisionStatus,
  Task,
  TaskActivityEvent,
  TaskPriority,
  TaskRevision,
  TaskStatus,
  TaskTag,
} from "@/types"
import { MOCK_PROJECTS } from "./projects"
import { MOCK_USERS } from "./users"
import { createSeededRandom, intBetween, pickFrom } from "./seed"

const DEMO_REVISION_PRESETS = [
  {
    title: "Logo colour tweak",
    details: "Adjust primary brand cyan tint to meet WCAG AA contrast against slate-900 background.",
    requestedBy: "client" as const,
  },
  {
    title: "Change header image",
    details: "Replace stock hero graphic with hi-res product mock render from deliverables folder.",
    requestedBy: "internal" as const,
  },
  {
    title: "Resize for print",
    details: "Add 3mm bleeds and convert spot colors for offset CMYK vector output.",
    requestedBy: "client" as const,
  },
  {
    title: "Update CTA typography",
    details: "Increase font weight to 600 and adjust letter-spacing for mobile readability.",
    requestedBy: "internal" as const,
  },
  {
    title: "Fix responsive spacing",
    details: "Refine padding on 375px viewport to eliminate bottom gap and horizontal scroll.",
    requestedBy: "client" as const,
  },
]

const DEMO_TAGS: TaskTag[] = [
  { id: "tag-ui", label: "UI/UX", color: "blue" },
  { id: "tag-qa", label: "QA Ready", color: "violet" },
  { id: "tag-perf", label: "Performance", color: "emerald" },
  { id: "tag-client", label: "Client Review", color: "amber" },
  { id: "tag-a11y", label: "A11y", color: "cyan" },
  { id: "tag-copy", label: "Copy", color: "slate" },
]

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

    const revCount = status === "Re-Draw" ? Math.max(1, i % 4) : i % 4
    const revisions: TaskRevision[] = []

    for (let rIdx = 0; rIdx < revCount; rIdx++) {
      const preset = DEMO_REVISION_PRESETS[(i + rIdx) % DEMO_REVISION_PRESETS.length]
      let revStatus: RevisionStatus = "requested"
      if (status === "Complete") {
        revStatus = "approved"
      } else if (status === "Re-Draw") {
        revStatus = rIdx === 0 ? "in_progress" : "requested"
      } else if (status === "QA Review") {
        revStatus = "submitted"
      } else {
        const statuses: RevisionStatus[] = ["requested", "in_progress", "submitted", "approved", "rejected"]
        revStatus = statuses[(i + rIdx) % statuses.length]
      }

      const revCreated = makeDateOffset(Math.max(dueOffset - 4 + rIdx, -10))
      revisions.push({
        id: `rev-${i}-${rIdx + 1}`,
        number: rIdx + 1,
        title: preset.title,
        details: preset.details,
        requestedBy: preset.requestedBy,
        assigneeId: dev1.id,
        dueDate: makeDateOffset(Math.max(dueOffset - 1 + rIdx, -5)),
        status: revStatus,
        files:
          rIdx === 0
            ? [
                {
                  id: `rf-${i}-1`,
                  name: `${preset.title.toLowerCase().replace(/\s+/g, "-")}-spec.pdf`,
                  previewUrl: "/placeholder-spec.pdf",
                  size: "1.4 MB",
                  type: "application/pdf",
                  uploadedAt: `${revCreated}T10:00:00.000Z`,
                  uploadedBy: "Elena Rostova",
                },
              ]
            : [],
        createdAt: `${revCreated}T10:00:00.000Z`,
        updatedAt: `${revCreated}T16:30:00.000Z`,
        createdById: "usr-admin",
      })
    }

    const tags = [
      DEMO_TAGS[i % DEMO_TAGS.length],
      DEMO_TAGS[(i + 2) % DEMO_TAGS.length],
    ]

    const activity: TaskActivityEvent[] = [
      {
        id: `act-${i}-1`,
        type: "system",
        actorId: "usr-admin",
        actorName: "Marcus Vance",
        action: "created this task",
        timestamp: `${createdAt}T09:15:00.000Z`,
      },
      {
        id: `act-${i}-2`,
        type: "system",
        actorId: "usr-admin",
        actorName: "Devon Brooks",
        action: "assigned",
        field: "Assignees",
        toValue: dev2 ? `${dev1.name}, ${dev2.name}` : dev1.name,
        timestamp: `${createdAt}T09:45:00.000Z`,
      },
    ]
    if (status !== "Open") {
      activity.push({
        id: `act-${i}-3`,
        type: "system",
        actorId: dev1.id,
        actorName: dev1.name,
        action: "changed status",
        field: "Status",
        fromValue: "Open",
        toValue: status,
        timestamp: `${makeDateOffset(Math.min(-1, dueOffset - 2))}T13:10:00.000Z`,
      })
    }

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
      startDate: createdAt,
      dueDate,
      estimatedHours: intBetween(rng, 4, 24),
      loggedHours:
        status === "Open" ? 0 : intBetween(rng, 2, 18),
      tags,
      revisions,
      nextRevisionNumber: revCount + 1,
      comments: [
        {
          id: `tc-${i}-1`,
          authorId: dev1.id,
          authorName: dev1.name,
          content:
            "Started implementation against approved Figma frame. Will tag QA once staging preview builds.",
          createdAt: `${createdAt}T11:30:00.000Z`,
        },
        ...(status === "Re-Draw"
          ? [
              {
                id: `tc-${i}-2`,
                authorId: reviewer.id,
                authorName: reviewer.name,
                content:
                  "Flagged mobile CTA overflow at 375px and dark-mode subtitle contrast. Please verify fix and re-submit.",
                createdAt: `${makeDateOffset(-1)}T14:25:00.000Z`,
                isQaRelated: true,
                resolved: false,
              },
            ]
          : []),
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
      activity,
      watchers: [dev1.id, reviewer.id],
      createdAt,
    })
  }

  return items
}

export const MOCK_TASKS: Task[] = generateTasks()
