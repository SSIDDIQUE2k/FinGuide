"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { PlusCircle, Trash2, DollarSign, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react"
import { BudgetTracker } from "./budget-tracker"

interface BudgetItem {
  id: string
  name: string
  category: string
  amount: number
  type: "income" | "expense"
  frequency: "monthly" | "weekly" | "yearly"
}

interface BudgetCategory {
  name: string
  budgeted: number
  spent: number
  color: string
}

export function BudgetDashboard() {
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([
    { id: "1", name: "Salary", category: "Income", amount: 5000, type: "income", frequency: "monthly" },
    { id: "2", name: "Rent", category: "Housing", amount: 1500, type: "expense", frequency: "monthly" },
    { id: "3", name: "Groceries", category: "Food", amount: 600, type: "expense", frequency: "monthly" },
  ])

  const [newItem, setNewItem] = useState({
    name: "",
    category: "",
    amount: "",
    type: "expense" as "income" | "expense",
    frequency: "monthly" as "monthly" | "weekly" | "yearly",
  })

  const categories: BudgetCategory[] = [
    { name: "Housing", budgeted: 1500, spent: 1500, color: "bg-chart-1" },
    { name: "Food", budgeted: 600, spent: 450, color: "bg-chart-2" },
    { name: "Transportation", budgeted: 300, spent: 280, color: "bg-chart-3" },
    { name: "Entertainment", budgeted: 200, spent: 150, color: "bg-chart-4" },
    { name: "Utilities", budgeted: 150, spent: 140, color: "bg-chart-5" },
  ]

  const totalIncome = budgetItems.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0)

  const totalExpenses = budgetItems
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + item.amount, 0)

  const remainingBudget = totalIncome - totalExpenses

  const addBudgetItem = () => {
    if (newItem.name && newItem.category && newItem.amount) {
      const item: BudgetItem = {
        id: Date.now().toString(),
        name: newItem.name,
        category: newItem.category,
        amount: Number.parseFloat(newItem.amount),
        type: newItem.type,
        frequency: newItem.frequency,
      }
      setBudgetItems([...budgetItems, item])
      setNewItem({ name: "", category: "", amount: "", type: "expense", frequency: "monthly" })
    }
  }

  const removeBudgetItem = (id: string) => {
    setBudgetItems(budgetItems.filter((item) => item.id !== id))
  }

  return (
    <div className="space-y-6">
      {/* Budget Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalIncome.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Monthly income</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${totalExpenses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Monthly expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${remainingBudget >= 0 ? "text-green-600" : "text-red-600"}`}>
              ${remainingBudget.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {remainingBudget >= 0 ? "Available to save" : "Over budget"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Savings Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalIncome > 0 ? Math.round((remainingBudget / totalIncome) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Of total income</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tracking">Live Tracking</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="manage">Manage Items</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Budget Breakdown</CardTitle>
                <CardDescription>Your monthly budget allocation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {categories.map((category) => {
                  const percentage = category.budgeted > 0 ? (category.spent / category.budgeted) * 100 : 0
                  const isOverBudget = category.spent > category.budgeted

                  return (
                    <div key={category.name} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{category.name}</span>
                        <span className="text-sm text-muted-foreground">
                          ${category.spent} / ${category.budgeted}
                        </span>
                      </div>
                      <Progress
                        value={Math.min(percentage, 100)}
                        className={`h-2 ${isOverBudget ? "bg-red-100" : ""}`}
                      />
                      {isOverBudget && (
                        <p className="text-xs text-red-600">Over budget by ${category.spent - category.budgeted}</p>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Items</CardTitle>
                <CardDescription>Your latest budget entries</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {budgetItems.slice(-5).map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-2 h-2 rounded-full ${item.type === "income" ? "bg-green-500" : "bg-red-500"}`}
                        />
                        <div>
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-sm font-medium ${item.type === "income" ? "text-green-600" : "text-red-600"}`}
                        >
                          {item.type === "income" ? "+" : "-"}${item.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">{item.frequency}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tracking" className="space-y-4">
          <BudgetTracker />
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Category Analysis</CardTitle>
              <CardDescription>Detailed breakdown of your spending by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {categories.map((category) => {
                  const percentage = category.budgeted > 0 ? (category.spent / category.budgeted) * 100 : 0
                  const remaining = category.budgeted - category.spent

                  return (
                    <div key={category.name} className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">{category.name}</h3>
                        <Badge variant={percentage > 100 ? "destructive" : percentage > 80 ? "secondary" : "default"}>
                          {percentage.toFixed(0)}% used
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Budgeted</p>
                          <p className="font-medium">${category.budgeted}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Spent</p>
                          <p className="font-medium">${category.spent}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Remaining</p>
                          <p className={`font-medium ${remaining >= 0 ? "text-green-600" : "text-red-600"}`}>
                            ${Math.abs(remaining)}
                          </p>
                        </div>
                      </div>

                      <Progress value={Math.min(percentage, 100)} className="h-3" />
                      <Separator />
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Budget Item</CardTitle>
              <CardDescription>Add a new income or expense to your budget</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Salary, Rent, Groceries"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    placeholder="e.g., Housing, Food, Income"
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={newItem.amount}
                    onChange={(e) => setNewItem({ ...newItem, amount: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={newItem.type}
                    onValueChange={(value: "income" | "expense") => setNewItem({ ...newItem, type: value })}
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
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select
                    value={newItem.frequency}
                    onValueChange={(value: "monthly" | "weekly" | "yearly") =>
                      setNewItem({ ...newItem, frequency: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={addBudgetItem} className="w-full">
                <PlusCircle className="w-4 h-4 mr-2" />
                Add Budget Item
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current Budget Items</CardTitle>
              <CardDescription>Manage your existing budget items</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {budgetItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-3 h-3 rounded-full ${item.type === "income" ? "bg-green-500" : "bg-red-500"}`}
                      />
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.category} • {item.frequency}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`font-medium ${item.type === "income" ? "text-green-600" : "text-red-600"}`}>
                        {item.type === "income" ? "+" : "-"}${item.amount.toLocaleString()}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBudgetItem(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Budget Insights</CardTitle>
              <CardDescription>Get personalized financial advice based on your documents and budget</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-accent/10 rounded-lg border">
                  <h4 className="font-semibold mb-2">Budget Analysis</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Based on your current budget, here are some insights:
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start space-x-2">
                      <span className="text-green-600">•</span>
                      <span>
                        Your savings rate of {totalIncome > 0 ? Math.round((remainingBudget / totalIncome) * 100) : 0}%
                        is{" "}
                        {remainingBudget / totalIncome > 0.2
                          ? "excellent"
                          : remainingBudget / totalIncome > 0.1
                            ? "good"
                            : "below recommended levels"}
                        .
                      </span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-600">•</span>
                      <span>
                        Housing costs represent {totalIncome > 0 ? Math.round((1500 / totalIncome) * 100) : 0}% of your
                        income.
                      </span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-orange-600">•</span>
                      <span>Consider reviewing categories where you're over budget.</span>
                    </li>
                  </ul>
                </div>

                <Button className="w-full bg-transparent" variant="outline">
                  Get Detailed AI Analysis
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  AI insights will be generated based on your uploaded financial documents and current budget data.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
