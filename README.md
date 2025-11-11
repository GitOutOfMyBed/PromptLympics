# OptoPrompt - Prompt Competition Platform

A Kaggle-style platform for crowdsourced prompt engineering competitions.

## Features

- **Competition Listing**: Browse all available prompt engineering competitions
- **Competition Details**: View detailed information, test cases, and leaderboards
- **Multi-step Competition Creation**: Create competitions with custom test cases and prizes
- **Prompt Submission**: Submit prompts and get automated evaluation
- **User Profiles**: Track your submissions and created competitions
- **Automated Evaluation**: Prompts are evaluated against test cases using OpenAI or Anthropic APIs

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Neon) with Prisma ORM
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage (training/validation data)
- **Encryption**: AES-256-GCM for API keys
- **LLM Integration**: OpenAI, Anthropic, Google AI (via Vercel AI SDK)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- OpenAI API key (for GPT models)
- Anthropic API key (for Claude models)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Optoprompt
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env.local` and add:
- `DATABASE_URL`: Your PostgreSQL connection string
- `FIREBASE_SERVICE_ACCOUNT_KEY`: Your Firebase service account JSON (paste entire JSON as single-line string)
  - Get from: Firebase Console → Project Settings → Service Accounts → Generate New Private Key
- `API_KEY_ENCRYPTION_SECRET`: Generate with `openssl rand -hex 32`
- `OPENAI_API_KEY`: Your OpenAI API key (optional, for GPT models)
- `ANTHROPIC_API_KEY`: Your Anthropic API key (optional, for Claude models)
- `GOOGLE_GENERATIVE_AI_API_KEY`: Your Google AI API key (optional, for Gemini models)

4. Set up the database:
```bash
npx prisma migrate dev
npx prisma generate
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment to Vercel

1. Push your code to GitHub

2. Import the project to Vercel

3. Set up environment variables in Vercel:
   - `DATABASE_URL`: Your production PostgreSQL URL (we recommend using Neon or Supabase)
   - `FIREBASE_SERVICE_ACCOUNT_KEY`: Paste your Firebase service account JSON as a single-line string
   - `API_KEY_ENCRYPTION_SECRET`: Generate with `openssl rand -hex 32`
   - `OPENAI_API_KEY`: Your OpenAI API key (optional)
   - `ANTHROPIC_API_KEY`: Your Anthropic API key (optional)
   - `GOOGLE_GENERATIVE_AI_API_KEY`: Your Google AI API key (optional)

4. Deploy!

### Database Setup for Production

For production, we recommend using one of these PostgreSQL hosting services:

- **Vercel Postgres**: Easy integration with Vercel
- **Supabase**: Free tier with generous limits
- **Railway**: Simple PostgreSQL hosting
- **Neon**: Serverless PostgreSQL

After setting up your database, run migrations:
```bash
npx prisma migrate deploy
```

## Architecture

**Security Model**:
- Organizers provide their own API keys (not platform keys)
- Keys encrypted with AES-256-GCM before storage
- Validation data stored in Firebase Storage (private, Admin SDK access only)
- Training data public (participants download for testing)

**Evaluation Flow**:
1. User submits prompt → saved as PENDING
2. Background job fetches validation data from Firebase
3. Runs prompt against each test case using organizer's API key
4. Compares outputs, calculates accuracy score
5. Updates submission status to COMPLETED
6. Updates competition leaderboard if score is best

**Key Modules**:
- `lib/evaluation.ts` - Evaluation engine
- `lib/llm.ts` - Multi-provider LLM interface
- `lib/encryption.ts` - API key encryption
- `firebase/firebaseadmin-storage.ts` - Private data access

## Project Structure

```
├── app/
│   ├── api/                 # API routes
│   │   ├── competitions/   # Competition CRUD
│   │   └── submissions/    # Submission handling & evaluation
│   ├── competitions/       # Competition pages (list, detail, create, submit)
│   └── _components/        # Shared components
├── lib/                     # Core utilities
│   ├── evaluation.ts       # Prompt evaluation engine
│   ├── llm.ts              # LLM provider interface
│   ├── encryption.ts       # API key encryption
│   └── types.ts            # Shared types
├── firebase/                # Firebase integration
│   ├── firebasefrontend.ts # Client SDK (auth, public storage)
│   └── firebaseadmin-storage.ts # Admin SDK (private validation data)
└── prisma/schema.prisma     # Database schema
```

## Key Features Explained

### Competition Creation

Organizers can create competitions with:
- Title, description, and requirements
- Model selection (GPT-4, GPT-3.5, Claude variants)
- Character/token limits for prompts
- Training and validation test cases (JSON format)
- Prize pool and distribution rules
- Start and end dates
- Optional target score (competition ends early if reached)

### Submission & Evaluation

1. Users submit their prompts
2. System runs the prompt against validation test cases
3. Each test case is evaluated using the specified LLM
4. Results are compared with expected outputs
5. Score is calculated based on accuracy
6. Leaderboard is updated

### Test Case Format

Test cases should be uploaded as JSON arrays:

```json
[
  {
    "input": "Your input text here",
    "expectedOutput": "The expected output"
  },
  {
    "input": "Another input",
    "expectedOutput": "Another expected output"
  }
]
```

## Roadmap

- [ ] Custom model support (users upload their own models)
- [ ] Automated prompting integration (DSPy)
- [ ] Advanced scoring metrics
- [ ] Email notifications
- [ ] Payment integration
- [ ] Real-time leaderboard updates
- [ ] Competition categories and tags
- [ ] Discussion forums per competition

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License
