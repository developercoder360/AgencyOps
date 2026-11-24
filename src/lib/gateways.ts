import type { PaymentGateway } from "@/types"

export const CARD_GATEWAYS: PaymentGateway[] = [
  "Stripe",
  "Square",
  "Authorize.Net",
  "NMI",
]

export const OFFLINE_MERCHANTS: PaymentGateway[] = [
  "ACH Routing",
  "Bank Transfer",
  "Zelle",
  "Wise",
]

export const ALL_GATEWAYS: PaymentGateway[] = [
  ...CARD_GATEWAYS,
  ...OFFLINE_MERCHANTS,
]

export function isOfflineMerchant(gateway: PaymentGateway): boolean {
  return OFFLINE_MERCHANTS.includes(gateway)
}
