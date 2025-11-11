import "server-only"

import * as jwt from "jsonwebtoken"
import jwksClient from "jwks-rsa"

const FIREBASE_PROJECT_ID = "promptlympics"

const client = jwksClient({
  jwksUri: `https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com`,
  cache: true,
  cacheMaxAge: 86400000, // 24 hours
})

function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err)
      return
    }
    const signingKey = key?.getPublicKey()
    callback(null, signingKey)
  })
}

interface FirebaseToken {
  uid: string
  email?: string
  name?: string
  picture?: string
  email_verified?: boolean
}

export async function verifyIdToken(token: string): Promise<FirebaseToken> {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getKey,
      {
        audience: FIREBASE_PROJECT_ID,
        issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
        algorithms: ["RS256"],
      },
      (err, decoded) => {
        if (err) {
          reject(err)
          return
        }
        resolve(decoded as FirebaseToken)
      }
    )
  })
}
