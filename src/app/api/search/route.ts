import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

// Configuration
const EMBEDDING_MODEL = 'text-embedding-3-small'
const EMBEDDING_DIMENSIONS = 512
const LLM_MODEL = 'gpt-4o-mini'
const MAX_PHRASES = 15
const RESULTS_PER_PHRASE = 10
const MATCH_THRESHOLD = 0.3

// filter out podcast admin/meta talk
const IGNORED_PODCAST_META = [
    'end of the episode',
    'end of this episode',
    'end of the show',
    'thanks for listening',
    'subscribe to the channel',
    'like and subscribe',
    'see you next week',
    'tune in next time'
]

// --- AGENTIC PROMPTS ---

// 1. INTENT CLASSIFIER
const INTENT_CLASSIFICATION_PROMPT = `You are the "Brain" of the My First Million search engine.
Classify the user's search query into one of these 5 categories:

1. "CURATION": The user wants "cool", "viral", "interesting", or "best" content. Often mentions "short form", "clips", "repurpose".
   - Example: "cool ideas for short form", "best stories", "wildest moments"
2. "FACT_CHECK": The user asks "Did I say...", "Was I right...", "Predictions I made".
   - Example: "predictions I got wrong", "did I call the crypto crash"
3. "CONTRARIAN": The user wants moments where Sam DISAGREED with popular opinion, conventional wisdom, or common advice.
   - Example: "disagreed with conventional wisdom", "went against the grain", "unpopular opinion"
4. "ADVICE": The user wants specific "how-to" or tactical advice on a subject.
   - Example: "how to hire a CEO", "advice on burnout", "negotiation tactics"
5. "GENERAL": Standard keyword search.
   - Example: "Airbnb", "Sam's diet", "trends"

Return ONLY the category name (CURATION, FACT_CHECK, CONTRARIAN, ADVICE, or GENERAL).`

// 2. SPECIALIZED QUERY GENERATORS

const PROMPT_CURATION = `TARGET: CURATION / HIGH-SIGNAL DISCOVERY
The user is looking for "gems" - viral moments, mind-blowing ideas, or unique stories.

CRITICAL RULES:
1. IGNORE META-TERMS: Do NOT use words like "repurpose", "short form", "content", "clip", "video".
2. NO NUMBERING: Return raw phrases only.
3. FOCUS ON REACTION: Search for phrases Sam uses when he is EXCITED.

Generate 3-15 distinct search phrases that find:
- Strong Reactions: "this blew my mind", "holy cow", "I can't believe this"
- Value Signaling: "billion dollar idea", "best business ever", "illegal to know this"
- Story Hooks: "let me tell you a story", "weirdest thing happened"

Example Output for "cool ideas for short form":
this actually blew my mind
the weirdest way to make money
I have never told anyone this
this is a billion dollar insight
the smartest thing I ever did`

const PROMPT_FACT_CHECK = `TARGET: FACT CHECK / PREDICTIONS
The user is auditing Sam's past statements. Focus on accuracy, betting, and predictions.

CRITICAL RULES:
1. NO NUMBERING.
2. Search for the ACT of predicting, not just the topic.

Generate 3-15 distinct search phrases that find:
- Prediction Verbs: "predict", "bet", "guarantee", "believe"
- Accountability: "I was wrong", "I nailed this", "called it"
- Timeframes: "in 5 years", "by 2025", "next decade"

Example Output for "predictions I got wrong":
I was completely wrong about
my prediction failed
I regret saying that
I lost the bet when
it turned out I was mistaken`

