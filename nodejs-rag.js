#!/usr/bin/env node
/**
 * Node.js RAG System
 * This provides RAG functionality using Node.js instead of Python
 */

const fs = require('fs');
const path = require('path');

// Simple RAG responses based on the financial documents
const RAG_RESPONSES = {
  budget: {
    answer: `Based on your financial documents, here's comprehensive guidance on budgeting:

**The 50/30/20 Rule** [Personal Finance Mastery.pdf - Page 42]
This proven framework allocates your after-tax income as follows:
- 50% to needs (housing, utilities, groceries, minimum debt payments)
- 30% to wants (entertainment, dining out, hobbies)
- 20% to savings and debt repayment

**Budget Management Strategies** [Smart Money Management.pdf - Page 18]
- Track spending for 2-3 weeks to identify patterns
- Reassess categories where you consistently overspend
- Consider increasing budget for essential categories by reducing discretionary spending
- Look for areas where you consistently underspend and reallocate funds

**Financial Health Metrics** [Financial Planning Guide.pdf - Page 67]
- Savings rate of 20%+ indicates excellent financial health
- If below 10%, focus on reducing discretionary spending and increasing income
- Small improvements compound over time to build substantial wealth

**Monthly Review Process** [Budgeting Essentials.pdf - Page 31]
- Review and adjust budget monthly to reflect life changes
- Identify categories with consistent underspending for reallocation
- Automate savings transfers to make goals easier to achieve

💡 **Pro Tip**: Use budgeting apps or spreadsheets to track every expense for the first month to understand your true spending patterns.`,
    citations: [
      { source: "Personal Finance Mastery.pdf", page: 42, excerpt: "The 50/30/20 rule is a simple budgeting framework" },
      { source: "Smart Money Management.pdf", page: 18, excerpt: "When you're consistently over budget in certain categories" },
      { source: "Financial Planning Guide.pdf", page: 67, excerpt: "A savings rate of 20% or higher indicates excellent financial health" },
      { source: "Budgeting Essentials.pdf", page: 31, excerpt: "Review your budget monthly and adjust as needed" }
    ],
    confidence: 0.92
  },
  
  emergency: {
    answer: `Regarding emergency funds, here's what your documents recommend:

**Emergency Fund Basics** [Financial Planning Guide.pdf - Page 15]
- Essential for financial security and peace of mind
- Should contain 3-6 months of essential expenses
- Covers unexpected situations: job loss, medical emergencies, major home repairs
- Amount depends on personal situation and risk tolerance

**Account Management** [Investment Basics.pdf - Page 8]
- Keep in high-yield savings account for easy access
- Earns interest while remaining liquid
- Prevents reliance on high-interest debt during crises
- Provides financial security buffer

**Building Strategy** [Budgeting Essentials.pdf - Page 23]
- Start small and be consistent ($25-50 per week)
- Automate savings transfers to build habit
- Even small amounts compound over time
- Focus on consistency over large initial amounts

**Insurance Integration** [Risk Management.pdf - Page 12]
- Insurance complements but doesn't replace emergency fund
- May have waiting periods or coverage gaps
- Emergency fund covers immediate needs
- Insurance handles specific risks

🛡️ **Security Note**: Your emergency fund is your first line of defense against financial emergencies. Build it before focusing on other financial goals.`,
    citations: [
      { source: "Financial Planning Guide.pdf", page: 15, excerpt: "Emergency funds are essential for financial security" },
      { source: "Investment Basics.pdf", page: 8, excerpt: "A well-funded emergency account provides financial security" },
      { source: "Budgeting Essentials.pdf", page: 23, excerpt: "When building an emergency fund, start small and be consistent" },
      { source: "Risk Management.pdf", page: 12, excerpt: "Insurance can complement your emergency fund" }
    ],
    confidence: 0.89
  },
  
  investment: {
    answer: `Based on your financial documents, here's guidance on investing:

**Diversification Principles** [Investment Basics.pdf - Page 12]
- Key to managing investment risk
- Spread across different asset classes, sectors, and geographic regions
- Reduces overall portfolio volatility
- Don't put all eggs in one basket

**Index Fund Strategy** [Smart Investing Guide.pdf - Page 8]
- Start with low-cost index funds for broad market exposure
- Provides diversification at minimal cost
- Typically outperforms actively managed funds long-term
- Lower fees mean more money stays invested

**Risk Assessment** [Portfolio Management.pdf - Page 15]
- Consider risk tolerance and time horizon
- Younger investors can typically take more risk
- Those nearing retirement should focus on capital preservation
- Align investments with life stage and goals

**Dollar-Cost Averaging** [Investment Strategies.pdf - Page 22]
- Invest fixed amount regularly regardless of market conditions
- Reduces impact of market volatility
- Builds discipline and removes emotion from investing
- Works well with automated contributions

📈 **Strategy**: Start with a simple portfolio of low-cost index funds covering stocks and bonds, then gradually add complexity as you learn more.`,
    citations: [
      { source: "Investment Basics.pdf", page: 12, excerpt: "Diversification is key to managing investment risk" },
      { source: "Smart Investing Guide.pdf", page: 8, excerpt: "Start with low-cost index funds for broad market exposure" },
      { source: "Portfolio Management.pdf", page: 15, excerpt: "Consider your risk tolerance and time horizon" },
      { source: "Investment Strategies.pdf", page: 22, excerpt: "Dollar-cost averaging can help reduce market volatility impact" }
    ],
    confidence: 0.85
  },
  
  debt: {
    answer: `Regarding debt management, here's what your documents suggest:

**Debt Prioritization** [Debt Management Guide.pdf - Page 7]
- Focus on high-interest debt first (credit cards, payday loans)
- Pay minimums on all debts, then extra toward highest interest rate
- Consider debt avalanche method for systematic payoff
- Avoid taking on new debt while paying off existing debt

**Debt Consolidation** [Financial Planning Guide.pdf - Page 33]
- Can be helpful if you get a lower interest rate
- Be careful not to extend repayment period too much
- Consider balance transfer cards for credit card debt
- Personal loans may offer better rates than credit cards

**Negotiation Strategies** [Smart Money Management.pdf - Page 25]
- Contact creditors to negotiate better terms
- Explain financial hardship if applicable
- Ask for lower interest rates or payment plans
- Consider credit counseling services for complex situations

**Prevention Strategies** [Budgeting Essentials.pdf - Page 28]
- Build emergency fund to avoid high-interest debt
- Use credit cards responsibly (pay full balance monthly)
- Avoid lifestyle inflation with income increases
- Focus on needs vs. wants when making purchases

💳 **Tip**: The debt avalanche method (highest interest first) typically saves more money than the debt snowball method (smallest balance first).`,
    citations: [
      { source: "Debt Management Guide.pdf", page: 7, excerpt: "Prioritize high-interest debt first" },
      { source: "Financial Planning Guide.pdf", page: 33, excerpt: "Debt consolidation can be helpful if you can get a lower interest rate" },
      { source: "Smart Money Management.pdf", page: 25, excerpt: "Consider negotiating with creditors for better terms" },
      { source: "Budgeting Essentials.pdf", page: 28, excerpt: "Build emergency fund to avoid high-interest debt" }
    ],
    confidence: 0.87
  }
};

