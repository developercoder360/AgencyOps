import type { CurrencyCode, Lead, LeadSource, LeadStatus, SignUp } from "@/types"
import { MOCK_BRANDS, MOCK_CITIES } from "./brands"
import { MOCK_USERS } from "./users"
import { createSeededRandom, intBetween, pickFrom } from "./seed"

const LEAD_SOURCES: LeadSource[] = [
  "Google Ads",
  "Bing Ads",
  "Website",
  "Organic SEO",
  "Referral",
  "Social Media",
  "Email Campaign",
]

const LEAD_STATUSES: LeadStatus[] = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal Sent",
  "Converted",
  "Lost",
]

const FIRST_NAMES = [
  "Oliver",
  "Amelia",
  "Liam",
  "Charlotte",
  "Noah",
  "Ava",
  "Ethan",
  "Harper",
  "Mason",
  "Evelyn",
  "Lucas",
  "Mia",
  "Benjamin",
  "Isabella",
  "Henry",
  "Grace",
  "Sebastian",
  "Chloe",
  "Jack",
  "Zoe",
]

const LAST_NAMES = [
  "Sterling",
  "Mercer",
  "Holloway",
  "Vance",
  "Kensington",
  "Thorne",
  "Bennett",
  "Callahan",
  "Delgado",
  "Whitmore",
  "Sinclair",
  "Kowalski",
  "Beaumont",
  "Gallagher",
  "Navarro",
  "Prescott",
  "Aldridge",
  "Sorensen",
]

const COMPANIES = [
  "Harborline Logistics",
  "Kestrel Biotech",
  "Brightleaf Dental",
  "Vanguard Legal LLP",
  "Crestview Hospitality",
  "Oakridge Wealth",
  "Redwood Architecture",
  "PulseFit Athletics",
  "Clearwater Energy",
  "Meridian Freight",
  "Atlas Robotics",
  "Saffron & Salt Catering",
  "Cobalt Cloud Systems",
  "Beacon Health Group",
  "Summit Roofing Co.",
  "Evergreen Retail",
  "Loomis Apparel",
  "Helios Solar Inc.",
]

export const AVAILABLE_SERVICES: string[] = [
  "Brand Identity",
  "Website Design & Development",
  "Custom Development",
  "Video Animation",
  "Mobile App",
  "Software Development",
  "Digital Marketing",
  "Content Writing",
  "Maintenance Services",
  "SEO",
  "SMM",
  "Paid Hosting",
  "Book Writing",
  "Book Publishing",
  "Book Marketing",
  "Book Cover Design",
  "Book Illustration",
  "Book SEO",
  "Book SMM",
  "Article PR",
  "Audio Book",
  "Author Website",
  "Advance Combo Package",
  "Author Ecommerce Website",
  "Basic",
  "Basic Illustrative",
  "Basic Publishing Package",
  "Beginner e-commerce",
  "Bronze logo",
  "Business Plus Monthly",
  "Corporate Combo",
  "Custom CRM / ERP Portal",
  "Debutant Publishing Package",
  "Elite Website",
  "Essentials SEO Monthly",
  "Extensive Publishing",
  "Extensive Republishing",
  "Gold",
  "Gold logo",
  "Growth Ecommerce Store",
  "Half-Page",
  "Half-Page Illustration",
  "Headliner Publishing Package",
  "Platinum",
  "Platinum Marketing Plan",
  "Platinum logo",
  "Platinum video",
  "Premium collateral",
  "Pro website",
  "Professional Website",
  "Silver",
  "Silver Book Cover Package",
  "Silver Logo",
  "Silver Marketing Package",
  "Silver Website",
  "Simple Start",
  "Spot Illustration",
  "Standard Publishing",
  "Standard Publishing Package",
  "Starter Presence Package",
  "Startup Combo",
  "Startup Illustrative",
  "Startup Website",
  "Startup collateral",
  "Other",
]

const SAMPLE_STREETS = [
  "742 Evergreen Terrace",
  "120 Broadway, Suite 1400",
  "450 Lexington Ave, 4th Fl",
  "222 Merchandise Mart Plaza",
  "500 West 2nd St, Suite 1900",
  "800 5th Ave, Suite 4100",
  "100 Montgomery St, Suite 1200",
  "350 5th Ave, Fl 59",
  "111 W Jackson Blvd, Suite 1700",
  "600 Congress Ave, Suite 2200",
  "1301 2nd Ave, Suite 2800",
  "101 California St, Suite 2450",
]

const SAMPLE_ZIPS = [
  "10005", "10017", "60654", "78701", "98104", "94104", "10118", "60604", "78701", "98101", "94111", "97201"
]

const SERVICE_INTERESTS = [
  "Custom Website Redesign",
  "Brand Identity & Logo Kit",
  "Technical SEO Retainer",
  "Google & Meta Paid Media",
  "E-Commerce Storefront",
  "Full Stack SaaS MVP",
]

const SALES_REPS = MOCK_USERS.filter(
  (u) => u.role === "Sales/Account Manager" || u.role === "Project Admin"
)

function makeDateOffset(daysBack: number): string {
  const base = Date.UTC(2026, 10, 11) // 2026-11-11
  const dt = new Date(base - daysBack * 86400000)
  return dt.toISOString().slice(0, 10)
}

