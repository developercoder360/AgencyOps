import type { Lead, LeadSource, LeadStatus, SignUp } from "@/types"
import crmSnapshot from "./crm-real-snapshot.json"
import { MOCK_BRANDS, MOCK_CITIES } from "./brands"
import { MOCK_USERS } from "./users"

function mapLeadSource(raw: string): LeadSource {
  const s = raw.toLowerCase()
  if (s.includes("google")) return "Google Ads"
  if (s.includes("bing")) return "Bing Ads"
  if (s.includes("social")) return "Social Media"
  if (s.includes("seo")) return "Organic SEO"
  if (s.includes("email")) return "Email Campaign"
  if (s.includes("ref")) return "Referral"
  return "Website"
}

const STATUSES: LeadStatus[] = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal Sent",
  "Converted",
]

export const MOCK_LEADS: Lead[] = crmSnapshot.leads.map((l, idx) => {
  const brand =
    MOCK_BRANDS.find((b) => b.id === `brd-${l.brandRawId}`) ??
    MOCK_BRANDS[idx % MOCK_BRANDS.length]
  const owner = MOCK_USERS[idx % MOCK_USERS.length]
  const city = MOCK_CITIES[idx % MOCK_CITIES.length]
  const ownerId = owner?.id ?? "usr-1"
  const ownerName = owner?.name ?? "Account Manager"

  return {
    id: l.id,
    code: `LD-${l.rawId}`,
    name: l.name,
    email: l.email || `contact@${l.name.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
    phone: l.contact || "+1 (555) 010-0000",
    company: l.name,
    brandId: brand.id,
    brandName: brand.name,
    source: mapLeadSource(l.sourceRaw),
    city: city?.name ?? "Houston",
    country: city?.country ?? "USA",
    estimatedValue: 1800 + (idx % 8) * 750,
    currency: "USD",
    status: STATUSES[idx % STATUSES.length],
    assignedStaffIds: [ownerId],
    createdAt: l.createdAt,
    notes: `${l.serviceRaw} inquiry via ${l.sourceRaw}.`,
    assignmentHistory: [
      {
        id: `lah-${l.rawId}-1`,
        fromStaffName: "System Import",
        toStaffName: ownerName,
        assignedBy: "System Import",
        timestamp: l.createdAt,
        note: `Imported from CRM (${l.sourceRaw})`,
      },
    ],
  }
})

export const MOCK_SIGNUPS: SignUp[] = MOCK_LEADS.slice(0, 12).map((lead, idx) => ({
  id: `su-${idx + 1}`,
  code: `SU-${100 + idx + 1}`,
  name: lead.name,
  email: lead.email,
  phone: lead.phone,
  brandId: lead.brandId,
  brandName: lead.brandName,
  serviceInterest: "Web & Brand Package",
  source: lead.source,
  city: lead.city,
  ipAddress: `192.0.2.${10 + idx}`,
  utmCampaign: `${lead.source.toLowerCase().replace(/\s+/g, "-")}-q4`,
  convertedToLead: true,
  leadId: lead.id,
  createdAt: lead.createdAt,
  notes: lead.notes,
}))
