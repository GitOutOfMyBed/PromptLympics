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
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **File Upload**: Next.js API with filesystem storage
- **LLM Integration**: OpenAI & Anthropic APIs

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

Edit `.env` and add:
- `DATABASE_URL`: Your PostgreSQL connection string
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL`: Your app URL (e.g., `http://localhost:3000`)
- `OPENAI_API_KEY`: Your OpenAI API key (optional)
- `ANTHROPIC_API_KEY`: Your Anthropic API key (optional)
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: For Google OAuth (optional)
- `GITHUB_ID` & `GITHUB_SECRET`: For GitHub OAuth (optional)

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
   - `DATABASE_URL`: Your production PostgreSQL URL (we recommend using Vercel Postgres or Supabase)
   - `NEXTAUTH_SECRET`: Generate a new secret for production
   - `NEXTAUTH_URL`: Your production URL
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `ANTHROPIC_API_KEY`: Your Anthropic API key
   - OAuth credentials (if using)

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

## Project Structure

```
├── app/                      # Next.js App Router pages
│   ├── api/                 # API routes
│   │   ├── auth/           # Authentication endpoints
│   │   ├── competitions/   # Competition CRUD
│   │   ├── submissions/    # Submission endpoints
│   │   └── upload/         # File upload handler
│   ├── auth/               # Auth pages (signin, signup)
│   ├── competitions/       # Competition pages
│   ├── profile/            # User profile
│   └── layout.tsx          # Root layout
├── components/              # React components
│   ├── ui/                 # shadcn/ui components
│   └── ...                 # Feature components
├── lib/                     # Utility libraries
│   ├── auth.ts             # NextAuth configuration
│   ├── prisma.ts           # Prisma client
│   ├── evaluation.ts       # Prompt evaluation logic
│   └── utils.ts            # Utility functions
├── prisma/                  # Database schema
│   └── schema.prisma       # Prisma schema
└── public/                  # Static files
    └── uploads/            # User-uploaded files
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
