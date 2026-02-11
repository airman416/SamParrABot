'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
    ArrowLeft,
    Scissors,
    Youtube,
    Loader2,
    Download,
    Users,
    Sparkles,
    AlertCircle,
} from 'lucide-react'
import { ClipCard } from '@/components'
import type { ViralClip } from '@/components/ClipCard'
import { cn } from '@/lib/utils'

type JobStatus = 'idle' | 'queued' | 'downloading' | 'transcribing' | 'analyzing' | 'complete' | 'error'

const STATUS_MESSAGES: Record<string, { label: string; detail: string }> = {
    queued: {
        label: 'Starting up...',
        detail: 'Preparing your clip analysis',
    },
    downloading: {
        label: 'Downloading audio',
        detail: 'Fetching audio from YouTube...',
    },
    transcribing: {
        label: 'Transcribing & diarizing',
        detail: 'AssemblyAI is identifying speakers and transcribing every word. This may take a few minutes for longer videos.',
    },
    analyzing: {
        label: 'Finding viral moments',
        detail: 'AI is analyzing the conversation to find the 3 most shareable clips...',
    },
}

export default function ClipperPage() {
    const [youtubeUrl, setYoutubeUrl] = useState('')
    const [jobId, setJobId] = useState<string | null>(null)
    const [videoId, setVideoId] = useState<string | null>(null)
    const [status, setStatus] = useState<JobStatus>('idle')
    const [clips, setClips] = useState<ViralClip[]>([])
    const [error, setError] = useState<string | null>(null)
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const API_URL = process.env.NEXT_PUBLIC_CLIPPING_API_URL || 'http://localhost:8000'

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (pollRef.current) clearInterval(pollRef.current)
        }
    }, [])

    const startPolling = useCallback(
        (id: string) => {
            if (pollRef.current) clearInterval(pollRef.current)

            pollRef.current = setInterval(async () => {
                try {
                    const res = await fetch(`${API_URL}/viral-clips/${id}`)
                    if (!res.ok) throw new Error('Polling failed')

                    const data = await res.json()
                    setStatus(data.status)
                    setVideoId(data.video_id)

                    if (data.status === 'complete') {
                        setClips(data.clips)
                        if (pollRef.current) clearInterval(pollRef.current)
                    } else if (data.status === 'error') {
                        setError(data.error || 'An unexpected error occurred')
                        if (pollRef.current) clearInterval(pollRef.current)
                    }
                } catch {
                    // Keep polling on transient network errors
                }
            }, 3000)
        },
        [API_URL]
    )

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!youtubeUrl.trim()) return

        // Reset state
        setError(null)
        setClips([])
        setStatus('queued')

        try {
            const res = await fetch(`${API_URL}/viral-clips`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ youtube_url: youtubeUrl.trim() }),
            })

            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data.detail || 'Failed to start analysis')
            }

            const data = await res.json()
            setJobId(data.job_id)
            setVideoId(data.video_id)
            startPolling(data.job_id)
        } catch (err: unknown) {
            setStatus('error')
            setError(err instanceof Error ? err.message : 'Failed to start analysis')
        }
    }

    const handleReset = () => {
        if (pollRef.current) clearInterval(pollRef.current)
        setYoutubeUrl('')
        setJobId(null)
        setVideoId(null)
        setStatus('idle')
        setClips([])
        setError(null)
    }

    const isProcessing = ['queued', 'downloading', 'transcribing', 'analyzing'].includes(status)
    const statusInfo = STATUS_MESSAGES[status]

    return (
        <main className="min-h-screen bg-black text-white overflow-x-hidden">
            {/* Animated Background Gradient */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-950/40 via-black to-yellow-950/30" />
                <div className="absolute top-[-10%] left-[10%] w-[500px] h-[500px] bg-amber-500/25 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-[10%] right-[15%] w-[400px] h-[400px] bg-yellow-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-[40%] right-[5%] w-[300px] h-[300px] bg-amber-600/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-5xl mx-auto px-6 py-8">
                {/* Nav */}
                <Link
                    href="/"
                    className={cn(
                        "inline-flex items-center gap-2 px-4 py-2 rounded-xl mb-8",
                        "bg-zinc-900 border border-zinc-800",
                        "text-zinc-400 hover:text-amber-400 hover:border-amber-500/30",
                        "transition-all duration-200"
                    )}
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to SamGPT
                </Link>

                {/* Hero */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30 mb-6">
                        <Scissors className="w-8 h-8 text-amber-400" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        <span className="text-white">Viral Clip </span>
                        <span className="bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 bg-clip-text text-transparent">Generator</span>
                    </h1>
                    <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
                        Paste any YouTube podcast link. We&apos;ll transcribe it, identify speakers, and use AI to find the <span className="text-amber-400 font-medium">3 most viral-worthy moments</span> -- all under 2 minutes.
                    </p>
                </div>

                {/* How it works pills */}
                {status === 'idle' && (
                    <div className="flex flex-wrap justify-center gap-3 mb-10">
                        {[
                            { icon: Youtube, label: 'Paste YouTube link' },
                            { icon: Users, label: 'Speaker diarization' },
                            { icon: Sparkles, label: 'AI viral detection' },
                            { icon: Download, label: 'Download 9:16 clips' },
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
                )}

                {/* Input Form */}
                {(status === 'idle' || status === 'error') && (
                    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mb-12">
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/50 via-yellow-500/50 to-amber-500/50 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="relative flex items-center bg-zinc-900 border border-zinc-700 rounded-2xl overflow-hidden focus-within:border-amber-500/50 transition-colors">
                                <Youtube className="w-5 h-5 text-zinc-500 ml-5 flex-shrink-0" />
                                <input
                                    type="text"
                                    value={youtubeUrl}
                                    onChange={(e) => setYoutubeUrl(e.target.value)}
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    className="flex-1 bg-transparent px-4 py-4 text-white placeholder-zinc-600 outline-none text-lg"
                                />
                                <button
                                    type="submit"
                                    disabled={!youtubeUrl.trim()}
                                    className={cn(
                                        "mr-2 px-6 py-2.5 rounded-xl font-medium text-sm",
                                        "bg-gradient-to-r from-amber-500 to-yellow-500",
                                        "text-black",
                                        "hover:from-amber-400 hover:to-yellow-400",
                                        "transition-all duration-200",
                                        "disabled:opacity-40 disabled:cursor-not-allowed"
                                    )}
                                >
                                    <span className="flex items-center gap-2">
                                        <Scissors className="w-4 h-4" />
                                        Find Clips
                                    </span>
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        )}
                    </form>
                )}

                {/* Processing State */}
                {isProcessing && statusInfo && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="relative mb-8">
                            <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                                <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
                            </div>
                            <div className="absolute -inset-4 bg-amber-500/5 rounded-full animate-ping" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">{statusInfo.label}</h2>
                        <p className="text-zinc-400 text-center max-w-md">{statusInfo.detail}</p>

                        {/* Progress Steps */}
                        <div className="mt-10 space-y-3 w-full max-w-sm">
                            {(['downloading', 'transcribing', 'analyzing'] as const).map((step) => {
                                const stepOrder = { downloading: 1, transcribing: 2, analyzing: 3 }
                                const currentOrder = stepOrder[status as keyof typeof stepOrder] || 0
                                const thisOrder = stepOrder[step]
                                const isDone = currentOrder > thisOrder
                                const isCurrent = status === step

                                return (
                                    <div
                                        key={step}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300",
                                            isDone && "bg-amber-500/10 border-amber-500/30",
                                            isCurrent && "bg-amber-500/5 border-amber-500/20 animate-pulse",
                                            !isDone && !isCurrent && "bg-zinc-900/50 border-zinc-800 opacity-40"
                                        )}
                                    >
                                        {isDone ? (
                                            <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                                                <svg className="w-3.5 h-3.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        ) : isCurrent ? (
                                            <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
                                        ) : (
                                            <div className="w-6 h-6 rounded-full border border-zinc-700" />
                                        )}
                                        <span className={cn(
                                            "text-sm font-medium",
                                            isDone && "text-amber-400",
                                            isCurrent && "text-white",
                                            !isDone && !isCurrent && "text-zinc-600"
                                        )}>
                                            {STATUS_MESSAGES[step]?.label}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>

                        <button
                            onClick={handleReset}
                            className="mt-8 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                )}

                {/* Results */}
                {status === 'complete' && clips.length > 0 && videoId && (
                    <div>
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-1">Your Viral Clips</h2>
                                <p className="text-zinc-400 text-sm">
                                    Found <span className="text-amber-400 font-medium">{clips.length}</span> potential viral moments
                                </p>
                            </div>
                            <button
                                onClick={handleReset}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-xl",
                                    "bg-zinc-900 border border-zinc-800",
                                    "text-zinc-400 hover:text-amber-400 hover:border-amber-500/30",
                                    "transition-all duration-200"
                                )}
                            >
                                <Scissors className="w-4 h-4" />
                                New Video
                            </button>
                        </div>

                        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1">
                            {clips.map((clip, index) => (
                                <ClipCard
                                    key={index}
                                    clip={clip}
                                    videoId={videoId}
                                    index={index}
                                />
                            ))}
                        </div>
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
