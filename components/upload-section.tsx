"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Upload, FileText, X, CheckCircle, AlertCircle } from "lucide-react"
import { useDropzone } from "react-dropzone"
import { SecurityNotice } from "@/components/security-notice"

interface UploadedFile {
  id: string
  name: string
  size: number
  status: "uploading" | "processing" | "completed" | "error"
  progress: number
  error?: string
}

export function UploadSection() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      status: "uploading",
      progress: 0,
    }))

    setFiles((prev) => [...prev, ...newFiles])

    // Simulate upload and processing
    newFiles.forEach((file) => {
      simulateFileProcessing(file.id)
    })
  }, [])

  const simulateFileProcessing = (fileId: string) => {
    // Simulate upload progress
    const uploadInterval = setInterval(() => {
      setFiles((prev) =>
        prev.map((file) => {
          if (file.id === fileId && file.status === "uploading") {
            const newProgress = Math.min(file.progress + Math.random() * 20, 100)
            if (newProgress >= 100) {
              clearInterval(uploadInterval)
              // Start processing phase
              setTimeout(() => {
                setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, status: "processing", progress: 0 } : f)))
                simulateProcessing(fileId)
              }, 500)
              return { ...file, progress: 100, status: "uploading" }
            }
            return { ...file, progress: newProgress }
          }
          return file
        }),
      )
    }, 200)
  }

  const simulateProcessing = (fileId: string) => {
    const processingInterval = setInterval(() => {
      setFiles((prev) =>
        prev.map((file) => {
          if (file.id === fileId && file.status === "processing") {
            const newProgress = Math.min(file.progress + Math.random() * 15, 100)
            if (newProgress >= 100) {
              clearInterval(processingInterval)
              return { ...file, progress: 100, status: "completed" }
            }
            return { ...file, progress: newProgress }
          }
          return file
        }),
      )
    }, 300)
  }

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== fileId))
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    multiple: true,
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getStatusIcon = (status: UploadedFile["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-destructive" />
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusText = (status: UploadedFile["status"]) => {
    switch (status) {
      case "uploading":
        return "Uploading..."
      case "processing":
        return "Processing document..."
      case "completed":
        return "Ready for analysis"
      case "error":
        return "Processing failed"
      default:
        return ""
    }
  }

  return (
    <section id="upload" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Upload Your Financial Documents</h2>
            <p className="text-lg text-muted-foreground">
              Drag and drop your PDF files or click to browse. Our AI will process them and make them searchable.
            </p>
          </div>

          <div className="mb-8">
            <SecurityNotice />
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Document Upload</CardTitle>
              <CardDescription>Upload PDF documents to build your financial knowledge base</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive ? "border-accent bg-accent/5" : "border-border hover:border-accent/50 hover:bg-accent/5"
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                {isDragActive ? (
                  <p className="text-lg text-accent">Drop your PDF files here...</p>
                ) : (
                  <div>
                    <p className="text-lg text-foreground mb-2">Drag & drop PDF files here, or click to select</p>
                    <p className="text-sm text-muted-foreground">Supports multiple PDF files up to 50MB each</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {files.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Processing Files</CardTitle>
                <CardDescription>
                  {files.filter((f) => f.status === "completed").length} of {files.length} files processed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {files.map((file) => (
                    <div key={file.id} className="flex items-center space-x-4 p-4 border border-border rounded-lg">
                      <div className="flex-shrink-0">{getStatusIcon(file.status)}</div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(file.id)}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <Progress value={file.progress} className="flex-1" />
                          <span className="text-xs text-muted-foreground min-w-0">{getStatusText(file.status)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {files.some((f) => f.status === "completed") && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <Button className="w-full" size="lg">
                      Start Asking Questions
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  )
}
