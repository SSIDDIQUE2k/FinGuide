"use client"

import { useAuth } from "@/lib/auth-context"
import { LoginForm } from "@/components/login-form"
import { ChatInterface } from "@/components/chat-interface"
import { Header } from "@/components/header"

export default function ChatPage() {
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      <Header />
      <main className="px-4 sm:px-6 lg:px-8 py-8">
        <ChatInterface />
      </main>
    </div>
  )
}
