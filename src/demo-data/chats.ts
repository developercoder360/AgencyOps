import type { ChatThread } from "@/types"

export const MOCK_CHAT_THREADS: ChatThread[] = [
  {
    id: "chat-1",
    projectId: "prj-1",
    projectName: "Harborline Logistics — Enterprise SaaS Marketing Site",
    brandName: "PixelForge Studio",
    participantIds: ["usr-3", "usr-4", "usr-5", "usr-7"],
    unreadCount: 2,
    lastMessageAt: "10:42 AM",
    lastMessagePreview: "Uploaded updated mobile hero spacing to staging.",
    messages: [
      {
        id: "msg-101",
        senderId: "usr-3",
        senderName: "Devon Brooks",
        senderInitials: "DB",
        content:
          "Morning team — client confirmed they want the freight calculator above the fold on desktop and tablet.",
        timestamp: "09:15 AM",
        readByIds: ["usr-4", "usr-5", "usr-7"],
      },
      {
        id: "msg-102",
        senderId: "usr-4",
        senderName: "Aria Chen",
        senderInitials: "AC",
        content:
          "Got it. I adjusted the Figma layout tokens and handed off the responsive breakpoints to Liam.",
        timestamp: "09:48 AM",
        readByIds: ["usr-3", "usr-5", "usr-7"],
        attachment: "harborline-hero-v3.fig",
      },
      {
        id: "msg-103",
        senderId: "usr-7",
        senderName: "Liam Gallagher",
        senderInitials: "LG",
        content:
          "Uploaded updated mobile hero spacing to staging. Ready for Tariq's QA pass.",
        timestamp: "10:42 AM",
        readByIds: ["usr-3", "usr-4"],
      },
    ],
  },
  {
    id: "chat-2",
    projectId: "prj-2",
    projectName: "Kestrel Biotech — Rebrand & Visual Identity System",
    brandName: "Apex Brandworks",
    participantIds: ["usr-2", "usr-9", "usr-10", "usr-5"],
    unreadCount: 3,
    lastMessageAt: "10:18 AM",
    lastMessagePreview: "Logo monochrome lockup needs 2px tighter kerning.",
    messages: [
      {
        id: "msg-201",
        senderId: "usr-9",
        senderName: "Lucas Meyer",
        senderInitials: "LM",
        content:
          "Shared the primary wordmark + laboratory emblem sheet in Project Files (client-visible toggled off for now).",
        timestamp: "Yesterday 4:20 PM",
        readByIds: ["usr-2", "usr-5"],
        attachment: "kestrel-brandbook-draft.pdf",
      },
      {
        id: "msg-202",
        senderId: "usr-5",
        senderName: "Tariq Al-Mansoor",
        senderInitials: "TA",
        content:
          "Logo monochrome lockup needs 2px tighter kerning between the 'S' and 'T' glyphs before we turn on client visibility.",
        timestamp: "10:18 AM",
        readByIds: ["usr-9"],
      },
    ],
  },
  {
    id: "chat-3",
    projectId: "prj-3",
    projectName: "Brightleaf Dental — E-Commerce Storefront Migration",
    brandName: "Northstar SEO",
    participantIds: ["usr-3", "usr-11", "usr-12", "usr-16"],
    unreadCount: 0,
    lastMessageAt: "Yesterday",
    lastMessagePreview: "301 redirect map validated with zero 404s.",
    messages: [
      {
        id: "msg-301",
        senderId: "usr-11",
        senderName: "Noah Jenkins",
        senderInitials: "NJ",
        content:
          "Ran Screaming Frog crawl on staging — 301 redirect map validated with zero 404s across 420 legacy URLs.",
        timestamp: "Yesterday 2:10 PM",
        readByIds: ["usr-3", "usr-12", "usr-16"],
      },
      {
        id: "msg-302",
        senderId: "usr-16",
        senderName: "Hannah Kim",
        senderInitials: "HK",
        content:
          "Verified structured JSON-LD product schema in QA. Approved for launch window.",
        timestamp: "Yesterday 3:05 PM",
        readByIds: ["usr-3", "usr-11", "usr-12"],
      },
    ],
  },
  {
    id: "chat-4",
    projectId: "prj-4",
    projectName: "Vanguard Legal LLP — Technical SEO & Schema Overhaul",
    brandName: "Veloce Digital",
    participantIds: ["usr-2", "usr-8", "usr-12"],
    unreadCount: 0,
    lastMessageAt: "Nov 10",
    lastMessagePreview: "Attaching Q4 retargeting copy deck for review.",
    messages: [
      {
        id: "msg-401",
        senderId: "usr-12",
        senderName: "Maya Alvarez",
        senderInitials: "MA",
        content:
          "Attaching Q4 retargeting copy deck for review ahead of Friday's client sync.",
        timestamp: "Nov 10, 5:30 PM",
        readByIds: ["usr-2", "usr-8"],
        attachment: "vanguard-q4-ad-copy.docx",
      },
    ],
  },
  {
    id: "chat-5",
    projectId: "prj-5",
    projectName: "Crestview Hospitality — Paid Acquisition Funnel Refresh",
    brandName: "Craftly Media",
    participantIds: ["usr-1", "usr-14", "usr-15"],
    unreadCount: 0,
    lastMessageAt: "Nov 09",
    lastMessagePreview: "Booking widget conversion pixel firing cleanly.",
    messages: [
      {
        id: "msg-501",
        senderId: "usr-14",
        senderName: "Zoe Mensah",
        senderInitials: "ZM",
        content:
          "Motion banner exports uploaded and booking widget conversion pixel firing cleanly on staging.",
        timestamp: "Nov 09, 1:45 PM",
        readByIds: ["usr-1", "usr-15"],
      },
    ],
  },
]
