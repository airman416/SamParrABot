export interface SearchResult {
    id: number
    episode_id: string
    content: string
    start_timestamp: number
    url: string
    similarity: number
    matched_phrase?: string
    episode_title?: string
}

export interface SearchResponse {
    generated_phrases: string[]
    results: SearchResult[]
    total_found: number
}

export interface SearchPhase {
    status: 'idle' | 'expanding' | 'searching' | 'done' | 'error'
    phrases: string[]
    currentPhrase?: string
    error?: string
}
