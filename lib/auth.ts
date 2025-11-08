import { verifyIdToken } from "@/firebase/firebaseadmin"
import { prisma } from "@/lib/prisma"

export async function verifyAuth(request: Request) {
  const authHeader = request.headers.get("Authorization")

  if (!authHeader?.startsWith("Bearer ")) {
    return null
  }

  const token = authHeader.split("Bearer ")[1]

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
    return null
  }
}
