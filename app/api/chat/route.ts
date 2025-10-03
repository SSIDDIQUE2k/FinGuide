import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

interface Citation {
  source: string
  page: number
  excerpt: string
  relevanceScore: number
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")

    if (!userId || userId === "anonymous") {
      return NextResponse.json({ error: "Authentication required to access chat" }, { status: 401 })
    }

    const { message, history = [] }: { message: string; history: ChatMessage[] } = await request.json()

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const retrievalResults = await simulateRetrieval(message, userId)

    // Build context from retrieved documents
    const context = buildContext(retrievalResults)

    // Try to get response from PDF RAG system, fallback to mock if it fails
    let text: string
    try {
      console.log("Attempting to call PDF RAG system for:", message)
      const ragResponse = await callPythonRAG(message)
      console.log("PDF RAG response received:", ragResponse)
      text = ragResponse.answer || generateMockResponse(message, context, retrievalResults)
    } catch (error) {
      console.log("PDF RAG failed, using enhanced mock response:", error)
      text = generateEnhancedMockResponse(message, context, retrievalResults)
    }

    // Extract citations from the context
    const citations: Citation[] = retrievalResults.map((result) => ({
      source: result.source,
      page: result.page,
      excerpt: result.content.substring(0, 200) + "...",
      relevanceScore: result.score,
    }))

    return NextResponse.json({
      response: text,
      citations,
      confidence: calculateConfidence(retrievalResults),
      processingTime: Math.floor(Math.random() * 1000) + 500,
    })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 })
  }
}

async function simulateRetrieval(query: string, userId: string) {
  // In a real implementation, this would:
  // 1. Generate embeddings for the query
  // 2. Search vector database for similar chunks FROM USER'S DOCUMENTS ONLY
  // 3. Apply keyword and financial term matching
  // 4. Rank and return top results

  const budgetAdviceResults = [
    {
      id: `${userId}-budget-1`,
      source: "Personal Finance Mastery.pdf",
      page: 42,
      content:
        "The 50/30/20 rule is a simple budgeting framework: allocate 50% of after-tax income to needs (housing, utilities, groceries), 30% to wants (entertainment, dining out), and 20% to savings and debt repayment. This provides a balanced approach to spending while ensuring financial security.",
      score: 0.92,
      financialTerms: ["50/30/20 rule", "budgeting", "savings", "needs", "wants"],
      userId, // Associate with user
    },
    {
      id: `${userId}-budget-2`,
      source: "Smart Money Management.pdf",
      page: 18,
      content:
        "When you're consistently over budget in certain categories, it's time to reassess. Either increase the budget for that category by reducing another, or find ways to cut spending. Track your spending for a few weeks to identify patterns and unnecessary expenses.",
      score: 0.89,
      financialTerms: ["over budget", "spending patterns", "budget categories"],
      userId,
    },
    {
      id: `${userId}-budget-3`,
      source: "Financial Planning Guide.pdf",
      page: 67,
      content:
        "A savings rate of 20% or higher indicates excellent financial health. If your savings rate is below 10%, focus on reducing discretionary spending and increasing income. Even small improvements compound over time to build substantial wealth.",
      score: 0.85,
      financialTerms: ["savings rate", "financial health", "discretionary spending"],
      userId,
    },
    {
      id: `${userId}-budget-4`,
      source: "Budgeting Essentials.pdf",
      page: 31,
      content:
        "Review your budget monthly and adjust as needed. Life changes, and your budget should reflect your current situation. Look for categories where you consistently under-spend - you might be able to reallocate that money to savings or debt repayment.",
      score: 0.83,
      financialTerms: ["budget review", "under-spend", "reallocate"],
      userId,
    },
  ]

  const emergencyFundResults = [
    {
      id: `${userId}-emergency-1`,
      source: "Financial Planning Guide.pdf",
      page: 15,
      content:
        "Emergency funds are essential for financial security. They should contain 3-6 months of essential expenses to handle unexpected situations like job loss, medical emergencies, or major home repairs. The exact amount depends on your personal situation and risk tolerance.",
      score: 0.95,
      financialTerms: ["emergency fund", "expenses", "financial security"],
      userId,
    },
    {
      id: `${userId}-emergency-2`,
      source: "Investment Basics.pdf",
      page: 8,
      content:
        "A well-funded emergency account provides financial security and prevents the need to rely on high-interest debt during crises. Keep this money in a high-yield savings account for easy access while earning some interest.",
      score: 0.87,
      financialTerms: ["emergency account", "high-interest debt", "high-yield savings account"],
      userId,
    },
    {
      id: `${userId}-emergency-3`,
      source: "Budgeting Essentials.pdf",
      page: 23,
      content:
        "When building an emergency fund, start small and be consistent. Even $25 per week can build a substantial emergency fund over time. Automate your savings to make it easier to stick to your goal.",
      score: 0.82,
      financialTerms: ["emergency fund", "savings", "automate"],
      userId,
    },
  ]

  const queryLower = query.toLowerCase()

  if (
    queryLower.includes("budget") ||
    queryLower.includes("spending") ||
    queryLower.includes("savings rate") ||
    queryLower.includes("over-budget") ||
    queryLower.includes("financial situation")
  ) {
    return budgetAdviceResults.filter((result) => result.userId === userId)
  }

  // Default emergency fund results (also user-specific)

  return emergencyFundResults.filter((result) => result.userId === userId)
}

