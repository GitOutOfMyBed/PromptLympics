# Contributing

## Setup

1. Clone and install:
```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in values

3. Run migrations:
```bash
npx prisma migrate dev
```

## Development

```bash
npm run dev
```

## Testing

```bash
npm test
```

## Code Style

- Use TypeScript
- Keep components small and focused
- Add JSDoc comments to exported functions
- Follow existing patterns in the codebase

## Pull Requests

1. Create a feature branch
2. Make your changes
3. Run tests
4. Submit PR with clear description

## API Routes

- All routes in `app/api/`
- Use `verifyAuth()` for protected endpoints
- Return proper HTTP status codes

## Security

- Never commit API keys or secrets
- All LLM calls use encrypted organizer keys
- Validate user input in API routes
