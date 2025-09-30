"use client"

import { useAuth } from "@/lib/auth-context"
import { LoginForm } from "@/components/login-form"
import { Header } from "@/components/header"
import { SearchResults } from "@/components/search-results"
import { AnswerDisplay } from "@/components/answer-display"

// Mock data for demonstration
const mockSearchResults = [
  {
    id: "1",
    score: 0.95,
    source: "Financial Planning Guide.pdf",
    page: 15,
    chunkId: 1,
    content:
      "Emergency funds are essential for financial security. They should contain 3-6 months of essential expenses to handle unexpected situations like job loss, medical emergencies, or major home repairs. The exact amount depends on your personal situation and risk tolerance.",
    highlightedContent:
      "<mark>Emergency funds</mark> are essential for financial security. They should contain <mark>3-6 months of essential expenses</mark> to handle unexpected situations like job loss, medical emergencies, or major home repairs. The exact amount depends on your personal situation and risk tolerance.",
    financialTerms: ["emergency fund", "expenses", "financial security"],
  },
  {
    id: "2",
    score: 0.87,
    source: "Investment Basics.pdf",
    page: 8,
    chunkId: 2,
    content:
      "A well-funded emergency account provides financial security and prevents the need to rely on high-interest debt during crises. Keep this money in a high-yield savings account for easy access while earning some interest.",
    highlightedContent:
      "A well-funded <mark>emergency account</mark> provides <mark>financial security</mark> and prevents the need to rely on high-interest debt during crises. Keep this money in a high-yield savings account for easy access while earning some interest.",
    financialTerms: ["emergency account", "high-interest debt", "high-yield savings account"],
  },
]

const mockCitations = [
  {
    id: "1",
    source: "Financial Planning Guide.pdf",
    page: 15,
    excerpt:
      "Emergency funds should contain 3-6 months of essential expenses to handle unexpected situations like job loss, medical emergencies, or major home repairs.",
    relevanceScore: 0.95,
  },
  {
    id: "2",
    source: "Investment Basics.pdf",
    page: 8,
    excerpt:
      "A well-funded emergency account provides financial security and prevents the need to rely on high-interest debt during crises.",
    relevanceScore: 0.87,
  },
]

export default function ResultsPage() {
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
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Search Results</h1>
            <p className="text-muted-foreground">
              AI-powered analysis of your financial documents with precise citations.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <AnswerDisplay
                question="What is an emergency fund and how much should I save?"
                answer="An emergency fund is a crucial financial safety net that should contain 3-6 months worth of essential expenses. This fund serves as protection against unexpected financial hardships such as job loss, medical emergencies, or major home repairs.

The recommended amount varies based on your personal situation:
• 3 months: If you have stable employment and good insurance coverage
• 6 months: If you have variable income or work in an unstable industry  
• More than 6 months: If you're self-employed or have dependents

Keep this money in a high-yield savings account for easy access while earning some interest."
                citations={mockCitations}
                confidence={0.92}
                processingTime={1247}
              />
            </div>

            <div>
              <SearchResults query="emergency fund savings" results={mockSearchResults} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
