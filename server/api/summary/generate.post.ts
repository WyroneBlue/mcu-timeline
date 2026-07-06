import { createHash } from 'node:crypto'
import Anthropic from '@anthropic-ai/sdk'

const MODEL = 'claude-sonnet-5'

const LANGUAGE_NAMES: Record<string, string> = {
    en: 'English',
    nl: 'Dutch',
    es: 'Spanish',
    pt: 'Portuguese',
    it: 'Italian',
    tr: 'Turkish',
    ar: 'Arabic',
    zh: 'Simplified Chinese',
    ja: 'Japanese',
}

const PER_TITLE_SCHEMA = {
    type: 'object',
    properties: {
        summaries: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    title: { type: 'string' },
                    summary: { type: 'string' },
                },
                required: ['title', 'summary'],
                additionalProperties: false,
            },
        },
    },
    required: ['summaries'],
    additionalProperties: false,
}

type Mode = 'per-title' | 'flowing-story'

interface SummaryRow {
    title_id: number
    summary_text: string
    key_characters: string[] | null
    key_events: string[] | null
    spoiler_level: 'safe' | 'mild' | 'heavy'
}

export default defineEventHandler(async (event) => {
    const user = await requireUser(event)
    const db = adminClient()

    const body = await readBody<{ title_id?: number, mode?: Mode, locale?: string }>(event)

    const titleId = Number(body?.title_id)
    const mode = body?.mode
    const locale = typeof body?.locale === 'string' && LANGUAGE_NAMES[body.locale] ? body.locale : 'en'

    if (!Number.isInteger(titleId) || titleId <= 0) {
        throw createError({ statusCode: 400, message: 'Invalid title_id' })
    }
    if (mode !== 'per-title' && mode !== 'flowing-story') {
        throw createError({ statusCode: 400, message: 'Invalid mode' })
    }

    // Target title + its prerequisite list (from context_summaries)
    const { data: targetTitle, error: titleError } = await db
        .from('titles')
        .select('id, title')
        .eq('id', titleId)
        .single()
    if (titleError || !targetTitle) {
        throw createError({ statusCode: 404, message: 'Title not found' })
    }

    const { data: targetSummary } = await db
        .from('context_summaries')
        .select('prerequisite_title_ids')
        .eq('title_id', titleId)
        .maybeSingle()

    const prerequisiteIds: number[] = Array.isArray(targetSummary?.prerequisite_title_ids)
        ? (targetSummary!.prerequisite_title_ids as unknown[]).map(Number).filter(n => Number.isInteger(n))
        : []

    // User progress → watched ids; gap = prerequisites NOT watched
    const { data: progress } = await db
        .from('progress')
        .select('title_id, status')
        .eq('user_id', user.id)

    const watchedIds = new Set((progress ?? []).filter(p => p.status === 'watched').map(p => p.title_id))
    const gap = prerequisiteIds.filter(id => !watchedIds.has(id)).sort((a, b) => a - b)

    if (gap.length === 0) {
        return { mode, gap: [], summaries: [], story: '', cached: false }
    }

    // Spoiler filter: reveal_all → all levels; otherwise only 'safe'
    const { data: profile } = await db
        .from('profiles')
        .select('spoiler_mode')
        .eq('id', user.id)
        .maybeSingle()
    const spoilerBucket: 'safe' | 'heavy' = profile?.spoiler_mode === 'reveal_all' ? 'heavy' : 'safe'

    const gapHash = createHash('sha256').update(gap.join(',')).digest('hex')

    // Cache lookup
    const { data: cachedRecap } = await db
        .from('generated_recaps')
        .select('content')
        .eq('title_id', titleId)
        .eq('gap_hash', gapHash)
        .eq('locale', locale)
        .eq('mode', mode)
        .eq('spoiler_level', spoilerBucket)
        .maybeSingle()

    if (cachedRecap?.content) {
        const content = cachedRecap.content as { summaries?: { title: string, summary: string }[], story?: string }
        return { mode, gap, ...content, cached: true }
    }

    // Load context summaries for the gap (spoiler-filtered) + title names for ordering
    let summariesQuery = db
        .from('context_summaries')
        .select('title_id, summary_text, key_characters, key_events, spoiler_level')
        .in('title_id', gap)
    if (spoilerBucket === 'safe') {
        summariesQuery = summariesQuery.eq('spoiler_level', 'safe')
    }
    const { data: gapSummaries } = await summariesQuery

    const { data: gapTitles } = await db
        .from('titles')
        .select('id, title, chronology_index')
        .in('id', gap)
        .order('chronology_index', { ascending: true })

    const orderedSummaries: (SummaryRow & { title: string })[] = (gapTitles ?? [])
        .map((t) => {
            const row = (gapSummaries ?? []).find(s => s.title_id === t.id) as SummaryRow | undefined
            return row ? { ...row, title: t.title as string } : null
        })
        .filter((r): r is SummaryRow & { title: string } => r !== null)

    if (orderedSummaries.length === 0) {
        return { mode, gap, summaries: [], story: '', cached: false }
    }

    const fallbackSummaries = orderedSummaries.map(s => ({ title: s.title, summary: s.summary_text }))

    const config = useRuntimeConfig()
    const apiKey = config.anthropicApiKey
    if (!apiKey) {
        // No key configured: fall back to the raw curated summaries
        return buildFallback(mode, gap, fallbackSummaries)
    }

    const languageName = LANGUAGE_NAMES[locale]

    const summaryBlock = orderedSummaries
        .map(s => `### ${s.title}\n${s.summary_text}\nCharacters: ${(s.key_characters ?? []).join(', ')}\nEvents: ${(s.key_events ?? []).join('; ')}`)
        .join('\n\n')

    const systemPrompt = `You are an MCU expert who writes recaps for viewers who skipped certain titles. Write entirely in ${languageName}. Keep the tone informal but informative. Avoid spoilers for the title the user is about to watch. Be concise but complete.`

    let userPrompt: string
    if (mode === 'per-title') {
        userPrompt = `The user is about to watch "${targetTitle.title}" and has skipped the following titles. For each skipped title, write a short standalone summary (2-3 sentences) that tells the viewer exactly what they need to know. Do not use bullet points; write it as flowing prose.

Skipped titles:
${summaryBlock}

Return one summary object per skipped title, in the same order.`
    }
    else {
        userPrompt = `The user is about to watch "${targetTitle.title}" and has skipped the following titles. Write one continuous, flowing story that weaves all the important events and characters together into a coherent narrative. The reader does not need to know which films these were — it is about the story. Write it as an epic recap in the second person ("So far in the MCU..."). Maximum 300 words.

Skipped titles:
${summaryBlock}

Return ONLY the story text as plain text, no JSON and no markdown headers.`
    }

    const anthropic = new Anthropic({ apiKey })

    try {
        let content: { summaries?: { title: string, summary: string }[], story?: string }

        if (mode === 'per-title') {
            const response = await anthropic.messages.create({
                model: MODEL,
                max_tokens: 1500,
                thinking: { type: 'disabled' },
                system: systemPrompt,
                messages: [{ role: 'user', content: userPrompt }],
                output_config: {
                    format: { type: 'json_schema', schema: PER_TITLE_SCHEMA },
                },
            })
            const text = response.content.find(b => b.type === 'text')?.text ?? ''
            const parsed = JSON.parse(text) as { summaries: { title: string, summary: string }[] }
            content = { summaries: parsed.summaries }
        }
        else {
            const response = await anthropic.messages.create({
                model: MODEL,
                max_tokens: 1500,
                thinking: { type: 'disabled' },
                system: systemPrompt,
                messages: [{ role: 'user', content: userPrompt }],
            })
            const text = response.content.find(b => b.type === 'text')?.text ?? ''
            content = { story: text.trim() }
        }

        await db
            .from('generated_recaps')
            .upsert({
                title_id: titleId,
                gap_hash: gapHash,
                locale,
                mode,
                spoiler_level: spoilerBucket,
                content,
                model: MODEL,
            }, { onConflict: 'title_id,gap_hash,locale,mode,spoiler_level' })

        return { mode, gap, ...content, cached: false }
    }
    catch (e) {
        console.error('Recap generation failed, returning curated summaries:', e)
        return buildFallback(mode, gap, fallbackSummaries)
    }
})

function buildFallback(mode: Mode, gap: number[], summaries: { title: string, summary: string }[]) {
    if (mode === 'flowing-story') {
        return { mode, gap, story: summaries.map(s => s.summary).join('\n\n'), cached: false, fallback: true }
    }
    return { mode, gap, summaries, cached: false, fallback: true }
}
