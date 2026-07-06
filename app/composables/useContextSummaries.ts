import type { Database } from '~/types/supabase'

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

export function useContextSummaries() {
    const client = useSupabaseClient<Database>()

    async function getSummaryForTitle(titleId: number): Promise<ContextSummary | null> {
        const { data, error } = await client
            .from('context_summaries')
            .select('*')
            .eq('title_id', titleId)
            .maybeSingle()
        if (error || !data) return null
        return normalize(data)
    }

    async function loadEntries(ids: number[]): Promise<SkippedPrerequisite[]> {
        if (ids.length === 0) return []

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

        const results: SkippedPrerequisite[] = []
        for (const t of titles ?? []) {
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

    // Every prerequisite of a title, in chronological order
    async function getPrerequisites(currentTitleId: number): Promise<SkippedPrerequisite[]> {
        const current = await getSummaryForTitle(currentTitleId)
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
