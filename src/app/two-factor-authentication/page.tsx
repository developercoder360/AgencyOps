"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { ArrowLeft, KeyRound, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const otpSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code from your app"),
})

const recoverySchema = z.object({
  recoveryCode: z.string().min(8, "Enter a valid backup recovery code"),
})

export default function TwoFactorAuthenticationPage() {
  const router = useRouter()

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { code: "482910" },
  })

  const recoveryForm = useForm<z.infer<typeof recoverySchema>>({
    resolver: zodResolver(recoverySchema),
    defaultValues: { recoveryCode: "" },
  })

  function onVerifyOtp() {
    toast.success("2FA verified — welcome back to AgencyOps")
    router.push("/dashboard")
  }

  function onVerifyRecovery() {
    toast.success("Recovery code accepted — signed in")
    router.push("/dashboard")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl [background:var(--brand-mark-bg)] text-base font-bold text-(--brand-mark-fg) shadow-(--brand-mark-shadow)">
            <ShieldCheck className="size-6" />
          </div>
          <h1 className="font-display mt-3 text-2xl font-bold tracking-tight text-foreground [[data-theme=studio]_&]:text-[1.75rem]">
            Two-Factor Verification
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Verify your identity to access internal agency operations
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Enter Verification Code</CardTitle>
            <CardDescription>
              Use your authenticator TOTP code or a single-use backup code.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="totp">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="totp">Authenticator App</TabsTrigger>
                <TabsTrigger value="recovery">Recovery Code</TabsTrigger>
              </TabsList>

              <TabsContent value="totp" className="mt-4">
                <form
                  onSubmit={otpForm.handleSubmit(onVerifyOtp)}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="otp-input">6-Digit Code</Label>
                    <Input
                      id="otp-input"
                      maxLength={6}
                      className="text-center font-mono text-lg tracking-[0.4em]"
                      {...otpForm.register("code")}
                    />
                    {otpForm.formState.errors.code ? (
                      <p className="text-xs text-destructive">
                        {otpForm.formState.errors.code.message}
                      </p>
                    ) : null}
                  </div>
                  <Button type="submit" className="w-full">
                    Verify & Continue
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="recovery" className="mt-4">
                <form
                  onSubmit={recoveryForm.handleSubmit(onVerifyRecovery)}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="rec-input">Backup Recovery Code</Label>
                    <div className="relative">
                      <KeyRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="rec-input"
                        placeholder="AGY-9482-KL7P"
                        className="pl-9 font-mono"
                        {...recoveryForm.register("recoveryCode")}
                      />
                    </div>
                    {recoveryForm.formState.errors.recoveryCode ? (
                      <p className="text-xs text-destructive">
                        {recoveryForm.formState.errors.recoveryCode.message}
                      </p>
                    ) : null}
                  </div>
                  <Button type="submit" className="w-full">
                    Sign In with Recovery Code
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between text-xs text-muted-foreground">
            <Link
              href="/login"
              className="inline-flex items-center gap-1 hover:text-foreground hover:underline"
            >
              <ArrowLeft className="size-3.5" />
              Back to Login
            </Link>
            <Link href="/settings/security" className="text-primary hover:underline">
              2FA Settings →
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