const PROMPT_CONTRARIAN = `TARGET: CONTRARIAN / DISAGREEMENT WITH CONVENTIONAL WISDOM
The user wants moments where Sam disagreed with popular opinion or common advice.

CRITICAL RULES:
1. NO NUMBERING.
2. Use SHORT, NATURAL phrases Sam would actually say MID-SENTENCE.
3. Focus on DISAGREEMENT markers, not formal language.

Generate 3-15 distinct search phrases that find:
- Disagreement: "everyone's wrong about", "that's BS", "I disagree"
- Contrarian markers: "unpopular opinion", "hot take", "against the grain"
- Dismissal of norms: "the common advice is", "people always say but", "most experts think"

Example Output for "disagreed with conventional wisdom":
everyone thinks this but
the common advice is wrong
people always say you should
most experts are wrong about
that's complete BS
I disagree with the idea
unpopular opinion but
contrary to what people think`

const PROMPT_ADVICE = `TARGET: TACTICAL ADVICE
The user wants "How-To" knowledge. Focus on frameworks, rules, and lessons.

CRITICAL RULES:
1. NO NUMBERING.
2. Search for the LESSON, not the topic keyword alone.

Generate 3-15 distinct search phrases that find:
- Frameworks: "the rule is", "my data shows", "the system I use"
- Imperatives: "never do this", "always hire", "start by"
- Experience: "my biggest lesson", "what I learned from"

Example Output for "advice on burnout":
when you feel burned out
the cure for burnout is
my rule for relaxation
how I manage stress
stop working when`

const PROMPT_GENERAL = `TARGET: GENERAL TOPIC SEARCH
The user wants mentions of a specific entity or topic.

CRITICAL RULES:
1. NO NUMBERING.
2. Place the topic in context.

Generate 3-15 distinct search phrases to find this topic.
- Use synonyms and related concepts.
- Place the topic in context of a sentence.

Example Output for "Airbnb":
when Brian Chesky told me
the business model of Airbnb
staying in an Airbnb
vacation rental market
competition for hotels`

// --- 3. TYPES ---
interface SearchResult {
    id: number
    episode_id: string
    content: string
    start_timestamp: number
    url: string
    similarity: number
    matched_phrase?: string
}

