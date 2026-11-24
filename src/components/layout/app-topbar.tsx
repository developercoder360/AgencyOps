"use client"

import * as React from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  Bell,
  CheckCheck,
  Copy,
  KeyRound,
  Landmark,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Settings,
  Shield,
  Sun,
  User,
} from "lucide-react"
import { useAppState } from "@/components/providers/app-state-provider"
import {
  CURRENT_USER,
  DEFAULT_FILE_PERMISSIONS,
  DEFAULT_TASK_PERMISSIONS,
  FILE_PERMISSION_KEYS,
  FILE_PERMISSION_META,
  READ_ONLY_FILE_PERMISSIONS,
  READ_ONLY_TASK_PERMISSIONS,
  TASK_PERMISSION_KEYS,
  TASK_PERMISSION_META,
} from "@/lib/permissions"
import { useStore } from "@/lib/store"
import { Switch } from "@/components/ui/switch"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "cn"

const BANK_ACCOUNTS = [
  {
    currency: "USD",
    bank: "Mercury / Evolve Bank & Trust",
    accountName: "AgencyOps Digital LLC",
    routing: "021000021",
    accountNo: "9810 4429 1182",
    swift: "MRCYUS33XXX",
  },
  {
    currency: "GBP",
    bank: "Wise Business UK",
    accountName: "AgencyOps Studio Ltd",
    routing: "Sort: 23-14-70",
    accountNo: "88412904",
    swift: "TRWIGB2LXXX",
  },
  {
    currency: "CAD",
    bank: "RBC Royal Bank Business",
    accountName: "AgencyOps Canada Inc.",
    routing: "Transit: 00002-003",
    accountNo: "104-882-910",
    swift: "ROYCCAT2XXX",
  },
  {
    currency: "AED",
    bank: "Emirates NBD Business",
    accountName: "AgencyOps MENA FZ-LLC",
    routing: "Branch: 044 Dubai Marina",
    accountNo: "1012 8840 9921",
    swift: "EBILAEADXXX",
  },
]

