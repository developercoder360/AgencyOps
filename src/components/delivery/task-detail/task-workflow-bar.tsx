"use client"

import * as React from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  PauseCircle,
  PlayCircle,
  SendHorizontal,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { TaskRolePermissions } from "@/lib/permissions"
import type { StaffUser, Task } from "@/types"
import { QA_FAIL_CATEGORIES } from "./types"

const onHoldSchema = z.object({
  reason: z
    .string()
    .min(5, "Provide a brief reason for putting this task on hold"),
})

const qaFailSchema = z.object({
  category: z.string().min(1, "Select a QA category"),
  reason: z.string().min(6, "Describe what failed QA verification"),
  evidenceName: z.string().min(2, "Provide an evidence screenshot/file name"),
})

interface TaskWorkflowBarProps {
  task: Task
  users: StaffUser[]
  permissions: TaskRolePermissions
  holdDialogOpen: boolean
  onHoldDialogOpenChange: (open: boolean) => void
  onSubmitOnHold: (reason: string) => void
  onResumeFromHold: () => void
  onSendToQa: () => void
  onQaPass: () => void
  onSubmitQaFail: (payload: {
    category: string
    reason: string
    evidenceName: string
    redFlagUserIds: string[]
  }) => void
}

export function TaskWorkflowBar({
  task,
  users,
  permissions,
  holdDialogOpen,
  onHoldDialogOpenChange,
  onSubmitOnHold,
  onResumeFromHold,
  onSendToQa,
  onQaPass,
  onSubmitQaFail,
}: TaskWorkflowBarProps) {
  const [qaFailOpen, setQaFailOpen] = React.useState(false)
  const [redFlagUsers, setRedFlagUsers] = React.useState<string[]>([])

  const holdForm = useForm<z.infer<typeof onHoldSchema>>({
    resolver: zodResolver(onHoldSchema),
    defaultValues: { reason: task.onHoldReason ?? "" },
  })

  const qaFailForm = useForm<z.infer<typeof qaFailSchema>>({
    resolver: zodResolver(qaFailSchema),
    defaultValues: {
      category: QA_FAIL_CATEGORIES[0],
      reason: "",
      evidenceName: `${task.code.toLowerCase()}-qa-issue.png`,
    },
  })

  // Visibility rules based on role + task state
  const showPutOnHold =
    permissions.canPutOnHold &&
    task.status !== "On Hold" &&
    task.status !== "Complete"
  const showResumeHold = permissions.canPutOnHold && task.status === "On Hold"
  const showSendToQa =
    permissions.canSendToQa &&
    task.status !== "QA Review" &&
    task.status !== "Complete"
  const showQaActions =
    permissions.canQaReview &&
    task.status !== "Complete" &&
    (task.status === "QA Review" ||
      task.status === "Progress" ||
      task.status === "Re-Draw")

  const hasAnyAction =
    showPutOnHold || showResumeHold || showSendToQa || showQaActions

  function openHold() {
    holdForm.reset({ reason: task.onHoldReason ?? "" })
    onHoldDialogOpenChange(true)
  }

  function openQaFail() {
    setRedFlagUsers([...task.assigneeIds])
    qaFailForm.reset({
      category: QA_FAIL_CATEGORIES[0],
      reason: "",
      evidenceName: `${task.code.toLowerCase()}-qa-issue.png`,
    })
    setQaFailOpen(true)
  }

  function handleHoldFormSubmit(values: z.infer<typeof onHoldSchema>) {
    onSubmitOnHold(values.reason)
    holdForm.reset({ reason: "" })
    onHoldDialogOpenChange(false)
  }

  function handleQaFailSubmit(values: z.infer<typeof qaFailSchema>) {
    onSubmitQaFail({
      category: values.category,
      reason: values.reason,
      evidenceName: values.evidenceName,
      redFlagUserIds: redFlagUsers,
    })
    setQaFailOpen(false)
  }

  const taskAssignees = users.filter((u) => task.assigneeIds.includes(u.id))

  return (
    <>
      {hasAnyAction ? (
        <div
          aria-label="Workflow actions"
          className="flex h-12 shrink-0 items-center justify-between gap-2 border-t border-border bg-card/95 px-4 backdrop-blur-xs"
        >
          <div className="flex flex-wrap items-center gap-2">
            {showPutOnHold ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={openHold}
                className="gap-1.5 text-xs"
              >
                <PauseCircle className="size-3.5 text-amber-600 dark:text-amber-400" />
                On Hold
              </Button>
            ) : null}

            {showResumeHold ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onResumeFromHold}
                className="gap-1.5 text-xs"
              >
                <PlayCircle className="size-3.5 text-primary" />
                Resume Task
              </Button>
            ) : null}

            {showSendToQa ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onSendToQa}
                className="gap-1.5 text-xs"
              >
                <SendHorizontal className="size-3.5 text-violet-600 dark:text-violet-400" />
                Send to QA
              </Button>
            ) : null}
          </div>

          {showQaActions ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={openQaFail}
                className="gap-1.5 text-xs"
              >
                <ShieldAlert className="size-3.5" />
                QA Fail
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={onQaPass}
                className="gap-1.5 bg-emerald-600 text-xs text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
              >
                <ShieldCheck className="size-3.5" />
                QA Pass
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* On Hold Dialog */}
      <Dialog open={holdDialogOpen} onOpenChange={onHoldDialogOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PauseCircle className="size-4 text-amber-600 dark:text-amber-400" />
              Place Task On Hold
            </DialogTitle>
            <DialogDescription>
              Specify the blocker dependency for {task.code}.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={holdForm.handleSubmit(handleHoldFormSubmit)}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="td-hold-reason">Blocker Reason</Label>
              <Textarea
                id="td-hold-reason"
                rows={3}
                placeholder="e.g., Waiting on client copy sign-off and brand imagery..."
                {...holdForm.register("reason")}
              />
              {holdForm.formState.errors.reason ? (
                <p className="text-xs text-destructive">
                  {holdForm.formState.errors.reason.message}
                </p>
              ) : null}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onHoldDialogOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Confirm On Hold</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* QA Fail Dialog */}
      <Dialog open={qaFailOpen} onOpenChange={setQaFailOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="size-4" />
              QA Fail & Red-Flag Review ({task.code})
            </DialogTitle>
            <DialogDescription>
              Document the failure category, reason, evidence, and any team
              members receiving a QA red flag. Task moves to Re-Draw.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={qaFailForm.handleSubmit(handleQaFailSubmit)}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label>Failure Category</Label>
              <Controller
                control={qaFailForm.control}
                name="category"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {QA_FAIL_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="td-qa-fail-reason">Failure Details</Label>
              <Textarea
                id="td-qa-fail-reason"
                rows={3}
                placeholder="Describe exact viewport, visual, or functional issues..."
                {...qaFailForm.register("reason")}
              />
              {qaFailForm.formState.errors.reason ? (
                <p className="text-xs text-destructive">
                  {qaFailForm.formState.errors.reason.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="td-qa-fail-evidence">
                Evidence File / Screenshot
              </Label>
              <Input
                id="td-qa-fail-evidence"
                {...qaFailForm.register("evidenceName")}
              />
              {qaFailForm.formState.errors.evidenceName ? (
                <p className="text-xs text-destructive">
                  {qaFailForm.formState.errors.evidenceName.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Red-Flag Assignees
              </Label>
              <div className="space-y-1.5 rounded-lg border border-border p-3">
                {taskAssignees.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No assignees on this task to red-flag.
                  </p>
                ) : (
                  taskAssignees.map((u) => {
                    const checked = redFlagUsers.includes(u.id)
                    return (
                      <label
                        key={u.id}
                        className="flex cursor-pointer items-center justify-between text-sm"
                      >
                        <span className="flex items-center gap-2">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() =>
                              setRedFlagUsers((prev) =>
                                prev.includes(u.id)
                                  ? prev.filter((id) => id !== u.id)
                                  : [...prev, u.id]
                              )
                            }
                          />
                          <span>{u.name}</span>
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {u.role}
                        </Badge>
                      </label>
                    )
                  })
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setQaFailOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="destructive">
                Submit QA Fail → Re-Draw
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
