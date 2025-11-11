import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKey) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set"
    );
  }

  try {
    // Parse the JSON string from environment variable
    const parsedCredentials = JSON.parse(serviceAccountKey.trim());
    admin.initializeApp({
      credential: admin.credential.cert(parsedCredentials),
      storageBucket: "promptlympics.firebasestorage.app",
    });
  } catch (error) {
    console.error("Failed to parse Firebase service account key");
    console.error("Error:", error);
    throw new Error(
      `Invalid FIREBASE_SERVICE_ACCOUNT_KEY: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

const bucket = admin.storage().bucket();

/**
 * Fetch validation data from Firebase Storage
 * This bypasses security rules using Admin SDK
 */
export async function getValidationData(filePath: string): Promise<any> {
  try {
    // Remove leading slash if present
    const path = filePath.startsWith("/") ? filePath.slice(1) : filePath;

    const file = bucket.file(path);
    const [exists] = await file.exists();

    if (!exists) {
      throw new Error(`Validation file not found: ${path}`);
    }

    const [contents] = await file.download();
    return JSON.parse(contents.toString("utf-8"));
  } catch (error) {
    console.error("Error fetching validation data:", error);
    throw error;
  }
}
