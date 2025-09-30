import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { Suspense } from "react"
import { AuthProvider } from "@/lib/auth-context"

export const metadata: Metadata = {
  title: "FinGuide - AI-Powered Financial Document Analysis",
  description: "Upload financial documents and get AI-powered insights with citations",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <AuthProvider>
          <Suspense>{children}</Suspense>
        </AuthProvider>
      </body>
    </html>
  )
}
