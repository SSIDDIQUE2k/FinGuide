"use client"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import { LogOut, User } from "lucide-react"

export function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">FG</span>
              </div>
              <span className="text-xl font-semibold text-foreground">FinGuide</span>
            </Link>
          </div>

          {user && (
            <nav className="hidden md:flex items-center space-x-8">
              <a href="/#features" className="text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="/#upload" className="text-muted-foreground hover:text-foreground transition-colors">
                Upload
              </a>
              <Link href="/chat" className="text-muted-foreground hover:text-foreground transition-colors">
                Chat
              </Link>
              <Link href="/documents" className="text-muted-foreground hover:text-foreground transition-colors">
                Documents
              </Link>
              <Link href="/budget" className="text-muted-foreground hover:text-foreground transition-colors">
                Budget
              </Link>
            </nav>
          )}

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
                <Button variant="outline" size="sm" onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
                <Link href="/chat">
                  <Button size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