const passwordSchema = z
  .object({
    currentPassword: z.string().min(6, "Enter at least 6 characters"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type PasswordFormValues = z.infer<typeof passwordSchema>

interface AppTopbarProps {
  onOpenMobileSidebar: () => void
}

export function AppTopbar({ onOpenMobileSidebar }: AppTopbarProps) {
  const { setTheme, resolvedTheme } = useTheme()
  const { users } = useStore()
  const {
    activeUserId,
    activeUser,
    setActiveUserId,
    filePermissions,
    setFilePermission,
    setAllFilePermissions,
    taskPermissions,
    setTaskPermission,
    setAllTaskPermissions,
    notifications,
    unreadNotificationsCount,
    markAllNotificationsRead,
    markNotificationRead,
    unreadMessagesCount,
  } = useAppState()

  const [bankingOpen, setBankingOpen] = React.useState(false)
  const [notifOpen, setNotifOpen] = React.useState(false)
  const [passwordOpen, setPasswordOpen] = React.useState(false)
  const [permScope, setPermScope] = React.useState<"files" | "tasks">("files")

  const enabledFileCount = FILE_PERMISSION_KEYS.filter(
    (k) => filePermissions[k]
  ).length
  const enabledTaskCount = TASK_PERMISSION_KEYS.filter(
    (k) => taskPermissions[k]
  ).length
  const totalPermKeys = FILE_PERMISSION_KEYS.length + TASK_PERMISSION_KEYS.length
  const totalEnabledCount = enabledFileCount + enabledTaskCount

  const persona = CURRENT_USER

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  function copyBankField(label: string, value: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(value).catch(() => {})
    }
    toast.success(`${label} copied to clipboard`)
  }

  function onPasswordSubmit() {
    toast.success("Password updated successfully (prototype simulation)")
    form.reset()
    setPasswordOpen(false)
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border bg-background/95 px-3 backdrop-blur-sm sm:gap-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onOpenMobileSidebar}
            aria-label="Open navigation menu"
            className="shrink-0 lg:hidden"
          >
            <Menu className="size-5" />
          </Button>

          <Link
            href="/dashboard"
            className="flex min-w-0 items-center gap-2 lg:hidden"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-[#1F63C8] to-[#0B3266] text-xs font-bold text-white">
              AO
            </span>
            <span className="hidden truncate text-sm font-semibold tracking-tight sm:inline">
              AgencyOps
            </span>
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {/* Per-User Permissions Switcher (Files & Tasks) */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                aria-label="User file permissions switcher"
              >
                <Shield className="size-3.5 text-primary" />
                <span className="hidden sm:inline">Permissions</span>
                <Badge
                  variant={
                    totalEnabledCount === totalPermKeys ? "secondary" : "outline"
                  }
                  className="h-4 px-1.5 font-mono text-[10px]"
                >
                  {totalEnabledCount}/{totalPermKeys}
                </Badge>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-84 p-3.5">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-semibold text-foreground">
                      User Permissions
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Toggle per-user access permissions for Files and Tasks.
                    </p>
                  </div>
                </div>

                <div
                  role="tablist"
                  aria-label="Permission modules"
                  className="grid grid-cols-2 rounded-lg border border-border bg-muted/50 p-0.5"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={permScope === "files"}
                    onClick={() => setPermScope("files")}
                    className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                      permScope === "files"
                        ? "bg-background text-foreground shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Files ({enabledFileCount}/{FILE_PERMISSION_KEYS.length})
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={permScope === "tasks"}
                    onClick={() => setPermScope("tasks")}
                    className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                      permScope === "tasks"
                        ? "bg-background text-foreground shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Tasks ({enabledTaskCount}/{TASK_PERMISSION_KEYS.length})
                  </button>
                </div>

                {users.length > 0 && (
                  <div className="space-y-1">
                    <Label
                      htmlFor="perm-user-select"
                      className="text-[11px] text-muted-foreground"
                    >
                      Active User
                    </Label>
                    <Select
                      value={activeUser?.id ?? activeUserId}
                      onValueChange={(nextId) => {
                        setActiveUserId(nextId)
                        const chosen = users.find((u) => u.id === nextId)
                        if (chosen) {
                          toast.info(`Switched active permissions user to ${chosen.name}`)
                        }
                      }}
                    >
                      <SelectTrigger id="perm-user-select" className="h-8 w-full text-xs">
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            <span className="truncate">{u.name}</span>
                            <span className="ml-1 text-muted-foreground">
                              ({u.email})
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="max-h-64 space-y-2 overflow-y-auto border-t border-border pt-2.5 pr-0.5">
                  {permScope === "files"
                    ? FILE_PERMISSION_KEYS.map((key) => {
                        const meta = FILE_PERMISSION_META[key]
                        const checked = Boolean(filePermissions[key])
                        return (
                          <div
                            key={key}
                            className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-muted/20 px-2.5 py-2"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-medium text-foreground">
                                  {meta.label}
                                </span>
                                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px] text-muted-foreground">
                                  {key}
                                </code>
                              </div>
                              <p className="mt-0.5 text-[10px] text-muted-foreground leading-tight">
                                {meta.description}
                              </p>
                            </div>
                            <Switch
                              size="sm"
                              checked={checked}
                              onCheckedChange={(next) => setFilePermission(key, next)}
                              aria-label={`Toggle ${key}`}
                            />
                          </div>
                        )
                      })
                    : TASK_PERMISSION_KEYS.map((key) => {
                        const meta = TASK_PERMISSION_META[key]
                        const checked = Boolean(taskPermissions[key])
                        return (
                          <div
                            key={key}
                            className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-muted/20 px-2.5 py-2"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-medium text-foreground">
                                  {meta.label}
                                </span>
                                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px] text-muted-foreground">
                                  {key}
                                </code>
                              </div>
                              <p className="mt-0.5 text-[10px] text-muted-foreground leading-tight">
                                {meta.description}
                              </p>
                            </div>
                            <Switch
                              size="sm"
                              checked={checked}
                              onCheckedChange={(next) => setTaskPermission(key, next)}
                              aria-label={`Toggle ${key}`}
                            />
                          </div>
                        )
                      })}
                </div>

                <div className="flex items-center justify-between gap-1.5 border-t border-border pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    className="flex-1 text-[11px]"
                    onClick={() => {
                      if (permScope === "files") {
                        setAllFilePermissions({ ...DEFAULT_FILE_PERMISSIONS })
                      } else {
                        setAllTaskPermissions({ ...DEFAULT_TASK_PERMISSIONS })
                      }
                    }}
                  >
                    Grant All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    className="flex-1 text-[11px]"
                    onClick={() => {
                      if (permScope === "files") {
                        setAllFilePermissions({ ...READ_ONLY_FILE_PERMISSIONS })
                      } else {
                        setAllTaskPermissions({ ...READ_ONLY_TASK_PERMISSIONS })
                      }
                    }}
                  >
                    View Only
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    className="flex-1 text-[11px] text-destructive hover:text-destructive"
                    onClick={() => {
                      if (permScope === "files") {
                        setAllFilePermissions({
                          "files.view": false,
                          "files.upload": false,
                          "files.download": false,
                          "files.delete": false,
                          "files.manage_visibility": false,
                        })
                      } else {
                        setAllTaskPermissions({
                          "tasks.view": false,
                          "tasks.create": false,
                          "tasks.edit": false,
                          "tasks.delete": false,
                          "tasks.assign": false,
                          "tasks.manage_status": false,
                        })
                      }
                    }}
                  >
                    Revoke All
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Banking button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setBankingOpen(true)}
            className="gap-1.5"
          >
            <Landmark className="size-4 text-primary" />
            <span className="hidden md:inline">Banking</span>
          </Button>

          {/* Messages link */}
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Messages"
          >
            <Link href="/chats">
              <MessageSquare className="size-4" />
              {unreadMessagesCount > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-slate-950">
                  {unreadMessagesCount}
                </span>
              ) : null}
            </Link>
          </Button>

          {/* Notifications Sheet trigger */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setNotifOpen(true)}
            className="relative"
            aria-label={`Notifications (${unreadNotificationsCount} unread)`}
          >
            <Bell className="size-4" />
            {unreadNotificationsCount > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white">
                {unreadNotificationsCount}
              </span>
            ) : null}
          </Button>

          {/* Theme toggle */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
            aria-label="Toggle color theme"
          >
            <Sun className="size-4 dark:hidden" />
            <Moon className="hidden size-4 dark:block" />
          </Button>

          {/* User dropdown + Demo Role Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="h-9 gap-2 px-2"
                aria-label="User menu"
              >
                <Avatar className="size-7">
                  <AvatarFallback className="bg-primary text-[11px] font-semibold text-primary-foreground">
                    {persona.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden text-left sm:block">
                  <div className="text-xs font-medium leading-none">
                    {persona.name}
                  </div>
                  <div className="mt-0.5 text-[10px] leading-none text-muted-foreground">
                    {persona.title}
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>
                <div className="font-medium">{persona.name}</div>
                <div className="text-xs font-normal text-muted-foreground">
                  {persona.email}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link href="/users/usr-1">
                    <User className="mr-2 size-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setPasswordOpen(true)}>
                  <KeyRound className="mr-2 size-4" />
                  Change Password
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 size-4" />
                    General Settings
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="text-destructive focus:text-destructive">
                <Link
                  href="/login"
                  onClick={() => toast.info("Signed out of demo session")}
                >
                  <LogOut className="mr-2 size-4" />
                  Logout
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Banking Details Dialog */}
      <Dialog open={bankingOpen} onOpenChange={setBankingOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Landmark className="size-4 text-primary" />
              Agency Settlement Bank Accounts
            </DialogTitle>
            <DialogDescription>
              Share verified wire and ACH coordinates for multi-currency client
              transfers (USD, GBP, CAD & AED).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {BANK_ACCOUNTS.map((acct) => (
              <div
                key={acct.currency}
                className="rounded-lg border border-border bg-muted/30 p-3.5"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge>{acct.currency}</Badge>
                    <span className="text-sm font-medium">{acct.bank}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() =>
                      copyBankField(
                        `${acct.currency} Bank Details`,
                        `${acct.accountName} | ${acct.bank} | ${acct.routing} | Acct: ${acct.accountNo} | SWIFT: ${acct.swift}`
                      )
                    }
                  >
                    <Copy className="mr-1 size-3" />
                    Copy All
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-1.5 text-xs sm:grid-cols-2">
                  <div>
                    <span className="text-muted-foreground">Beneficiary: </span>
                    <span className="font-medium">{acct.accountName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Routing/Sort: </span>
                    <span className="font-mono font-medium">{acct.routing}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Account #: </span>
                    <span className="font-mono font-medium">{acct.accountNo}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">SWIFT/BIC: </span>
                    <span className="font-mono font-medium">{acct.swift}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>

      {/* Notifications Sheet */}
      <Sheet open={notifOpen} onOpenChange={setNotifOpen}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader className="border-b border-border pb-3">
            <div className="flex items-center justify-between pr-6">
              <SheetTitle>Notifications</SheetTitle>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => {
                  markAllNotificationsRead()
                  toast.success("All notifications marked as read")
                }}
              >
                <CheckCheck className="mr-1 size-3.5" />
                Mark all read
              </Button>
            </div>
            <SheetDescription>
              Real-time updates across leads, payments, QA, and HR requests.
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="flex-1 min-h-0 px-4">
            <div className="space-y-2.5 py-2">
              {notifications.map((n) => (
                <Link
                  key={n.id}
                  href={n.href}
                  onClick={() => {
                    markNotificationRead(n.id)
                    setNotifOpen(false)
                  }}
                  className={cn(
                    "block rounded-lg border p-3 transition-colors hover:bg-muted/60",
                    n.read
                      ? "border-border bg-background"
                      : "border-primary/30 bg-primary/5"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {n.title}
                    </span>
                    {!n.read ? (
                      <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {n.description}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {n.category}
                    </Badge>
                    <span>{n.timestamp}</span>
                  </div>
                </Link>
              ))}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Change Password Dialog */}
      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Update your internal staff password for {persona.email}.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit(onPasswordSubmit)}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                {...form.register("currentPassword")}
              />
              {form.formState.errors.currentPassword ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.currentPassword.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                {...form.register("newPassword")}
              />
              {form.formState.errors.newPassword ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.newPassword.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...form.register("confirmPassword")}
              />
              {form.formState.errors.confirmPassword ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.confirmPassword.message}
                </p>
              ) : null}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPasswordOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Update Password</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
