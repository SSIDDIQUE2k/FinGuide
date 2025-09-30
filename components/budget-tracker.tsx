"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarIcon, Plus, Trash2, TrendingUp, TrendingDown, Target } from "lucide-react"
import { format } from "date-fns"
import { BudgetAdvice } from "./budget-advice"
import { BudgetAnalytics } from "./budget-analytics"

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

export function BudgetTracker() {
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: "1",
      name: "Salary",
      amount: 5000,
      category: "Income",
      date: new Date(2024, 0, 1),
      type: "income",
      recurring: true,
    },
    {
      id: "2",
      name: "Rent Payment",
      amount: 1500,
      category: "Housing",
      date: new Date(2024, 0, 1),
      type: "expense",
      recurring: true,
    },
    {
      id: "3",
      name: "Grocery Shopping",
      amount: 120,
      category: "Food",
      date: new Date(2024, 0, 5),
      type: "expense",
    },
    {
      id: "4",
      name: "Gas Station",
      amount: 45,
      category: "Transportation",
      date: new Date(2024, 0, 7),
      type: "expense",
    },
    {
      id: "5",
      name: "Coffee Shop",
      amount: 15,
      category: "Food",
      date: new Date(2024, 0, 8),
      type: "expense",
    },
    {
      id: "6",
      name: "Movie Tickets",
      amount: 25,
      category: "Entertainment",
      date: new Date(2024, 0, 10),
      type: "expense",
    },
    {
      id: "7",
      name: "Freelance Work",
      amount: 800,
      category: "Income",
      date: new Date(2024, 0, 15),
      type: "income",
    },
    {
      id: "8",
      name: "Gym Membership",
      amount: 50,
      category: "Health",
      date: new Date(2024, 0, 12),
      type: "expense",
      recurring: true,
    },
  ])

  const [budgetGoals, setBudgetGoals] = useState<BudgetGoal[]>([
    { id: "1", category: "Housing", monthlyLimit: 1500, currentSpent: 1500, color: "bg-chart-1" },
    { id: "2", category: "Food", monthlyLimit: 600, currentSpent: 320, color: "bg-chart-2" },
    { id: "3", category: "Transportation", monthlyLimit: 300, currentSpent: 145, color: "bg-chart-3" },
    { id: "4", category: "Entertainment", monthlyLimit: 200, currentSpent: 80, color: "bg-chart-4" },
    { id: "5", category: "Utilities", monthlyLimit: 150, currentSpent: 0, color: "bg-chart-5" },
    { id: "6", category: "Health", monthlyLimit: 100, currentSpent: 50, color: "bg-chart-1" },
  ])

  const [newTransaction, setNewTransaction] = useState({
    name: "",
    amount: "",
    category: "",
    date: new Date(),
    type: "expense" as "income" | "expense",
    recurring: false,
  })

  const [newGoal, setNewGoal] = useState({
    category: "",
    monthlyLimit: "",
  })

  // Calculate current month totals
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  const monthlyTransactions = transactions.filter(
    (t) => t.date.getMonth() === currentMonth && t.date.getFullYear() === currentYear,
  )

  const monthlyIncome = monthlyTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)

  const monthlyExpenses = monthlyTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)

  // Update budget goals based on actual spending
  useEffect(() => {
    const updatedGoals = budgetGoals.map((goal) => {
      const categorySpent = monthlyTransactions
        .filter((t) => t.category === goal.category && t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0)

      return { ...goal, currentSpent: categorySpent }
    })
    setBudgetGoals(updatedGoals)
  }, [transactions])

  const addTransaction = () => {
    if (newTransaction.name && newTransaction.amount && newTransaction.category) {
      const transaction: Transaction = {
        id: Date.now().toString(),
        name: newTransaction.name,
        amount: Number.parseFloat(newTransaction.amount),
        category: newTransaction.category,
        date: newTransaction.date,
        type: newTransaction.type,
        recurring: newTransaction.recurring,
      }
      setTransactions([...transactions, transaction])
      setNewTransaction({
        name: "",
        amount: "",
        category: "",
        date: new Date(),
        type: "expense",
        recurring: false,
      })
    }
  }

  const addBudgetGoal = () => {
    if (newGoal.category && newGoal.monthlyLimit) {
      const goal: BudgetGoal = {
        id: Date.now().toString(),
        category: newGoal.category,
        monthlyLimit: Number.parseFloat(newGoal.monthlyLimit),
        currentSpent: 0,
        color: `bg-chart-${budgetGoals.length + 1}`,
      }
      setBudgetGoals([...budgetGoals, goal])
      setNewGoal({ category: "", monthlyLimit: "" })
    }
  }

  const removeTransaction = (id: string) => {
    setTransactions(transactions.filter((t) => t.id !== id))
  }

  const removeBudgetGoal = (id: string) => {
    setBudgetGoals(budgetGoals.filter((g) => g.id !== id))
  }

  return (
    <div className="space-y-6">
      {/* Monthly Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${monthlyIncome.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{format(new Date(), "MMMM yyyy")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${monthlyExpenses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {monthlyTransactions.filter((t) => t.type === "expense").length} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Income</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${monthlyIncome - monthlyExpenses >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              ${(monthlyIncome - monthlyExpenses).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {monthlyIncome > 0 ? Math.round(((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100) : 0}% savings
              rate
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tracking" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tracking">Budget Tracking</TabsTrigger>
          <TabsTrigger value="advice">AI Advice</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="tracking" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Budget Goals Tracking */}
            <Card>
              <CardHeader>
                <CardTitle>Budget Goals</CardTitle>
                <CardDescription>Track your spending against monthly budget limits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {budgetGoals.map((goal) => {
                  const percentage = goal.monthlyLimit > 0 ? (goal.currentSpent / goal.monthlyLimit) * 100 : 0
                  const isOverBudget = goal.currentSpent > goal.monthlyLimit
                  const remaining = goal.monthlyLimit - goal.currentSpent

                  return (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${goal.color}`} />
                          <span className="text-sm font-medium">{goal.category}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">
                            ${goal.currentSpent} / ${goal.monthlyLimit}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeBudgetGoal(goal.id)}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <Progress
                        value={Math.min(percentage, 100)}
                        className={`h-2 ${isOverBudget ? "[&>div]:bg-red-500" : ""}`}
                      />
                      <div className="flex justify-between text-xs">
                        <span className={isOverBudget ? "text-red-600" : "text-muted-foreground"}>
                          {percentage.toFixed(0)}% used
                        </span>
                        <span className={remaining >= 0 ? "text-green-600" : "text-red-600"}>
                          ${Math.abs(remaining)} {remaining >= 0 ? "remaining" : "over"}
                        </span>
                      </div>
                    </div>
                  )
                })}

                {/* Add New Budget Goal */}
                <div className="pt-4 border-t space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Category"
                      value={newGoal.category}
                      onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
                    />
                    <Input
                      type="number"
                      placeholder="Monthly limit"
                      value={newGoal.monthlyLimit}
                      onChange={(e) => setNewGoal({ ...newGoal, monthlyLimit: e.target.value })}
                    />
                  </div>
                  <Button onClick={addBudgetGoal} size="sm" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Budget Goal
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Your latest financial activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {transactions
                    .sort((a, b) => b.date.getTime() - a.date.getTime())
                    .slice(0, 10)
                    .map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-2 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-2 h-2 rounded-full ${transaction.type === "income" ? "bg-green-500" : "bg-red-500"}`}
                          />
                          <div>
                            <p className="text-sm font-medium">{transaction.name}</p>
                            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                              <span>{transaction.category}</span>
                              <span>•</span>
                              <span>{format(transaction.date, "MMM d")}</span>
                              {transaction.recurring && (
                                <>
                                  <span>•</span>
                                  <Badge variant="secondary" className="text-xs">
                                    Recurring
                                  </Badge>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-sm font-medium ${transaction.type === "income" ? "text-green-600" : "text-red-600"}`}
                          >
                            {transaction.type === "income" ? "+" : "-"}${transaction.amount.toLocaleString()}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTransaction(transaction.id)}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Add New Transaction */}
          <Card>
            <CardHeader>
              <CardTitle>Add Transaction</CardTitle>
              <CardDescription>Record a new income or expense</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="transaction-name">Description</Label>
                  <Input
                    id="transaction-name"
                    placeholder="e.g., Grocery shopping"
                    value={newTransaction.name}
                    onChange={(e) => setNewTransaction({ ...newTransaction, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transaction-amount">Amount</Label>
                  <Input
                    id="transaction-amount"
                    type="number"
                    placeholder="0.00"
                    value={newTransaction.amount}
                    onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transaction-category">Category</Label>
                  <Input
                    id="transaction-category"
                    placeholder="e.g., Food, Housing"
                    value={newTransaction.category}
                    onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transaction-type">Type</Label>
                  <Select
                    value={newTransaction.type}
                    onValueChange={(value: "income" | "expense") =>
                      setNewTransaction({ ...newTransaction, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(newTransaction.date, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newTransaction.date}
                        onSelect={(date) => date && setNewTransaction({ ...newTransaction, date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={newTransaction.recurring}
                  onChange={(e) => setNewTransaction({ ...newTransaction, recurring: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="recurring" className="text-sm">
                  Recurring transaction
                </Label>
              </div>

              <Button onClick={addTransaction} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Transaction
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advice">
          <BudgetAdvice
            budgetData={{
              monthlyIncome,
              monthlyExpenses,
              budgetGoals: budgetGoals.map((goal) => ({
                category: goal.category,
                monthlyLimit: goal.monthlyLimit,
                currentSpent: goal.currentSpent,
              })),
              savingsRate:
                monthlyIncome > 0 ? Math.round(((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100) : 0,
            }}
          />
        </TabsContent>

        <TabsContent value="analytics">
          <BudgetAnalytics
            transactions={transactions}
            budgetGoals={budgetGoals}
            monthlyIncome={monthlyIncome}
            monthlyExpenses={monthlyExpenses}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
