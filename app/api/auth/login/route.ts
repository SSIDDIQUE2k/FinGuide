import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const validUsers = [
      { id: "user1", email: "demo@example.com", password: "demo123" },
      { id: "user2", email: "admin@example.com", password: "admin123" },
    ]

    const user = validUsers.find((u) => u.email === email && u.password === password)

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const token = generateToken(user.id, user.email)

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email },
      token,
    })

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}

function generateToken(userId: string, email: string): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))
  const payload = btoa(
    JSON.stringify({
      userId,
      email,
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
    }),
  )
  const signature = btoa(`signature-${userId}-${Date.now()}`)

  return `${header}.${payload}.${signature}`
}