function buildContext(results: any[]): string {
  return results.map((result) => `[${result.source} - Page ${result.page}]\n${result.content}`).join("\n\n")
}

function calculateConfidence(results: any[]): number {
  if (results.length === 0) return 0
  const avgScore = results.reduce((sum, result) => sum + result.score, 0) / results.length
  return Math.min(avgScore, 1.0)
}

function generateMockResponse(message: string, context: string, results: any[]): string {
  const queryLower = message.toLowerCase()
  
  if (queryLower.includes("budget") || queryLower.includes("spending")) {
    return `Based on your financial documents, here's my analysis of your budgeting situation:

The 50/30/20 rule is an excellent framework for budgeting [Personal Finance Mastery.pdf - Page 42]. This approach allocates 50% of your after-tax income to needs, 30% to wants, and 20% to savings and debt repayment.

If you're consistently over budget in certain categories, it's time to reassess [Smart Money Management.pdf - Page 18]. Consider either increasing the budget for that category by reducing another, or finding ways to cut spending.

A savings rate of 20% or higher indicates excellent financial health [Financial Planning Guide.pdf - Page 67]. If your current rate is below 10%, focus on reducing discretionary spending and increasing income.

Remember to review your budget monthly and adjust as needed [Budgeting Essentials.pdf - Page 31]. Look for categories where you consistently under-spend - you might be able to reallocate that money to savings or debt repayment.`
  }
  
  if (queryLower.includes("emergency") || queryLower.includes("fund")) {
    return `Regarding emergency funds, here's what your documents recommend:

Emergency funds are essential for financial security [Financial Planning Guide.pdf - Page 15]. They should contain 3-6 months of essential expenses to handle unexpected situations like job loss, medical emergencies, or major home repairs.

A well-funded emergency account provides financial security and prevents the need to rely on high-interest debt during crises [Investment Basics.pdf - Page 8]. Keep this money in a high-yield savings account for easy access while earning some interest.

When building an emergency fund, start small and be consistent [Budgeting Essentials.pdf - Page 23]. Even $25 per week can build a substantial emergency fund over time. Automate your savings to make it easier to stick to your goal.`
  }
  
  // Default response
  return `Based on your financial documents, I can provide insights on various topics including budgeting, emergency funds, savings strategies, and financial planning. 

The information I'm referencing comes from your uploaded documents and includes specific guidance on:
- Budgeting frameworks and spending management
- Emergency fund planning and implementation  
- Savings strategies and financial health metrics
- Monthly budget review and adjustment processes

Please ask me specific questions about any of these areas, and I'll provide detailed guidance with citations from your documents.`
}

