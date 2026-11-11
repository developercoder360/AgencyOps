"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Lock, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const loginSchema = z.object({
  email: z.string().email("Enter a valid internal staff email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export default function LoginPage() {
  const router = useRouter()
  const [remember, setRemember] = React.useState(true)

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "marcus.vance@agencyops.io",
      password: "••••••••••••",
    },
  })

  function onSubmit() {
    toast.success("Credentials verified — proceeding to 2FA verification")
    router.push("/two-factor-authentication")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl [background:var(--brand-mark-bg)] text-base font-bold text-(--brand-mark-fg) shadow-(--brand-mark-shadow)">
            AO
          </div>
          <h1 className="font-display mt-3 text-2xl font-bold tracking-tight text-foreground [[data-theme=studio]_&]:text-[1.75rem]">
            AgencyOps Portal
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Internal staff CRM & operations workspace
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lock className="size-4 text-primary" />
              Staff Sign In
            </CardTitle>
            <CardDescription>
              UI prototype only — click Sign In to preview 2FA or jump straight
              to Dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="login-email">Work Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  {...form.register("email")}
                />
                {form.formState.errors.email ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.email.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="login-pass">Password</Label>
                <Input
                  id="login-pass"
                  type="password"
                  {...form.register("password")}
                />
                {form.formState.errors.password ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.password.message}
                  </p>
                ) : null}
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                <Checkbox
                  checked={remember}
                  onCheckedChange={(v) => setRemember(!!v)}
                />
                <span>Trust this workstation for 14 days</span>
              </label>

              <Button type="submit" className="w-full">
                Sign In
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-between text-xs text-muted-foreground">
            <Link
              href="/two-factor-authentication"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              <ShieldCheck className="size-3.5" />
              2FA Screen
            </Link>
            <Link href="/dashboard" className="hover:text-foreground hover:underline">
              Skip to Dashboard →
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
