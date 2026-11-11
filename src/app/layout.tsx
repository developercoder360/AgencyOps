import type { Metadata } from "next"
import {
  Fraunces,
  Geist,
  Geist_Mono,
  JetBrains_Mono,
  Plus_Jakarta_Sans,
} from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { AppStateProvider } from "@/components/providers/app-state-provider"
import { getUiThemeInitScript } from "@/lib/theme"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const studioDisplay = Fraunces({
  variable: "--font-studio-display",
  subsets: ["latin"],
})

const studioSans = Plus_Jakarta_Sans({
  variable: "--font-studio-sans",
  subsets: ["latin"],
})

const studioMono = JetBrains_Mono({
  variable: "--font-studio-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "AgencyOps — Multi-Brand Agency CRM & ERP",
  description:
    "Internal operations platform for leads, multi-gateway billing, project delivery, QA, chat, and HR.",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="classic"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${studioDisplay.variable} ${studioSans.variable} ${studioMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: getUiThemeInitScript() }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <AppStateProvider>{children}</AppStateProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
