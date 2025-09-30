import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect all API routes except public ones
  if (pathname.startsWith("/api/")) {
    // Allow public routes
    const publicRoutes = ["/api/auth/login", "/api/auth/register", "/api/health"]
    if (publicRoutes.some((route) => pathname.startsWith(route))) {
      return NextResponse.next()
    }

    // Check for authentication token
    const authToken = request.headers.get("authorization") || request.cookies.get("auth-token")?.value

    if (!authToken) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Validate token (in production, verify JWT signature)
    if (!isValidToken(authToken)) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }

    // Add user context to request headers
    const userId = extractUserIdFromToken(authToken)
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("x-user-id", userId)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  return NextResponse.next()
}

function isValidToken(token: string): boolean {
  try {
    const cleanToken = token.replace("Bearer ", "")
    const decoded = JSON.parse(atob(cleanToken.split(".")[1] || ""))
    return decoded.exp > Date.now() / 1000
  } catch {
    return false
  }
}

function extractUserIdFromToken(token: string): string {
  try {
    const cleanToken = token.replace("Bearer ", "")
    const decoded = JSON.parse(atob(cleanToken.split(".")[1] || ""))
    return decoded.userId || "anonymous"
  } catch {
    return "anonymous"
  }
}

export const config = {
  matcher: ["/api/:path*", "/documents/:path*", "/chat/:path*", "/budget/:path*"],
}
