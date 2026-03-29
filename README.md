# SamGPT (Sam's Brain) 🧠

> Ask one question. Instantly surface the best Sam Parr moments, with timestamped proof.

![Sam Parr - From Hotdogs to $30M](/image.png)
![Sam Parr asks](/ask.jpeg)

## Why This Exists

Podcast content is high-value and high-volume, but hard to search when you need answers fast.

`SamGPT` turns long-form conversations into an AI-powered discovery engine:
- Find the exact quote, not just the episode.
- Jump to the exact timestamp, not just a summary.
- Go from research to publishable clips in one workflow.

Example prompts:
- *"Find where I found something really funny."*
- *"Any cool predictions I got right that I can talk about today?"*
- *"What's a guest idea that actually impressed me?"*
- *"Find some cool ideas I can repurpose for short form."*

## How It Works

Under the hood, this is a modern retrieval architecture with clear layers and strong separation of concerns.

```mermaid
flowchart TD
    USER[End User - asks question]
    APP[Web App - captures query and renders results]
    ORCH[AI Orchestration - coordinates the retrieval flow]
    LLM[LLM Layer - intent classification and query expansion]
    VECTORDB[Vector Database - semantic similarity search]
    RANK[Ranking Layer - re-scores and prioritizes best hits]
    CLIP[Async Pipeline - long running clip generation tasks]

    USER --> APP
    APP --> ORCH
    ORCH --> LLM
    ORCH --> VECTORDB
    VECTORDB --> RANK
    RANK --> APP
    APP --> CLIP
    CLIP --> APP
```

### LLM + Semantic Retrieval Deep Dive

```mermaid
flowchart TD
    Q[User asks a question]
    I[LLM understands intent and goal]
    E[LLM rewrites into better search phrases]
    P[System builds 3 to 15 query phrases]
    M[Each phrase is converted to embeddings]
    V[Vector DB finds similar transcript chunks]
    A[Backend merges and deduplicates matches]
    R[Ranking boosts chunks matched multiple times]
    O[User gets top quotes with timestamps]

    Q --> I
    I --> E
    E --> P
    P --> M
    M --> V
    V --> A
    A --> R
    R --> O
```

### Async Clip + Download Pipeline (External Backend)

This pipeline is handled by an external backend service (configured via `NEXT_PUBLIC_CLIPPING_API_URL`), not by this repository.

```mermaid
flowchart TD
    U[User pastes a YouTube link]
    FE[Frontend starts a background clip job]
    API[External backend coordinates the pipeline]
    DL[Worker downloads source media]
    TR[Worker transcribes audio and labels speakers]
    AI[Model layer picks high potential viral moments]
    RENDER[Worker renders final clip segments]
    STORE[Rendered MP4 files are stored]
    READY[Backend marks job complete and returns clip list]
    FILE[Download endpoint streams selected clip file]

    U --> FE
    FE --> API
    API --> DL
    DL --> TR
    TR --> AI
    AI --> RENDER
    RENDER --> STORE
    STORE --> READY
    READY --> API
    API --> FE
    FE --> FILE
```

## Why It Matters

This project is built for people who care about speed, signal, and shipping:
- **Faster insight extraction**: ask naturally, get precise moments with context.
- **Higher content leverage**: turn long episodes into short-form opportunities quickly.
- **Production-ready AI stack**: orchestration layer, LLM layer, vector retrieval, deterministic ranking, async jobs.
- **Real user experience**: polished interface, clear loading states, direct links, and clip workflows.

### Technology Used

- **App framework**: Next.js `16`, React `19`, TypeScript
- **UI system**: Tailwind CSS `v4`, Headless UI, Lucide icons
- **LLM + embeddings**: OpenAI `gpt-4o-mini`, `text-embedding-3-small`
- **Data platform**: Supabase PostgreSQL + `pgvector`
- **Media pipeline integration**: external async clipping service (`/viral-clips`, `/clip`, `/recent-videos`)

## Get Started

Run it locally:

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

Then open the app, ask a real question, and explore the moments worth sharing.

---

Built for the MFM community and creator tooling workflows.
