import { CreditCard, Landmark } from "lucide-react"
import { cn } from "cn"
import type { PaymentGateway } from "@/types"

const GATEWAY_STYLES: Record<PaymentGateway, string> = {
  Stripe:
    "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30",
  Square:
    "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-500/20 dark:text-slate-200 dark:border-slate-500/40",
  "Authorize.Net":
    "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30",
  NMI:
    "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/15 dark:text-teal-300 dark:border-teal-500/30",
  "Bank Transfer":
    "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
}

export function GatewayBadge({
  gateway,
  className,
}: {
  gateway: PaymentGateway
  className?: string
}) {
  const Icon = gateway === "Bank Transfer" ? Landmark : CreditCard
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        GATEWAY_STYLES[gateway],
        className
      )}
    >
      <Icon className="size-3 shrink-0" aria-hidden="true" />
      <span>{gateway}</span>
    </span>
  )
}
