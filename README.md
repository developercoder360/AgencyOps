# AgencyOps — Multi-Brand Agency CRM & ERP Prototype

A frontend-only, high-fidelity agency operations dashboard prototype built with **Next.js 16 (App Router)**, **TypeScript (strict)**, **shadcn/ui (`radix-nova`)**, **TanStack Table v8**, **Tremor Raw (Recharts)**, **Tailwind CSS v4**, **react-hook-form + zod**, and **next-themes**.

> **Prototype Note:** All data is deterministic in-memory mock data (`/src/mocks/*.ts`) with zero backend APIs, database connections, or real payment charges.

---

## Tremor Approach Decision

During Phase 0 dependency verification, `@tremor/react@3.18.7` declared `peerDependencies: { react: '^18.0.0' }` and relies on Tailwind v3 config plugins, which conflicts with **React 19.3.0** and **Tailwind CSS v4.3.3**.

Instead of forcing `--legacy-peer-deps`, this project implements **Tremor Raw** copy-paste components under [`src/components/tremor/`](src/components/tremor/) powered by **Recharts `3.10.1`** and Tailwind v4 CSS design tokens:
- `AreaChart`
- `BarChart`
- `DonutChart`
- `ProgressBar`
- `BadgeDelta`
- `Tracker`

---

## Route Map

### Overview & Sales / Billing
| Route | Description |
| --- | --- |
| `/` | Redirects to `/dashboard` |
| `/dashboard` | Executive KPIs, brand & date-range filters, target progress bar, Tremor charts, recent transactions, due tasks, dismissible celebration card |
| `/brands` | Multi-brand directory + Create/Edit Sheet with live logo upload preview |
| `/leads` | Lead pipeline `<DataTable>`, Create/Edit Sheets, Detail Sheet with assignment-history timeline |
| `/sign-ups` | Website inquiry sign-ups `<DataTable>` + Detail Sheet with lead conversion action |
| `/invoices` | Multi-currency invoices `<DataTable>`, Create Sheet (dynamic line-item editor, tax/discount, live total), Detail Sheet (gateway badge & attachments) |
| `/invoice/[id]` | Standalone public hosted checkout page mockup (card form with success/decline simulation + bank transfer proof upload) |
| `/transactions` | Multi-gateway settlements `<DataTable>` (including Refund Requested, Refunded, Chargeback) + event timeline Dialog |
| `/marketing-spendings` | Tremor `BarChart` + Brand × Channel daily spend matrix + spend ledger |

### Delivery
| Route | Description |
| --- | --- |
| `/projects` | Projects `<DataTable>` with List/Card toggle, status filters, member avatars, and overdue deadline highlighting |
| `/projects/[id]` | Project workspace with Overview, Tasks, Files (client-visibility toggle), and Comments & Activity tabs |
| `/tasks` | 6-column Kanban board & `<DataTable>` toggle, subtasks, evidence upload, On Hold dialog, and QA Pass/Fail flow with red-flagging |
| `/chats` | Two-pane project chat with unread badges, read receipts, and message edit dialog |

### HR Management
| Route | Description |
| --- | --- |
| `/hrm/dashboard` | HR KPIs, daily attendance `<Tracker>`, 7-day `<AreaChart>`, and pending leave Approve / Reject-with-remarks |
| `/hrm/daily-attendance` | Daily attendance `<DataTable>`, manual-edit Dialog, and audit logs timeline Sheet |
| `/hrm/monthly-attendance-report` | Month picker enforcing the **26th-to-25th payroll window** + pivot grid with per-day status chips |
| `/hrm/leave-balances` | Staff PTO balances `<DataTable>` + quota adjustment Dialog |
| `/hrm/leave-requests` | Leave requests `<DataTable>`, Apply Leave Sheet, and Approve/Reject actions |
| `/hrm/leave-types` | Leave policy rules `<DataTable>` + Create Sheet |
| `/hrm/shift-scheduling` | Shift schedules `<DataTable>` + Create Sheet |
| `/hrm/holidays` | Regional & company holidays `<DataTable>` + Add Dialog |

### Admin, Exports, Settings & Auth UI
| Route | Description |
| --- | --- |
| `/users` | Staff directory `<DataTable>`, Invite User Sheet, and grouped module Permissions Sheet |
| `/users/[id]` | User 360° profile tabs (Attendance, Leads, Projects, Sales, Leave Balance) |
| `/teams` | Delivery & revenue teams `<DataTable>` + Create Sheet |
| `/cities` | Territory markets, billing currencies, and timezones `<DataTable>` + Add Dialog |
| `/export-logs` | Async export jobs `<DataTable>` (`queued`, `processing`, `completed`, `failed`) + shared `<ExportDialog>` |
| `/settings` | Company profile + organization logo upload preview |
| `/settings/security` | 2FA setup UI with QR placeholder SVG, TOTP verification, and backup recovery codes |
| `/login` | Standalone internal staff sign-in UI |
| `/two-factor-authentication` | Standalone 2FA verification & recovery code UI |

---

## Mock Data Approach

- **Interfaces:** Defined in [`src/types/index.ts`](src/types/index.ts).
- **Seeded Determinism:** [`src/mocks/seed.ts`](src/mocks/seed.ts) provides a Mulberry32 PRNG (`createSeededRandom`) and fixed reference date (`REFERENCE_DATE_ISO = "2026-11-11"`), preventing SSR/client hydration mismatches from `Math.random()` or `new Date()`.
- **Datasets:** Realistic agency datasets (~40–52 rows per primary table) live in [`src/mocks/`](src/mocks/) across `brands.ts`, `users.ts`, `leads.ts`, `billing.ts`, `marketing.ts`, `projects.ts`, `tasks.ts`, `chats.ts`, `hrm.ts`, and `exports.ts`.
- **Multi-Currency:** [`src/lib/currency.ts`](src/lib/currency.ts) normalizes `USD`, `GBP`, and `CAD` amounts into USD equivalents for dashboard KPIs, charts, and invoices.
- **Role-Based Demo Navigation:** [`src/lib/permissions.ts`](src/lib/permissions.ts) powers the Demo Role Switcher in the top-right user menu (`Super Admin`, `Sales/Account Manager`, `Project Admin`, `Designer/Developer`, `QA Reviewer`, `HR Manager`).

---

## Adding a New DataTable Page in Under 10 Lines

```tsx
"use client"
import { DataTable, DataTableColumnHeader } from "@/components/data-table"
import { PageHeader, StatusBadge } from "@/components/shared"
import { MOCK_ITEMS } from "@/mocks/items"

const columns = [
  { accessorKey: "name", header: ({ column }) => <DataTableColumnHeader column={column} title="Name" /> },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
]

export default function ExamplePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Example" description="Reusable table with search, filters, sorting, and export." />
      <DataTable columns={columns} data={MOCK_ITEMS} exportModule="Example" />
    </div>
  )
}
```

---

## Scripts

```bash
npm run dev    # Start local Next.js dev server
npm run lint   # Run ESLint checks
npm run build  # Type-check & build production bundle
```
