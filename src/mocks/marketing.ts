import type { LeadSource, MarketingSpend } from "@/types"
import { MOCK_BRANDS } from "./brands"
import { createSeededRandom, intBetween } from "./seed"

const SPEND_SOURCES: LeadSource[] = [
  "Google Ads",
  "Bing Ads",
  "Social Media",
  "Email Campaign",
  "Organic SEO",
]

function makeDateOffset(daysBack: number): string {
  const base = Date.UTC(2026, 10, 11)
  return new Date(base - daysBack * 86400000).toISOString().slice(0, 10)
}

function generateMarketingSpends(): MarketingSpend[] {
  const rng = createSeededRandom(55109)
  const items: MarketingSpend[] = []
  let idx = 1

  // 14 days x 5 brands x 3-4 channels -> ~60 realistic daily records across recent dates
  for (let day = 0; day < 14; day++) {
    const date = makeDateOffset(day)
    for (const brand of MOCK_BRANDS) {
      const source = SPEND_SOURCES[(day + idx) % SPEND_SOURCES.length]
      const spendUsd = intBetween(rng, 180, 920)
      const impressions = spendUsd * intBetween(rng, 22, 48)
      const clicks = Math.round(impressions * (intBetween(rng, 18, 42) / 1000))
      const leadsGenerated = Math.max(1, Math.round(clicks * 0.08))
      const revenueAttributedUsd = spendUsd * intBetween(rng, 3, 7)

      items.push({
        id: `mkt-${idx}`,
        date,
        brandId: brand.id,
        brandName: brand.name,
        source,
        spendUsd,
        impressions,
        clicks,
        leadsGenerated,
        revenueAttributedUsd,
      })
      idx++
    }
  }

  return items
}

export const MOCK_MARKETING_SPENDS: MarketingSpend[] = generateMarketingSpends()
