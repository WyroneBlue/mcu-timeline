import type { Database } from '~/types/supabase'
import contextSummariesJson from '../../data/context-summaries.json'
import { localTitlesForMode } from './useTitles'

export interface ContextSummary {
    title_id: number
    prerequisite_title_ids: number[]
    summary_text: string
    key_characters: string[]
    key_events: string[]
    spoiler_level: 'safe' | 'mild' | 'heavy'
}

export interface SkippedPrerequisite {
    titleId: number
    title: string
    slug: string
    summary: ContextSummary
}

type ContextSummaryRow = Database['public']['Tables']['context_summaries']['Row']

function toStringArray(value: unknown): string[] {
    return Array.isArray(value) ? value.map(String) : []
}

function toNumberArray(value: unknown): number[] {
    return Array.isArray(value) ? value.map(Number).filter(n => Number.isInteger(n)) : []
}

function normalize(row: ContextSummaryRow): ContextSummary {
    return {
        title_id: row.title_id,
        prerequisite_title_ids: toNumberArray(row.prerequisite_title_ids),
        summary_text: row.summary_text,
        key_characters: toStringArray(row.key_characters),
        key_events: toStringArray(row.key_events),
        spoiler_level: row.spoiler_level,
    }
}

// Local fallback mirrors useTitles: the JSON is slug-based, so slugs are
// resolved against the same local title list (and thus the same ids) that
// getTitleBySlug falls back to when Supabase is unavailable.
interface LocalSummaryEntry {
    title_slug: string
    prerequisite_slugs: string[]
    summary: string
    key_characters: string[]
    key_events: string[]
}

let localMapsCache: { idBySlug: Map<string, number>; titleById: Map<number, { title: string; slug: string }> } | null = null

function localMaps() {
    if (!localMapsCache) {
        const idBySlug = new Map<string, number>()
        const titleById = new Map<number, { title: string; slug: string }>()
        for (const t of localTitlesForMode('extreme')) {
            idBySlug.set(t.slug, t.id)
            titleById.set(t.id, { title: t.title, slug: t.slug })
        }
        localMapsCache = { idBySlug, titleById }
    }
    return localMapsCache
}

function localSummaryForTitle(titleId: number, slug?: string): ContextSummary | null {
    const { idBySlug, titleById } = localMaps()
    // Slug beats id: fallback ids are mode-dependent, slugs never are.
    const resolvedSlug = slug ?? titleById.get(titleId)?.slug
    if (!resolvedSlug) return null
    const entry = (contextSummariesJson as LocalSummaryEntry[]).find(e => e.title_slug === resolvedSlug)
    if (!entry) return null
    return {
        title_id: titleId,
        prerequisite_title_ids: entry.prerequisite_slugs
            .map(s => idBySlug.get(s))
            .filter((id): id is number => id !== undefined),
        summary_text: entry.summary,
        key_characters: entry.key_characters,
        key_events: entry.key_events,
        spoiler_level: 'safe',
    }
}

function localEntries(ids: number[]): SkippedPrerequisite[] {
    const { titleById } = localMaps()
    const results: SkippedPrerequisite[] = []
    for (const id of ids) {
        const meta = titleById.get(id)
        if (!meta) continue
        // A prerequisite without its own JSON entry (e.g. the first film) still
        // needs to show up as a chip, so synthesize an empty summary for it.
        const summary = localSummaryForTitle(id) ?? {
            title_id: id,
            prerequisite_title_ids: [],
            summary_text: '',
            key_characters: [],
            key_events: [],
            spoiler_level: 'safe' as const,
        }
        results.push({ titleId: id, title: meta.title, slug: meta.slug, summary })
    }
    return results
}

export function useContextSummaries() {
    const client = useSupabaseClient<Database>()

    async function getSummaryForTitle(titleId: number, slug?: string): Promise<ContextSummary | null> {
        try {
            const { data, error } = await client
                .from('context_summaries')
                .select('*')
                .eq('title_id', titleId)
                .maybeSingle()
            if (!error && data) return normalize(data)
        } catch {
            // Supabase unavailable, fall back to local data
        }
        return localSummaryForTitle(titleId, slug)
    }

    async function loadEntries(ids: number[]): Promise<SkippedPrerequisite[]> {
        if (ids.length === 0) return []

        try {
            const [{ data: rows }, { data: titles }] = await Promise.all([
                client
                    .from('context_summaries')
                    .select('*')
                    .in('title_id', ids),
                client
                    .from('titles')
                    .select('id, title, slug, chronology_index')
                    .in('id', ids)
                    .order('chronology_index', { ascending: true }),
            ])

            if (titles && titles.length > 0) {
                const results: SkippedPrerequisite[] = []
                for (const t of titles) {
                    const row = (rows ?? []).find(r => r.title_id === t.id)
                    if (!row) continue
                    results.push({
                        titleId: t.id,
                        title: t.title,
                        slug: t.slug,
                        summary: normalize(row),
                    })
                }
                return results
            }
        } catch {
            // Supabase unavailable, fall back to local data
        }
        return localEntries(ids)
    }

    // Every prerequisite of a title, in chronological order
    async function getPrerequisites(currentTitleId: number, slug?: string): Promise<SkippedPrerequisite[]> {
        const current = await getSummaryForTitle(currentTitleId, slug)
        if (!current) return []
        return loadEntries(current.prerequisite_title_ids)
    }

    async function getSkippedPrerequisites(
        currentTitleId: number,
        skippedIds: Set<number>,
    ): Promise<SkippedPrerequisite[]> {
        const current = await getSummaryForTitle(currentTitleId)
        if (!current) return []
        return loadEntries(current.prerequisite_title_ids.filter(id => skippedIds.has(id)))
    }

    return {
        getSummaryForTitle,
        getPrerequisites,
        getSkippedPrerequisites,
    }
}
