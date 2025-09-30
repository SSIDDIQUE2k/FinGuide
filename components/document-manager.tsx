"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  FileText,
  Search,
  Trash2,
  Download,
  Eye,
  Calendar,
  HardDrive,
  FileCheck,
  Upload,
  Filter,
  AlertCircle,
} from "lucide-react"
import { apiClient } from "@/lib/api-client"

interface Document {
  id: string
  name: string
  size: number
  uploadedAt: string
  status: "processing" | "completed" | "error"
  pages: number
  chunks: number
}

export function DocumentManager() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getDocuments()
      setDocuments(response.documents)
    } catch (error) {
      console.error("Failed to load documents:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    try {
      await apiClient.deleteDocument(documentId)
      setDocuments((prev) => prev.filter((doc) => doc.id !== documentId))
      setSelectedDocuments((prev) => {
        const newSet = new Set(prev)
        newSet.delete(documentId)
        return newSet
      })
    } catch (error) {
      console.error("Failed to delete document:", error)
    }
  }

  const handleBulkDelete = async () => {
    try {
      await Promise.all(Array.from(selectedDocuments).map((id) => apiClient.deleteDocument(id)))
      setDocuments((prev) => prev.filter((doc) => !selectedDocuments.has(doc.id)))
      setSelectedDocuments(new Set())
    } catch (error) {
      console.error("Failed to delete documents:", error)
    }
  }

  const toggleDocumentSelection = (documentId: string) => {
    setSelectedDocuments((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(documentId)) {
        newSet.delete(documentId)
      } else {
        newSet.add(documentId)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    if (selectedDocuments.size === filteredDocuments.length) {
      setSelectedDocuments(new Set())
    } else {
      setSelectedDocuments(new Set(filteredDocuments.map((doc) => doc.id)))
    }
  }

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusBadge = (status: Document["status"]) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
            <FileCheck className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        )
      case "processing":
        return (
          <Badge variant="secondary">
            <div className="h-3 w-3 mr-1 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Processing
          </Badge>
        )
      case "error":
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        )
    }
  }

  const totalStats = documents.reduce(
    (acc, doc) => ({
      totalSize: acc.totalSize + doc.size,
      totalPages: acc.totalPages + doc.pages,
      totalChunks: acc.totalChunks + doc.chunks,
    }),
    { totalSize: 0, totalPages: 0, totalChunks: 0 },
  )

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="h-8 bg-muted rounded w-64 mb-2"></div>
          <div className="h-4 bg-muted rounded w-96"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-20 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-16"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Document Management</h1>
        <p className="text-muted-foreground">Manage your uploaded financial documents and monitor processing status.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Documents</p>
                <p className="text-2xl font-bold text-foreground">{documents.length}</p>
              </div>
              <FileText className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Size</p>
                <p className="text-2xl font-bold text-foreground">{formatFileSize(totalStats.totalSize)}</p>
              </div>
              <HardDrive className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Pages</p>
                <p className="text-2xl font-bold text-foreground">{totalStats.totalPages}</p>
              </div>
              <FileCheck className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Search Chunks</p>
                <p className="text-2xl font-bold text-foreground">{totalStats.totalChunks}</p>
              </div>
              <Search className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-sm border border-border rounded px-3 py-2 bg-background"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="processing">Processing</option>
                  <option value="error">Error</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {selectedDocuments.size > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Selected ({selectedDocuments.size})
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Documents</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {selectedDocuments.size} selected document(s)? This action
                        cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleBulkDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              <Button size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Upload New
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Documents ({filteredDocuments.length})</CardTitle>
            {filteredDocuments.length > 0 && (
              <Button variant="ghost" size="sm" onClick={toggleSelectAll}>
                {selectedDocuments.size === filteredDocuments.length ? "Deselect All" : "Select All"}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No documents found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your search or filters."
                  : "Upload your first financial document to get started."}
              </p>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredDocuments.map((document) => (
                <div key={document.id} className="p-6 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={selectedDocuments.has(document.id)}
                      onChange={() => toggleDocumentSelection(document.id)}
                      className="mt-1"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-accent flex-shrink-0" />
                          <div>
                            <h3 className="font-medium text-foreground truncate">{document.name}</h3>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <HardDrive className="h-3 w-3" />
                                {formatFileSize(document.size)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(document.uploadedAt)}
                              </span>
                              <span>{document.pages} pages</span>
                              <span>{document.chunks} chunks</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">{getStatusBadge(document.status)}</div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Document</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{document.name}"? This action cannot be undone and will
                                remove the document from your search index.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteDocument(document.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
