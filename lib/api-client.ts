interface ChatResponse {
  response: string
  citations: Array<{
    source: string
    page: number
    excerpt: string
    relevanceScore: number
  }>
  confidence: number
  processingTime: number
}

interface SearchResponse {
  query: string
  results: Array<{
    id: string
    score: number
    source: string
    page: number
    chunkId: number
    content: string
    highlightedContent: string
    financialTerms: string[]
  }>
  totalResults: number
  processingTime: number
}

interface UploadResponse {
  success: boolean
  files: Array<{
    id: string
    name: string
    size: number
    type: string
    status: string
    uploadedAt: string
  }>
  message: string
}

export class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl = "/api") {
    this.baseUrl = baseUrl
  }

  setToken(token: string | null) {
    this.token = token
  }

  private getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }
    
    if (this.token) {
      headers["authorization"] = `Bearer ${this.token}`
    }
    
    return headers
  }

  private getFetchOptions(options: RequestInit = {}): RequestInit {
    return {
      ...options,
      credentials: "include", // Include cookies for authentication
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    }
  }

  async uploadFiles(files: File[]): Promise<UploadResponse> {
    const formData = new FormData()
    files.forEach((file) => formData.append("files", file))

    const response = await fetch(`${this.baseUrl}/upload`, {
      method: "POST",
      body: formData,
      credentials: "include", // Include auth cookies
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Upload failed")
    }

    return response.json()
  }

  async sendChatMessage(
    message: string,
    history: Array<{ role: string; content: string }> = [],
  ): Promise<ChatResponse> {
    const response = await fetch(`${this.baseUrl}/chat`, {
      method: "POST",
      ...this.getFetchOptions(), // Use auth-enabled fetch options
      body: JSON.stringify({ message, history }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Chat request failed")
    }

    return response.json()
  }

  async searchDocuments(query: string, filters: any = {}): Promise<SearchResponse> {
    const response = await fetch(`${this.baseUrl}/search`, {
      method: "POST",
      ...this.getFetchOptions(), // Use auth-enabled fetch options
      body: JSON.stringify({ query, filters }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Search failed")
    }

    return response.json()
  }

  async getDocuments() {
    const response = await fetch(`${this.baseUrl}/documents`, {
      ...this.getFetchOptions({ method: "GET" }), // Use auth-enabled fetch options
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to fetch documents")
    }

    return response.json()
  }

  async deleteDocument(documentId: string) {
    const response = await fetch(`${this.baseUrl}/documents?id=${documentId}`, {
      ...this.getFetchOptions({ method: "DELETE" }), // Use auth-enabled fetch options
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to delete document")
    }

    return response.json()
  }
}

export const apiClient = new ApiClient()
