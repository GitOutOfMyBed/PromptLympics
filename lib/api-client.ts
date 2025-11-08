import { auth } from "@/firebase/firebasefrontend"

export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  const user = auth.currentUser

  if (!user) {
    throw new Error("User not authenticated")
  }

  const token = await user.getIdToken()

  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  }

  return fetch(url, {
    ...options,
    headers,
  })
}
