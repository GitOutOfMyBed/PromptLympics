/**
 * SERVER-ONLY MODULE
 * API Key Encryption Module
 * Uses AES-256-GCM to encrypt organizer API keys for secure storage.
 * Keys are encrypted before saving to DB and decrypted for evaluation.
 */

import "server-only"

import * as crypto from 'crypto'

// Encryption configuration
const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32 // 256 bits

/**
 * Get or generate encryption key from environment
 */
function getEncryptionKey(): Buffer {
  const key = process.env.API_KEY_ENCRYPTION_SECRET

  if (!key) {
    throw new Error('API_KEY_ENCRYPTION_SECRET environment variable is not set')
  }

  // Convert hex string to buffer
  const keyBuffer = Buffer.from(key, 'hex')

  if (keyBuffer.length !== KEY_LENGTH) {
    throw new Error(`Encryption key must be ${KEY_LENGTH} bytes (${KEY_LENGTH * 2} hex characters)`)
  }

  return keyBuffer
}

/**
 * Encrypt an API key for secure storage
 * @param apiKey - The plain text API key
 * @returns Encrypted data as a JSON string
 */
export async function encryptApiKey(apiKey: string): Promise<string> {
  try {
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(16) // 128-bit IV

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    let encrypted = cipher.update(apiKey, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const authTag = cipher.getAuthTag()

    // Store all components needed for decryption
    const encryptedData = {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      algorithm: ALGORITHM
    }

    return JSON.stringify(encryptedData)
  } catch (error) {
    console.error('Error encrypting API key:', error)
    throw new Error('Failed to encrypt API key')
  }
}

/**
 * Decrypt an API key for use
 * @param encryptedData - The encrypted data as a JSON string
 * @returns The decrypted API key
 */
export async function decryptApiKey(encryptedData: string): Promise<string> {
  try {
    const key = getEncryptionKey()
    const { encrypted, iv, authTag, algorithm } = JSON.parse(encryptedData)

    if (algorithm !== ALGORITHM) {
      throw new Error('Invalid encryption algorithm')
    }

    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      key,
      Buffer.from(iv, 'hex')
    )

    decipher.setAuthTag(Buffer.from(authTag, 'hex'))

    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    console.error('Error decrypting API key:', error)
    throw new Error('Failed to decrypt API key')
  }
}

/**
 * Generate a new encryption key for initial setup
 * @returns A 32-byte key as a hex string
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex')
}

/**
 * Validate API key format based on provider
 * @param apiKey - The API key to validate
 * @param provider - The provider type
 * @returns True if valid format
 */
export function validateApiKeyFormat(apiKey: string, provider: string): boolean {
  switch (provider) {
    case 'openai':
      // OpenAI keys start with 'sk-'
      return apiKey.startsWith('sk-') && apiKey.length > 20
    case 'anthropic':
      // Anthropic keys start with 'sk-ant-'
      return apiKey.startsWith('sk-ant-') && apiKey.length > 30
    case 'google':
      // Google keys start with 'AIza'
      return apiKey.startsWith('AIza') && apiKey.length === 39
    default:
      return false
  }
}

/**
 * Get provider from model name
 * @param modelName - The model name (e.g., 'gpt-4o-mini')
 * @returns The provider name
 */
export function getProviderFromModel(modelName: string): string {
  if (modelName.startsWith('gpt')) {
    return 'openai'
  } else if (modelName.startsWith('claude')) {
    return 'anthropic'
  } else if (modelName.startsWith('gemini')) {
    return 'google'
  }
  throw new Error(`Unknown provider for model: ${modelName}`)
}