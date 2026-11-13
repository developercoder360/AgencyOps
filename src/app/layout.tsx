import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { StoreProvider } from "@/lib/store"
import { AppStateProvider } from "@/components/providers/app-state-provider"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <StoreProvider>
            <AppStateProvider>{children}</AppStateProvider>
          </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
