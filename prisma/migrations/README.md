# Database Migrations

This directory contains Prisma database migrations.

## ⚠️ IMPORTANT: Schema Changes

**When you update `schema.prisma`, you MUST run migrations!**

### Development Workflow

1. **Update schema.prisma**
2. **Create migration:**
   ```bash
   npx prisma migrate dev --name describe_your_change
   ```
3. **Commit both:**
   - `schema.prisma`
   - `prisma/migrations/[timestamp]_describe_your_change/`

### Production Deployment

**Before deploying code changes, run migrations:**

```bash
# Production
npx prisma migrate deploy

# OR via package.json script (recommended to add)
npm run db:migrate
```

### Common Error

```
The column `Competition.customBaseUrl` does not exist in the current database.
```

**Fix:** You forgot to run migrations! Run:
```bash
npx prisma migrate deploy
```

## Testing Schema Sync

We have automated tests to catch this:

```bash
npm test __tests__/schema.test.ts
```

This will fail if:
- Database is out of sync with schema.prisma
- Required fields are missing
- Migrations haven't been run

## Migration Files

Each migration is a directory with:
- `migration.sql` - The SQL to run
- Auto-generated timestamp name

**Never edit existing migrations!** Create a new one instead.

## Troubleshooting

### Reset database (development only)
```bash
npx prisma migrate reset
```

### Check current state
```bash
npx prisma migrate status
```

### Generate Prisma Client after changes
```bash
npx prisma generate
```

## CI/CD Integration

Add to your deployment pipeline:

```yaml
# Example GitHub Actions
- name: Run database migrations
  run: npx prisma migrate deploy
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}

- name: Test schema sync
  run: npm test __tests__/schema.test.ts
```

This ensures:
1. Migrations run before code deploys
2. Schema mismatches are caught in CI
