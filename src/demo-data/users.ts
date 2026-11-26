import type { ModulePermissions, PermissionModule, Role, StaffUser } from "@/types"
import crmSnapshot from "./crm-real-snapshot.json"
import { MOCK_BRANDS, MOCK_TEAMS } from "./brands"

const ALL_MODULES: PermissionModule[] = [
  "dashboard",
  "brands",
  "leads",
  "signups",
  "invoices",
  "transactions",
  "marketing",
  "projects",
  "tasks",
  "chats",
  "hrm",
  "users",
  "teams",
  "cities",
  "exports",
  "settings",
]

const AVATAR_COLORS = [
  "bg-blue-600",
  "bg-emerald-600",
  "bg-violet-600",
  "bg-amber-600",
  "bg-rose-600",
  "bg-indigo-600",
  "bg-cyan-600",
  "bg-teal-600",
]

function buildPermissions(role: Role): Record<PermissionModule, ModulePermissions> {
  const result = {} as Record<PermissionModule, ModulePermissions>
  for (const mod of ALL_MODULES) {
    const isAdmin = role === "Super Admin"
    const isSales =
      role === "Sales/Account Manager" &&
      ["dashboard", "brands", "leads", "signups", "invoices", "transactions", "marketing", "projects", "chats", "exports"].includes(mod)
    const isPm =
      role === "Project Admin" &&
      ["dashboard", "leads", "projects", "tasks", "chats", "teams", "exports"].includes(mod)
    const isDev =
      role === "Designer/Developer" &&
      ["dashboard", "projects", "tasks", "chats"].includes(mod)
    const isQa =
      role === "QA Reviewer" &&
      ["dashboard", "projects", "tasks", "chats", "exports"].includes(mod)
    const isHr =
      role === "HR Manager" &&
      ["dashboard", "hrm", "users", "teams", "cities", "exports", "settings"].includes(mod)

    const canView = isAdmin || isSales || isPm || isDev || isQa || isHr
    result[mod] = {
      view: canView,
      create: canView && !isDev && mod !== "transactions",
      edit: canView && (isAdmin || !isDev || mod === "tasks"),
      delete: isAdmin,
      export: isAdmin || isSales || isPm || isHr || (isQa && mod === "tasks"),
    }
  }
  return result
}

function inferRole(jobRole: string, department: string, idx: number): Role {
  if (idx === 0) return "Super Admin"
  const text = `${jobRole} ${department}`.toLowerCase()
  if (text.includes("human resource") || text.includes("hr")) return "HR Manager"
  if (text.includes("qa") || text.includes("quality")) return "QA Reviewer"
  if (text.includes("sales") || text.includes("account") || text.includes("biller") || text.includes("closer")) {
    return "Sales/Account Manager"
  }
  if (text.includes("manager") || text.includes("lead") || text.includes("head") || text.includes("admin")) {
    return "Project Admin"
  }
  return "Designer/Developer"
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "ST"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export const MOCK_USERS: StaffUser[] = crmSnapshot.staffUsers.map((u, idx) => {
  const role = inferRole(u.jobRole, u.department, idx)
  const team = MOCK_TEAMS[idx % MOCK_TEAMS.length]
  const primaryBrand = MOCK_BRANDS[idx % MOCK_BRANDS.length]
  const secondaryBrand = MOCK_BRANDS[(idx + 1) % MOCK_BRANDS.length]
  const brandIds =
    role === "Super Admin"
      ? MOCK_BRANDS.slice(0, 6).map((b) => b.id)
      : [primaryBrand.id, secondaryBrand.id]

  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role,
    department: u.department,
    teamId: team.id,
    teamName: team.name,
    brandIds,
    avatarInitials: getInitials(u.name),
    avatarColor: AVATAR_COLORS[idx % AVATAR_COLORS.length],
    phone: u.phone || "+1 (212) 555-0100",
    city: idx % 3 === 0 ? "Karachi" : idx % 3 === 1 ? "New York" : "London",
    timezone: idx % 3 === 0 ? "Asia/Karachi" : idx % 3 === 1 ? "America/New_York" : "Europe/London",
    status: "Active",
    joinedAt: u.joinDate,
    birthday: `199${idx % 6}-0${(idx % 9) + 1}-1${idx % 9}`,
    monthlyTargetUsd: role === "Sales/Account Manager" || role === "Super Admin" ? 35000 + idx * 1500 : 0,
    redFlagCount: 0,
    permissions: buildPermissions(role),
  }
})
