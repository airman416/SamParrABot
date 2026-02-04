import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
    try {
        const { content } = await request.json()

        if (!content) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 })
        }

        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

        const prompt = `You are a social media expert.
        Generate a viral TikTok/Reels caption for a video clip with this spoken content:
        "${content}"
        
        Rules:
        1. Keep it short (under 2 sentences).
        2. Be punchy and engaging (clickbait is okay but keep it high status).
        3. Include 3-5 relevant hashtags.
        4. Return Output format:
        [Caption]
        [Hashtags]
        
        Example:
        This is actually illegal to know 🤯
        #business #startup #samparr
        `

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 100
        })

        const generatedText = response.choices[0]?.message?.content?.trim() || ''

        return NextResponse.json({ caption: generatedText })

    } catch (error) {
        console.error('Caption generation error:', error)
        return NextResponse.json(
            { error: 'Failed to generate caption' },
            { status: 500 }
        )
    }
}
