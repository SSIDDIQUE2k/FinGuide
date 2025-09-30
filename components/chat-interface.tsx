"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Send, Bot, User, FileText, Loader2, Lightbulb } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"

interface Message {
  id: string
  type: "user" | "assistant"
  content: string
  timestamp: Date
  citations?: Citation[]
  isLoading?: boolean
}

interface Citation {
  source: string
  page: number
  excerpt: string
}

export function ChatInterface() {
  const { token } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [documentStats, setDocumentStats] = useState({ documents: 0, pages: 0, chunks: 0 })
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Set the token for API client
  useEffect(() => {
    if (token) {
      apiClient.setToken(token)
    }
  }, [token])

  const suggestedQuestions = [
    "What is an emergency fund and how much should I save?",
    "How does compound interest work in investments?",
    "What are the different types of retirement accounts?",
    "How can I improve my credit score?",
    "What should I consider when choosing insurance coverage?",
    "How do I create a monthly budget?",
  ]

  useEffect(() => {
    loadDocumentStats()
  }, [])

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const loadDocumentStats = async () => {
    try {
      const response = await apiClient.getDocuments()
      setDocumentStats({
        documents: response.totalDocuments,
        pages: response.totalPages,
        chunks: response.totalChunks,
      })
    } catch (error) {
      console.error("Failed to load document stats:", error)
    }
  }

  const handleSubmit = async (question: string) => {
    if (!question.trim() || isLoading) return

    const userMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      type: "user",
      content: question.trim(),
      timestamp: new Date(),
    }

    const loadingMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      type: "assistant",
      content: "",
      timestamp: new Date(),
      isLoading: true,
    }

    setMessages((prev) => [...prev, userMessage, loadingMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await apiClient.sendChatMessage(question, [])

      const assistantMessage: Message = {
        id: loadingMessage.id,
        type: "assistant",
        content: response.response,
        timestamp: new Date(),
        citations: response.citations,
        isLoading: false,
      }

      setMessages((prev) => prev.map((msg) => (msg.id === loadingMessage.id ? assistantMessage : msg)))
    } catch (error) {
      console.error("Chat error:", error)
      const errorMessage: Message = {
        id: loadingMessage.id,
        type: "assistant",
        content: "I apologize, but I encountered an error while processing your question. Please try again.",
        timestamp: new Date(),
        isLoading: false,
      }
      setMessages((prev) => prev.map((msg) => (msg.id === loadingMessage.id ? errorMessage : msg)))
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSubmit(input)
  }

  const handleSuggestedQuestion = (question: string) => {
    handleSubmit(question)
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-3">Financial Knowledge Base</h1>
        <p className="text-lg text-muted-foreground">
          Access comprehensive financial insights from external sources and industry documents with precise citations and real-time analysis.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
        {/* Chat Area */}
        <div className="xl:col-span-3">
          <Card className="h-[700px] flex flex-col shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
            <CardHeader className="pb-4 border-b border-border/50">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Bot className="h-6 w-6 text-accent" />
                </div>
                Financial Assistant
                <Badge variant="outline" className="ml-auto bg-green-50 text-green-700 border-green-200">
                  Active
                </Badge>
              </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0">
              <ScrollArea className="flex-1 px-6" ref={scrollAreaRef}>
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-16 px-8">
                    <div className="mb-8 rounded-full bg-gradient-to-br from-accent/20 to-accent/10 p-6">
                      <Bot className="h-12 w-12 text-accent" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-4">
                      Ready to help with your financial questions
                    </h3>
                    <p className="text-muted-foreground mb-8 max-w-lg text-lg leading-relaxed">
                      Ask me anything about financial topics. I'll provide detailed answers with
                      precise citations from external sources and real-time analysis powered by Hugging Face models.
                    </p>
                    <div className="grid grid-cols-1 gap-3 max-w-lg w-full">
                      {suggestedQuestions.slice(0, 3).map((question, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="lg"
                          onClick={() => handleSuggestedQuestion(question)}
                          className="text-left justify-start h-auto py-4 px-4 text-wrap hover:bg-accent/5 hover:border-accent/30 transition-all duration-200"
                          disabled={isLoading}
                        >
                          <Lightbulb className="h-4 w-4 mr-3 flex-shrink-0 text-accent" />
                          <span className="text-sm font-medium">{question}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8 py-6">
                    {messages.map((message) => (
                      <div key={message.id} className="flex gap-6">
                        <div className="flex-shrink-0">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${
                              message.type === "user"
                                ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground"
                                : "bg-gradient-to-br from-accent/20 to-accent/10 text-accent"
                            }`}
                          >
                            {message.type === "user" ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                          </div>
                        </div>

                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-foreground text-lg">
                              {message.type === "user" ? "You" : "Assistant"}
                            </span>
                            <span className="text-sm text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                              {message.timestamp.toLocaleTimeString()}
                            </span>
                          </div>

                          {message.isLoading ? (
                            <div className="flex items-center gap-3 text-muted-foreground bg-muted/30 rounded-lg p-4">
                              <Loader2 className="h-5 w-5 animate-spin text-accent" />
                              <span className="text-sm font-medium">Analyzing documents with AI...</span>
                            </div>
                          ) : (
                            <div className="prose prose-sm max-w-none">
                              <div className="text-foreground whitespace-pre-wrap leading-relaxed text-base bg-gradient-to-r from-background to-muted/20 p-4 rounded-lg border border-border/50">
                                {message.content}
                              </div>

                              {message.citations && message.citations.length > 0 && (
                                <div className="mt-6 space-y-3">
                                  <h4 className="text-base font-semibold text-foreground flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-accent" />
                                    Sources
                                  </h4>
                                  <div className="grid gap-3">
                                    {message.citations.map((citation, index) => (
                                      <div key={index} className="border border-border/50 rounded-lg p-4 bg-gradient-to-r from-muted/20 to-background hover:shadow-sm transition-shadow">
                                        <div className="flex items-center gap-3 mb-3">
                                          <FileText className="h-4 w-4 text-accent flex-shrink-0" />
                                          <span className="font-semibold text-sm text-foreground">{citation.source}</span>
                                          <Badge variant="outline" className="text-xs bg-accent/10 text-accent border-accent/30">
                                            Page {citation.page}
                                          </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground italic leading-relaxed">"{citation.excerpt}"</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              <div className="border-t border-border/50 p-6 bg-gradient-to-r from-background to-muted/10">
                <form onSubmit={handleInputSubmit} className="flex gap-3">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask a question about financial topics..."
                    disabled={isLoading}
                    className="flex-1 h-12 text-base border-border/50 focus:border-accent/50 focus:ring-accent/20"
                  />
                  <Button 
                    type="submit" 
                    disabled={isLoading || !input.trim()}
                    size="lg"
                    className="h-12 px-6 bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 shadow-lg"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="xl:col-span-2 space-y-6">
          <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/10">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-accent" />
                Suggested Questions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {suggestedQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="lg"
                  onClick={() => handleSuggestedQuestion(question)}
                  className="w-full text-left justify-start h-auto py-4 px-4 text-wrap hover:bg-accent/5 hover:border-accent/20 border border-transparent transition-all duration-200"
                  disabled={isLoading}
                >
                  <Lightbulb className="h-4 w-4 mr-3 flex-shrink-0 text-accent" />
                  <span className="text-sm font-medium leading-relaxed">{question}</span>
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/10">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <FileText className="h-5 w-5 text-accent" />
                Knowledge Base Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                  <span className="text-sm font-medium text-foreground">External sources</span>
                  <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30">
                    {documentStats.documents}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                  <span className="text-sm font-medium text-foreground">Knowledge pages</span>
                  <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30">
                    {documentStats.pages}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <span className="text-sm font-medium text-foreground">Index status</span>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border-green-200 dark:border-green-800">
                    Ready
                  </Badge>
                </div>
                <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="h-4 w-4 text-accent" />
                    <span className="text-sm font-semibold text-foreground">AI Status</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Hugging Face models active and processing external sources in real-time.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
