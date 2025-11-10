import * as admin from "firebase-admin"
import * as fs from "fs"
import * as path from "path"

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  const serviceAccountKeyOrPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY

  if (!serviceAccountKeyOrPath) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set")
  }

  try {
    let parsedCredentials: any

    // Check if it's a file path or JSON string
    if (serviceAccountKeyOrPath.trim().startsWith("{")) {
      // It's a JSON string (for production environments like Vercel)
      parsedCredentials = JSON.parse(serviceAccountKeyOrPath.trim())
    } else {
      // It's a file path (for local development)
      const absolutePath = path.resolve(process.cwd(), serviceAccountKeyOrPath)
      const serviceAccountJson = fs.readFileSync(absolutePath, "utf-8")
      parsedCredentials = JSON.parse(serviceAccountJson)
    }

    admin.initializeApp({
      credential: admin.credential.cert(parsedCredentials),
      storageBucket: "promptlympics.firebasestorage.app",
    })
  } catch (error) {
    console.error("Failed to load Firebase service account:", serviceAccountKeyOrPath.substring(0, 50))
    console.error("Error:", error)
    throw new Error(`Invalid FIREBASE_SERVICE_ACCOUNT_KEY: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

const bucket = admin.storage().bucket()

/**
 * Fetch validation data from Firebase Storage
 * This bypasses security rules using Admin SDK
 */
export async function getValidationData(filePath: string): Promise<any> {
  try {
    // Remove leading slash if present
    const path = filePath.startsWith("/") ? filePath.slice(1) : filePath

    const file = bucket.file(path)
    const [exists] = await file.exists()

    if (!exists) {
      throw new Error(`Validation file not found: ${path}`)
    }

    const [contents] = await file.download()
    return JSON.parse(contents.toString("utf-8"))
  } catch (error) {
    console.error("Error fetching validation data:", error)
    throw error
  }
}
