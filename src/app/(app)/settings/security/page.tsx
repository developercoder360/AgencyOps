"use client"

import * as React from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  KeyRound,
  RefreshCw,
  ShieldCheck,
} from "lucide-react"
import { PageHeader } from "@/components/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const INITIAL_RECOVERY_CODES = [
  "AGY-9482-KL7P",
  "AGY-2190-MN4Q",
  "AGY-7731-XZ8R",
  "AGY-5504-BC2T",
  "AGY-8319-VW6Y",
  "AGY-4627-DF9W",
]

const otpSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit authenticator code"),
})

export default function SecuritySettingsPage() {
  const [enabled2FA, setEnabled2FA] = React.useState(true)
  const [recoveryCodes, setRecoveryCodes] = React.useState(
    INITIAL_RECOVERY_CODES
  )
  const secretKey = "JBSW Y3DP EHPK 3PXP"

  const form = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { code: "" },
  })

  function copyText(label: string, text: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {})
    }
    toast.success(`${label} copied to clipboard`)
  }

  function onVerifySubmit() {
    setEnabled2FA(true)
    form.reset()
    toast.success("Authenticator app verified & 2FA protection active")
  }

  function regenerateCodes() {
    setRecoveryCodes([
      "AGY-6120-PQ3N",
      "AGY-3849-TR5V",
      "AGY-9012-HJ8K",
      "AGY-7451-LM2W",
      "AGY-1598-CX6Z",
      "AGY-8824-DF7B",
    ])
    toast.success("Generated fresh backup recovery codes")
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Security & Two-Factor Authentication"
        description="Protect staff accounts with TOTP authenticator verification and single-use backup codes."
        badge={
          <Badge variant={enabled2FA ? "default" : "secondary"}>
            {enabled2FA ? "2FA Enabled" : "2FA Disabled"}
          </Badge>
        }
        actions={
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href="/settings">
              <ArrowLeft className="size-4" />
              General Settings
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* QR Setup Card */}
        <Card className="lg:col-span-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" />
              Authenticator App Setup
            </CardTitle>
            <CardDescription>
              Scan the QR placeholder with Google Authenticator, 1Password, or
              Authy.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-muted/20 p-5 sm:flex-row">
              {/* Crisp deterministic SVG QR placeholder */}
              <div
                className="flex size-36 shrink-0 items-center justify-center rounded-(--radius-surface) border border-border bg-(--qr-bg) p-2"
                aria-label="2FA QR Code Placeholder"
              >
                <svg
                  viewBox="0 0 100 100"
                  className="size-full text-(--qr-fg)"
                  role="img"
                  aria-label="Authenticator QR pattern"
                >
                  <rect x="4" y="4" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="6" />
                  <rect x="12" y="12" width="12" height="12" fill="currentColor" />
                  <rect x="68" y="4" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="6" />
                  <rect x="76" y="12" width="12" height="12" fill="currentColor" />
                  <rect x="4" y="68" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="6" />
                  <rect x="12" y="76" width="12" height="12" fill="currentColor" />
                  <rect x="40" y="10" width="8" height="8" fill="currentColor" />
                  <rect x="52" y="18" width="8" height="8" fill="currentColor" />
                  <rect x="40" y="34" width="14" height="14" fill="currentColor" />
                  <rect x="12" y="44" width="10" height="10" fill="currentColor" />
                  <rect x="64" y="44" width="10" height="10" fill="currentColor" />
                  <rect x="82" y="46" width="12" height="12" fill="currentColor" />
                  <rect x="44" y="64" width="12" height="12" fill="currentColor" />
                  <rect x="66" y="72" width="14" height="14" fill="currentColor" />
                  <rect x="84" y="84" width="10" height="10" fill="currentColor" />
                </svg>
              </div>

              <div className="space-y-2 text-xs">
                <div className="font-semibold text-foreground">
                  Manual Setup Key
                </div>
                <div className="flex items-center gap-2">
                  <code className="rounded bg-muted px-2 py-1 font-mono text-xs font-semibold">
                    {secretKey}
                  </code>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => copyText("Secret key", secretKey)}
                    aria-label="Copy secret key"
                  >
                    <Copy className="size-3.5" />
                  </Button>
                </div>
                <p className="text-muted-foreground">
                  Account: marcus.vance@agencyops.io (Time-based TOTP)
                </p>
                <div className="pt-1">
                  <Link
                    href="/two-factor-authentication"
                    className="font-medium text-primary hover:underline"
                  >
                    Preview 2FA Login Prompt →
                  </Link>
                </div>
              </div>
            </div>

            <form
              onSubmit={form.handleSubmit(onVerifySubmit)}
              className="space-y-3"
            >
              <div className="space-y-1.5">
                <Label htmlFor="totp-verify">Verify 6-Digit Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="totp-verify"
                    placeholder="123456"
                    maxLength={6}
                    className="font-mono tracking-widest"
                    {...form.register("code")}
                  />
                  <Button type="submit">Verify</Button>
                </div>
                {form.formState.errors.code ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.code.message}
                  </p>
                ) : null}
              </div>
            </form>

            {enabled2FA ? (
              <div className="flex items-center justify-between rounded-lg border border-(--tone-emerald-border) bg-(--tone-emerald-bg) p-3 text-xs text-(--tone-emerald-fg)">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="size-4" />
                  Hardware / TOTP 2FA is currently active
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    setEnabled2FA(false)
                    toast.warning("2FA temporarily disabled in preview")
                  }}
                >
                  Disable
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Recovery Codes Card */}
        <Card className="lg:col-span-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="size-4 text-primary" />
              Single-Use Recovery Codes
            </CardTitle>
            <CardDescription>
              Store these codes securely in a password manager in case you lose
              access to your authenticator device.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {recoveryCodes.map((code) => (
                <div
                  key={code}
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2 font-mono text-xs font-medium"
                >
                  <span>{code}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => copyText("Recovery code", code)}
                    aria-label={`Copy ${code}`}
                  >
                    <Copy className="size-3" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  copyText("All recovery codes", recoveryCodes.join("\n"))
                }
                className="gap-1.5"
              >
                <Copy className="size-3.5" />
                Copy All Codes
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={regenerateCodes}
                className="gap-1.5"
              >
                <RefreshCw className="size-3.5" />
                Regenerate
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
