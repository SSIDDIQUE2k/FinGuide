"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, MessageSquare, BookOpen, TrendingUp, AlertTriangle } from "lucide-react"

interface Citation {
  source: string
  page: number
  excerpt: string
  relevanceScore: number
}

interface BudgetAdviceResponse {
  response: string
  citations: Citation[]
  confidence: number
  processingTime: number
}

interface BudgetData {
  monthlyIncome: number
  monthlyExpenses: number
  budgetGoals: Array<{
    category: string
    monthlyLimit: number
    currentSpent: number
  }>
  savingsRate: number
}

interface BudgetAdviceProps {
  budgetData: BudgetData
}

export function BudgetAdvice({ budgetData }: BudgetAdviceProps) {
  const [advice, setAdvice] = useState<BudgetAdviceResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateBudgetContext = () => {
    const overBudgetCategories = budgetData.budgetGoals.filter((goal) => goal.currentSpent > goal.monthlyLimit)
    const underBudgetCategories = budgetData.budgetGoals.filter((goal) => goal.currentSpent < goal.monthlyLimit * 0.8)

    return `
Current Financial Situation:
- Monthly Income: $${budgetData.monthlyIncome.toLocaleString()}
- Monthly Expenses: $${budgetData.monthlyExpenses.toLocaleString()}
- Net Income: $${(budgetData.monthlyIncome - budgetData.monthlyExpenses).toLocaleString()}
- Savings Rate: ${budgetData.savingsRate}%

Budget Performance:
${budgetData.budgetGoals
  .map(
    (goal) =>
      `- ${goal.category}: $${goal.currentSpent} spent of $${goal.monthlyLimit} budgeted (${Math.round((goal.currentSpent / goal.monthlyLimit) * 100)}%)`,
  )
  .join("\n")}

${
  overBudgetCategories.length > 0
    ? `
Over-budget categories: ${overBudgetCategories.map((g) => g.category).join(", ")}
`
    : ""
}

${
  underBudgetCategories.length > 0
    ? `
Under-budget categories: ${underBudgetCategories.map((g) => g.category).join(", ")}
`
    : ""
}

Please provide personalized budget advice based on this financial data.`
  }

  const getAdvice = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const budgetContext = generateBudgetContext()

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: budgetContext,
          history: [],
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get budget advice")
      }

      const data: BudgetAdviceResponse = await response.json()
      setAdvice(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const getAdviceType = () => {
    if (budgetData.savingsRate < 10) return { type: "warning", icon: AlertTriangle, color: "text-orange-600" }
    if (budgetData.savingsRate > 20) return { type: "success", icon: TrendingUp, color: "text-green-600" }
    return { type: "info", icon: MessageSquare, color: "text-blue-600" }
  }

  const adviceType = getAdviceType()
  const AdviceIcon = adviceType.icon

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AdviceIcon className={`h-5 w-5 ${adviceType.color}`} />
            <CardTitle>Personalized Budget Advice</CardTitle>
          </div>
          <Button onClick={getAdvice} disabled={isLoading} size="sm" variant="outline">
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <MessageSquare className="w-4 h-4 mr-2" />
                Get Advice
              </>
            )}
          </Button>
        </div>
        <CardDescription>
          AI-powered financial guidance based on your spending patterns and budget goals
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {!advice && !isLoading && !error && (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Click "Get Advice" to receive personalized budget recommendations</p>
            <p className="text-xs mt-1">Based on your current spending patterns and financial goals</p>
          </div>
        )}

        {advice && (
          <div className="space-y-4">
            {/* Confidence and Processing Info */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-xs">
                  {Math.round(advice.confidence * 100)}% confidence
                </Badge>
                <span>•</span>
                <span>{advice.processingTime}ms processing time</span>
              </div>
            </div>

            {/* Main Advice */}
            <div className="prose prose-sm max-w-none">
              <div className="p-4 bg-muted/50 rounded-lg border">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{advice.response}</p>
              </div>
            </div>

            {/* Citations */}
            {advice.citations.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm font-medium">
                  <BookOpen className="w-4 h-4" />
                  <span>Sources</span>
                </div>
                <div className="space-y-2">
                  {advice.citations.map((citation, index) => (
                    <div key={index} className="p-3 bg-background border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {citation.source}
                          </Badge>
                          <span className="text-xs text-muted-foreground">Page {citation.page}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {Math.round(citation.relevanceScore * 100)}% relevant
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{citation.excerpt}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
