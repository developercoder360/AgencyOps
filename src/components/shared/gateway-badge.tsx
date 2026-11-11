import { CreditCard, Landmark } from "lucide-react"
import { cn } from "cn"
import type { PaymentGateway } from "@/types"

const GATEWAY_STYLES: Record<PaymentGateway, string> = {
  Stripe:
    "bg-(--tone-indigo-bg) text-(--tone-indigo-fg) border-(--tone-indigo-border)",
  Square:
    "bg-(--tone-slate-bg) text-(--tone-slate-fg) border-(--tone-slate-border)",
  "Authorize.Net":
    "bg-(--tone-sky-bg) text-(--tone-sky-fg) border-(--tone-sky-border)",
  NMI: "bg-(--tone-teal-bg) text-(--tone-teal-fg) border-(--tone-teal-border)",
  "Bank Transfer":
    "bg-(--tone-amber-bg) text-(--tone-amber-fg) border-(--tone-amber-border)",
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
        "inline-flex items-center gap-1.5 rounded-(--radius-gateway) border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        GATEWAY_STYLES[gateway],
        className
      )}
    >
      <Icon className="size-3 shrink-0" aria-hidden="true" />
      <span>{gateway}</span>
    </span>
  )
}
