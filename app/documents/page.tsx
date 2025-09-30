"use client"

import { useAuth } from "@/lib/auth-context"
import { LoginForm } from "@/components/login-form"
import { Header } from "@/components/header"
import { DocumentManager } from "@/components/document-manager"

export default function DocumentsPage() {
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
        <DocumentManager />
      </main>
    </div>
  )
}
