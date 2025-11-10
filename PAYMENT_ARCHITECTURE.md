# Payment Architecture for Prompt Evaluation

## The Problem
When a user submits a prompt, it needs to be evaluated against validation test cases using an LLM API (OpenAI/Anthropic). **Who pays for these API calls?**

---

## Option 1: User Supplies Their API Key ❌

### How it works:
- User enters their OpenAI/Anthropic API key when submitting
- Platform uses user's key to evaluate their submission

### Pros:
- ✅ Zero cost to platform
- ✅ Zero cost to organizer
- ✅ Simple implementation

### Cons:
- ❌ **Terrible UX** - Most users don't have API keys
- ❌ **Security risk** - User could extract validation data by monitoring their own API calls
- ❌ **Cheating** - User can see exact prompts sent to API, reverse-engineer test cases
- ❌ **Rate limits** - User's personal limits apply
- ❌ **No business model** - Platform makes no money

### Verdict: **Don't do this** - Too many downsides

---

## Option 2: Competition Creator Supplies API Key ⚠️

### How it works:
- Organizer enters encrypted API key when creating competition
- Platform uses organizer's key to evaluate all submissions
- Key stored encrypted in database

### Pros:
- ✅ Organizer pays for their own competition (fair)
- ✅ No cost to platform
- ✅ No cost to participants
- ✅ Simple billing (organizer sees charges in their own API account)

### Cons:
- ⚠️ **Security risk** - Need to encrypt/decrypt keys securely
- ⚠️ **Key management** - What if organizer's API credits run out mid-competition?
- ⚠️ **Trust issue** - Organizers must trust platform with their API keys
- ⚠️ **No platform revenue** - Can't take a cut
- ⚠️ **Rate limits** - Limited by organizer's API tier

### Implementation:
```typescript
// Store encrypted in database
{
  competitionId: "123",
  encryptedApiKey: "encrypted_key_here", // AES-256 encryption
  apiProvider: "OPENAI" | "ANTHROPIC"
}

// At evaluation time
const apiKey = decrypt(competition.encryptedApiKey)
const result = await callLLM(prompt, testCase, apiKey)
```

### Verdict: **Good for MVP** - Simple, works, organizer controls costs

---

## Option 3: Platform Uses Own API Keys & Charges Organizer 💰

### How it works:
- Platform has its own OpenAI/Anthropic API keys
- Organizer pre-pays or buys credits
- Platform tracks usage and bills organizer
- Platform can add markup (e.g., $0.01/submission → $0.015/submission)

### Pros:
- ✅ **Best UX** - Organizers just buy credits
- ✅ **Platform revenue** - Can charge markup
- ✅ **Centralized control** - Platform manages all API usage
- ✅ **Better rate limits** - Use platform's enterprise API tier
- ✅ **Professional** - Like AWS, Stripe model
- ✅ **Security** - API keys never exposed

### Cons:
- ❌ **Complex payment system** - Need Stripe integration
- ❌ **Upfront cost** - Platform must pay API bills before getting paid
- ❌ **Credit risk** - What if organizer disputes charges?
- ❌ **Usage tracking** - Need to track every API call accurately

### Implementation:
```typescript
// Pre-purchase credits
POST /api/credits/purchase
{
  amount: 100.00, // Buy $100 in credits
  stripeToken: "tok_xxxx"
}

// Create competition with budget
POST /api/competitions
{
  ...competition data,
  maxBudget: 50.00, // Maximum $50 to spend on this competition
  costPerSubmission: 0.015 // $0.015 per submission
}

// Track usage
{
  competitionId: "123",
  creditsUsed: 12.50,
  submissionsProcessed: 834,
  remainingBudget: 37.50
}

// Stop when budget depleted
if (competition.creditsUsed >= competition.maxBudget) {
  return { error: "Competition budget exhausted" }
}
```

### Verdict: **Best long-term** - Professional, scalable, profitable

---

## Option 4: Platform Uses Own Keys, Bills Later 📊

### How it works:
- Platform uses own API keys
- Track usage per competition
- Send invoice at end of month
- Use Stripe Invoicing API

### Pros:
- ✅ Simple UX (no upfront payment)
- ✅ Professional
- ✅ Can add markup
- ✅ Good for B2B customers

### Cons:
- ⚠️ **Payment risk** - Organizer might not pay
- ⚠️ **Cash flow** - Platform pays API bills before getting paid
- ⚠️ **Collections** - Need to handle unpaid invoices

### Verdict: **Good for enterprise** - Works for trusted, high-volume organizers

---

## Recommended Approach: Phased Rollout

### Phase 1: MVP (Launch ASAP) ✅
**Option 2: Organizer supplies encrypted API key**

**Why:**
- Simple to implement (1-2 days)
- No payment processing needed
- No legal/compliance issues
- Organizer controls costs directly
- Can test product-market fit

**Implementation:**
```typescript
// Add to competition creation form
<Input
  type="password"
  label="OpenAI API Key"
  helperText="Your key is encrypted and only used for this competition"
/>

// Encrypt before storing
const encryptedKey = await encrypt(apiKey, process.env.ENCRYPTION_KEY)

// Decrypt at evaluation time
const apiKey = await decrypt(competition.encryptedApiKey)
```

**Pros:**
- Ship quickly
- No financial risk
- Learn what users want

