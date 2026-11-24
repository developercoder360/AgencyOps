import { Banknote, CreditCard, Landmark } from "lucide-react"
import { cn } from "cn"
import { isOfflineMerchant } from "@/lib/gateways"
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
  "ACH Routing":
    "bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-500/30",
  "Bank Transfer":
    "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
  Zelle:
    "bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30",
  Wise:
    "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
}

export function GatewayBadge({
  gateway,
  className,
}: {
  gateway: PaymentGateway
  className?: string
}) {
  const Icon =
    gateway === "Zelle" || gateway === "Wise"
      ? Banknote
      : isOfflineMerchant(gateway)
        ? Landmark
        : CreditCard
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
