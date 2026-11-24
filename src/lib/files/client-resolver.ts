import type { Lead, Project, SignUp, Task } from "@/types"

export interface ResolvedClientProfile {
  canonicalId: string
  slug: string
  name: string
  company: string
  email?: string
  phone?: string
  city?: string
  brandName?: string
  serviceInterest?: string
  signupId?: string
  leadId?: string
  matchIds: string[]
  projects: Project[]
  tasks: Task[]
}

export function slugifyClientKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function getClientDetailHref(clientIdOrName: string): string {
  const trimmed = clientIdOrName.trim()
  if (!trimmed) return "/sign-ups"
  // Preserve IDs like "su-1" or "ld-1"; slugify names/company titles for clean URLs
  const isEntityId = /^(su|ld|cli)-/i.test(trimmed)
  const segment = isEntityId ? trimmed : slugifyClientKey(trimmed) || trimmed
  return `/clients/${encodeURIComponent(segment)}`
}

interface ResolverDataset {
  signups: SignUp[]
  leads: Lead[]
  projects: Project[]
  tasks: Task[]
}

export function resolveClientProfile(
  rawKey: string,
  { signups, leads, projects, tasks }: ResolverDataset
): ResolvedClientProfile | null {
  const decoded = decodeURIComponent(rawKey || "").trim()
  if (!decoded) return null
  const lower = decoded.toLowerCase()
  const keySlug = slugifyClientKey(decoded)

  // 1. Try SignUp exact ID or name match
  let matchedSignup = signups.find(
    (s) =>
      s.id.toLowerCase() === lower ||
      s.code.toLowerCase() === lower ||
      slugifyClientKey(s.name) === keySlug
  )

  // 2. Try Lead exact ID, company, or name match
  let matchedLead = leads.find(
    (l) =>
      l.id.toLowerCase() === lower ||
      l.code.toLowerCase() === lower ||
      slugifyClientKey(l.company || "") === keySlug ||
      slugifyClientKey(l.name) === keySlug
  )

  // 3. Try Project clientCompany or clientName match
  const matchedProjectsInitial = projects.filter(
    (p) =>
      slugifyClientKey(p.clientCompany || "") === keySlug ||
      slugifyClientKey(p.clientName || "") === keySlug ||
      (matchedSignup &&
        p.clientName.toLowerCase() === matchedSignup.name.toLowerCase()) ||
      (matchedLead &&
        (p.clientCompany.toLowerCase() === matchedLead.company.toLowerCase() ||
          p.clientName.toLowerCase() === matchedLead.name.toLowerCase()))
  )

  const primaryProject = matchedProjectsInitial[0]

  // Cross-link Lead / SignUp if only Project matched initially
  if (!matchedSignup && primaryProject) {
    matchedSignup = signups.find(
      (s) => s.name.toLowerCase() === primaryProject.clientName.toLowerCase()
    )
  }
  if (!matchedLead && primaryProject) {
    matchedLead = leads.find(
      (l) =>
        l.company.toLowerCase() === primaryProject.clientCompany.toLowerCase() ||
        l.name.toLowerCase() === primaryProject.clientName.toLowerCase()
    )
  }
  if (!matchedLead && matchedSignup?.leadId) {
    matchedLead = leads.find((l) => l.id === matchedSignup?.leadId)
  }

  if (!matchedSignup && !matchedLead && matchedProjectsInitial.length === 0) {
    return null
  }

  const name =
    matchedSignup?.name ||
    matchedLead?.name ||
    primaryProject?.clientName ||
    decoded
  const company =
    matchedLead?.company ||
    primaryProject?.clientCompany ||
    matchedSignup?.name ||
    decoded
  const slug = slugifyClientKey(company || name) || decoded
  const canonicalId = matchedSignup?.id || matchedLead?.id || `cli-${slug}`

  const matchIdSet = new Set<string>([canonicalId, slug, decoded])
  if (matchedSignup) {
    matchIdSet.add(matchedSignup.id)
    matchIdSet.add(slugifyClientKey(matchedSignup.name))
  }
  if (matchedLead) {
    matchIdSet.add(matchedLead.id)
    if (matchedLead.company) matchIdSet.add(slugifyClientKey(matchedLead.company))
    matchIdSet.add(slugifyClientKey(matchedLead.name))
  }
  if (primaryProject) {
    if (primaryProject.clientCompany) {
      matchIdSet.add(slugifyClientKey(primaryProject.clientCompany))
    }
    if (primaryProject.clientName) {
      matchIdSet.add(slugifyClientKey(primaryProject.clientName))
    }
  }

  // Gather all projects linked to this client
  const companyLower = company.toLowerCase()
  const nameLower = name.toLowerCase()
  const clientProjects = projects.filter(
    (p) =>
      p.clientCompany.toLowerCase() === companyLower ||
      p.clientName.toLowerCase() === nameLower ||
      (matchedSignup &&
        p.clientName.toLowerCase() === matchedSignup.name.toLowerCase()) ||
      (matchedLead &&
        (p.clientCompany.toLowerCase() === matchedLead.company.toLowerCase() ||
          p.clientName.toLowerCase() === matchedLead.name.toLowerCase()))
  )

  const projectIdSet = new Set(clientProjects.map((p) => p.id))
  const clientTasks = tasks.filter(
    (t) =>
      (t.clientId && matchIdSet.has(t.clientId)) ||
      (t.leadId && matchIdSet.has(t.leadId)) ||
      projectIdSet.has(t.projectId)
  )

  return {
    canonicalId,
    slug,
    name,
    company,
    email: matchedSignup?.email || matchedLead?.email,
    phone: matchedSignup?.phone || matchedLead?.phone,
    city: matchedSignup?.city || matchedLead?.city,
    brandName:
      matchedSignup?.brandName ||
      matchedLead?.brandName ||
      primaryProject?.brandName,
    serviceInterest: matchedSignup?.serviceInterest,
    signupId: matchedSignup?.id,
    leadId: matchedLead?.id,
    matchIds: Array.from(matchIdSet).filter(Boolean),
    projects: clientProjects,
    tasks: clientTasks,
  }
}

export function resolveTaskClientKey(
  task: Task,
  project: Project | undefined,
  signups: SignUp[],
  leads: Lead[]
): string | null {
  if (task.clientId) return task.clientId
  if (task.leadId) return task.leadId
  if (project) {
    const matchedSignup = signups.find(
      (s) => s.name.toLowerCase() === project.clientName.toLowerCase()
    )
    if (matchedSignup) return matchedSignup.id
    const matchedLead = leads.find(
      (l) =>
        l.company.toLowerCase() === project.clientCompany.toLowerCase() ||
        l.name.toLowerCase() === project.clientName.toLowerCase()
    )
    if (matchedLead) return matchedLead.id
    const slug = slugifyClientKey(project.clientCompany || project.clientName)
    if (slug) return `cli-${slug}`
  }
  return null
}