function generateLeads(): Lead[] {
  const rng = createSeededRandom(40119)
  const items: Lead[] = []

  for (let i = 0; i < 48; i++) {
    const first = FIRST_NAMES[i % FIRST_NAMES.length]
    const last = LAST_NAMES[(i * 3) % LAST_NAMES.length]
    const company = COMPANIES[i % COMPANIES.length]
    const brand = MOCK_BRANDS[i % MOCK_BRANDS.length]
    const city = MOCK_CITIES[i % MOCK_CITIES.length]
    const source = pickFrom(rng, LEAD_SOURCES)
    const status = LEAD_STATUSES[(i + intBetween(rng, 0, 2)) % LEAD_STATUSES.length]
    const currency: CurrencyCode = city.currency
    const estimatedValue = intBetween(rng, 25, 240) * 100
    const daysBack = intBetween(rng, 0, 165)
    const createdAt = makeDateOffset(daysBack)
    const primaryRep = SALES_REPS[i % SALES_REPS.length]
    const secondaryRep =
      rng() > 0.55 ? SALES_REPS[(i + 1) % SALES_REPS.length] : null

    const assignedStaffIds = secondaryRep
      ? [primaryRep.id, secondaryRep.id]
      : [primaryRep.id]

    const assignmentHistory = [
      {
        id: `hist-${i}-1`,
        fromStaffName: null,
        toStaffName: SALES_REPS[(i + 2) % SALES_REPS.length].name,
        assignedBy: "Auto-Router (CRM)",
        timestamp: `${createdAt} 09:15`,
        note: `Captured via ${source} for ${brand.name}`,
      },
      {
        id: `hist-${i}-2`,
        fromStaffName: SALES_REPS[(i + 2) % SALES_REPS.length].name,
        toStaffName: primaryRep.name,
        assignedBy: "Marcus Vance",
        timestamp: `${createdAt} 11:40`,
        note: "Reassigned to territory lead for discovery call",
      },
    ]

    if (secondaryRep) {
      assignmentHistory.push({
        id: `hist-${i}-3`,
        fromStaffName: primaryRep.name,
        toStaffName: secondaryRep.name,
        assignedBy: primaryRep.name,
        timestamp: `${makeDateOffset(Math.max(0, daysBack - 1))} 15:05`,
        note: "Added co-owner for technical scoping & quote",
      })
    }

    const leadServices = [
      AVAILABLE_SERVICES[(i * 3) % AVAILABLE_SERVICES.length],
      AVAILABLE_SERVICES[(i * 3 + 1) % AVAILABLE_SERVICES.length],
    ]
    if (i % 2 === 0) {
      leadServices.push(AVAILABLE_SERVICES[(i * 3 + 2) % AVAILABLE_SERVICES.length])
    }

    const leadAddress = SAMPLE_STREETS[i % SAMPLE_STREETS.length]
    const leadZip = SAMPLE_ZIPS[i % SAMPLE_ZIPS.length]
    const desc = `Inbound inquiry from ${city.name} seeking ${leadServices.join(
      ", "
    )}. Target delivery within 4 to 6 weeks.`

    items.push({
      id: `lead-${i + 1}`,
      code: `LD-${2040 + i}`,
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@${company
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")}.com`,
      phone: `+1 (555) ${String(210 + i).padStart(3, "0")}-${String(
        4100 + i * 17
      ).slice(0, 4)}`,
      company,
      brandId: brand.id,
      brandName: brand.name,
      source,
      address: leadAddress,
      city: city.name,
      state: city.state,
      zipCode: leadZip,
      country: city.country,
      services: leadServices,
      estimatedValue,
      currency,
      status,
      assignedStaffIds,
      clientPassword: i % 2 === 0 ? `ClientPass${101 + i}#` : undefined,
      createdAt,
      description: desc,
      notes: desc,
      assignmentHistory,
    })
  }

  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

function generateSignUps(): SignUp[] {
  const rng = createSeededRandom(88317)
  const items: SignUp[] = []

  for (let i = 0; i < 44; i++) {
    const first = FIRST_NAMES[(i + 5) % FIRST_NAMES.length]
    const last = LAST_NAMES[(i * 5 + 1) % LAST_NAMES.length]
    const brand = MOCK_BRANDS[(i + 1) % MOCK_BRANDS.length]
    const city = MOCK_CITIES[(i + 2) % MOCK_CITIES.length]
    const source = pickFrom(rng, LEAD_SOURCES)
    const converted = i % 3 !== 0
    const createdAt = makeDateOffset(intBetween(rng, 0, 120))

    items.push({
      id: `su-${i + 1}`,
      code: `SU-${5100 + i}`,
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}${i + 1}@exampleclient.io`,
      phone: `+1 (555) ${String(330 + i).padStart(3, "0")}-${String(
        7200 + i * 13
      ).slice(0, 4)}`,
      brandId: brand.id,
      brandName: brand.name,
      serviceInterest: SERVICE_INTERESTS[i % SERVICE_INTERESTS.length],
      source,
      city: city.name,
      ipAddress: `172.58.${intBetween(rng, 10, 220)}.${intBetween(rng, 12, 240)}`,
      utmCampaign:
        source === "Google Ads"
          ? "q4-brand-design-us"
          : source === "Bing Ads"
            ? "bing-enterprise-web"
            : "organic-landing-hero",
      convertedToLead: converted,
      leadId: converted ? `lead-${(i % 48) + 1}` : undefined,
      createdAt,
      notes: `Submitted landing page brief requesting callback regarding ${
        SERVICE_INTERESTS[i % SERVICE_INTERESTS.length]
      }.`,
    })
  }

  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export const MOCK_LEADS: Lead[] = generateLeads()
export const MOCK_SIGNUPS: SignUp[] = generateSignUps()
