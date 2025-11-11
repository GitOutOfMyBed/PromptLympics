import "server-only"

import { verifyIdToken } from "@/firebase/firebaseadmin"
import { prisma } from "@/lib/prisma"

export async function verifyAuth(request: Request) {
  const authHeader = request.headers.get("Authorization")

  if (!authHeader) {
    console.error("No Authorization header")
    return null
  }

  if (!authHeader.startsWith("Bearer ")) {
    console.error("Invalid Authorization header format:", authHeader.substring(0, 20))
    return null
  }

  const token = authHeader.split("Bearer ")[1]

  if (!token) {
    console.error("No token found in Authorization header")
    return null
  }

  try {
    const decodedToken = await verifyIdToken(token)

    let user = await prisma.user.findUnique({
      where: { email: decodedToken.email },
    })

    if (!user && decodedToken.email) {
      user = await prisma.user.create({
        data: {
          email: decodedToken.email,
          name: decodedToken.name || decodedToken.email,
          image: decodedToken.picture,
        },
      })
    }

    return {
      user,
      uid: decodedToken.uid,
    }
  } catch (error) {
    console.error("Auth verification error:", error)
    if (error instanceof Error) {
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }
    return null
  }
}
