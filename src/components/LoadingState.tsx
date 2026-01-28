'use client'

import { Brain, Search, Sparkles, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingStateProps {
    status: 'expanding' | 'searching' | 'done'
    phrases: string[]
    currentPhrase?: string
}

export function LoadingState({ status, phrases, currentPhrase }: LoadingStateProps) {
    return (
        <div className="w-full max-w-2xl mx-auto">
            {/* Brain Animation */}
            <div className="flex justify-center mb-8">
                <div className={cn(
                    "relative w-24 h-24 rounded-full",
                    "bg-gradient-to-br from-amber-500/20 to-yellow-600/20",
                    "flex items-center justify-center",
                    status !== 'done' && "animate-pulse"
                )}>
                    <div className={cn(
                        "absolute inset-2 rounded-full",
                        "bg-gradient-to-br from-amber-500/30 to-yellow-600/30",
                        status !== 'done' && "animate-ping"
                    )} style={{ animationDuration: '2s' }} />
                    <Brain className={cn(
                        "w-10 h-10 text-amber-400 relative z-10",
                        status !== 'done' && "animate-bounce"
                    )} style={{ animationDuration: '1.5s' }} />
                </div>
            </div>

            {/* Status Text */}
            <div className="text-center mb-8">
                <h3 className="text-xl font-medium text-white mb-2">
                    {status === 'expanding' && "Understanding your question..."}
                    {status === 'searching' && "Searching Sam's archive..."}
                    {status === 'done' && "Search complete!"}
                </h3>
                <p className="text-zinc-500 text-sm">
                    {status === 'expanding' && "Generating focused search queries"}
                    {status === 'searching' && "Finding the most relevant quotes"}
                    {status === 'done' && "Found your results"}
                </p>
            </div>

            {/* Phrase Steps */}
            <div className="space-y-3">
                {phrases.map((phrase, index) => {
                    const isActive = phrase === currentPhrase
                    const isComplete = status === 'done' ||
                        (status === 'searching' && phrases.indexOf(currentPhrase || '') > index)

                    return (
                        <div
                            key={index}
                            className={cn(
                                "relative flex items-center gap-4 p-4 rounded-xl",
                                "transition-all duration-500",
                                isComplete && "bg-amber-500/10 border border-amber-500/30",
                                isActive && !isComplete && "bg-yellow-500/10 border border-yellow-500/30",
                                !isActive && !isComplete && "bg-zinc-900/50 border border-zinc-800"
                            )}
                        >
                            {/* Icon */}
                            <div className={cn(
                                "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                                isComplete && "bg-amber-500/20",
                                isActive && !isComplete && "bg-yellow-500/20",
                                !isActive && !isComplete && "bg-zinc-800"
                            )}>
                                {isComplete ? (
                                    <CheckCircle2 className="w-5 h-5 text-amber-400" />
                                ) : isActive ? (
                                    <Search className="w-4 h-4 text-yellow-400 animate-pulse" />
                                ) : (
                                    <Sparkles className="w-4 h-4 text-zinc-600" />
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <p className={cn(
                                    "font-medium truncate",
                                    isComplete && "text-amber-300",
                                    isActive && !isComplete && "text-yellow-300",
                                    !isActive && !isComplete && "text-zinc-500"
                                )}>
                                    {isComplete ? "Scanned:" : isActive ? "Scanning:" : "Pending:"}
                                    <span className="ml-2 font-normal italic">&ldquo;{phrase}&rdquo;</span>
                                </p>
                            </div>

                            {/* Progress indicator for active */}
                            {isActive && !isComplete && (
                                <div className="flex-shrink-0">
                                    <div className="flex gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