**Cons:**
- Not scalable long-term
- Can't monetize platform

---

### Phase 2: Growth (After Product-Market Fit) 💰
**Option 3: Platform credits with Stripe**

**Why:**
- Better UX
- Platform revenue
- Professional
- Scales to thousands of competitions

**Implementation:**
```typescript
// Pricing tiers
const PRICING = {
  GPT_3_5: 0.002,    // $0.002 per evaluation
  GPT_4: 0.03,       // $0.03 per evaluation
  CLAUDE_HAIKU: 0.0025,
  CLAUDE_SONNET: 0.015,

  // Platform markup: 50% on top of cost
  MARKUP: 1.5
}

// Credits system
User.credits = 100.00
Competition.estimatedCost = testCases.length * submissions * costPerEval

// Deduct on submission
await deductCredits(organizer.id, actualCost)
```

**Migration path:**
1. Add Stripe payment processing
2. Add credits system to database
3. Offer both options (bring your own key OR buy credits)
4. Deprecate bring-your-own-key after 6 months

---

### Phase 3: Enterprise (Scale) 🏢
**Option 4: Invoicing for large customers**

**Why:**
- Large companies prefer invoices
- Higher contract values
- Predictable revenue

**Features:**
- Monthly invoicing
- Volume discounts
- Dedicated API limits
- Premium support

---

## Cost Estimation Examples

### Example Competition:
- 100 test cases
- 50 submissions
- Using GPT-4

**Total API calls:** 100 × 50 = 5,000 evaluations

**Costs:**

| Model | OpenAI Cost | Platform Markup (50%) | Total Cost |
|-------|-------------|----------------------|------------|
| GPT-3.5 Turbo | $10 | $5 | **$15** |
| GPT-4 | $150 | $75 | **$225** |
| Claude Haiku | $12.50 | $6.25 | **$18.75** |
| Claude Sonnet | $75 | $37.50 | **$112.50** |

**For organizer:**
- Option 2 (Own Key): Pay OpenAI directly ($10-$150)
- Option 3 (Credits): Pay platform ($15-$225)

---

## Security Considerations

### If storing organizer's API keys:

```typescript
// Use AES-256-GCM encryption
import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.API_KEY_ENCRYPTION_SECRET // 32 bytes
const ALGORITHM = 'aes-256-gcm'

async function encryptApiKey(apiKey: string): Promise<string> {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv)

  let encrypted = cipher.update(apiKey, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  return JSON.stringify({
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  })
}

async function decryptApiKey(encryptedData: string): Promise<string> {
  const { encrypted, iv, authTag } = JSON.parse(encryptedData)

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    ENCRYPTION_KEY,
    Buffer.from(iv, 'hex')
  )

  decipher.setAuthTag(Buffer.from(authTag, 'hex'))

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}
```

**Important:**
- Never log API keys
- Rotate encryption key regularly
- Use environment variable for encryption key
- Never store in plain text
- Audit access to encrypted keys

---

## My Recommendation

### For Your Situation:

**Start with Option 2** (Organizer supplies encrypted API key)

**Reasons:**
1. **Ship fast** - Can implement in 1-2 days
2. **Validate idea** - See if people actually use it
3. **No financial risk** - Don't pay for others' API usage
4. **Simple** - No payment processing, no legal issues
5. **Fair** - Organizer pays for what they use

**Then migrate to Option 3** once you have:
- 10+ active competitions
- Proven product-market fit
- Users asking for easier payment
- $10k+ in potential monthly GMV (Gross Merchandise Value)

### Implementation Priority:

**Week 1-2: MVP (Option 2)**
- [x] Add API key field to competition form
- [x] Encrypt/decrypt API keys
- [x] Use organizer's key for evaluation
- [x] Add cost estimator ("~$15 for 100 submissions on GPT-4")

**Month 2-3: Credits (Option 3)**
- [ ] Integrate Stripe
- [ ] Build credits system
- [ ] Add pricing tiers
- [ ] Usage tracking & billing
- [ ] Migration tool (key → credits)

**Month 6+: Enterprise (Option 4)**
- [ ] Invoicing system
- [ ] Volume discounts
- [ ] Dedicated support

---

## Prevent Cost Explosions

**Critical: Add limits regardless of which option:**

```typescript
const MAX_TEST_CASES = 100
const MAX_SUBMISSIONS_PER_USER = 10
const MAX_SUBMISSIONS_PER_COMPETITION = 1000
const TIMEOUT_PER_EVAL = 30000 // 30 seconds

// Estimate and confirm before competition starts
const estimatedCost = calculateCost(
  testCases.length,
  expectedSubmissions,
  modelType
)

if (estimatedCost > 1000) {
  return {
    error: `This competition could cost $${estimatedCost}. Please confirm.`,
    requiresConfirmation: true
  }
}
```

---

## Summary

| Option | Best For | Cost to Platform | Revenue | Complexity |
|--------|----------|------------------|---------|------------|
| 1. User API Key | Never | $0 | $0 | Low |
| 2. Organizer API Key | **MVP** | $0 | $0 | **Low** |
| 3. Platform Credits | **Growth** | API costs | 50% markup | High |
| 4. Invoicing | Enterprise | API costs | 50% markup | Medium |

**My advice: Start with #2, migrate to #3 after product-market fit.**
