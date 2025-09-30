"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts"
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Target, PieChartIcon } from "lucide-react"

interface Transaction {
  id: string
  name: string
  amount: number
  category: string
  date: Date
  type: "income" | "expense"
  recurring?: boolean
}

interface BudgetGoal {
  id: string
  category: string
  monthlyLimit: number
  currentSpent: number
  color: string
}

interface BudgetAnalyticsProps {
  transactions: Transaction[]
  budgetGoals: BudgetGoal[]
  monthlyIncome: number
  monthlyExpenses: number
}

export function BudgetAnalytics({ transactions, budgetGoals, monthlyIncome, monthlyExpenses }: BudgetAnalyticsProps) {
  const analytics = useMemo(() => {
    // Calculate spending by category
    const categorySpending = budgetGoals.map((goal) => ({
      category: goal.category,
      budgeted: goal.monthlyLimit,
      spent: goal.currentSpent,
      remaining: goal.monthlyLimit - goal.currentSpent,
      percentage: goal.monthlyLimit > 0 ? (goal.currentSpent / goal.monthlyLimit) * 100 : 0,
      status:
        goal.currentSpent > goal.monthlyLimit
          ? "over"
          : goal.currentSpent > goal.monthlyLimit * 0.8
            ? "warning"
            : "good",
    }))

    // Calculate daily spending trend (last 30 days)
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (29 - i))
      return date
    })

    const dailySpending = last30Days.map((date) => {
      const dayTransactions = transactions.filter(
        (t) => t.type === "expense" && t.date.toDateString() === date.toDateString(),
      )
      const totalSpent = dayTransactions.reduce((sum, t) => sum + t.amount, 0)

      return {
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        amount: totalSpent,
        transactions: dayTransactions.length,
      }
    })

    // Calculate financial health metrics
    const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0
    const totalBudgeted = budgetGoals.reduce((sum, goal) => sum + goal.monthlyLimit, 0)
    const totalSpent = budgetGoals.reduce((sum, goal) => sum + goal.currentSpent, 0)
    const budgetUtilization = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0

    // Top spending categories
    const topCategories = categorySpending
      .filter((cat) => cat.spent > 0)
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 5)

    // Budget performance insights
    const overBudgetCategories = categorySpending.filter((cat) => cat.status === "over")
    const warningCategories = categorySpending.filter((cat) => cat.status === "warning")
    const goodCategories = categorySpending.filter((cat) => cat.status === "good")

    return {
      categorySpending,
      dailySpending,
      savingsRate,
      budgetUtilization,
      topCategories,
      overBudgetCategories,
      warningCategories,
      goodCategories,
      totalBudgeted,
      totalSpent,
    }
  }, [transactions, budgetGoals, monthlyIncome, monthlyExpenses])

  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7c7c", "#8dd1e1", "#d084d0", "#ffb347"]

  const getHealthScore = () => {
    let score = 100

    // Deduct points for over-budget categories
    score -= analytics.overBudgetCategories.length * 15

    // Deduct points for low savings rate
    if (analytics.savingsRate < 10) score -= 20
    else if (analytics.savingsRate < 20) score -= 10

    // Deduct points for high budget utilization
    if (analytics.budgetUtilization > 100) score -= 15
    else if (analytics.budgetUtilization > 90) score -= 5

    return Math.max(0, score)
  }

  const healthScore = getHealthScore()

  return (
    <div className="space-y-6">
      {/* Financial Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                healthScore >= 80 ? "text-green-600" : healthScore >= 60 ? "text-yellow-600" : "text-red-600"
              }`}
            >
              {healthScore}/100
            </div>
            <Progress value={healthScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Savings Rate</CardTitle>
            {analytics.savingsRate >= 20 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                analytics.savingsRate >= 20
                  ? "text-green-600"
                  : analytics.savingsRate >= 10
                    ? "text-yellow-600"
                    : "text-red-600"
              }`}
            >
              {analytics.savingsRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.savingsRate >= 20 ? "Excellent" : analytics.savingsRate >= 10 ? "Good" : "Needs improvement"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Usage</CardTitle>
            <PieChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                analytics.budgetUtilization <= 90
                  ? "text-green-600"
                  : analytics.budgetUtilization <= 100
                    ? "text-yellow-600"
                    : "text-red-600"
              }`}
            >
              {analytics.budgetUtilization.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              ${analytics.totalSpent.toLocaleString()} of ${analytics.totalBudgeted.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            {analytics.overBudgetCategories.length === 0 ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge variant="destructive" className="text-xs">
                {analytics.overBudgetCategories.length} over
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {analytics.warningCategories.length} warning
              </Badge>
              <Badge variant="default" className="text-xs">
                {analytics.goodCategories.length} good
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending by Category Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Budget vs Actual Spending</CardTitle>
            <CardDescription>Compare your planned budget with actual spending</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.categorySpending}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} fontSize={12} />
                <YAxis />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `$${value.toLocaleString()}`,
                    name === "budgeted" ? "Budgeted" : "Spent",
                  ]}
                />
                <Bar dataKey="budgeted" fill="#e2e8f0" name="budgeted" />
                <Bar dataKey="spent" fill="#3b82f6" name="spent" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Categories Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Top Spending Categories</CardTitle>
            <CardDescription>Your highest expense categories this month</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.topCategories}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percentage }) => `${category} (${percentage.toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="spent"
                >
                  {analytics.topCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, "Spent"]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Daily Spending Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Spending Trend</CardTitle>
          <CardDescription>Your spending pattern over the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics.dailySpending}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={12} interval="preserveStartEnd" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => [`$${value.toLocaleString()}`, "Spent"]}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Area type="monotone" dataKey="amount" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category Performance Details */}
      <Card>
        <CardHeader>
          <CardTitle>Category Performance Analysis</CardTitle>
          <CardDescription>Detailed breakdown of each budget category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.categorySpending.map((category, index) => (
              <div key={category.category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="font-medium">{category.category}</span>
                    <Badge
                      variant={
                        category.status === "over"
                          ? "destructive"
                          : category.status === "warning"
                            ? "secondary"
                            : "default"
                      }
                      className="text-xs"
                    >
                      {category.status === "over"
                        ? "Over Budget"
                        : category.status === "warning"
                          ? "Near Limit"
                          : "On Track"}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      ${category.spent.toLocaleString()} / ${category.budgeted.toLocaleString()}
                    </div>
                    <div className={`text-xs ${category.remaining >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {category.remaining >= 0
                        ? `$${category.remaining.toLocaleString()} remaining`
                        : `$${Math.abs(category.remaining).toLocaleString()} over`}
                    </div>
                  </div>
                </div>
                <Progress
                  value={Math.min(category.percentage, 100)}
                  className={`h-2 ${
                    category.status === "over"
                      ? "[&>div]:bg-red-500"
                      : category.status === "warning"
                        ? "[&>div]:bg-yellow-500"
                        : ""
                  }`}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{category.percentage.toFixed(1)}% used</span>
                  <span>
                    {category.percentage <= 50
                      ? "Low usage"
                      : category.percentage <= 80
                        ? "Moderate usage"
                        : category.percentage <= 100
                          ? "High usage"
                          : "Over budget"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
