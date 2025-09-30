"use client"

import { useAuth } from "@/lib/auth-context"
import { LoginForm } from "@/components/login-form"
import { BudgetDashboard } from "@/components/budget-dashboard"
import { Header } from "@/components/header"

export default function BudgetPage() {
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Budget Manager</h1>
          <p className="text-muted-foreground">
            Create and manage your budget with AI-powered insights from your financial documents.
          </p>
        </div>
        <BudgetDashboard />
      </main>
    </div>
  )
}
