# Test Suite - Preventing Production Failures

This test suite prevents the issues we encountered from happening again.

## Tests

### 1. API Routes Test (`api-routes.test.ts`)
**Prevents:** Static rendering errors in production

**What it checks:**
- All routes using `verifyAuth` have `export const dynamic = 'force-dynamic'`
- All routes using `request.headers` have the dynamic export

**Error it prevents:**
```
Error: Dynamic server usage: Route /api/user/profile couldn't be rendered statically
```

### 2. Database Schema Test (`database-schema.test.ts`)
**Prevents:** Schema mismatch errors

**What it checks:**
- Competition table has all required columns (including `customBaseUrl`, `customHeaders`)
- PracticeChallenge table exists with all columns
- All migrations are applied

**Error it prevents:**
```
PrismaClientKnownRequestError: The column `Competition.customBaseUrl` does not exist
```

### 3. API Integration Test (`api-integration.test.ts`)
**Prevents:** API response issues

**What it checks:**
- API endpoints return correct data structure
- Sensitive fields are not exposed
- All expected fields are present

## Running Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:routes    # Check API route configuration
npm run test:schema    # Check database schema

# Tests run automatically before build
npm run build          # Runs tests first
```

## How It Prevents Issues

### Before Deployment
The `prebuild` script runs schema and route tests **before every build**, catching issues before they reach production.

### During Development
Run `npm run test:schema` after any Prisma schema changes to ensure migrations are applied.

### In CI/CD
Add to your CI pipeline:
```yaml
- name: Run schema tests
  run: npm run test:schema

- name: Run route tests
  run: npm run test:routes
```

## When to Run

- **After schema changes:** `npm run test:schema`
- **After adding API routes:** `npm run test:routes`
- **Before deploying:** Automatically runs with `npm run build`
- **When debugging:** `npm test` to run all tests
