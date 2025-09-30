import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // General chatbot responses (not financial-specific)
    const responses = {
      greeting: [
        "Hello! I'm your general AI assistant. How can I help you today?",
        "Hi there! I'm here to help with any questions you might have.",
        "Greetings! What would you like to know about?"
      ],
      help: [
        "I can help you with general questions, explanations, and conversations. For financial advice, please use the Financial Knowledge Base.",
        "I'm a general-purpose AI assistant. I can discuss various topics, answer questions, and have conversations.",
        "I'm here to help! Ask me anything, and I'll do my best to assist you."
      ],
      weather: [
        "I don't have access to real-time weather data, but I can help you understand weather patterns or discuss climate topics.",
        "For current weather, I'd recommend checking a weather app or website. I can help explain weather concepts though!",
        "I can't check the weather for you, but I'm happy to discuss weather-related topics or help with other questions."
      ],
      time: [
        "I don't have access to real-time information, but I can help you with time-related calculations or concepts.",
        "For the current time, please check your device. I can help with time zone conversions or other time-related questions though!",
        "I can't tell you the exact time, but I can help with time management tips or time-related calculations."
      ],
      general: [
        "That's an interesting question! Let me help you with that.",
        "I'd be happy to help you understand that topic better.",
        "That's a great question! Here's what I can tell you about that.",
        "I can definitely help you with that. Let me explain...",
        "That's something I can assist you with. Here's my perspective..."
      ]
    }

    // Determine response type based on message content
    const lowerMessage = message.toLowerCase()
    let responseType = "general"
    let response = ""

    if (lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("hey")) {
      responseType = "greeting"
    } else if (lowerMessage.includes("help") || lowerMessage.includes("what can you do")) {
      responseType = "help"
    } else if (lowerMessage.includes("weather")) {
      responseType = "weather"
    } else if (lowerMessage.includes("time") || lowerMessage.includes("what time")) {
      responseType = "time"
    }

    // Get random response from appropriate category
    const responseArray = responses[responseType as keyof typeof responses]
    response = responseArray[Math.floor(Math.random() * responseArray.length)]

    // Add contextual response based on message
    if (responseType === "general") {
      if (lowerMessage.includes("explain") || lowerMessage.includes("what is")) {
        response += ` Regarding "${message}", I can provide a general explanation. `
      } else if (lowerMessage.includes("how to")) {
        response += ` For "${message}", here's a general approach: `
      } else if (lowerMessage.includes("why")) {
        response += ` That's a thoughtful question about "${message}". `
      }
      
      // Add some general helpful content
      response += "I'm designed to be helpful, harmless, and honest. If you need specific financial advice, I'd recommend using our Financial Knowledge Base which has specialized financial expertise."
    }

    return NextResponse.json({
      answer: `🤖 **General AI Assistant**\n\n${response}\n\n*Note: For financial advice, please use the Financial Knowledge Base for specialized expertise.*`,
      source: "general-chatbot",
      confidence: 0.8,
      mode: "general"
    })

  } catch (error) {
    console.error("General chatbot error:", error)
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    )
  }
}
