/**
 * API Route Configuration Tests
 * Prevents static rendering errors by ensuring all authenticated routes have dynamic export
 */

import fs from 'fs'
import path from 'path'
import { glob } from 'glob'

describe('API Route Configuration', () => {
  it('all routes using verifyAuth should have dynamic export', async () => {
    const routeFiles = await glob('app/api/**/route.ts', {
      cwd: process.cwd()
    })

    const errors: string[] = []

    for (const file of routeFiles) {
      const filePath = path.join(process.cwd(), file)
      const content = fs.readFileSync(filePath, 'utf-8')

      // Check if route uses verifyAuth
      if (content.includes('verifyAuth')) {
        // Check if it has dynamic export
        if (!content.includes("export const dynamic = 'force-dynamic'")) {
          errors.push(file)
        }
      }
    }

    if (errors.length > 0) {
      throw new Error(
        `The following routes use verifyAuth but are missing "export const dynamic = 'force-dynamic'":\n` +
        errors.map(f => `  - ${f}`).join('\n') +
        '\n\nThis will cause deployment failures. Add this line after imports:\n' +
        "export const dynamic = 'force-dynamic'"
      )
    }
  })

  it('all routes using request.headers should have dynamic export', async () => {
    const routeFiles = await glob('app/api/**/route.ts', {
      cwd: process.cwd()
    })

    const errors: string[] = []

    for (const file of routeFiles) {
      const filePath = path.join(process.cwd(), file)
      const content = fs.readFileSync(filePath, 'utf-8')

      // Check if route accesses request.headers
      if (content.includes('req.headers') || content.includes('request.headers')) {
        // Check if it has dynamic export
        if (!content.includes("export const dynamic = 'force-dynamic'")) {
          errors.push(file)
        }
      }
    }

    if (errors.length > 0) {
      throw new Error(
        `The following routes use request.headers but are missing "export const dynamic = 'force-dynamic'":\n` +
        errors.map(f => `  - ${f}`).join('\n')
      )
    }
  })
})
