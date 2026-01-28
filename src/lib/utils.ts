import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatTimestamp(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
}

export function getMatchLevel(similarity: number): { label: string; color: string; bgColor: string } {
    if (similarity >= 0.7) {
        return { label: 'Excellent Match', color: 'text-amber-400', bgColor: 'bg-amber-500/20' }
    } else if (similarity >= 0.5) {
        return { label: 'Strong Match', color: 'text-yellow-500', bgColor: 'bg-yellow-500/20' }
    } else if (similarity >= 0.35) {
        return { label: 'Good Match', color: 'text-amber-600', bgColor: 'bg-amber-600/20' }
    }
    return { label: 'Partial Match', color: 'text-zinc-400', bgColor: 'bg-zinc-500/20' }
}

// MFM Brand Colors
export const brand = {
    gold: '#C9A227',
    goldLight: '#D4B23D',
    goldDark: '#A88420',
    black: '#000000',
    white: '#FFFFFF',
}
