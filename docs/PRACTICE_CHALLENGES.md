# Practice Challenges

Practice challenges are **platform-curated educational content** designed to help users learn and improve their prompt engineering skills.

## Key Differences from Competitions

| Feature | Competitions | Practice Challenges |
|---------|-------------|-------------------|
| Created by | Users | Platform admins only |
| Prizes | Yes | No |
| Deadlines | Yes | No (always available) |
| Submission limit | Low (default 3) | High (default 999) |
| Test results visibility | Hidden from participants | Visible to help learning |
| Purpose | Win prizes | Learn and improve |

## Why Admin-Only?

Practice challenges are created only by platform administrators for several important reasons:

1. **Cost Control** - Creator's API key pays for all submissions. With unlimited submissions, costs could be high.
2. **Quality Control** - Curated challenges ensure high-quality learning experience
3. **Educational Design** - Admins can create progressive learning paths
4. **No Spam** - Prevents low-quality or duplicate practice content

## Creating Practice Challenges

### Prerequisites

1. Admin access to the database
2. Platform API key (OpenAI, Anthropic, or Google)
3. Training and validation datasets prepared

### Method 1: Database Seed Script

Use the example seed script:

```bash
# Copy the example
cp prisma/seed-practice.example.ts prisma/seed-practice.ts

# Edit with your data
# Update: challenges, API key, user ID, data URLs

# Run the seed
npx tsx prisma/seed-practice.ts
```

### Method 2: Direct Database Insert

Use Prisma Studio or direct SQL to insert practice challenges:

```bash
npx prisma studio
```

Then create a `PracticeChallenge` record with required fields:
- title, description, organizationName
- modelType, encryptedApiKey, apiKeyProvider
- trainingDataUrl, validationDataUrl
- trainingDataSize, validationDataSize
- creatorId (your admin user ID)

### Method 3: Admin API (Future)

A dedicated admin API could be built for managing practice challenges via UI.

## Data Format

Training and validation data should be JSON arrays of test cases:

```json
[
  {
    "input": "I love this product!",
    "expectedOutput": "positive"
  },
  {
    "input": "This is terrible.",
    "expectedOutput": "negative"
  }
]
```

## Best Practices

### 1. Progressive Difficulty
Create challenges that build on each other:
- Beginner: Simple sentiment analysis
- Intermediate: Multi-class classification
- Advanced: Complex extraction with edge cases

### 2. Clear Learning Objectives
Each challenge should teach specific skills:
- Output formatting
- Handling ambiguity
- Edge case management
- Structured data extraction

### 3. Helpful Starter Prompts
Provide starter prompts that:
- Demonstrate good structure
- Show the expected format
- Leave room for improvement

### 4. Reasonable Constraints
Set limits that encourage good prompting:
- Character limit: 500-1000 for most challenges
- Token limit: Based on complexity
- Target score: 85-95% for mastery

### 5. Cost-Effective Models
Use cheaper models for practice:
- `gpt-4o-mini` for most challenges
- `claude-3-haiku` for simple tasks
- Reserve expensive models for advanced challenges

### 6. Using OpenRouter for Free Models
Save costs with OpenRouter.ai:
- Access **free models** like `deepseek/deepseek-chat-v3.1:free`
- Use a single API key for hundreds of models
- Configure with `customBaseUrl` and `customHeaders`

**Example OpenRouter Configuration:**
```typescript
{
  modelType: 'deepseek/deepseek-chat-v3.1:free',
  apiKeyProvider: 'custom',
  customBaseUrl: 'https://openrouter.ai/api/v1',
  customHeaders: JSON.stringify({
    'HTTP-Referer': 'https://promptlympics.com',
    'X-Title': 'PromptLympics',
  })
}
```

See the seed script example for a complete OpenRouter challenge!

## Example Challenges

### Beginner: Sentiment Analysis
- **Goal**: Classify text as positive/negative/neutral
- **Teaches**: Basic instruction formatting, consistent outputs
- **Model**: gpt-4o-mini
- **Target Score**: 90%

### Intermediate: News Classification
- **Goal**: Categorize news into 5 categories
- **Teaches**: Multi-class classification, handling ambiguity
- **Model**: gpt-4o-mini
- **Target Score**: 92%

### Advanced: JSON Extraction
- **Goal**: Extract structured data from emails
- **Teaches**: JSON formatting, complex extraction, handling missing fields
- **Model**: gpt-4o or claude-sonnet
- **Target Score**: 85%

## Monitoring Costs

Since the platform pays for all practice submissions:

1. **Monitor API usage** regularly
2. **Set reasonable submission limits** (999 is high but finite)
3. **Use cheaper models** for practice
4. **Consider rate limiting** per user per day
5. **Track popular challenges** that may need limits

## Future Enhancements

Potential improvements:
- Admin UI for creating challenges
- Difficulty badges (Beginner/Intermediate/Advanced)
- Learning paths (complete challenges in sequence)
- Achievement system
- Cost usage dashboards
- Per-challenge submission limits
