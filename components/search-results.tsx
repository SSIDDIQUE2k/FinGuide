"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { FileText, Search, ExternalLink, Copy, Check, Filter, SortAsc } from "lucide-react"

interface SearchResult {
  id: string
  score: number
  source: string
  page: number
  chunkId: number
  content: string
  highlightedContent: string
  financialTerms: string[]
}

interface SearchResultsProps {
  query: string
  results: SearchResult[]
  isLoading?: boolean
}

export function SearchResults({ query, results, isLoading = false }: SearchResultsProps) {
  const [sortBy, setSortBy] = useState<"relevance" | "source" | "page">("relevance")
  const [filterSource, setFilterSource] = useState<string>("")
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const uniqueSources = Array.from(new Set(results.map((r) => r.source)))

  const filteredAndSortedResults = results
    .filter((result) => !filterSource || result.source === filterSource)
    .sort((a, b) => {
      switch (sortBy) {
        case "relevance":
          return b.score - a.score
        case "source":
          return a.source.localeCompare(b.source)
        case "page":
          return a.page - b.page
        default:
          return 0
      }
    })

  const handleCopyContent = async (result: SearchResult) => {
    try {
      await navigator.clipboard.writeText(result.content)
      setCopiedId(result.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error("Failed to copy content:", err)
    }
  }

  const formatScore = (score: number) => {
    return (score * 100).toFixed(1)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 animate-pulse" />
            Searching documents...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-20 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Found <span className="font-medium text-foreground">{results.length}</span> results for{" "}
                <span className="font-medium text-foreground">"{query}"</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={filterSource}
                  onChange={(e) => setFilterSource(e.target.value)}
                  className="text-sm border border-border rounded px-2 py-1 bg-background"
                >
                  <option value="">All sources</option>
                  {uniqueSources.map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <SortAsc className="h-4 w-4 text-muted-foreground" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "relevance" | "source" | "page")}
                  className="text-sm border border-border rounded px-2 py-1 bg-background"
                >
                  <option value="relevance">Relevance</option>
                  <option value="source">Source</option>
                  <option value="page">Page</option>
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results List */}
      <div className="space-y-4">
        {filteredAndSortedResults.map((result, index) => (
          <Card key={result.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-accent" />
                    <span className="font-medium text-foreground">{result.source}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Page {result.page}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {formatScore(result.score)}% match
                  </Badge>
                </div>

                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleCopyContent(result)} className="h-8 w-8 p-0">
                    {copiedId === result.id ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="space-y-3">
                {/* Highlighted Content */}
                <div className="prose prose-sm max-w-none">
                  <div
                    className="text-foreground leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: result.highlightedContent }}
                  />
                </div>

                {/* Financial Terms */}
                {result.financialTerms.length > 0 && (
                  <div>
                    <Separator className="my-3" />
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">Financial terms:</span>
                      {result.financialTerms.map((term, termIndex) => (
                        <Badge key={termIndex} variant="outline" className="text-xs">
                          {term}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAndSortedResults.length === 0 && !isLoading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No results found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search query or filters to find relevant content.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
