'use client'

import { useState, useCallback, useEffect, Suspense } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { Brain, ArrowLeft, Zap, Youtube, Search as SearchIcon, RefreshCw } from 'lucide-react'
import { SearchBar, LoadingState, ResultCard } from '@/components'
import type { SearchResult, SearchPhase } from '@/lib/types'
import { cn } from '@/lib/utils'

type ViewState = 'hero' | 'loading' | 'results'

function SearchInterface() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''

  const [query, setQuery] = useState(initialQuery)
  const [viewState, setViewState] = useState<ViewState>('hero')
  const [searchPhase, setSearchPhase] = useState<SearchPhase>({
    status: 'idle',
    phrases: []
  })
  const [results, setResults] = useState<SearchResult[]>([])

  // Actual search logic - just fetches data
  const performSearch = useCallback(async (searchQuery: string) => {
    setViewState('loading')
    setSearchPhase({ status: 'expanding', phrases: [] })
    setResults([])

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      })

      if (!response.ok) {
        throw new Error('Search failed')
      }

      const data = await response.json()

      const phrases = data.generated_phrases || []
      setSearchPhase({ status: 'searching', phrases, currentPhrase: phrases[0] })

      for (let i = 0; i < phrases.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 600))
        setSearchPhase(prev => ({ ...prev, currentPhrase: phrases[i + 1] }))
      }

      await new Promise(resolve => setTimeout(resolve, 400))
      setSearchPhase({ status: 'done', phrases })

      await new Promise(resolve => setTimeout(resolve, 500))
      setResults(data.results || [])
      setViewState('results')

    } catch (error) {
      console.error('Search error:', error)
      setSearchPhase({
        status: 'error',
        phrases: [],
        error: 'Search failed. Please try again.'
      })
    }
  }, [])

  // User trigger - updates URL only
  const onSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!query.trim()) return
    const newUrl = `/?q=${encodeURIComponent(query)}`
    router.push(newUrl)
  }

  // Sync state with URL changes
  useEffect(() => {
    if (initialQuery) {
      // Update input to match URL
      setQuery(initialQuery)
      // If we haven't searched this query yet, do it
      if (viewState === 'hero' || (viewState === 'results' && results.length === 0)) {
        performSearch(initialQuery)
      }
    } else {
      // URL is empty -> Reset to hero state
      // Only if we are not already in hero (prevents loop)
      if (viewState !== 'hero') {
        setViewState('hero')
        setQuery('')
        setResults([])
        setSearchPhase({ status: 'idle', phrases: [] })
      }
    }
  }, [initialQuery, performSearch]) // Intentionally omit viewState/results from dep array to avoid loops, logic handled inside

  const handleReset = () => {
    setQuery('')
    router.push('/')
  }

  // Refresh current search
  const onRefresh = () => {
    if (initialQuery) performSearch(initialQuery)
  }

  const handleSuggestionClick = (text: string) => {
    // If not already set, update query first (visual feedback)
    setQuery(text)
    // Then trigger navigation
    const newUrl = `/?q=${encodeURIComponent(text)}`
    router.push(newUrl)
  }

  return (
    <main className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Animated Background Gradient - MFM Gold */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-950/40 via-black to-yellow-950/30" />
        <div className="absolute top-[-10%] left-[10%] w-[500px] h-[500px] bg-amber-500/25 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[10%] right-[15%] w-[400px] h-[400px] bg-yellow-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[40%] right-[5%] w-[300px] h-[300px] bg-amber-600/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Hero View */}
        {viewState === 'hero' && (
          <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
            {/* Logo / Title */}
            <div className="text-center mb-12">
              <div className="relative w-24 h-24 mb-6 mx-auto rounded-full overflow-hidden border-2 border-amber-500/50 shadow-lg shadow-amber-500/25">
                <Image
                  src="/samparr.jpg"
                  alt="Sam Parr"
                  fill
                  className="object-cover"
                />
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-4">
                <span className="text-white">Sam</span>
                <span className="bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 bg-clip-text text-transparent">GPT</span>
              </h1>
              <p className="text-xl text-zinc-400 max-w-lg mx-auto">
                AI-powered search through every Sam Parr quote from{' '}
                <span className="text-amber-400 font-medium">My First Million</span> podcast
              </p>
            </div>

            {/* Search Bar */}
            <SearchBar
              value={query}
              onChange={setQuery}
              onSubmit={() => onSearchSubmit()}
              placeholder="Ask Sam: 'What was my worst investment?'"
            />

            {/* Suggested Queries */}
            <div className="flex flex-wrap justify-center gap-2 mt-8 max-w-3xl">
              {[
                "Find where I found something really funny.",
                "Find some cool ideas I can repurpose for short form.",
                "Any cool predictions I got right that I can talk about today?",
                "Any cool predictions I got wrong that I can talk about today?",
                "What's a guest idea that actually impressed me?"
              ].map((text) => (
                <button
                  key={text}
                  onClick={() => handleSuggestionClick(text)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900/50 border border-zinc-800 text-xs text-zinc-400 hover:text-amber-400 hover:border-amber-500/30 transition-all duration-200"
                >
                  {text}
                </button>
              ))}
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-3 mt-12">
              {[
                { icon: Zap, label: 'AI Query Expansion' },
                { icon: Youtube, label: 'Direct YouTube Links' },
                { icon: SearchIcon, label: 'Semantic Search' }
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/80 border border-zinc-800 text-sm text-zinc-500"
                >
                  <Icon className="w-4 h-4 text-amber-500" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading View */}
        {viewState === 'loading' && (
          <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
            <LoadingState
              status={searchPhase.status as 'expanding' | 'searching' | 'done'}
              phrases={searchPhase.phrases}
              currentPhrase={searchPhase.currentPhrase}
            />
          </div>
        )}

        {/* Results View */}
        {viewState === 'results' && (
          <div className="min-h-screen px-6 py-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleReset}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl",
                    "bg-zinc-900 border border-zinc-800",
                    "text-zinc-400 hover:text-amber-400 hover:border-amber-500/30",
                    "transition-all duration-200"
                  )}
                >
                  <ArrowLeft className="w-4 h-4" />
                  New Search
                </button>

                <button
                  onClick={onRefresh}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl",
                    "bg-amber-500/10 border border-amber-500/30",
                    "text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/50",
                    "transition-all duration-200"
                  )}
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Different Queries
                </button>
              </div>

              <div className="text-right">
                <p className="text-zinc-500 text-sm">
                  Found <span className="text-amber-400 font-medium">{results.length}</span> quotes
                </p>
              </div>
            </div>

            {/* Search Context */}
            <div className="mb-8 p-5 rounded-2xl bg-zinc-950 border border-zinc-800">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-zinc-400 text-sm mb-2">Searched for:</p>
                  <p className="text-white font-medium text-lg mb-3">&ldquo;{query}&rdquo;</p>
                  <div className="flex flex-wrap gap-2">
                    {searchPhase.phrases.map((phrase, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-sm border border-amber-500/20"
                      >
                        {phrase}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Results Grid */}
            {results.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2">
                {results.map((result, index) => (
                  <ResultCard key={result.id} result={result} index={index} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-zinc-500 text-lg">No results found. Try a different query.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Global Styles */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </main>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <SearchInterface />
    </Suspense>
  )
}
