"use client"

import { useAuth } from "@/lib/auth-context"
import { LoginForm } from "@/components/login-form"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { useState, useRef } from "react"
import { pdfValidator, type PDFValidationResult } from "@/lib/pdf-validator"

export default function UploadPage() {
  const { user, login, isLoading } = useAuth()
  const [dragActive, setDragActive] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<Array<File & { validation?: PDFValidationResult }>>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFiles(Array.from(e.dataTransfer.files))
    }
  }

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await handleFiles(Array.from(e.target.files))
    }
  }

  const handleFiles = async (files: File[]) => {
    setIsUploading(true)
    
    for (const file of files) {
      // Validate PDF
      const validation = await pdfValidator.validatePDF(file)
      
      // Add validation result to file
      const fileWithValidation = Object.assign(file, { validation })
      setUploadedFiles(prev => [...prev, fileWithValidation])
    }
    
    setIsUploading(false)
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const getValidationIcon = (validation: PDFValidationResult) => {
    if (validation.isValid && validation.isFinancial) {
      return <CheckCircle className="h-5 w-5 text-green-500" />
    } else if (!validation.isFinancial) {
      return <XCircle className="h-5 w-5 text-red-500" />
    } else {
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />
    }
  }

  const getValidationColor = (validation: PDFValidationResult) => {
    if (validation.isValid && validation.isFinancial) {
      return "border-green-200 bg-green-50 dark:bg-green-900/20"
    } else if (!validation.isFinancial) {
      return "border-red-200 bg-red-50 dark:bg-red-900/20"
    } else {
      return "border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-foreground mb-3">Upload Financial PDFs</h1>
            <p className="text-lg text-muted-foreground">
              Upload your financial documents for AI-powered analysis. Only financial PDFs are accepted.
            </p>
          </div>

          {/* Upload Area */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-accent" />
                Upload Financial Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? "border-accent bg-accent/5" 
                    : "border-border hover:border-accent/50"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Drop your financial PDFs here
                </h3>
                <p className="text-muted-foreground mb-4">
                  or click to browse files
                </p>
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? "Processing..." : "Choose Files"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>

          {/* Accepted Document Types */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-accent" />
                Accepted Financial Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pdfValidator.getSuggestedDocumentTypes().map((type, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-muted/20">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-foreground">{type}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Uploaded Files</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className={`border rounded-lg p-4 ${getValidationColor(file.validation!)}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getValidationIcon(file.validation!)}
                          <div>
                            <h4 className="font-medium text-foreground">{file.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {file.validation?.isValid && file.validation?.isFinancial && (
                            <Button size="sm" variant="outline">
                              Process
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => removeFile(index)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                      
                      {file.validation && (
                        <Alert className="mt-3">
                          <AlertDescription>
                            <strong>Validation Result:</strong> {file.validation.reason}
                            <br />
                            <strong>Confidence:</strong> {(file.validation.confidence * 100).toFixed(1)}%
                            {file.validation.suggestedAction && (
                              <>
                                <br />
                                <strong>Suggestion:</strong> {file.validation.suggestedAction}
                              </>
                            )}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
