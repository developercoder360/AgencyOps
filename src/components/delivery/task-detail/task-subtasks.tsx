"use client"

import * as React from "react"
import { Calendar, ListTodo, Plus, Trash2, User } from "lucide-react"
import { StatusBadge } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import type { StaffUser, Subtask, TaskStatus } from "@/types"
import { cn } from "cn"
import { TASK_STATUSES } from "./types"

interface TaskSubtasksProps {
  subtasks: Subtask[]
  users: StaffUser[]
  defaultAssigneeId: string
  defaultDueDate: string
  todayIso: string
  canEdit: boolean
  onAdd: (title: string, assigneeId: string, dueDate?: string) => void
  onToggle: (subtaskId: string, completed: boolean) => void
  onUpdate: (subtaskId: string, updates: Partial<Subtask>) => void
  onDelete: (subtaskId: string) => void
}

export function TaskSubtasks({
  subtasks,
  users,
  defaultAssigneeId,
  defaultDueDate,
  todayIso,
  canEdit,
  onAdd,
  onToggle,
  onUpdate,
  onDelete,
}: TaskSubtasksProps) {
  const [newTitle, setNewTitle] = React.useState("")
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editDraft, setEditDraft] = React.useState("")
  const addInputRef = React.useRef<HTMLInputElement | null>(null)

  const doneCount = subtasks.filter((s) => s.completed).length
  const pct =
    subtasks.length > 0 ? Math.round((doneCount / subtasks.length) * 100) : 0

  function handleAdd(e?: React.FormEvent) {
    e?.preventDefault()
    const trimmed = newTitle.trim()
    if (!trimmed) return
    onAdd(trimmed, defaultAssigneeId, defaultDueDate)
    setNewTitle("")
  }

  function startTitleEdit(st: Subtask) {
    if (!canEdit) return
    setEditingId(st.id)
    setEditDraft(st.title)
  }

  function commitTitleEdit(st: Subtask) {
    const trimmed = editDraft.trim()
    if (trimmed && trimmed !== st.title) {
      onUpdate(st.id, { title: trimmed })
    }
    setEditingId(null)
  }

  return (
    <section aria-label="Subtasks" className="space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Subtasks
          </h3>
          <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[11px] font-medium tabular-nums text-muted-foreground">
            {doneCount}/{subtasks.length}
          </span>
        </div>
        {subtasks.length > 0 ? (
          <div className="flex w-28 items-center gap-2">
            <Progress value={pct} className="h-1.5" />
            <span className="text-[11px] tabular-nums text-muted-foreground">
              {pct}%
            </span>
          </div>
        ) : null}
      </div>

      <div className="rounded-lg border border-border bg-card">
        {subtasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1.5 px-4 py-6 text-center">
            <ListTodo className="size-5 text-muted-foreground/60" />
            <p className="text-xs text-muted-foreground">
              Break this deliverable into trackable subtasks.
            </p>
            {canEdit ? (
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => addInputRef.current?.focus()}
                className="mt-1 gap-1"
              >
                <Plus className="size-3" />
                Add first subtask
              </Button>
            ) : null}
          </div>
        ) : (
          <ul className="divide-y divide-border/70">
            {subtasks.map((st) => {
              const assignee = users.find((u) => u.id === st.assigneeId)
              const stStatus: TaskStatus =
                st.status ?? (st.completed ? "Complete" : "Open")
              const overdue =
                !st.completed && Boolean(st.dueDate) && st.dueDate! < todayIso

              return (
                <li
                  key={st.id}
                  className="group flex flex-wrap items-center gap-2 px-3 py-2 text-xs hover:bg-muted/30 sm:flex-nowrap"
                >
                  <Checkbox
                    checked={st.completed}
                    disabled={!canEdit}
                    onCheckedChange={(checked) =>
                      onToggle(st.id, Boolean(checked))
                    }
                    aria-label={`Mark subtask "${st.title}" ${
                      st.completed ? "incomplete" : "complete"
                    }`}
                  />

                  {/* Title */}
                  <div className="min-w-0 flex-1">
                    {editingId === st.id ? (
                      <Input
                        autoFocus
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                        onBlur={() => commitTitleEdit(st)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            commitTitleEdit(st)
                          } else if (e.key === "Escape") {
                            e.stopPropagation()
                            setEditingId(null)
                          }
                        }}
                        aria-label="Edit subtask title"
                        className="h-6 px-1.5 text-xs"
                      />
                    ) : canEdit ? (
                      <button
                        type="button"
                        onClick={() => startTitleEdit(st)}
                        className={cn(
                          "block w-full truncate rounded px-1 py-0.5 text-left text-xs font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-[13px]",
                          st.completed && "text-muted-foreground line-through"
                        )}
                      >
                        {st.title}
                      </button>
                    ) : (
                      <span
                        className={cn(
                          "block truncate text-xs font-medium sm:text-[13px]",
                          st.completed && "text-muted-foreground line-through"
                        )}
                      >
                        {st.title}
                      </span>
                    )}
                  </div>

                  {/* Right metadata: Status, Due Date, Assignee, Delete */}
                  <div className="flex shrink-0 items-center gap-1.5">
                    {canEdit ? (
                      <Select
                        value={stStatus}
                        onValueChange={(v) =>
                          onUpdate(st.id, { status: v as TaskStatus })
                        }
                      >
                        <SelectTrigger
                          aria-label={`Status for ${st.title}`}
                          className="h-6 w-auto border-transparent bg-transparent px-1 text-[11px] shadow-none hover:border-border"
                        >
                          <StatusBadge
                            status={stStatus}
                            className="px-1.5 py-0 text-[10px]"
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {TASK_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              <StatusBadge status={s} />
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <StatusBadge
                        status={stStatus}
                        className="px-1.5 py-0 text-[10px]"
                      />
                    )}

                    {/* Subtask Due Date */}
                    {canEdit ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            aria-label={`Due date for ${st.title}`}
                            className={cn(
                              "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] tabular-nums transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                              overdue
                                ? "font-semibold text-rose-600 dark:text-rose-400"
                                : "text-muted-foreground"
                            )}
                          >
                            <Calendar className="size-3" />
                            <span>{st.dueDate ? st.dueDate.slice(5) : "Date"}</span>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-48 p-2">
                          <Input
                            type="date"
                            value={st.dueDate ?? ""}
                            onChange={(e) =>
                              onUpdate(st.id, {
                                dueDate: e.target.value || undefined,
                              })
                            }
                            aria-label="Subtask due date"
                            className="h-7 text-xs"
                          />
                        </PopoverContent>
                      </Popover>
                    ) : st.dueDate ? (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-[11px] tabular-nums",
                          overdue
                            ? "font-semibold text-rose-600 dark:text-rose-400"
                            : "text-muted-foreground"
                        )}
                      >
                        <Calendar className="size-3" />
                        {st.dueDate.slice(5)}
                      </span>
                    ) : null}

                    {/* Subtask Assignee */}
                    {canEdit ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            title={assignee ? assignee.name : "Assign member"}
                            aria-label={`Assignee for ${st.title}`}
                            className="inline-flex size-6 items-center justify-center rounded-full transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            {assignee ? (
                              <span
                                className={cn(
                                  "flex size-6 items-center justify-center rounded-full text-[9px] font-bold text-white",
                                  assignee.avatarColor
                                )}
                              >
                                {assignee.avatarInitials}
                              </span>
                            ) : (
                              <span className="flex size-6 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground">
                                <User className="size-3" />
                              </span>
                            )}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-52 p-1.5">
                          <div className="max-h-48 space-y-0.5 overflow-y-auto">
                            {users.map((u) => (
                              <button
                                key={u.id}
                                type="button"
                                onClick={() =>
                                  onUpdate(st.id, { assigneeId: u.id })
                                }
                                className={cn(
                                  "flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs hover:bg-muted",
                                  u.id === st.assigneeId && "bg-muted font-medium"
                                )}
                              >
                                <span
                                  className={cn(
                                    "flex size-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white",
                                    u.avatarColor
                                  )}
                                >
                                  {u.avatarInitials}
                                </span>
                                <span className="truncate">{u.name}</span>
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    ) : assignee ? (
                      <span
                        title={assignee.name}
                        className={cn(
                          "flex size-6 items-center justify-center rounded-full text-[9px] font-bold text-white",
                          assignee.avatarColor
                        )}
                      >
                        {assignee.avatarInitials}
                      </span>
                    ) : null}

                    {canEdit ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => onDelete(st.id)}
                        aria-label={`Delete subtask ${st.title}`}
                        className="opacity-60 transition-opacity hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {/* Inline Add Subtask */}
        {canEdit ? (
          <form
            onSubmit={handleAdd}
            className="flex items-center gap-2 border-t border-border bg-muted/20 px-3 py-2"
          >
            <Plus className="size-3.5 shrink-0 text-muted-foreground" />
            <Input
              ref={addInputRef}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.stopPropagation()
                  setNewTitle("")
                  addInputRef.current?.blur()
                }
              }}
              placeholder="Add subtask… (Enter to create)"
              aria-label="Add subtask"
              className="h-7 border-0 bg-transparent px-1 text-xs shadow-none focus-visible:ring-0"
            />
            {newTitle.trim() ? (
              <Button type="submit" size="xs" variant="secondary">
                Add
              </Button>
            ) : null}
          </form>
        ) : null}
      </div>
    </section>
  )
}
