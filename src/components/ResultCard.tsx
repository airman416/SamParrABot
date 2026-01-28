'use client'

import { useState } from 'react'
import { Clock, ExternalLink, Play, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import { cn, formatTimestamp, getMatchLevel } from '@/lib/utils'
import type { SearchResult } from '@/lib/types'

interface ResultCardProps {
    result: SearchResult
    index: number
}

export function ResultCard({ result, index }: ResultCardProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const matchLevel = getMatchLevel(result.similarity)

    // Extract YouTube video ID for embed
    const videoId = result.episode_id
    const timestamp = Math.floor(result.start_timestamp)
    const embedUrl = `https://www.youtube.com/embed/${videoId}?start=${timestamp}&rel=0`
    const watchUrl = result.url || `https://www.youtube.com/watch?v=${videoId}&t=${timestamp}s`

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
                animationDelay: `${index * 100}ms`,
                animation: 'fadeInUp 0.5s ease-out forwards'
            }}
        >
            {/* Header */}
            <div className="p-5 pb-4">
                <div className="flex items-start justify-between gap-4 mb-4">
                    {/* Left: Title and Metadata */}
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white text-lg mb-2 line-clamp-2 group-hover:text-amber-300 transition-colors">
                            {result.episode_title || 'Episode'}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500">
                            <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                {formatTimestamp(result.start_timestamp)}
                            </span>
                            {result.matched_phrase && (
                                <span className="flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                    Matched: &ldquo;{result.matched_phrase}&rdquo;
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Right: Match Score */}
                    <div className={cn(
                        "flex-shrink-0 px-3 py-2 rounded-xl",
                        matchLevel.bgColor
                    )}>
                        <div className="text-center">
                            <div className={cn("text-lg font-bold", matchLevel.color)}>
                                {Math.round(result.similarity * 100)}%
                            </div>
                            <div className={cn("text-xs", matchLevel.color, "opacity-80")}>
                                {matchLevel.label.split(' ')[0]}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quote */}
                <div className={cn(
                    "relative p-4 rounded-xl",
                    "bg-black border border-amber-500/20"
                )}>
                    <div className="absolute -top-2 left-4 px-2 bg-zinc-950 text-amber-500 text-xs font-bold tracking-wider">
                        SAM PARR SAYS
                    </div>
                    <p className={cn(
                        "text-zinc-300 leading-relaxed",
                        !isExpanded && "line-clamp-4"
                    )}>
                        &ldquo;{result.content}&rdquo;
                    </p>

                    {result.content.length > 300 && (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="flex items-center gap-1 mt-3 text-sm text-amber-400 hover:text-amber-300 transition-colors"
                        >
                            {isExpanded ? (
                                <>Show less <ChevronUp className="w-4 h-4" /></>
                            ) : (
                                <>Read more <ChevronDown className="w-4 h-4" /></>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* YouTube Embed Preview */}
            <div className="relative aspect-video bg-black">
                <iframe
                    src={embedUrl}
                    title={result.episode_title || 'Video'}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                />
            </div>

            {/* Footer: Watch on YouTube */}
            <div className="p-4 border-t border-zinc-800/50">
                <a
                    href={watchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                        "flex items-center justify-center gap-2",
                        "w-full py-3 rounded-xl",
                        "bg-red-600/10 text-red-400",
                        "hover:bg-red-600/20 hover:text-red-300",
                        "transition-all duration-200",
                        "font-medium"
                    )}
                >
                    <Play className="w-4 h-4" />
                    Watch on YouTube
                    <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                </a>
            </div>
        </div>
    )
}
