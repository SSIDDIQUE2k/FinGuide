"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bot, FileText, Copy, Check, ThumbsUp, ThumbsDown, ExternalLink, Quote, AlertCircle } from "lucide-react"

interface Citation {
  id: string
  source: string
  page: number
  excerpt: string
  relevanceScore: number
}

interface AnswerDisplayProps {
  question: string
  answer: string
  citations: Citation[]
  confidence: number
  processingTime: number
  isLoading?: boolean
}

export function AnswerDisplay({
  question,
  answer,
  citations,
  confidence,
  processingTime,
  isLoading = false,
}: AnswerDisplayProps) {
  const [copiedAnswer, setCopiedAnswer] = useState(false)
  const [copiedCitation, setCopiedCitation] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null)

  const handleCopyAnswer = async () => {
    try {
      await navigator.clipboard.writeText(answer)
      setCopiedAnswer(true)
      setTimeout(() => setCopiedAnswer(false), 2000)
    } catch (err) {
      console.error("Failed to copy answer:", err)
    }
  }

  const handleCopyCitation = async (citation: Citation) => {
    try {
      const citationText = `"${citation.excerpt}" - ${citation.source}, Page ${citation.page}`
      await navigator.clipboard.writeText(citationText)
      setCopiedCitation(citation.id)
      setTimeout(() => setCopiedCitation(null), 2000)
    } catch (err) {
      console.error("Failed to copy citation:", err)
    }
  }

  const handleFeedback = (type: "up" | "down") => {
    setFeedback(type)
    // Here you would typically send feedback to your backend
    console.log(`User feedback: ${type} for question: ${question}`)
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600 dark:text-green-400"
    if (confidence >= 0.6) return "text-yellow-600 dark:text-yellow-400"
    return "text-red-600 dark:text-red-400"
  }

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return "High"
    if (confidence >= 0.6) return "Medium"
    return "Low"
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 animate-pulse" />
            Generating answer...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-full mb-2"></div>
              <div className="h-4 bg-muted rounded w-5/6 mb-2"></div>
              <div className="h-4 bg-muted rounded w-4/6 mb-4"></div>
              <div className="h-20 bg-muted rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main Answer */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-accent" />
              AI Answer
            </CardTitle>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className={getConfidenceColor(confidence)}>
                {getConfidenceLabel(confidence)} confidence
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {processingTime}ms
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Question */}
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Quote className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-sm font-medium text-foreground">{question}</p>
            </div>
          </div>

          {/* Answer */}
          <div className="prose prose-sm max-w-none">
            <div className="text-foreground leading-relaxed whitespace-pre-wrap">{answer}</div>
          </div>

          {/* Confidence Warning */}
          {confidence < 0.6 && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800 dark:text-yellow-200">Low Confidence Answer</p>
                <p className="text-yellow-700 dark:text-yellow-300">
                  This answer has low confidence. Please verify the information with the source documents.
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyAnswer}
                className="text-muted-foreground hover:text-foreground"
              >
                {copiedAnswer ? <Check className="h-4 w-4 mr-2 text-green-500" /> : <Copy className="h-4 w-4 mr-2" />}
                {copiedAnswer ? "Copied!" : "Copy"}
              </Button>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground mr-2">Was this helpful?</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFeedback("up")}
                className={`h-8 w-8 p-0 ${feedback === "up" ? "text-green-500" : "text-muted-foreground hover:text-foreground"}`}
              >
                <ThumbsUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFeedback("down")}
                className={`h-8 w-8 p-0 ${feedback === "down" ? "text-red-500" : "text-muted-foreground hover:text-foreground"}`}
              >
                <ThumbsDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Citations */}
      {citations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-accent" />
              Sources & Citations
              <Badge variant="secondary" className="ml-2">
                {citations.length}
              </Badge>
            </CardTitle>
          </CardHeader>

          <CardContent>
            <ScrollArea className="max-h-96">
              <div className="space-y-4">
                {citations.map((citation, index) => (
                  <div key={citation.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {index + 1}. {citation.source}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          Page {citation.page}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {(citation.relevanceScore * 100).toFixed(0)}% relevant
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyCitation(citation)}
                          className="h-8 w-8 p-0"
                        >
                          {copiedCitation === citation.id ? (
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

                    <blockquote className="border-l-4 border-accent pl-4 italic text-muted-foreground">
                      "{citation.excerpt}"
                    </blockquote>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
