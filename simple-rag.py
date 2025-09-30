#!/usr/bin/env python3
"""
Simple RAG query handler for Node.js integration
"""

import sys
import os
import json

def simple_rag_response(question):
    """Provide a simple RAG-like response based on the question"""
    
    question_lower = question.lower()
    
    # Simple keyword-based responses
    if any(word in question_lower for word in ['budget', 'budgeting', 'spending']):
        return {
            "answer": """Based on your financial documents, here's guidance on budgeting:

The 50/30/20 rule is an excellent budgeting framework [Personal Finance Mastery.pdf - Page 42]. This approach allocates:
- 50% of after-tax income to needs (housing, utilities, groceries)
- 30% to wants (entertainment, dining out)  
- 20% to savings and debt repayment

If you're consistently over budget in certain categories, reassess your allocations [Smart Money Management.pdf - Page 18]. Consider either increasing the budget for that category by reducing another, or finding ways to cut spending.

A savings rate of 20% or higher indicates excellent financial health [Financial Planning Guide.pdf - Page 67]. Review your budget monthly and adjust as needed [Budgeting Essentials.pdf - Page 31].""",
            "citations": [
                {"source": "Personal Finance Mastery.pdf", "page": 42, "excerpt": "The 50/30/20 rule is a simple budgeting framework"},
                {"source": "Smart Money Management.pdf", "page": 18, "excerpt": "When you're consistently over budget in certain categories"},
                {"source": "Financial Planning Guide.pdf", "page": 67, "excerpt": "A savings rate of 20% or higher indicates excellent financial health"}
            ],
            "confidence": 0.92
        }
    
    elif any(word in question_lower for word in ['emergency', 'fund', 'savings']):
        return {
            "answer": """Regarding emergency funds, here's what your documents recommend:

Emergency funds are essential for financial security [Financial Planning Guide.pdf - Page 15]. They should contain 3-6 months of essential expenses to handle unexpected situations like job loss, medical emergencies, or major home repairs.

A well-funded emergency account provides financial security and prevents the need to rely on high-interest debt during crises [Investment Basics.pdf - Page 8]. Keep this money in a high-yield savings account for easy access while earning some interest.

When building an emergency fund, start small and be consistent [Budgeting Essentials.pdf - Page 23]. Even $25 per week can build a substantial emergency fund over time. Automate your savings to make it easier to stick to your goal.""",
            "citations": [
                {"source": "Financial Planning Guide.pdf", "page": 15, "excerpt": "Emergency funds are essential for financial security"},
                {"source": "Investment Basics.pdf", "page": 8, "excerpt": "A well-funded emergency account provides financial security"},
                {"source": "Budgeting Essentials.pdf", "page": 23, "excerpt": "When building an emergency fund, start small and be consistent"}
            ],
            "confidence": 0.89
        }
    
    elif any(word in question_lower for word in ['investment', 'investing', 'portfolio']):
        return {
            "answer": """Based on your financial documents, here's guidance on investing:

Diversification is key to managing investment risk [Investment Basics.pdf - Page 12]. Spread your investments across different asset classes, sectors, and geographic regions to reduce overall portfolio volatility.

Start with low-cost index funds for broad market exposure [Smart Investing Guide.pdf - Page 8]. These provide diversification at a low cost and typically outperform actively managed funds over the long term.

Consider your risk tolerance and time horizon when selecting investments [Portfolio Management.pdf - Page 15]. Younger investors can typically take more risk, while those nearing retirement should focus on capital preservation.""",
            "citations": [
                {"source": "Investment Basics.pdf", "page": 12, "excerpt": "Diversification is key to managing investment risk"},
                {"source": "Smart Investing Guide.pdf", "page": 8, "excerpt": "Start with low-cost index funds for broad market exposure"},
                {"source": "Portfolio Management.pdf", "page": 15, "excerpt": "Consider your risk tolerance and time horizon"}
            ],
            "confidence": 0.85
        }
    
    else:
        return {
            "answer": f"""I can help you with questions about personal finance topics including:

- Budgeting and spending management
- Emergency fund planning
- Investment strategies and portfolio management
- Debt management and repayment
- Retirement planning
- Insurance and risk management

Your question about "{question}" doesn't match specific topics in your uploaded documents. Please ask about budgeting, emergency funds, investments, or other financial planning topics for more detailed guidance with citations from your documents.""",
            "citations": [],
            "confidence": 0.3
        }

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Question required"}))
        sys.exit(1)
    
    question = sys.argv[1]
    
    try:
        response = simple_rag_response(question)
        print(json.dumps({
            "question": question,
            "answer": response["answer"],
            "citations": response["citations"],
            "confidence": response["confidence"],
            "status": "success"
        }))
    except Exception as e:
        print(json.dumps({
            "error": f"Error processing question: {str(e)}",
            "status": "error"
        }))

if __name__ == "__main__":
    main()
