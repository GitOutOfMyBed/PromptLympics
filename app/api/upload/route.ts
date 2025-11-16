import { NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"

export const dynamic = 'force-dynamic'

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

    // Read and parse files to validate and get size
    const trainingText = await trainingFile.text()
    const validationText = await validationFile.text()

    let trainingData, validationData
    try {
      trainingData = JSON.parse(trainingText)
      validationData = JSON.parse(validationText)
    } catch (e) {
      return NextResponse.json(
        { error: "Files must be valid JSON" },
        { status: 400 }
      )
    }

    if (!Array.isArray(trainingData) || !Array.isArray(validationData)) {
      return NextResponse.json(
        { error: "Files must contain JSON arrays" },
        { status: 400 }
      )
    }

    // Return the file contents to be uploaded from the client side
    // The client will upload to Firebase Storage and pass the URLs back
    return NextResponse.json({
      trainingSize: trainingData.length,
      validationSize: validationData.length,
      message: "Files validated successfully",
    })
  } catch (error) {
    console.error("Error validating files:", error)
    return NextResponse.json(
      { error: "Failed to validate files" },
      { status: 500 }
    )
  }
}
