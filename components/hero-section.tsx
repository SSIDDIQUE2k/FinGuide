import { Button } from "@/components/ui/button"
import { ArrowRight, FileText, Brain, Shield } from "lucide-react"
import Link from "next/link"

export function HeroSection() {
  return (
    <section className="relative py-20 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8 inline-flex items-center rounded-full border border-border bg-muted px-4 py-2 text-sm text-muted-foreground">
            <span className="mr-2 h-2 w-2 rounded-full bg-accent"></span>
            Powered by Advanced AI Technology
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl text-balance">
            AI-Powered Financial
            <span className="text-accent"> Knowledge Base</span>
          </h1>

          <p className="mt-6 text-lg leading-8 text-muted-foreground text-pretty max-w-2xl mx-auto">
            Access comprehensive financial insights from external sources and industry documents. Our advanced
            RAG system analyzes financial literature and provides expert-level answers with precise citations from authoritative sources.
          </p>

          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link href="/chat">
              <Button size="lg" className="group">
                Access Knowledge Base
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/upload">
              <Button variant="outline" size="lg">
                Upload Financial PDFs
              </Button>
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 rounded-lg bg-accent/10 p-3">
                <FileText className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">External Sources</h3>
              <p className="text-sm text-muted-foreground">
                Access comprehensive financial literature from authoritative industry sources
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="mb-4 rounded-lg bg-accent/10 p-3">
                <Brain className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Expert Insights</h3>
              <p className="text-sm text-muted-foreground">
                Get intelligent answers with precise citations from financial experts and institutions
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="mb-4 rounded-lg bg-accent/10 p-3">
                <Shield className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Reliable Sources</h3>
              <p className="text-sm text-muted-foreground">
                All information sourced from verified financial institutions and expert publications
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
