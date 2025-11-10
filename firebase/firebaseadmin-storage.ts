import * as admin from "firebase-admin"

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY

  if (!serviceAccount) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set")
  }

  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(serviceAccount)),
    storageBucket: "promptlympics.firebasestorage.app",
  })
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
