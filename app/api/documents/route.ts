import { type NextRequest, NextResponse } from "next/server"

interface Document {
  id: string
  name: string
  size: number
  uploadedAt: string
  status: "processing" | "completed" | "error"
  pages: number
  chunks: number
  userId: string
  isPrivate: boolean
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")

    if (!userId || userId === "anonymous") {
      return NextResponse.json({ error: "Authentication required to access documents" }, { status: 401 })
    }

    const userDocuments: Document[] = [
      {
        id: `${userId}-1`,
        name: "Financial Planning Guide.pdf",
        size: 2456789,
        uploadedAt: "2024-01-15T10:30:00Z",
        status: "completed",
        pages: 45,
        chunks: 127,
        userId,
        isPrivate: true,
      },
      {
        id: `${userId}-2`,
        name: "Investment Basics.pdf",
        size: 1834567,
        uploadedAt: "2024-01-14T14:22:00Z",
        status: "completed",
        pages: 32,
        chunks: 89,
        userId,
        isPrivate: true,
      },
      {
        id: `${userId}-3`,
        name: "Budgeting Essentials.pdf",
        size: 1234567,
        uploadedAt: "2024-01-13T09:15:00Z",
        status: "completed",
        pages: 28,
        chunks: 76,
        userId,
        isPrivate: true,
      },
    ]

    return NextResponse.json({
      documents: userDocuments,
      totalDocuments: userDocuments.length,
      totalPages: userDocuments.reduce((sum, doc) => sum + doc.pages, 0),
      totalChunks: userDocuments.reduce((sum, doc) => sum + doc.chunks, 0),
    })
  } catch (error) {
    console.error("Documents API error:", error)
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")

    if (!userId || userId === "anonymous") {
      return NextResponse.json({ error: "Authentication required to delete documents" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get("id")

    if (!documentId) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 })
    }

    if (!documentId.startsWith(userId)) {
      return NextResponse.json({ error: "Access denied: You can only delete your own documents" }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      message: `Document ${documentId} deleted successfully`,
    })
  } catch (error) {
    console.error("Delete document error:", error)
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 })
  }
}
