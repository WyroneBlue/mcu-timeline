import Anthropic from '@anthropic-ai/sdk'
import { findBannedWord } from './banned-words'

export interface ModerationResult {
    status: 'approved' | 'rejected' | 'flagged'
    source: 'heuristic' | 'ai'
    reason: string
}

const URL_PATTERN = /(?:https?:\/\/|www\.)[^\s<>"']+/gi

const URL_SHORTENERS = [
    'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd',
    'buff.ly', 'rebrand.ly', 'cutt.ly', 'shorturl.at', 'tiny.cc', 'rb.gy',
]

// Matches a known shortener domain followed by a path, with or without protocol
const SHORTENER_PATTERN = new RegExp(
    `(?:^|[^\\w.])(?:${URL_SHORTENERS.map(s => s.replace(/\./g, '\\.')).join('|')})/`,
    'i'
)

function countUrls(text: string): { count: number, hasShortener: boolean } {
    const matches = text.match(URL_PATTERN) || []
    const hasShortener = SHORTENER_PATTERN.test(text)
    return { count: matches.length, hasShortener }
}

function hasCharRepetition(text: string): boolean {
    return /(.)\1{7,}/.test(text)
}

function hasTokenRepetition(text: string): boolean {
    const tokens = text.toLowerCase().split(/\s+/).filter(Boolean)
    if (tokens.length < 5) return false
    const unique = new Set(tokens).size
    // >60% of tokens are repeats of earlier tokens
    return (tokens.length - unique) / tokens.length > 0.6
}

function isMostlyUppercase(text: string): boolean {
    const letters = text.match(/\p{L}/gu) || []
    if (letters.length < 20) return false
    const upper = letters.filter(c => c !== c.toLowerCase() && c === c.toUpperCase()).length
    return upper / letters.length > 0.8
}

async function classifyWithAI(body: string, locale: string): Promise<ModerationResult> {
    const config = useRuntimeConfig()
    const apiKey = config.anthropicApiKey as string | undefined

    if (!apiKey) {
        return { status: 'flagged', source: 'ai', reason: 'classifier unavailable (no API key)' }
    }

    try {
        const anthropic = new Anthropic({ apiKey })

        const response = await anthropic.messages.create({
            model: 'claude-haiku-4-5',
            max_tokens: 256,
            system: 'You moderate user-submitted movie/series reviews for a family-friendly fan app. '
                + 'Classify the review as "approved", "rejected", or "flagged". '
                + 'Reject: hate speech, harassment, sexual content, spam, advertising, doxxing/personal info. '
                + 'Flag when unsure or borderline. Normal opinions (including negative ones) and spoilers are fine. '
                + 'The review may be written in en, nl, es, pt, it, tr, ar, zh or ja.',
            messages: [{
                role: 'user',
                content: `Review locale: ${locale}\n\nReview text:\n${body}`,
            }],
            output_config: {
                format: {
                    type: 'json_schema',
                    schema: {
                        type: 'object',
                        properties: {
                            status: { type: 'string', enum: ['approved', 'rejected', 'flagged'] },
                            reason: { type: 'string', description: 'Short explanation for the classification' },
                        },
                        required: ['status', 'reason'],
                        additionalProperties: false,
                    },
                },
            },
        })

        const block = response.content[0]
        const text = block && block.type === 'text' ? block.text : ''
        const parsed = JSON.parse(text) as { status: string, reason: string }

        if (parsed.status === 'approved' || parsed.status === 'rejected' || parsed.status === 'flagged') {
            return { status: parsed.status, source: 'ai', reason: parsed.reason || 'ai classification' }
        }
        return { status: 'flagged', source: 'ai', reason: 'classifier returned unexpected status' }
    } catch {
        // Fail safe: never fail the submission, hold for manual review instead
        return { status: 'flagged', source: 'ai', reason: 'classifier error' }
    }
}

export async function moderateReview(body: string, locale: string): Promise<ModerationResult> {
    // 1. Hard-reject heuristics
    const bannedWord = findBannedWord(body)
    if (bannedWord) {
        return { status: 'rejected', source: 'heuristic', reason: `banned word: ${bannedWord}` }
    }

    const { count: urlCount, hasShortener } = countUrls(body)
    if (hasShortener) {
        return { status: 'rejected', source: 'heuristic', reason: 'url shortener link' }
    }
    if (urlCount > 1) {
        return { status: 'rejected', source: 'heuristic', reason: 'multiple urls' }
    }

    if (hasCharRepetition(body) || hasTokenRepetition(body)) {
        return { status: 'rejected', source: 'heuristic', reason: 'excessive repetition' }
    }

    if (isMostlyUppercase(body)) {
        return { status: 'rejected', source: 'heuristic', reason: 'excessive uppercase' }
    }

    // 2. Clean auto-approve: no signals at all and reasonable length
    if (urlCount === 0 && body.trim().length >= 30) {
        return { status: 'approved', source: 'heuristic', reason: 'clean' }
    }

    // 3. Uncertain (very short, or contains a single url) → AI classifier
    return classifyWithAI(body, locale)
}
