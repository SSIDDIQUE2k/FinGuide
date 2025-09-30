import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")

    if (!userId || userId === "anonymous") {
      return NextResponse.json({ error: "Authentication required to upload documents" }, { status: 401 })
    }

    const formData = await request.formData()
    const files = formData.getAll("files") as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

    for (const file of files) {
      if (file.type !== "application/pdf") {
        return NextResponse.json(
          { error: `Invalid file type: ${file.name}. Only PDF files are allowed.` },
          { status: 400 },
        )
      }

      if (file.size > 50 * 1024 * 1024) {
        return NextResponse.json({ error: `File too large: ${file.name}. Maximum size is 50MB.` }, { status: 400 })
      }
    }

    const processedFiles = []

    for (const file of files) {
      const buffer = await file.arrayBuffer()

      const fileId = `${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      const fileData = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        status: "processing",
        uploadedAt: new Date().toISOString(),
        userId, // Associate document with user
        isPrivate: true, // Mark all financial documents as private
      }

      // await saveToSecureStorage(buffer, fileId, userId)
      // await queueProcessingJob(fileId, userId)

      processedFiles.push(fileData)
    }

    return NextResponse.json({
      success: true,
      files: processedFiles,
      message: `Successfully uploaded ${files.length} file(s)`,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Failed to process upload" }, { status: 500 })
  }
}
