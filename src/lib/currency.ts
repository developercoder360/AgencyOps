import type { CurrencyCode } from "@/types"

// Fixed deterministic rates relative to 1 USD for prototype consistency
export const USD_RATES: Record<CurrencyCode, number> = {
  USD: 1,
  GBP: 1.27, // 1 GBP = $1.27 USD
  CAD: 0.73, // 1 CAD = $0.73 USD
}

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: "$",
  GBP: "£",
  CAD: "CA$",
}

export function toUsd(amount: number, currency: CurrencyCode): number {
  return Math.round(amount * USD_RATES[currency] * 100) / 100
}

export function formatCurrency(
  amount: number,
  currency: CurrencyCode = "USD",
  compact = false
): string {
  if (compact && Math.abs(amount) >= 1000) {
    const k = amount / 1000
    const formatted = k >= 100 ? Math.round(k).toString() : k.toFixed(1)
    return `${CURRENCY_SYMBOLS[currency]}${formatted.replace(/\.0$/, "")}k`
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatUsdEquivalent(
  amount: number,
  currency: CurrencyCode
): string {
  if (currency === "USD") return formatCurrency(amount, "USD")
  return `${formatCurrency(amount, currency)} (~${formatCurrency(toUsd(amount, currency), "USD")})`
}
