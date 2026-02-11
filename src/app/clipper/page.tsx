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
    Monitor,
    Smartphone,
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

interface RecentVideo {
    video_id: string
    title: string
    published: string
    thumbnail: string
    url: string
    duration_minutes?: number
}

const TEST_VIDEO_ID = 'dQw4w9WgXcQ'
const TEST_START = 30
const TEST_DURATION = 20

function TestDownloadButtons() {
    const [downloadingAR, setDownloadingAR] = useState<'16:9' | '9:16' | null>(null)
    const API_URL = process.env.NEXT_PUBLIC_CLIPPING_API_URL || 'http://localhost:8000'

    const handleTestDownload = async (aspectRatio: '16:9' | '9:16') => {
        setDownloadingAR(aspectRatio)
        try {
            const response = await fetch(`${API_URL}/clip`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    video_id: TEST_VIDEO_ID,
                    start_time: TEST_START,
                    duration: TEST_DURATION,
                    aspect_ratio: aspectRatio,
                }),
            })
            if (!response.ok) throw new Error('Download failed')

            const arLabel = aspectRatio === '9:16' ? 'portrait' : 'landscape'
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `test_clip_${arLabel}.mp4`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (error) {
            console.error('Test download error:', error)
            alert('Test download failed. Is the backend running?')
        } finally {
            setDownloadingAR(null)
        }
    }

    return (
        <div className="flex gap-3">
            <button
                onClick={() => handleTestDownload('16:9')}
                disabled={downloadingAR !== null}
                className={cn(
                    "flex-1 flex items-center justify-center gap-2",
                    "py-2.5 rounded-xl text-sm font-medium",
                    "bg-zinc-800 border border-zinc-700",
                    "text-zinc-300 hover:text-amber-400 hover:border-amber-500/30",
                    "transition-all duration-200",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
            >
                {downloadingAR === '16:9' ? (
                    <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Downloading...
                    </>
                ) : (
                    <>
                        <Monitor className="w-4 h-4" />
                        16:9 Landscape
                    </>
                )}
            </button>
            <button
                onClick={() => handleTestDownload('9:16')}
                disabled={downloadingAR !== null}
                className={cn(
                    "flex-1 flex items-center justify-center gap-2",
                    "py-2.5 rounded-xl text-sm font-medium",
                    "bg-zinc-800 border border-zinc-700",
                    "text-zinc-300 hover:text-amber-400 hover:border-amber-500/30",
                    "transition-all duration-200",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
            >
                {downloadingAR === '9:16' ? (
                    <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Downloading...
                    </>
                ) : (
                    <>
                        <Smartphone className="w-4 h-4" />
                        9:16 Portrait
                    </>
                )}
            </button>
        </div>
    )
}

export default function ClipperPage() {
    const [youtubeUrl, setYoutubeUrl] = useState('')
    const [jobId, setJobId] = useState<string | null>(null)
    const [videoId, setVideoId] = useState<string | null>(null)
    const [status, setStatus] = useState<JobStatus>('idle')
    const [clips, setClips] = useState<ViralClip[]>([])
    const [error, setError] = useState<string | null>(null)
    const [recentVideos, setRecentVideos] = useState<RecentVideo[]>([])
    const [loadingRecent, setLoadingRecent] = useState(true)
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const API_URL = process.env.NEXT_PUBLIC_CLIPPING_API_URL || 'http://localhost:8000'

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (pollRef.current) clearInterval(pollRef.current)
        }
    }, [])

    // Fetch recent MFM videos on mount
    useEffect(() => {
        async function fetchRecent() {
            try {
                const res = await fetch(`${API_URL}/recent-videos?limit=8`)
                if (res.ok) {
                    const data = await res.json()
                    setRecentVideos(data.videos || [])
                }
            } catch {
                // Silently fail - this is a nice-to-have
            } finally {
                setLoadingRecent(false)
            }
        }
        fetchRecent()
    }, [API_URL])

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

    const startAnalysis = useCallback(async (url: string) => {
        // Reset state
        setError(null)
        setClips([])
        setStatus('queued')
        setYoutubeUrl(url)

        try {
            const res = await fetch(`${API_URL}/viral-clips`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ youtube_url: url }),
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
    }, [API_URL, startPolling])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!youtubeUrl.trim()) return
        startAnalysis(youtubeUrl.trim())
    }

    const handleRecentVideoClick = (video: RecentVideo) => {
        startAnalysis(video.url)
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

                {/* Test Download Widget - dev only */}
                {process.env.NODE_ENV === 'development' && (status === 'idle' || status === 'error') && (
                    <div className="max-w-2xl mx-auto mb-12">
                        <div className="rounded-2xl overflow-hidden bg-zinc-950 border border-dashed border-zinc-700">
                            <div className="p-4 border-b border-zinc-800 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Test Download</span>
                            </div>
                            <div className="relative aspect-video bg-black">
                                <iframe
                                    src="https://www.youtube.com/embed/dQw4w9WgXcQ?start=30&rel=0"
                                    title="Test Video"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="absolute inset-0 w-full h-full"
                                />
                            </div>
                            <div className="p-4">
                                <p className="text-zinc-500 text-xs mb-3">Test the 16:9 vs 9:16 crop on a sample clip (30s from start, 20s duration)</p>
                                <TestDownloadButtons />
                            </div>
                        </div>
                    </div>
                )}

                {/* Recent MFM Episodes */}
                {(status === 'idle' || status === 'error') && recentVideos.length > 0 && (
                    <div className="max-w-4xl mx-auto mb-12">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                                <Youtube className="w-4 h-4 text-red-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">Recent My First Million Episodes</h2>
                                <p className="text-zinc-500 text-sm">Click any episode to instantly find viral clips</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {recentVideos.map((video) => (
                                <button
                                    key={video.video_id}
                                    onClick={() => handleRecentVideoClick(video)}
                                    className={cn(
                                        "group relative rounded-xl overflow-hidden text-left",
                                        "bg-zinc-900 border border-zinc-800",
                                        "hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/5",
                                        "transition-all duration-300"
                                    )}
                                >
                                    {/* Thumbnail */}
                                    <div className="relative aspect-video bg-zinc-800 overflow-hidden">
                                        <img
                                            src={video.thumbnail}
                                            alt={video.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                        {/* Duration badge */}
                                        {video.duration_minutes && (
                                            <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[10px] text-white font-medium">
                                                {video.duration_minutes} min
                                            </div>
                                        )}
                                        {/* Play overlay */}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                                            <div className="w-10 h-10 rounded-full bg-amber-500/90 flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300">
                                                <Scissors className="w-5 h-5 text-black" />
                                            </div>
                                        </div>
                                    </div>
                                    {/* Title */}
                                    <div className="p-3">
                                        <p className="text-xs text-zinc-300 font-medium line-clamp-2 group-hover:text-amber-300 transition-colors leading-snug">
                                            {video.title}
                                        </p>
                                        {video.published && (
                                            <p className="text-[10px] text-zinc-600 mt-1.5">
                                                {new Date(video.published).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                })}
                                            </p>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recent videos loading skeleton */}
                {(status === 'idle') && loadingRecent && (
                    <div className="max-w-4xl mx-auto mb-12">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-zinc-800 animate-pulse" />
                            <div className="h-5 w-48 bg-zinc-800 rounded animate-pulse" />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800">
                                    <div className="aspect-video bg-zinc-800 animate-pulse" />
                                    <div className="p-3 space-y-2">
                                        <div className="h-3 bg-zinc-800 rounded animate-pulse" />
                                        <div className="h-3 bg-zinc-800 rounded animate-pulse w-2/3" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
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
