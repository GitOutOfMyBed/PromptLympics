import { NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

export async function POST(req: Request) {
  try {
    const auth = await verifyAuth(req)

    if (!auth?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const trainingFile = formData.get("trainingFile") as File
    const validationFile = formData.get("validationFile") as File

    if (!trainingFile || !validationFile) {
      return NextResponse.json(
        { error: "Both training and validation files are required" },
        { status: 400 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads")
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filenames
    const timestamp = Date.now()
    const trainingFilename = `training-${timestamp}-${trainingFile.name}`
    const validationFilename = `validation-${timestamp}-${validationFile.name}`

    const trainingPath = join(uploadsDir, trainingFilename)
    const validationPath = join(uploadsDir, validationFilename)

    // Write files
    const trainingBytes = await trainingFile.arrayBuffer()
    const validationBytes = await validationFile.arrayBuffer()

    await writeFile(trainingPath, Buffer.from(trainingBytes))
    await writeFile(validationPath, Buffer.from(validationBytes))

    // Parse JSON to get sample counts
    const trainingData = JSON.parse(await trainingFile.text())
    const validationData = JSON.parse(await validationFile.text())

    if (!Array.isArray(trainingData) || !Array.isArray(validationData)) {
      return NextResponse.json(
        { error: "Files must contain JSON arrays" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      trainingUrl: `/uploads/${trainingFilename}`,
      validationUrl: `/uploads/${validationFilename}`,
      trainingSize: trainingData.length,
      validationSize: validationData.length,
    })
  } catch (error) {
    console.error("Error uploading files:", error)
    return NextResponse.json(
      { error: "Failed to upload files" },
      { status: 500 }
    )
  }
}
