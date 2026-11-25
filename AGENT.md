# Agency Delivery & Operations Dashboard (`AGENT.md`)

This repository is a Next.js 16 (App Router + Turbopack) agency delivery, project management, HRM, and client operations dashboard built with React 19, TypeScript, Tailwind CSS v4, shadcn/ui, TanStack Table, Recharts, and Tiptap.

---

## Tech Stack
- **Framework**: Next.js `16.4.6` (App Router, Turbopack)
- **Language**: TypeScript (`strict`, no `any`)
- **UI**: shadcn/ui (`radix-ui`), Tailwind CSS v4, `lucide-react`, `sonner`
- **Forms & Validation**: `react-hook-form` + `zod` + `@hookform/resolvers`
- **Tables & Charts**: `@tanstack/react-table`, `recharts`
- **Rich Text**: Tiptap (`@tiptap/react`, `@tiptap/starter-kit`, official extensions) + `isomorphic-dompurify`, `lowlight`, `katex`
- **Dates**: `date-fns` + `react-day-picker` (`DatePicker` in `src/components/ui/date-picker.tsx`)

---

## Project Structure
- `src/app/(app)/` — Authenticated app routes:
  - `projects/` — Project workspaces (CRUD, List/Card views, project detail)
  - `tasks/` — Task index (Board / List / Table views, pagination, filters, task detail drawer)
  - `chats/` — Project chat threads with replies, `@mentions`, attachments, reactions, pinning
  - `hrm/` — `daily-attendance/` (including CSV import), `leave-requests/`, `leave-types/`, `shift-scheduling/`, `holidays/`
  - `invoices/`, `leads/`, `files/`, `settings/`, `dev/rich-text/`
- `src/components/rich-text/` — Reusable Tiptap `RichTextEditor` (`full | compact | comment | minimal`), `RichTextViewer`, custom nodes (attachments, callouts, details, math, images, tables, slash commands, mentions, find/replace), and `DOMPurify` sanitization.
- `src/components/tasks/` & `src/components/delivery/task-detail/` — Task management views, `TaskFormDialog`, `TaskDetailPanel`, `TaskRevisions`, `TaskDescriptionEditor`, `TaskActivitySidebar`.
- `src/components/ui/` — shadcn/ui primitives + shared `DatePicker` and `rich-text-editor.tsx` compatibility exports.
- `src/lib/store/` — Client-side state store (`StoreProvider`, `useStore`) persisted to `localStorage` with relational deletion checks.
- `src/lib/permissions.ts` — Permission-based access control helpers.
- `src/types/` — Shared TypeScript domain interfaces (`index.ts`, `rich-text.ts`).

---

## Engineering Conventions
1. **Strict TypeScript**: Never use `any`. Run `npx tsc --noEmit` after edits.
2. **React Compiler & ESLint**: Avoid calling `setState` synchronously inside `useEffect`, avoid reading/writing refs during render, and avoid mutating `editor` instances directly inside effects (use Tiptap commands instead). Run `npx eslint <files>` after edits.
3. **SSR Safety**: Dynamic-import client-only rich editors (`ssr: false`) and use `immediatelyRender: false` in Tiptap `useEditor` to prevent Next.js hydration mismatches.
4. **Datepickers**: Always use `DatePicker` (`src/components/ui/date-picker.tsx`) or `Calendar` + `Popover` + `date-fns` (`format`, `parseISO`) instead of native `<input type="date">`.
5. **Rich Text**: Use `RichTextEditor` for long-text inputs and `RichTextViewer` (sanitized via `DOMPurify`) for rendering stored HTML/JSON content.
6. **UI Consistency**: Use existing shadcn/ui primitives (`Button`, `Dialog`, `Sheet`, `Popover`, `DropdownMenu`, `Badge`, `Command`, `Input`) and theme CSS variables so light and dark modes stay consistent.

---

## Common Commands
- `npm run dev` — Start development server
- `npm run build` — Production build
- `npx tsc --noEmit` — Type-check the project
- `npx eslint src/` — Lint source files
