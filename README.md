# Sam's Brain 🧠

> AI-powered semantic search through every Sam Parr quote from the **My First Million** podcast.

![Sam Parr - From Hotdogs to $30M](/image.png)

## What is this?

**Sam's Brain** is an intelligent search engine that lets you search through Sam Parr's quotes and statements from the My First Million podcast using natural language. Instead of keyword matching, it uses:

- **🤖 Agentic Query Expansion** - Your question is analyzed and expanded into multiple semantic search phrases
- **🔍 Vector Semantic Search** - Finds contextually relevant quotes, not just keyword matches
- **🎯 Intent Classification** - Understands if you're looking for predictions, advice, funny moments, or cool ideas
- **📺 Direct YouTube Links** - Jump straight to the exact timestamp in the episode

## Example Queries

- *"Find where I found something really funny."*
- *"Any cool predictions I got right that I can talk about today?"*
- *"What's a guest idea that actually impressed me?"*
- *"Find some cool ideas I can repurpose for short form."*

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **AI**: OpenAI GPT-4o-mini (intent classification + query expansion), text-embedding-3-small
- **Database**: Supabase (PostgreSQL + pgvector)
- **Scraping**: Python + YouTube Transcript API

## Getting Started

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Set up your `.env.local`:
```
OPENAI_API_KEY=your_key
SUPABASE_URL=your_url
SUPABASE_KEY=your_key
```

## How It Works

1. **Intent Classification**: Your query is classified into one of 5 categories (Curation, Fact-Check, Contrarian, Advice, General)
2. **Query Expansion**: Based on intent, specialized prompts generate 3-15 semantic search phrases
3. **Vector Search**: Each phrase is embedded and searched against the transcript database
4. **Ranking**: Results are aggregated and ranked by a composite score favoring multi-phrase matches
5. **Display**: Top quotes are shown with episode context and direct YouTube links

---

Built with ❤️ for the MFM community.
