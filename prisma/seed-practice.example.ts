/**
 * Example script for seeding practice challenges
 * Practice challenges are platform-curated educational content, not user-generated.
 *
 * Usage:
 * 1. Copy this file to seed-practice.ts
 * 2. Update the challenges with your actual data
 * 3. Run: npx tsx prisma/seed-practice.ts
 */

import { PrismaClient } from '@prisma/client';
import { encryptApiKey } from '../lib/encryption';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding practice challenges...');

  // Example: Sentiment Analysis Practice Challenge
  const sentimentChallenge = await prisma.practiceChallenge.create({
    data: {
      title: 'Sentiment Analysis Basics',
      description: `Learn to craft prompts for sentiment analysis.

Your prompt should classify text as positive, negative, or neutral.

**Skills you'll practice:**
- Clear instruction formatting
- Consistent output formatting
- Handling edge cases

**Tips:**
- Be explicit about the output format (positive/negative/neutral)
- Consider how to handle mixed sentiment
- Test your prompt on the training data first`,
      organizationName: 'PromptLympics Academy',

      // Learning goals
      minimumScore: 0.7,  // 70% to pass
      targetScore: 0.9,   // 90% for mastery

      // Starter prompt to help users
      starterPrompt: `You are a sentiment analysis assistant. Classify the sentiment of the given text.

Rules:
- Output only: positive, negative, or neutral
- Be consistent in your classifications`,

      // Constraints
      characterLimit: 500,
      tokenLimit: 150,
      maxSubmissionsPerUser: 999, // Essentially unlimited for practice

      // Model configuration
      modelType: 'gpt-4o-mini', // Use a cheaper model for practice

      // API Key (encrypted) - REPLACE WITH YOUR KEY
      encryptedApiKey: await encryptApiKey(process.env.PRACTICE_API_KEY!),
      apiKeyProvider: 'openai',

      // Data URLs (upload to Firebase Storage first)
      trainingDataUrl: 'https://storage.googleapis.com/your-bucket/sentiment-training.json',
      validationDataUrl: 'practice/sentiment-validation.json', // Private path in Firebase
      trainingDataSize: 50,
      validationDataSize: 100,

      // Creator (use your admin user ID)
      creatorId: 'YOUR_ADMIN_USER_ID',
    },
  });

  console.log('Created practice challenge:', sentimentChallenge.title);

  // Example: Text Classification Practice Challenge
  const classificationChallenge = await prisma.practiceChallenge.create({
    data: {
      title: 'Text Classification: News Categories',
      description: `Practice classifying news articles into categories.

**Categories:** Technology, Sports, Politics, Entertainment, Business

**What you'll learn:**
- Multi-class classification prompting
- Handling ambiguous cases
- Consistent category naming

**Challenge:**
Some articles may fit multiple categories - your prompt needs to handle this!`,
      organizationName: 'PromptLympics Academy',

      minimumScore: 0.75,
      targetScore: 0.92,

      starterPrompt: `Classify the news article into one of these categories:
- Technology
- Sports
- Politics
- Entertainment
- Business

Output only the category name.`,

      characterLimit: 600,
      tokenLimit: 200,
      maxSubmissionsPerUser: 999,

      modelType: 'gpt-4o-mini',
      encryptedApiKey: await encryptApiKey(process.env.PRACTICE_API_KEY!),
      apiKeyProvider: 'openai',

      trainingDataUrl: 'https://storage.googleapis.com/your-bucket/news-training.json',
      validationDataUrl: 'practice/news-validation.json',
      trainingDataSize: 40,
      validationDataSize: 80,

      creatorId: 'YOUR_ADMIN_USER_ID',
    },
  });

  console.log('Created practice challenge:', classificationChallenge.title);

  // Example: Data Extraction Practice Challenge
  const extractionChallenge = await prisma.practiceChallenge.create({
    data: {
      title: 'Data Extraction: Email Parsing',
      description: `Extract key information from email text.

**Extract:**
- Sender name
- Date
- Subject
- Action items (if any)

**Format:** Return as JSON

**Learning objectives:**
- Structured output formatting
- Information extraction
- JSON formatting in prompts`,
      organizationName: 'PromptLympics Academy',

      minimumScore: 0.6,
      targetScore: 0.85,

      starterPrompt: `Extract information from the email and return as JSON:
{
  "sender": "name",
  "date": "date",
  "subject": "subject line",
  "actionItems": ["item1", "item2"]
}`,

      characterLimit: 800,
      tokenLimit: 250,
      maxSubmissionsPerUser: 999,

      modelType: 'gpt-4o-mini',
      encryptedApiKey: await encryptApiKey(process.env.PRACTICE_API_KEY!),
      apiKeyProvider: 'openai',

      trainingDataUrl: 'https://storage.googleapis.com/your-bucket/email-training.json',
      validationDataUrl: 'practice/email-validation.json',
      trainingDataSize: 30,
      validationDataSize: 60,

      creatorId: 'YOUR_ADMIN_USER_ID',
    },
  });

  console.log('Created practice challenge:', extractionChallenge.title);

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Error seeding practice challenges:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
