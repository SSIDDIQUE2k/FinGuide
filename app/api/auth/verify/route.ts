import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const authToken = request.cookies.get("auth-token")?.value

    if (!authToken) {
      return NextResponse.json({ error: "No authentication token" }, { status: 401 })
    }

    // Validate token
    if (!isValidToken(authToken)) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }

    // Extract user info from token
    const userId = extractUserIdFromToken(authToken)
    const email = extractEmailFromToken(authToken)

    return NextResponse.json({
      user: { id: userId, email },
      token: authToken,
    })
  } catch (error) {
    console.error("Token verification error:", error)
    return NextResponse.json({ error: "Token verification failed" }, { status: 500 })
  }
}

function isValidToken(token: string): boolean {
  try {
    const decoded = JSON.parse(atob(token.split(".")[1] || ""))
    return decoded.exp > Date.now() / 1000
  } catch {
    return false
  }
}

function extractUserIdFromToken(token: string): string {
  try {
    const decoded = JSON.parse(atob(token.split(".")[1] || ""))
    return decoded.userId || "anonymous"
  } catch {
    return "anonymous"
  }
}

function extractEmailFromToken(token: string): string {
  try {
    const decoded = JSON.parse(atob(token.split(".")[1] || ""))
    return decoded.email || ""
  } catch {
    return ""
  }
}
