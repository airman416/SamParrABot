'use client'

import { useState } from 'react'
import { Download, Clock, Users, Sparkles, Monitor, Smartphone } from 'lucide-react'
import { cn, formatTimestamp } from '@/lib/utils'

export interface ViralClip {
    title: string
    description: string
    start_time: number
    end_time: number
    speakers: string[]
}

interface ClipCardProps {
    clip: ViralClip
    videoId: string
    index: number
}

type AspectRatio = '16:9' | '9:16'

export function ClipCard({ clip, videoId, index }: ClipCardProps) {
    const [downloadingAR, setDownloadingAR] = useState<AspectRatio | null>(null)

    const startSeconds = Math.floor(clip.start_time)
    const duration = Math.round(clip.end_time - clip.start_time)
    const embedUrl = `https://www.youtube.com/embed/${videoId}?start=${startSeconds}&rel=0`

    const handleDownload = async (aspectRatio: AspectRatio) => {
        setDownloadingAR(aspectRatio)
        try {
            const API_URL = process.env.NEXT_PUBLIC_CLIPPING_API_URL || 'http://localhost:8000'
            const response = await fetch(`${API_URL}/clip`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    video_id: videoId,
                    start_time: clip.start_time,
                    duration: duration,
                    aspect_ratio: aspectRatio,
                }),
            })

            if (!response.ok) throw new Error('Download failed')

            const arLabel = aspectRatio === '9:16' ? 'portrait' : 'landscape'
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `viral_clip_${videoId}_${index + 1}_${arLabel}.mp4`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (error) {
            console.error('Download error:', error)
            alert('Failed to download clip. Please try again.')
        } finally {
            setDownloadingAR(null)
        }
    }

    return (
        <div
            className={cn(
                "group relative",
                "rounded-2xl overflow-hidden",
                "bg-zinc-950 backdrop-blur-sm",
                "border border-zinc-800/50",
                "hover:border-amber-500/30",
                "transition-all duration-300",
                "hover:shadow-lg hover:shadow-amber-500/5"
            )}
            style={{
                animationDelay: `${index * 150}ms`,
                animation: 'fadeInUp 0.5s ease-out forwards',
                opacity: 0,
            }}
        >
            {/* Clip Number Badge */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-black font-bold text-sm shadow-lg shadow-amber-500/30">
                    {index + 1}
                </div>
            </div>

            {/* Header */}
            <div className="p-5 pb-4 pt-14">
                <h3 className="font-semibold text-white text-lg mb-2 group-hover:text-amber-300 transition-colors">
                    {clip.title}
                </h3>
                <p className="text-zinc-400 text-sm mb-4 leading-relaxed">
                    {clip.description}
                </p>

                {/* Metadata pills */}
                <div className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs border border-amber-500/20">
                        <Clock className="w-3 h-3" />
                        {formatTimestamp(clip.start_time)} - {formatTimestamp(clip.end_time)}
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs border border-amber-500/20">
                        <Sparkles className="w-3 h-3" />
                        {duration}s
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800 text-zinc-400 text-xs border border-zinc-700">
                        <Users className="w-3 h-3" />
                        {clip.speakers.map(s => `Speaker ${s}`).join(', ')}
                    </span>
                </div>
            </div>

            {/* YouTube Embed */}
            <div className="relative aspect-video bg-black">
                <iframe
                    src={embedUrl}
                    title={clip.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                />
            </div>

            {/* Download Buttons */}
            <div className="p-4 border-t border-zinc-800/50">
                <div className="flex gap-3">
                    {/* 16:9 Landscape */}
                    <button
                        onClick={() => handleDownload('16:9')}
                        disabled={downloadingAR !== null}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2",
                            "py-3 rounded-xl",
                            "bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20",
                            "border border-amber-500/30",
                            "text-amber-400 font-medium text-sm",
                            "hover:from-amber-500/30 hover:via-yellow-500/30 hover:to-amber-500/30",
                            "hover:border-amber-500/50 hover:text-amber-300",
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
                                Download 16:9
                            </>
                        )}
                    </button>

                    {/* 9:16 Portrait */}
                    <button
                        onClick={() => handleDownload('9:16')}
                        disabled={downloadingAR !== null}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2",
                            "py-3 rounded-xl",
                            "bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20",
                            "border border-amber-500/30",
                            "text-amber-400 font-medium text-sm",
                            "hover:from-amber-500/30 hover:via-yellow-500/30 hover:to-amber-500/30",
                            "hover:border-amber-500/50 hover:text-amber-300",
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
                                Download 9:16
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
