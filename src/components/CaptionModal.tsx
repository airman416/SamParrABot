'use client'

import { useState, useEffect } from 'react'
import { X, Copy, Check, MessageSquare, Loader2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CaptionModalProps {
    isOpen: boolean
    onClose: () => void
    videoId: string
    timestamp: number
}

export function CaptionModal({ isOpen, onClose, videoId, timestamp }: CaptionModalProps) {
    const [caption, setCaption] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (isOpen && videoId) {
            setIsLoading(true)
            setCaption('')

            // Fetch caption from API
            fetch('/api/caption', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videoId, start_timestamp: timestamp })
            })
                .then(res => res.json())
                .then(data => {
                    setCaption(data.caption)
                    setIsLoading(false)
                })
                .catch(err => {
                    console.error(err)
                    setCaption('Check out this clip from My First Million! 🚀\n#MyFirstMillion #Business #Startup')
                    setIsLoading(false)
                })
        }
    }, [isOpen, videoId, timestamp])

    const handleCopy = () => {
        navigator.clipboard.writeText(caption)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="text-center mb-6">
                    <div className="mx-auto w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mb-3">
                        <Check className="w-6 h-6 text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">Clip Downloaded!</h3>
                    <p className="text-zinc-400 text-sm">Your clip is ready.</p>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-amber-500 font-medium text-sm">
                        <Sparkles className="w-4 h-4" />
                        AI Suggested Caption
                    </div>

                    <div className="relative group">
                        <div className={cn(
                            "w-full p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 min-h-[120px] text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap",
                            isLoading && "flex items-center justify-center"
                        )}>
                            {isLoading ? (
                                <div className="flex flex-col items-center gap-2 text-zinc-500">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Generating viral caption...</span>
                                </div>
                            ) : caption}
                        </div>

                        {!isLoading && (
                            <button
                                onClick={handleCopy}
                                className="absolute top-2 right-2 p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                title="Copy caption"
                            >
                                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            </button>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl bg-white text-black font-semibold hover:bg-zinc-200 transition-colors"
                    >
                        Done
                    </button>
                    {!isLoading && (
                        <button
                            onClick={handleCopy}
                            className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-white font-medium hover:bg-zinc-700 transition-colors"
                        >
                            {copied ? 'Copied!' : 'Copy Caption'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
