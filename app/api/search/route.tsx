import { type NextRequest, NextResponse } from "next/server"

interface SearchResult {
  id: string
  score: number
  source: string
  page: number
  chunkId: number
  content: string
  highlightedContent: string
  financialTerms: string[]
  userId: string
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")

    if (!userId || userId === "anonymous") {
      return NextResponse.json({ error: "Authentication required to search documents" }, { status: 401 })
    }

    const { query, filters = {} }: { query: string; filters?: any } = await request.json()

    if (!query?.trim()) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    const searchResults = await performSearch(query, filters, userId)

    return NextResponse.json({
      query,
      results: searchResults,
      totalResults: searchResults.length,
      processingTime: Math.floor(Math.random() * 500) + 100,
    })
  } catch (error) {
    console.error("Search API error:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}

async function performSearch(query: string, filters: any, userId: string): Promise<SearchResult[]> {
  const mockResults: SearchResult[] = [
    {
      id: `${userId}-1`,
      score: 0.95,
      source: "Financial Planning Guide.pdf",
      page: 15,
      chunkId: 1,
      content:
        "Emergency funds are essential for financial security. They should contain 3-6 months of essential expenses to handle unexpected situations like job loss, medical emergencies, or major home repairs. The exact amount depends on your personal situation and risk tolerance.",
      highlightedContent:
        "<mark>Emergency funds</mark> are essential for financial security. They should contain <mark>3-6 months of essential expenses</mark> to handle unexpected situations like job loss, medical emergencies, or major home repairs. The exact amount depends on your personal situation and risk tolerance.",
      financialTerms: ["emergency fund", "expenses", "financial security"],
      userId,
    },
    {
      id: `${userId}-2`,
      score: 0.87,
      source: "Investment Basics.pdf",
      page: 8,
      chunkId: 2,
      content:
        "A well-funded emergency account provides financial security and prevents the need to rely on high-interest debt during crises. Keep this money in a high-yield savings account for easy access while earning some interest.",
      highlightedContent:
        "A well-funded <mark>emergency account</mark> provides <mark>financial security</mark> and prevents the need to rely on high-interest debt during crises. Keep this money in a high-yield savings account for easy access while earning some interest.",
      financialTerms: ["emergency account", "high-interest debt", "high-yield savings account"],
      userId,
    },
    {
      id: `${userId}-3`,
      score: 0.82,
      source: "Budgeting Essentials.pdf",
      page: 23,
      chunkId: 3,
      content:
        "When building an emergency fund, start small and be consistent. Even $25 per week can build a substantial emergency fund over time. Automate your savings to make it easier to stick to your goal.",
      highlightedContent:
        "When building an <mark>emergency fund</mark>, start small and be consistent. Even $25 per week can build a substantial <mark>emergency fund</mark> over time. Automate your savings to make it easier to stick to your goal.",
      financialTerms: ["emergency fund", "savings", "automate"],
      userId,
    },
    {
      id: `${userId}-4`,
      score: 0.78,
      source: "Risk Management.pdf",
      page: 12,
      chunkId: 4,
      content:
        "Insurance can complement your emergency fund by covering specific risks like health emergencies or disability. However, insurance should not replace your emergency fund as it may not cover all expenses or may have waiting periods.",
      highlightedContent:
        "Insurance can complement your <mark>emergency fund</mark> by covering specific risks like health emergencies or disability. However, insurance should not replace your <mark>emergency fund</mark> as it may not cover all expenses or may have waiting periods.",
      financialTerms: ["emergency fund", "insurance", "disability"],
      userId,
    },
  ]

  // Apply filters if provided
  let filteredResults = mockResults.filter((result) => result.userId === userId)

  if (filters.source) {
    filteredResults = filteredResults.filter((result) => result.source === filters.source)
  }

  if (filters.minScore) {
    filteredResults = filteredResults.filter((result) => result.score >= filters.minScore)
  }

  // Sort by score (relevance) by default
  filteredResults.sort((a, b) => b.score - a.score)

  return filteredResults
}
