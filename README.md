# AgencyOps — Multi-Brand Agency CRM & ERP Prototype

A frontend-only, high-fidelity agency operations platform built with **Next.js 16 (App Router)**, **TypeScript (strict)**, **shadcn/ui (`radix-nova`)**, **TanStack Table v8**, **Tremor Raw (Recharts)**, **Tailwind CSS v4**, **react-hook-form + zod**, and **next-themes**.

> **Client-Side Persistence Architecture:** AgencyOps starts fresh and empty by default. All creations, edits, and deletions are saved directly to your browser's `localStorage` (`agencyops:data:v1`) with zero backend APIs or server databases required. Demo datasets can be loaded or cleared anytime via **Settings → Data Management**.

---

## Data Store & Persistence Architecture

The application state is managed by a centralized, typed client-side store under [`src/lib/store/`](src/lib/store/):
- **Core Store (`StoreManager`):** Implements subscription listeners, reactive updates, and snapshot caching via `useSyncExternalStore`.
- **Hydration Safety:** Avoids server/client hydration mismatches. Components display skeleton loading states during initial mount, synchronizing with localStorage post-mount.
- **Persistence:** Serializes to browser `localStorage` under `agencyops:data:v1` with automatic schema version validation and corrupted state recovery.
- **Data Management (Settings):**
  - **Export Backup:** Downloads complete state as `agencyops-backup-YYYY-MM-DD.json`.
  - **Import Backup:** Restores state from JSON file with validation.
  - **Load Demo Data:** Re-populates the app with the full multi-brand agency dataset from [`src/demo-data/`](src/demo-data/).
  - **Clear All Data:** Destructive reset requiring "DELETE" text confirmation.
  - **Storage Usage Meter:** Displays real-time KB consumption against the ~5 MB browser quota.

---

## Entity Relationship Rules (Block vs. Cascade)

The relations layer ([`src/lib/store/relations.ts`](src/lib/store/relations.ts)) enforces relational integrity before executing deletions:

### Deletion Block Rules (Referential Integrity)
| Entity | Deletion Constraint |
| --- | --- |
| **Brand** | **BLOCKED** if linked to any Leads, Invoices, Marketing Spend records, or Projects. Reassign or delete related items first. |
| **Team** | **BLOCKED** if referenced by active Staff Users. |
| **City** | **BLOCKED** if referenced by active Staff Users or Leads. |
| **User (Staff)** | **BLOCKED** if managing active Projects or assigned to incomplete Tasks. |
| **Lead** | **BLOCKED** if referenced by any Invoices. |
| **Shift Schedule** | **BLOCKED** if staff members are currently assigned to this shift. |
| **Leave Type** | **BLOCKED** if leave requests exist under this policy. |

### Cascade Deletion Rules
| Entity | Cascade Behavior |
| --- | --- |
| **Project** | **CASCADES** to delete all associated Tasks, Subtasks, Activity comments, and Project files. |
| **Invoice** | **CASCADES** to delete all associated Payment Transactions. |
| **Chat Thread** | Deleting a project chat thread deletes all chat messages within that thread. |

---

## Route Map

### Overview & Sales / Billing
| Route | Description |
| --- | --- |
| `/` | Redirects to `/dashboard` |
| `/dashboard` | Executive KPIs, Getting Started Onboarding Checklist, target attainment, Tremor charts, and recent activity |
| `/brands` | Multi-brand directory + Create/Edit Sheet with logo preview + relation deletion checks |
| `/leads` | Lead pipeline `<DataTable>`, Create/Edit Sheets, Detail Sheet with assignment timeline |
| `/sign-ups` | Website inquiry sign-ups `<DataTable>` + Convert to Lead dialog |
| `/invoices` | Multi-currency invoices `<DataTable>`, Create Sheet (dynamic line-item editor, tax/discount), Detail Sheet |
| `/invoice/[id]` | Standalone public hosted checkout page mockup (tokenized simulation; never stores real card data) |
| `/transactions` | Multi-gateway settlements `<DataTable>` + event timeline Dialog |
| `/marketing-spendings` | Tremor `BarChart` + Brand × Channel daily spend matrix + spend ledger |

### Delivery
| Route | Description |
| --- | --- |
| `/projects` | Projects `<DataTable>` with List/Card toggle, status filters, and member avatars |
| `/projects/[id]` | Project workspace with Overview, Tasks, Files (client-visibility toggle), and Comments |
| `/tasks` | 6-column Kanban board & `<DataTable>` toggle, subtasks, evidence upload, On Hold dialog, and QA Pass/Fail |
| `/chats` | Two-pane project chat with unread badges, read receipts, and message edit |

### HR Management
| Route | Description |
| --- | --- |
| `/hrm/dashboard` | HR KPIs, live daily roster `<Tracker>`, 7-day trend chart, and pending leave reviews |
| `/hrm/daily-attendance` | Daily attendance ledger, manual override dialog with audit logs |
| `/hrm/monthly-attendance-report` | Month picker enforcing the **26th-to-25th payroll window** + pivot grid with status chips |
| `/hrm/leave-balances` | Staff PTO balances `<DataTable>` + quota adjustment Dialog |
| `/hrm/leave-requests` | Leave requests `<DataTable>`, Apply Leave Sheet, and Approve/Reject actions |
| `/hrm/leave-types` | Leave policy rules `<DataTable>` + Create Sheet + relation protection |
| `/hrm/shift-scheduling` | Shift schedules `<DataTable>` + Create Sheet + relation protection |
| `/hrm/holidays` | Regional & company holidays `<DataTable>` + Add Dialog |

### Admin, Exports, Settings & Auth UI
| Route | Description |
| --- | --- |
| `/users` | Staff directory `<DataTable>`, Invite User Sheet, and grouped module Permissions Sheet |
| `/users/[id]` | User 360° profile tabs (Attendance, Leads, Projects, Sales, Leave Balance) |
| `/teams` | Delivery & revenue teams `<DataTable>` + Create Sheet |
| `/cities` | Territory markets, billing currencies, and timezones `<DataTable>` + Add Dialog |
| `/export-logs` | Async export jobs `<DataTable>` + CSV/XLSX download action |
| `/settings` | General settings + Client-Side Data Management (backup, import, load demo, wipe) |
| `/settings/security` | 2FA setup UI with QR placeholder SVG, TOTP verification, and backup recovery codes |
| `/login` | Standalone internal staff sign-in UI |
| `/two-factor-authentication` | Standalone 2FA verification & recovery code UI |

---

## Adding a New Entity to Store & UI in Under 15 Lines

### 1. Register Action in Store
```ts
// In src/lib/store/types.ts & store.ts:
createNote: (note: Omit<Note, "id" | "createdAt">) => storeManager.createEntity("notes", note)
```

### 2. Consume in Component
```tsx
"use client"
import { DataTable } from "@/components/data-table"
import { PageHeader } from "@/components/shared"
import { useStore } from "@/lib/store"

export default function NotesPage() {
  const { notes, isLoaded } = useStore()
  if (!isLoaded) return <div className="p-6">Loading...</div>
  return (
    <div className="space-y-6">
      <PageHeader title="Notes" description="Live entity connected to browser store." />
      <DataTable columns={noteColumns} data={notes} exportModule="Notes" />
    </div>
  )
}
```

---

## Hosted Invoices & Security Note

The hosted checkout preview at `/invoice/[id]` simulates real payment gateway flows (Stripe Elements, PayPal, Bank Transfer proof upload). **No real cards, bank accounts, or credentials are ever transmitted, charged, or stored.** All transaction records are generated tokenized client-side and saved only in the local browser session.
