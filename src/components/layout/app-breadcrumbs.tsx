"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  brands: "Brands",
  leads: "Leads",
  "sign-ups": "Sign Ups",
  invoices: "Invoices",
  transactions: "Transactions",
  "marketing-spendings": "Marketing Spendings",
  projects: "Projects",
  tasks: "Tasks",
  chats: "Chats",
  hrm: "HR Management",
  "daily-attendance": "Daily Attendance",
  "monthly-attendance-report": "Monthly Report",
  "leave-balances": "Leave Balances",
  "leave-requests": "Leave Requests",
  "leave-types": "Leave Types",
  "shift-scheduling": "Shift Scheduling",
  holidays: "Holidays",
  users: "Users",
  teams: "Teams",
  cities: "Cities",
  "export-logs": "Export Logs",
  settings: "Settings",
  security: "Security & 2FA",
}

function formatSegment(segment: string): string {
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment]
  return segment.toUpperCase()
}

export function AppBreadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  if (segments.length === 0) return null

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/dashboard" className="inline-flex items-center gap-1">
              <Home className="size-3.5" aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">Home</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {segments.map((segment, index) => {
          const href = `/${segments.slice(0, index + 1).join("/")}`
          const isLast = index === segments.length - 1
          const label = formatSegment(segment)
          const nonRoutableGroup = segment === "hrm"

          return (
            <React.Fragment key={href}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : nonRoutableGroup ? (
                  <BreadcrumbLink asChild>
                    <Link href="/hrm/dashboard">{label}</Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={href}>{label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
