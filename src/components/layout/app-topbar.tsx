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
  Clock,
  Copy,
  KeyRound,
  Landmark,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Palette,
  Settings,
  ShieldCheck,
  Sun,
  User,
} from "lucide-react"
import { useAppState } from "@/components/providers/app-state-provider"
import { DEMO_ROLES, ROLE_PERSONA_SUMMARY } from "@/lib/permissions"
import { UI_THEMES, isValidUiTheme, type UiTheme } from "@/lib/theme"
import type { Role } from "@/types"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "cn"

const TIMEZONES = [
  { value: "America/New_York", label: "EST (New York)" },
  { value: "America/Chicago", label: "CST (Chicago)" },
  { value: "America/Los_Angeles", label: "PST (San Francisco)" },
  { value: "America/Toronto", label: "EST (Toronto)" },
  { value: "Europe/London", label: "GMT (London)" },
  { value: "UTC", label: "UTC" },
]

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
  const {
    role,
    setRole,
    uiTheme,
    setUiTheme,
    timezone,
    setTimezone,
    notifications,
    unreadNotificationsCount,
    markAllNotificationsRead,
    markNotificationRead,
    unreadMessagesCount,
  } = useAppState()

  const [bankingOpen, setBankingOpen] = React.useState(false)
  const [notifOpen, setNotifOpen] = React.useState(false)
  const [passwordOpen, setPasswordOpen] = React.useState(false)

  const persona = ROLE_PERSONA_SUMMARY[role]

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  function handleRoleChange(nextRole: string) {
    const typed = nextRole as Role
    setRole(typed)
    toast.success(`Switched demo view to ${typed}`)
  }

  function handleUiThemeChange(nextTheme: string) {
    if (!isValidUiTheme(nextTheme)) return
    setUiTheme(nextTheme as UiTheme)
    const meta = UI_THEMES.find((t) => t.id === nextTheme)
    toast.success(`Switched theme to ${meta?.label ?? nextTheme}`)
  }

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
      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-2 border-b border-(--topbar-border) bg-(--topbar-bg) px-3 shadow-none backdrop-blur-md sm:gap-3 sm:px-6">
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
            <span className="flex size-7 shrink-0 items-center justify-center rounded-(--radius-control) [background:var(--brand-mark-bg)] text-xs font-bold text-(--brand-mark-fg)">
              AO
            </span>
            <span className="font-display hidden truncate text-sm font-semibold tracking-tight sm:inline">
              AgencyOps
            </span>
          </Link>

          <div className="hidden items-center gap-2 sm:flex">
            <Badge variant="outline" className="gap-1.5 font-normal">
              <ShieldCheck className="size-3.5 text-primary" />
              <span>Role:</span>
              <span className="font-medium text-foreground">{role}</span>
            </Badge>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
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

          {/* Timezone picker */}
          <div className="hidden xl:block">
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger
                aria-label="Select timezone"
                className="h-8 w-[170px] text-xs"
              >
                <Clock className="mr-1.5 size-3.5 text-muted-foreground" />
                <SelectValue placeholder="Timezone" />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
                <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-(--badge-warn-bg) text-[10px] font-bold text-(--badge-warn-fg)">
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
              <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-(--badge-alert-bg) text-[10px] font-bold text-(--badge-alert-fg)">
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

              {/* Demo Role Switcher */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <ShieldCheck className="mr-2 size-4 text-primary" />
                  <span>Demo Role Switcher</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-56">
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Preview sidebar permissions
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup
                    value={role}
                    onValueChange={handleRoleChange}
                  >
                    {DEMO_ROLES.map((r) => (
                      <DropdownMenuRadioItem key={r} value={r}>
                        {r}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              {/* UI Theme Switcher */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Palette className="mr-2 size-4 text-primary" />
                  <span>
                    Theme:{" "}
                    {UI_THEMES.find((t) => t.id === uiTheme)?.label ?? uiTheme}
                  </span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-60">
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Switch visual theme
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup
                    value={uiTheme}
                    onValueChange={handleUiThemeChange}
                  >
                    {UI_THEMES.map((t) => (
                      <DropdownMenuRadioItem key={t.id} value={t.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{t.label}</span>
                          <span className="text-[11px] text-muted-foreground">
                            {t.description}
                          </span>
                        </div>
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

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
              transfers (USD, GBP, CAD).
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