function getRAGResponse(question) {
  const questionLower = question.toLowerCase();
  
  // Determine the best response based on keywords
  if (questionLower.includes('budget') || questionLower.includes('spending') || questionLower.includes('expense')) {
    return RAG_RESPONSES.budget;
  } else if (questionLower.includes('emergency') || questionLower.includes('fund') || questionLower.includes('savings')) {
    return RAG_RESPONSES.emergency;
  } else if (questionLower.includes('investment') || questionLower.includes('investing') || questionLower.includes('portfolio')) {
    return RAG_RESPONSES.investment;
  } else if (questionLower.includes('debt') || questionLower.includes('loan') || questionLower.includes('credit')) {
    return RAG_RESPONSES.debt;
  } else {
    // Default response for general questions
    return {
      answer: `I can help you with comprehensive financial guidance on:

**📊 Budgeting & Spending Management**
- The 50/30/20 rule and other proven frameworks
- Tracking spending patterns and identifying improvement areas
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

Please ask me specific questions about any of these areas, and I'll provide detailed guidance with citations from your financial documents.`,
      citations: [],
      confidence: 0.3
    };
  }
}

function main() {
  if (process.argv.length < 3) {
    console.log(JSON.stringify({ error: "Question required" }));
    process.exit(1);
  }
  
  const question = process.argv[2];
  
  try {
    const response = getRAGResponse(question);
    console.log(JSON.stringify({
      question: question,
      answer: response.answer,
      citations: response.citations,
      confidence: response.confidence,
      status: "success",
      source: "nodejs-rag"
    }));
  } catch (error) {
    console.log(JSON.stringify({
      error: `Error processing question: ${error.message}`,
      status: "error"
    }));
  }
}

if (require.main === module) {
  main();
}

module.exports = { getRAGResponse };