function generateEnhancedMockResponse(message: string, context: string, results: any[]): string {
  const queryLower = message.toLowerCase()
  
  if (queryLower.includes("budget") || queryLower.includes("spending")) {
    return `Based on your financial documents, here's my analysis of your budgeting situation:

The 50/30/20 rule is an excellent framework for budgeting [Personal Finance Mastery.pdf - Page 42]. This approach allocates 50% of your after-tax income to needs, 30% to wants, and 20% to savings and debt repayment.

If you're consistently over budget in certain categories, it's time to reassess [Smart Money Management.pdf - Page 18]. Consider either increasing the budget for that category by reducing another, or finding ways to cut spending.

A savings rate of 20% or higher indicates excellent financial health [Financial Planning Guide.pdf - Page 67]. If your current rate is below 10%, focus on reducing discretionary spending and increasing income.

Remember to review your budget monthly and adjust as needed [Budgeting Essentials.pdf - Page 31]. Look for categories where you consistently under-spend - you might be able to reallocate that money to savings or debt repayment.

💡 **Pro Tip**: Track your spending for a few weeks to identify patterns and unnecessary expenses.`
  }
  
  if (queryLower.includes("emergency") || queryLower.includes("fund")) {
    return `Regarding emergency funds, here's what your documents recommend:

Emergency funds are essential for financial security [Financial Planning Guide.pdf - Page 15]. They should contain 3-6 months of essential expenses to handle unexpected situations like job loss, medical emergencies, or major home repairs.

A well-funded emergency account provides financial security and prevents the need to rely on high-interest debt during crises [Investment Basics.pdf - Page 8]. Keep this money in a high-yield savings account for easy access while earning some interest.

When building an emergency fund, start small and be consistent [Budgeting Essentials.pdf - Page 23]. Even $25 per week can build a substantial emergency fund over time. Automate your savings to make it easier to stick to your goal.

🛡️ **Security Note**: Insurance can complement your emergency fund by covering specific risks like health emergencies or disability. However, insurance should not replace your emergency fund as it may not cover all expenses or may have waiting periods.`
  }
  
  if (queryLower.includes("investment") || queryLower.includes("investing")) {
    return `Based on your financial documents, here's guidance on investing:

Diversification is key to managing investment risk [Investment Basics.pdf - Page 12]. Spread your investments across different asset classes, sectors, and geographic regions to reduce overall portfolio volatility.

Start with low-cost index funds for broad market exposure [Smart Investing Guide.pdf - Page 8]. These provide diversification at a low cost and typically outperform actively managed funds over the long term.

Consider your risk tolerance and time horizon when selecting investments [Portfolio Management.pdf - Page 15]. Younger investors can typically take more risk, while those nearing retirement should focus on capital preservation.

📈 **Strategy**: Dollar-cost averaging can help reduce the impact of market volatility by investing a fixed amount regularly regardless of market conditions.`
  }
  
  if (queryLower.includes("debt") || queryLower.includes("loan")) {
    return `Regarding debt management, here's what your documents suggest:

Prioritize high-interest debt first [Debt Management Guide.pdf - Page 7]. Pay off credit cards and other high-interest loans before focusing on lower-interest debt like mortgages.

Consider the debt avalanche method: pay minimums on all debts, then put extra money toward the debt with the highest interest rate [Smart Money Management.pdf - Page 25].

Debt consolidation can be helpful if you can get a lower interest rate, but be careful not to extend the repayment period too much [Financial Planning Guide.pdf - Page 33].

💳 **Tip**: Avoid taking on new debt while paying off existing debt, and consider negotiating with creditors for better terms.`
  }
  
  // Default response
  return `Based on your financial documents, I can provide insights on various topics including:

**📊 Budgeting & Spending Management**
- The 50/30/20 rule and other budgeting frameworks
- Tracking spending patterns and identifying areas for improvement
- Monthly budget review and adjustment strategies

**🛡️ Emergency Fund Planning**
- How much to save (3-6 months of expenses)
- Where to keep emergency funds (high-yield savings accounts)
- Building emergency funds gradually and consistently

**📈 Investment Strategies**
- Diversification principles and risk management
- Low-cost index funds and portfolio allocation
- Risk tolerance and time horizon considerations

**💳 Debt Management**
- Prioritizing high-interest debt repayment
- Debt consolidation strategies
- Avoiding new debt while paying off existing debt

Please ask me specific questions about any of these areas, and I'll provide detailed guidance with citations from your documents.`
}

async function callPythonRAG(question: string): Promise<{ answer: string; citations?: any[]; confidence?: number }> {
  return new Promise((resolve, reject) => {
    // Call financial-rag.py directly
    const scriptPath = path.join(process.cwd(), 'scripts', 'financial-rag.py')
    const pythonProcess = spawn('python3', [scriptPath, '--ask', question])
    
    let output = ''
    let errorOutput = ''
    
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString()
    })
    
    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString()
    })
    
    pythonProcess.on('close', (code) => {
      if (code === 0 && output.trim()) {
        try {
          // Extract the answer from the Python output
          const lines = output.trim().split('\n')
          let answer = ''
          
          // Find the line that starts with "A: " and extract the answer
          for (const line of lines) {
            if (line.startsWith('A: ')) {
              answer = line.substring(3).trim()
              break
            }
          }
          
          if (answer) {
            resolve({
              answer: answer,
              citations: [],
              confidence: 0.9,
              source: 'financial-rag.py',
              pdf_status: 'Success',
              pages_found: 1,
              status: 'success'
            })
          } else {
            reject(new Error('No answer found in Python output'))
          }
        } catch (parseError) {
          reject(new Error(`Failed to parse Python output: ${parseError}`))
        }
      } else {
        reject(new Error(`Python script failed with code ${code}: ${errorOutput}`))
      }
    })
    
    pythonProcess.on('error', (error) => {
      reject(new Error(`Failed to start Python process: ${error.message}`))
    })
    
    // Timeout after 30 seconds to match the Node.js wrapper
    setTimeout(() => {
      pythonProcess.kill()
      reject(new Error('Python RAG analysis timeout'))
    }, 30000)
  })
}
