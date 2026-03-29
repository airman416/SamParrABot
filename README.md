# SamGPT (Sam's Brain) 🧠

> AI-native search and clip workflow over **My First Million** podcast transcripts.

![Sam Parr - From Hotdogs to $30M](/image.png)

## What this is

![Sam Parr asks](/ask.jpeg)

`SamGPT` is a full-stack AI product that lets users ask natural-language questions and retrieve timestamped, context-rich quotes from Sam Parr episodes.

It combines:
- **Intent-aware query planning** (classify query intent, then generate targeted search phrases)
- **Embedding-based semantic retrieval** (not keyword match)
- **Multi-angle ranking** (boost chunks matched by multiple generated phrases)
- **Creator workflow support** (caption generation + external viral-clip pipeline integration)

## Architecture Diagram

```mermaid
flowchart LR
    U[User in Browser]

    subgraph FE[Frontend]
      N["Next.js 16 App Router + React 19 + Tailwind CSS"]
      P1["POST /api/search"]
      P2["POST /api/caption"]
      C["/clipper page"]
    end

    subgraph AI[OpenAI API]
      O1[Chat Completions API<br/>gpt-4o-mini]
      O2[Embeddings API<br/>text-embedding-3-small 512d]
    end

    subgraph DB[Supabase]
      S1[PostgreSQL + pgvector]
      S2[RPC: match_transcripts]
      S3[episodes table]
    end

    subgraph CLIP[External Clipping Service]
      X1[Clipping API<br/>NEXT_PUBLIC_CLIPPING_API_URL]
      X2[Transcript + diarization pipeline<br/>AssemblyAI]
      X3[Clip rendering/download jobs]
    end

    U -->|search query| N
    N --> P1
    P1 -->|1) intent classify| O1
    P1 -->|2) phrase expansion| O1
    P1 -->|3) embed each phrase| O2
    P1 -->|4) vector RPC search| S2
    S2 --> S1
    P1 -->|5) hydrate episode titles| S3
    P1 -->|ranked quotes + timestamps + URLs| N
    N -->|results UI| U

    U -->|caption request| N
    N --> P2
    P2 -->|caption generation| O1
    P2 -->|caption + hashtags| N

    U -->|YouTube URL| C
    C -->|start/poll jobs| X1
    X1 --> X2
    X1 --> X3
    X1 -->|top viral clips + download links| C
```

## Data Flow (Search Pipeline)

1. **`POST /api/search` receives query** from the Next.js client.
2. **OpenAI `gpt-4o-mini` classifies intent** into one of: `CURATION`, `FACT_CHECK`, `CONTRARIAN`, `ADVICE`, `GENERAL`.
3. **OpenAI `gpt-4o-mini` expands query** into 3-15 specialized semantic phrases.
4. **OpenAI `text-embedding-3-small` embeds each phrase** (`512` dimensions).
5. **Supabase RPC `match_transcripts` (pgvector)** retrieves nearest transcript chunks per phrase.
6. **Server-side aggregation/ranking** boosts chunks that match from multiple phrase angles.
7. **Episode metadata join** (from `episodes` table) enriches results for UI display.
8. **UI returns timestamped quotes + YouTube links** for immediate playback/context.

## Tech Stack

- **Application framework**: Next.js `16` (App Router), React `19`, TypeScript
- **Styling/UI**: Tailwind CSS `v4`, Headless UI, Lucide icons
- **LLM + embeddings**: OpenAI `gpt-4o-mini` + `text-embedding-3-small`
- **Vector data layer**: Supabase (PostgreSQL + `pgvector`) via RPC search
- **Creator tools**: Caption API route + external clipping API integration (`/viral-clips`, `/clip`, `/recent-videos`)

## Why this stands out (recruiter lens)

- **Production-shaped AI architecture**: hybrid LLM planning + vector retrieval + deterministic ranking logic
- **Clear system boundaries**: frontend, API orchestration, model APIs, vector DB, async media pipeline
- **Practical product execution**: search UX, timestamp linking, caption generation, clip creation workflow
- **Strong extensibility surface**: prompt strategies per intent, pluggable retrieval params, external job APIs

## Example Queries

- *"Find where I found something really funny."*
- *"Any cool predictions I got right that I can talk about today?"*
- *"What's a guest idea that actually impressed me?"*
- *"Find some cool ideas I can repurpose for short form."*

## Local Setup

```bash
npm install
npm run dev
```

Create `.env.local`:

```bash
OPENAI_API_KEY=your_openai_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_or_service_key
NEXT_PUBLIC_CLIPPING_API_URL=http://localhost:8000
```

---

Built for the MFM community and creator tooling workflows.
