"use client"

import { useAuth } from "@/lib/auth-context"
import { LoginForm } from "@/components/login-form"
import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { UploadSection } from "@/components/upload-section"
import { FeaturesSection } from "@/components/features-section"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function HomePage() {
  const { user, login, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm onLogin={login} />
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <UploadSection />
        <FeaturesSection />

        <section className="py-20 bg-accent/5">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">Ready to Get Started?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Upload your financial documents and start asking questions to get AI-powered insights with precise
              citations.
            </p>
            <Link href="/chat">
              <Button size="lg" className="text-lg px-8 py-3">
                Start Analyzing Documents
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