export async function POST(request: NextRequest) {
    try {
        const { query } = await request.json()

        if (!query || typeof query !== 'string') {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 })
        }

        // Initialize clients
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!)

        // --- STEP 1: CLASSIFY INTENT ---
        const classificationResponse = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: INTENT_CLASSIFICATION_PROMPT },
                { role: 'user', content: query }
            ],
            temperature: 0,
            max_tokens: 10
        })

        const intent = classificationResponse.choices[0]?.message?.content?.trim().toUpperCase() || 'GENERAL'
        console.log(`Query: "${query}" classified as: ${intent}`)

        // --- STEP 2: SELECT STRATEGY ---
        let selectedSystemPrompt = PROMPT_GENERAL
        switch (intent) {
            case 'CURATION': selectedSystemPrompt = PROMPT_CURATION; break;
            case 'FACT_CHECK': selectedSystemPrompt = PROMPT_FACT_CHECK; break;
            case 'CONTRARIAN': selectedSystemPrompt = PROMPT_CONTRARIAN; break;
            case 'ADVICE': selectedSystemPrompt = PROMPT_ADVICE; break;
            case 'GENERAL': default: selectedSystemPrompt = PROMPT_GENERAL; break;
        }

        // --- STEP 3: GENERATE TARGETED QUERIES ---
        const expansionResponse = await openai.chat.completions.create({
            model: LLM_MODEL,
            messages: [
                { role: 'system', content: "You are an expert search query generator.\n" + selectedSystemPrompt },
                { role: 'user', content: `Generate 3-15 search phrases for: "${query}"` }
            ],
            temperature: 0.7, // Lower temp for more precision since prompt is specialized
            max_tokens: 200
        })

        const content = expansionResponse.choices[0]?.message?.content?.trim() || ''
        const phrases = content
            .split('\n')
            .map(line => line.replace(/^\d+[\.\)]\s*/, '').replace(/^-\s*/, '').trim())
            .filter(line => {
                const l = line.toLowerCase()
                return l.length > 0 &&
                    l.length < 150 &&
                    !l.includes('repurpose') &&
                    !l.includes('short form') &&
                    !l.includes('clip')
            })
            .slice(0, MAX_PHRASES)

        if (phrases.length === 0) {
            return NextResponse.json(
                { error: 'Failed to generate search phrases' },
                { status: 500 }
            )
        }

        // Step 2: Search for each phrase in parallel
        const searchPromises = phrases.map(async (phrase) => {
            // Generate embedding
            const embeddingResponse = await openai.embeddings.create({
                model: EMBEDDING_MODEL,
                input: phrase,
                dimensions: EMBEDDING_DIMENSIONS
            })
            const embedding = embeddingResponse.data[0].embedding

            // Search Supabase
            const { data, error } = await supabase.rpc('match_transcripts', {
                query_embedding: embedding,
                match_threshold: MATCH_THRESHOLD,
                match_count: RESULTS_PER_PHRASE
            })

            if (error) {
                console.error('Supabase search error:', error)
                return []
            }

            // Add matched phrase to results
            return (data || []).map((result: SearchResult) => ({
                ...result,
                matched_phrase: phrase
            }))
        })

        const searchResults = await Promise.all(searchPromises)

        // Step 3: Aggregate and Rank Results
        const resultsMap = new Map<number, {
            chunk: SearchResult,
            count: number,
            maxSimilarity: number,
            avgSimilarity: number,
            totalSimilarity: number,
            phrases: string[]
        }>()

        for (const results of searchResults) {
            for (const result of results) {
                // Filter out podcast meta-talk (outros, housekeeping) that often matches "end of..."
                const lowerContent = result.content.toLowerCase()
                if (IGNORED_PODCAST_META.some(phrase => lowerContent.includes(phrase))) {
                    continue
                }

                const existing = resultsMap.get(result.id)

                if (existing) {
                    existing.count += 1
                    existing.totalSimilarity += result.similarity
                    existing.avgSimilarity = existing.totalSimilarity / existing.count
                    existing.phrases.push(result.matched_phrase!)

                    if (result.similarity > existing.maxSimilarity) {
                        existing.maxSimilarity = result.similarity
                        existing.chunk = result // Keep the version with best match metadata
                    }
                } else {
                    resultsMap.set(result.id, {
                        chunk: result,
                        count: 1,
                        maxSimilarity: result.similarity,
                        avgSimilarity: result.similarity,
                        totalSimilarity: result.similarity,
                        phrases: [result.matched_phrase!]
                    })
                }
            }
        }

        // Convert to array and calculate final score
        const allResults = Array.from(resultsMap.values()).map(item => {
            // Scoring Algorithm:
            // Base: Max Similarity (best single match)
            // Boost: 5% bonus for each additional phrase match (capped at 50%)
            // This favors results that match MULTIPLE generated angles

            const frequencyBoost = Math.min((item.count - 1) * 0.05, 0.5)
            const finalScore = item.maxSimilarity * (1 + frequencyBoost)

            return {
                ...item.chunk,
                similarity: finalScore, // Override match score with boosted score
                match_count: item.count, // matched_phrases count for debugging/display
                matched_phrase: item.phrases[0] // Primary phrase
            }
        })

        // Sort by BOOSTED score descending
        allResults.sort((a, b) => b.similarity - a.similarity)

        // Get episode titles
        const episodeIds = [...new Set(allResults.map(r => r.episode_id))]
        const { data: episodes } = await supabase
            .from('episodes')
            .select('id, title')
            .in('id', episodeIds)

        const episodeTitles = new Map(
            (episodes || []).map((ep: { id: string; title: string }) => [ep.id, ep.title])
        )

        // Add titles to results
        const resultsWithTitles = allResults.map(result => ({
            ...result,
            episode_title: episodeTitles.get(result.episode_id) || 'Unknown Episode'
        }))

        return NextResponse.json({
            generated_phrases: phrases,
            results: resultsWithTitles.slice(0, 15), // Limit to 15 results
            total_found: allResults.length
        })

    } catch (error) {
        console.error('Search API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
