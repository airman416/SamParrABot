'use client'

import { Search, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchBarProps {
    value: string
    onChange: (value: string) => void
    onSubmit: () => void
    disabled?: boolean
    placeholder?: string
}

export function SearchBar({ value, onChange, onSubmit, disabled, placeholder }: SearchBarProps) {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (value.trim() && !disabled) {
            onSubmit()
        }
    }

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto">
            <div className={cn(
                "relative group",
                "rounded-2xl",
                "bg-gradient-to-r from-amber-500/30 via-yellow-500/30 to-amber-600/30",
                "p-[2px]",
                "transition-all duration-300",
                "hover:from-amber-500/50 hover:via-yellow-500/50 hover:to-amber-600/50",
                "focus-within:from-amber-500/70 focus-within:via-yellow-500/70 focus-within:to-amber-600/70",
                "shadow-lg shadow-amber-500/10",
                "hover:shadow-xl hover:shadow-amber-500/20"
            )}>
                <div className="relative flex items-center bg-black rounded-[14px] overflow-hidden">
                    <div className="absolute left-5 text-zinc-500 group-focus-within:text-amber-400 transition-colors">
                        <Sparkles className="w-5 h-5" />
                    </div>

                    <input
                        type="text"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        disabled={disabled}
                        placeholder={placeholder || "Ask Sam's Brain: 'Find contrarian business ideas...'"}
                        className={cn(
                            "w-full py-5 pl-14 pr-14",
                            "bg-transparent",
                            "text-lg text-white placeholder:text-zinc-600",
                            "focus:outline-none",
                            "disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                        suppressHydrationWarning
                    />

                    <button
                        type="submit"
                        disabled={disabled || !value.trim()}
                        className={cn(
                            "absolute right-3",
                            "p-2.5 rounded-xl",
                            "bg-gradient-to-r from-amber-500 to-yellow-600",
                            "text-black font-bold",
                            "transition-all duration-200",
                            "hover:from-amber-400 hover:to-yellow-500",
                            "hover:scale-105",
                            "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100",
                            "focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-black"
                        )}
                    >
                        <Search className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <p className="text-center text-zinc-600 text-sm mt-4">
                Press <kbd className="px-2 py-0.5 rounded bg-zinc-900 text-amber-500 font-mono text-xs border border-zinc-800">Enter</kbd> to search
            </p>
        </form>
    )
}
