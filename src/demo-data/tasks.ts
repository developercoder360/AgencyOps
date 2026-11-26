import type { Task, TaskPriority, TaskStatus } from "@/types"
import crmSnapshot from "./crm-real-snapshot.json"
import { MOCK_PROJECTS } from "./projects"
import { MOCK_USERS } from "./users"

function normalizeTaskStatus(raw: string): TaskStatus {
  const s = raw.toLowerCase()
  if (s.includes("complete")) return "Complete"
  if (s.includes("qa")) return "QA Review"
  if (s.includes("draw")) return "Re-Draw"
  if (s.includes("hold")) return "On Hold"
  if (s.includes("progress")) return "Progress"
  return "Open"
}

function normalizePriority(raw: string): TaskPriority {
  const p = raw.toLowerCase()
  if (p.includes("urgent")) return "Urgent"
  if (p.includes("high")) return "High"
  return "Regular"
}

export const MOCK_TASKS: Task[] = crmSnapshot.tasks.map((t, idx) => {
  const project =
    MOCK_PROJECTS.find((p) => p.id === `prj-${t.projectRawId}`) ??
    MOCK_PROJECTS[idx % MOCK_PROJECTS.length]
  const assignee = MOCK_USERS[idx % MOCK_USERS.length]
  const reviewer = MOCK_USERS[(idx + 1) % MOCK_USERS.length] ?? assignee
  const status = normalizeTaskStatus(t.status)

  return {
    id: t.id,
    code: `TSK-${t.rawId}`,
    title: t.title,
    description: t.description || t.title,
    projectId: project.id,
    projectName: project.name,
    brandId: project.brandId,
    brandName: project.brandName,
    status,
    priority: normalizePriority(t.priority),
    assigneeIds: assignee ? [assignee.id] : [],
    reviewerId: reviewer?.id ?? "usr-1",
    startDate: t.startDate,
    dueDate: t.deadline,
    completedAt: t.completedOn || undefined,
    revisions: [],
    comments: [],
    evidenceFiles: [],
    qaHistory: [],
    redFlaggedUserIds: [],
    activity: [],
    watchers: assignee ? [assignee.id] : [],
    createdAt: t.startDate,
  }
})
