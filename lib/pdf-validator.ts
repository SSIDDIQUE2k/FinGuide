/**
 * PDF Validation Utility
 * Validates that uploaded PDFs are financial documents only
 */

export interface PDFValidationResult {
  isValid: boolean
  isFinancial: boolean
  confidence: number
  reason?: string
  suggestedAction?: string
}

export class PDFValidator {
  private financialKeywords = [
    // Budgeting & Planning
    'budget', 'budgeting', 'financial planning', 'money management', 'expense tracking',
    'income', 'revenue', 'cash flow', 'financial statement', 'balance sheet',
    
    // Investment & Savings
    'investment', 'investing', 'portfolio', 'stocks', 'bonds', 'mutual funds',
    'retirement', '401k', 'ira', 'savings', 'emergency fund', 'compound interest',
    
    // Banking & Credit
    'banking', 'credit', 'loan', 'mortgage', 'debt', 'credit score', 'interest rate',
    'checking account', 'savings account', 'credit card', 'personal loan',
    
    // Insurance & Risk
    'insurance', 'life insurance', 'health insurance', 'auto insurance', 'home insurance',
    'risk management', 'coverage', 'premium', 'deductible',
    
    // Tax & Accounting
    'tax', 'taxes', 'tax return', 'accounting', 'bookkeeping', 'audit', 'deduction',
    'w-2', '1099', 'taxable income', 'tax bracket',
    
    // Business Finance
    'business finance', 'corporate finance', 'financial analysis', 'profit', 'loss',
    'revenue', 'expenses', 'assets', 'liabilities', 'equity',
    
    // Real Estate
    'real estate', 'property', 'mortgage', 'home buying', 'rental property',
    'property management', 'real estate investment',
    
    // Financial Education
    'financial literacy', 'financial education', 'money management', 'personal finance',
    'financial advisor', 'financial planning', 'wealth management'
  ]

  private nonFinancialKeywords = [
    // Academic/Educational (non-financial)
    'mathematics', 'physics', 'chemistry', 'biology', 'history', 'literature',
    'philosophy', 'psychology', 'sociology', 'engineering', 'computer science',
    
    // Medical/Health (non-financial)
    'medical', 'healthcare', 'medicine', 'surgery', 'diagnosis', 'treatment',
    'pharmaceutical', 'clinical', 'patient care', 'medical research',
    
    // Legal (non-financial)
    'legal', 'law', 'court', 'litigation', 'contract', 'legal advice',
    'criminal law', 'civil law', 'constitutional law',
    
    // Technical/Engineering
    'engineering', 'software', 'programming', 'technology', 'mechanical',
    'electrical', 'civil engineering', 'computer programming',
    
    // Creative/Arts
    'art', 'music', 'painting', 'sculpture', 'design', 'photography',
    'creative writing', 'poetry', 'novel', 'fiction'
  ]

  /**
   * Validates if a PDF is a financial document
   */
  async validatePDF(file: File): Promise<PDFValidationResult> {
    try {
      // Check file type
      if (!file.type.includes('pdf')) {
        return {
          isValid: false,
          isFinancial: false,
          confidence: 0,
          reason: 'File is not a PDF document',
          suggestedAction: 'Please upload a PDF file'
        }
      }

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        return {
          isValid: false,
          isFinancial: false,
          confidence: 0,
          reason: 'File is too large (max 10MB)',
          suggestedAction: 'Please compress the PDF or upload a smaller file'
        }
      }

      // Extract text from PDF for analysis
      const text = await this.extractTextFromPDF(file)
      
      // Analyze content
      const analysis = this.analyzeContent(text)
      
      return analysis
      
    } catch (error) {
      return {
        isValid: false,
        isFinancial: false,
        confidence: 0,
        reason: 'Error processing PDF',
        suggestedAction: 'Please try uploading a different PDF file'
      }
    }
  }

  /**
   * Extract text from PDF file
   */
  private async extractTextFromPDF(file: File): Promise<string> {
    // This is a simplified version - in production, you'd use a proper PDF parser
    // For now, we'll simulate text extraction
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => {
        // In a real implementation, you'd use pdf-parse or similar
        // For demo purposes, we'll return a mock text based on filename
        const filename = file.name.toLowerCase()
        let mockText = ''
        
        if (filename.includes('budget') || filename.includes('financial')) {
          mockText = 'budget financial planning money management investment savings'
        } else if (filename.includes('tax') || filename.includes('return')) {
          mockText = 'tax return income deduction financial statement'
        } else if (filename.includes('insurance')) {
          mockText = 'insurance coverage premium deductible risk management'
        } else if (filename.includes('investment') || filename.includes('portfolio')) {
          mockText = 'investment portfolio stocks bonds mutual funds retirement'
        } else {
          mockText = 'document content analysis'
        }
        
        resolve(mockText)
      }
      reader.readAsArrayBuffer(file)
    })
  }

  /**
   * Analyze content to determine if it's financial
   */
  private analyzeContent(text: string): PDFValidationResult {
    const lowerText = text.toLowerCase()
    
    // Count financial keywords
    const financialMatches = this.financialKeywords.filter(keyword => 
      lowerText.includes(keyword.toLowerCase())
    ).length
    
    // Count non-financial keywords
    const nonFinancialMatches = this.nonFinancialKeywords.filter(keyword => 
      lowerText.includes(keyword.toLowerCase())
    ).length
    
    // Calculate confidence score
    const totalMatches = financialMatches + nonFinancialMatches
    const confidence = totalMatches > 0 ? financialMatches / totalMatches : 0.5
    
    // Determine if it's financial
    const isFinancial = financialMatches > nonFinancialMatches && confidence > 0.6
    
    if (isFinancial) {
      return {
        isValid: true,
        isFinancial: true,
        confidence: Math.min(confidence, 0.95),
        reason: `Document contains ${financialMatches} financial terms`,
        suggestedAction: 'PDF appears to be a financial document - ready for processing'
      }
    } else {
      return {
        isValid: false,
        isFinancial: false,
        confidence: confidence,
        reason: nonFinancialMatches > 0 
          ? `Document appears to be about ${this.getDocumentType(nonFinancialMatches)} rather than finance`
          : 'Document does not appear to contain financial content',
        suggestedAction: 'Please upload a financial document (budget, tax return, investment report, etc.)'
      }
    }
  }

  /**
   * Get document type based on non-financial keywords
   */
  private getDocumentType(nonFinancialMatches: number): string {
    if (nonFinancialMatches > 0) {
      return 'non-financial topics'
    }
    return 'general content'
  }

  /**
   * Get suggested financial document types
   */
  getSuggestedDocumentTypes(): string[] {
    return [
      'Budget and Expense Reports',
      'Tax Returns and Tax Documents',
      'Investment Statements',
      'Bank Statements',
      'Insurance Policies',
      'Financial Planning Documents',
      'Retirement Account Statements',
      'Credit Reports',
      'Loan Documents',
      'Financial Education Materials'
    ]
  }
}

export const pdfValidator = new PDFValidator()
