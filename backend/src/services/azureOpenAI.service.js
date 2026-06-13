const { AzureOpenAI } = require('openai')

const DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT
const API_VERSION = '2024-05-01-preview'

// Azure AI Foundry project URLs include /api/projects/... which the SDK must not see —
// it appends /openai/deployments/... itself. Strip to the origin only.
const RAW_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT || ''
const ENDPOINT = RAW_ENDPOINT.replace(/\/api\/projects\/.*$/, '').replace(/\/$/, '')

const client = new AzureOpenAI({
  endpoint: ENDPOINT,
  apiKey: process.env.AZURE_OPENAI_KEY,
  apiVersion: API_VERSION,
  deployment: DEPLOYMENT,
})

console.log('[Azure] endpoint (resolved):', ENDPOINT)
console.log('[Azure] deployment:', DEPLOYMENT)
console.log('[Azure] api-version:', API_VERSION)

async function generateMystery(genre, difficulty) {
  try {
    const response = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT,
      messages: [
        {
          role: 'system',
          content: `You are a mystery world generator. Always respond with valid JSON only. No markdown, no explanation.

IMPORTANT RULES FOR LANGUAGE AND NAMES:
- Use ONLY simple, common English first names (e.g. Sarah, Mike, Tom, Amy, Jake, Emma, Lisa, Dan, Kate, Ryan).
- Use ONLY simple everyday English words. No fancy, rare, or foreign words.
- Write all descriptions as short, clear sentences a 12-year-old can understand.
- Occupations should be everyday jobs: teacher, student, doctor, shop owner, janitor, librarian, coach, nurse, chef, security guard.
- Locations should be simple everyday places: classroom, library, cafeteria, parking lot, office, hallway, gym, rooftop, storage room.
- Motives should be simple human feelings: jealousy, greed, revenge, fear, anger, secrets.
- Keep sentences short. Maximum 2 sentences per description field.`,
        },
        {
          role: 'user',
          content: `Generate a complete detective mystery. Genre: ${genre}. Difficulty: ${difficulty}.

Return ONLY this JSON structure:
{
  "title": "string (short dramatic case title, 4-6 words, simple English)",
  "caseDescription": "string (2 short sentences describing the crime in plain English)",
  "victim": { "name": "string (simple English first + last name)", "age": "number", "occupation": "string (everyday job)", "causeOfDeath": "string (simple, e.g. 'poison in coffee', 'hit on the head')" },
  "suspects": [
    { "id": "s1", "name": "string (simple English name)", "age": "number", "occupation": "string", "personality": "string (one simple word: shy, angry, sneaky, nervous, calm)", "alibi": "string (one simple sentence)", "isGuilty": false, "motive": "" },
    { "id": "s2", "name": "string (simple English name)", "age": "number", "occupation": "string", "personality": "string (one simple word)", "alibi": "string (one simple sentence)", "isGuilty": false, "motive": "" },
    { "id": "s3", "name": "string (simple English name)", "age": "number", "occupation": "string", "personality": "string (one simple word)", "alibi": "string (one simple sentence)", "isGuilty": true, "motive": "string (simple reason like 'wanted the money' or 'was very jealous')" }
  ],
  "evidence": [
    { "id": "e1", "type": "document", "title": "string (simple title)", "description": "string (one simple sentence about what this clue shows)", "location": "string", "pointsTo": "s1 or s2 or s3" },
    { "id": "e2", "type": "photo", "title": "string", "description": "string (one simple sentence)", "location": "string", "pointsTo": "s1 or s2 or s3" },
    { "id": "e3", "type": "message", "title": "string", "description": "string (one simple sentence)", "location": "string", "pointsTo": "s1 or s2 or s3" },
    { "id": "e4", "type": "physical", "title": "string", "description": "string (one simple sentence)", "location": "string", "pointsTo": "s1 or s2 or s3" }
  ],
  "locations": [
    { "id": "l1", "name": "string (simple place name)", "description": "string (one simple sentence)", "cluesHere": ["e1"] },
    { "id": "l2", "name": "string (simple place name)", "description": "string (one simple sentence)", "cluesHere": ["e2", "e3"] },
    { "id": "l3", "name": "string (simple place name)", "description": "string (one simple sentence)", "cluesHere": ["e4"] }
  ],
  "timeline": [
    { "time": "string (e.g. '8:00 AM')", "event": "string (one simple sentence)" },
    { "time": "string", "event": "string" },
    { "time": "string", "event": "string" }
  ],
  "hiddenTruth": "string (2 simple sentences: what really happened and why the killer did it)"
}

The mystery plot should be interesting and surprising. But use only simple everyday English words and common English names. No difficult vocabulary.`,
        },
      ],
      temperature: 0.8,
    })

    const raw = response.choices[0].message.content.trim()
    // Strip accidental markdown fences
    const json = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    return JSON.parse(json)
  } catch (err) {
    console.error('[generateMystery] status:', err.status, '| message:', err.message)
    console.error('[generateMystery] full error:', JSON.stringify(err, null, 2))
    return { error: true, message: err.message, status: err.status }
  }
}

async function interrogateSuspect(suspect, conversationHistory, playerMessage, victim) {
  try {
    const guiltyContext = suspect.isGuilty
      ? `You are the murderer. Your motive: ${suspect.motive}. You are hiding this. Deflect suspicion but don't reveal guilt unless cornered with 3+ pieces of evidence.`
      : 'You are innocent but you have your own secrets. Be defensive if pressed too hard.'

    const systemPrompt = `You are ${suspect.name}, a ${suspect.age} year old ${suspect.occupation}.
Personality: ${suspect.personality}.
Your alibi: ${suspect.alibi}.
${guiltyContext}
The victim is: ${victim.name}.
Respond in 2-3 short sentences as this character. Stay in character always.
Use simple everyday English words only. Short sentences. Easy to understand.
If the player has found real evidence against you (isGuilty=true), become more nervous.
Never break character or mention being an AI.`

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: playerMessage },
    ]

    const response = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT,
      messages,
      temperature: 0.9,
    })

    const message = response.choices[0].message.content.trim()

    const mood = suspect.isGuilty && conversationHistory.length > 4 ? 'nervous' : 'calm'

    return { message, mood }
  } catch (err) {
    console.error('[interrogateSuspect] status:', err.status, '| message:', err.message)
    return { error: true, message: err.message, status: err.status }
  }
}

async function evaluateAccusation(mystery, accusedSuspectId, playerReasoning) {
  try {
    const guiltySuspect = mystery.suspects.find((s) => s.isGuilty)
    const guiltyId = guiltySuspect?.id

    const response = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT,
      messages: [
        {
          role: 'system',
          content: 'You are a mystery game judge. Always respond with valid JSON only. No markdown, no explanation.',
        },
        {
          role: 'user',
          content: `The player accused suspect ${accusedSuspectId}. Real culprit: ${guiltyId}.
Player reasoning: ${playerReasoning}.
Hidden truth: ${mystery.hiddenTruth}.

Return JSON:
{
  "correct": boolean,
  "score": number (0-100 based on reasoning quality),
  "ending": "string (2-3 sentences, dramatic reveal of the truth)",
  "hint": "string (if wrong, one hint without revealing culprit; empty string if correct)"
}`,
        },
      ],
      temperature: 0.7,
    })

    const raw = response.choices[0].message.content.trim()
    const json = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    return JSON.parse(json)
  } catch (err) {
    console.error('[evaluateAccusation] status:', err.status, '| message:', err.message)
    return { error: true, message: err.message, status: err.status }
  }
}

module.exports = { generateMystery, interrogateSuspect, evaluateAccusation }
