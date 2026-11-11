"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft, Mail, MapPin, Phone } from "lucide-react"
import { KpiCard, PageHeader, StatusBadge } from "@/components/shared"
import { getAvatarToneClass } from "@/lib/theme"
import { ProgressBar } from "@/components/tremor"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency, formatUsdEquivalent, toUsd } from "@/lib/currency"
import { MOCK_INVOICES } from "@/mocks/billing"
import { MOCK_ATTENDANCE_RECORDS, MOCK_LEAVE_BALANCES } from "@/mocks/hrm"
import { MOCK_LEADS } from "@/mocks/leads"
import { MOCK_PROJECTS } from "@/mocks/projects"
import type { StaffUser } from "@/types"

export function User360Client({ user }: { user: StaffUser }) {
  const attendance = React.useMemo(
    () => MOCK_ATTENDANCE_RECORDS.filter((a) => a.userId === user.id),
    [user.id]
  )
  const leads = React.useMemo(
    () => MOCK_LEADS.filter((l) => l.assignedStaffIds.includes(user.id)),
    [user.id]
  )
  const projects = React.useMemo(
    () =>
      MOCK_PROJECTS.filter(
        (p) => p.managerId === user.id || p.memberIds.includes(user.id)
      ),
    [user.id]
  )
  const salesInvoices = React.useMemo(
    () => MOCK_INVOICES.filter((inv) => inv.salesRepId === user.id),
    [user.id]
  )
  const leaveBalance = React.useMemo(
    () =>
      MOCK_LEAVE_BALANCES.find((b) => b.userId === user.id) ??
      MOCK_LEAVE_BALANCES[0],
    [user.id]
  )

  const totalSalesUsd = React.useMemo(
    () =>
      salesInvoices
        .filter((inv) => inv.status === "Success")
        .reduce((acc, inv) => acc + toUsd(inv.total, inv.currency), 0),
    [salesInvoices]
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title={user.name}
        description={`${user.role} • ${user.teamName} • Joined ${user.joinedAt}`}
        badge={<StatusBadge status={user.status} />}
        actions={
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href="/users">
              <ArrowLeft className="size-4" />
              Back to Users
            </Link>
          </Button>
        }
      />

      {/* Profile Header Card */}
      <Card>
        <CardContent className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="size-14">
              <AvatarFallback
                className={`text-base font-bold ${getAvatarToneClass(user.avatarColor)}`}
              >
                {user.avatarInitials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-foreground">
                  {user.department}
                </span>
                <Badge variant="outline">{user.timezone}</Badge>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Mail className="size-3.5" />
                  {user.email}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Phone className="size-3.5" />
                  {user.phone}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" />
                  {user.city}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t border-border pt-3 text-center sm:border-t-0 sm:pt-0">
            <div>
              <div className="text-xs text-muted-foreground">Leads</div>
              <div className="text-lg font-bold tabular-nums">
                {leads.length}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Projects</div>
              <div className="text-lg font-bold tabular-nums">
                {projects.length}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">QA Flags</div>
              <div className="font-display text-lg font-bold tabular-nums text-(--tone-rose-text)">
                {user.redFlagCount}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User 360 Tabs */}
      <Tabs defaultValue="attendance" className="space-y-4">
        <TabsList className="w-full flex-wrap justify-start gap-1 group-data-horizontal/tabs:h-auto">
          <TabsTrigger value="attendance">
            Attendance ({attendance.length})
          </TabsTrigger>
          <TabsTrigger value="leads">Leads ({leads.length})</TabsTrigger>
          <TabsTrigger value="projects">
            Projects ({projects.length})
          </TabsTrigger>
          <TabsTrigger value="sales">
            Sales ({salesInvoices.length})
          </TabsTrigger>
          <TabsTrigger value="leave">Leave Balance</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>Recent Attendance Logs</CardTitle>
              <CardDescription>
                Daily shift adherence and logged hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              {attendance.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No recent attendance records for this profile.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Shift</TableHead>
                        <TableHead>Check In</TableHead>
                        <TableHead>Check Out</TableHead>
                        <TableHead>Hours</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendance.map((rec) => (
                        <TableRow key={rec.id}>
                          <TableCell className="font-mono text-xs">
                            {rec.date}
                          </TableCell>
                          <TableCell className="text-xs">
                            {rec.shiftName}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {rec.checkIn ?? "—"}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {rec.checkOut ?? "—"}
                          </TableCell>
                          <TableCell className="tabular-nums text-xs">
                            {rec.workHours}h
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={rec.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leads">
          <Card>
            <CardHeader>
              <CardTitle>Assigned Leads</CardTitle>
            </CardHeader>
            <CardContent>
              {leads.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No sales leads currently assigned to {user.name}.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leads.map((l) => (
                        <TableRow key={l.id}>
                          <TableCell className="font-mono text-xs">
                            {l.code}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{l.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {l.company}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">{l.brandName}</TableCell>
                          <TableCell className="tabular-nums text-xs font-medium">
                            {formatCurrency(l.estimatedValue, l.currency)}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={l.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <CardTitle>Assigned Projects</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {projects.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No active project assignments.
                </p>
              ) : (
                projects.map((p) => (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className="flex flex-col gap-2 rounded-lg border border-border p-3 hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-primary">
                          {p.code}
                        </span>
                        <StatusBadge status={p.status} />
                      </div>
                      <div className="mt-1 font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {p.brandName} • Deadline {p.deadline}
                      </div>
                    </div>
                    <div className="w-36">
                      <ProgressBar value={p.progress} label={`${p.progress}%`} />
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <KpiCard
              title="Settled Revenue (USD Eq.)"
              value={formatCurrency(totalSalesUsd)}
              subtitle={`${salesInvoices.length} attributed invoices`}
            />
            <KpiCard
              title="Monthly Sales Quota"
              value={
                user.monthlyTargetUsd > 0
                  ? formatCurrency(user.monthlyTargetUsd)
                  : "N/A (Non-Sales)"
              }
              subtitle="Monthly agency revenue target"
            />
          </div>
          <Card>
            <CardContent className="pt-4">
              {salesInvoices.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No invoices attributed to {user.name}.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesInvoices.map((inv) => (
                        <TableRow key={inv.id}>
                          <TableCell className="font-mono text-xs">
                            {inv.invoiceNumber}
                          </TableCell>
                          <TableCell>{inv.clientCompany}</TableCell>
                          <TableCell className="tabular-nums text-xs">
                            {formatUsdEquivalent(inv.total, inv.currency)}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={inv.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leave">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Annual Leave</CardTitle>
                <CardDescription>
                  {leaveBalance.annualTotal - leaveBalance.annualUsed} of{" "}
                  {leaveBalance.annualTotal} remaining
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProgressBar
                  value={Math.round(
                    (leaveBalance.annualUsed / leaveBalance.annualTotal) * 100
                  )}
                  label={`${leaveBalance.annualUsed} used`}
                  color="blue"
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Sick Leave</CardTitle>
                <CardDescription>
                  {leaveBalance.sickTotal - leaveBalance.sickUsed} of{" "}
                  {leaveBalance.sickTotal} remaining
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProgressBar
                  value={Math.round(
                    (leaveBalance.sickUsed / leaveBalance.sickTotal) * 100
                  )}
                  label={`${leaveBalance.sickUsed} used`}
                  color="emerald"
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Casual & Carry Forward</CardTitle>
                <CardDescription>
                  {leaveBalance.casualTotal - leaveBalance.casualUsed} casual left
                  • +{leaveBalance.carryForward} carried forward
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProgressBar
                  value={Math.round(
                    (leaveBalance.casualUsed / leaveBalance.casualTotal) * 100
                  )}
                  label={`${leaveBalance.casualUsed} used`}
                  color="violet"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
