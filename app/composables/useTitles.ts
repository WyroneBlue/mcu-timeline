import type { Database } from '~/types/supabase'
import mcuTitlesJson from '../../data/mcu-titles.json'

type Title = Database['public']['Tables']['titles']['Row']

function localTitlesForMode(mode: 'simple' | 'in_depth' | 'extreme') {
    let filtered = mcuTitlesJson as any[]

    if (mode === 'simple') {
        filtered = filtered.filter(t => t.canon_level === 'core' && t.type === 'movie')
    } else if (mode === 'in_depth') {
        filtered = filtered.filter(t => ['core', 'extended'].includes(t.canon_level))
    }

    return filtered
        .sort((a, b) => (a.chronology_index || 0) - (b.chronology_index || 0))
        .map((t, i) => ({
            ...t,
            id: i + 1,
            franchise_id: 1,
            poster_url: t.poster_url ?? null,
            backdrop_url: t.backdrop_url ?? null,
            overview: t.overview ?? null,
            trailer_url: t.trailer_url ?? null,
            streaming_url: null,
            retconned_by: null,
            retcon_date: null,
            created_at: null,
        })) as unknown as Title[]
}

export function useTitles() {
    const client = useSupabaseClient<Database>()

    async function getTitlesForMode(mode: 'simple' | 'in_depth' | 'extreme') {
        try {
            let query = client
                .from('titles')
                .select('*')
                .order('chronology_index', { ascending: true })

            if (mode === 'simple') {
                query = query.eq('canon_level', 'core').eq('type', 'movie')
            } else if (mode === 'in_depth') {
                query = query.in('canon_level', ['core', 'extended'])
            }

            const { data, error } = await query
            if (error) throw error
            if (data && data.length > 0) return data as Title[]
        } catch {
            // Supabase unavailable, fall back to local data
        }

        return localTitlesForMode(mode)
    }

    async function getTitleBySlug(slug: string) {
        try {
            const { data, error } = await client
                .from('titles')
                .select('*')
                .eq('slug', slug)
                .single()
            if (error) throw error
            return data as Title
        } catch {
            const local = (mcuTitlesJson as any[]).find(t => t.slug === slug)
            if (!local) throw new Error(`Title not found: ${slug}`)
            const all = localTitlesForMode('extreme')
            return all.find(t => t.slug === slug)!
        }
    }

    async function getRetconsForTitle(titleId: number) {
        try {
            const { data: asSource } = await client
                .from('retcons')
                .select('*, affected_title:titles!retcons_affected_title_id_fkey(title, slug)')
                .eq('source_title_id', titleId)

            const { data: asAffected } = await client
                .from('retcons')
                .select('*, source_title:titles!retcons_source_title_id_fkey(title, slug)')
                .eq('affected_title_id', titleId)

            return {
                causedBy: asAffected || [],
                causes: asSource || [],
            }
        } catch {
            return { causedBy: [], causes: [] }
        }
    }

    async function getUpcomingReleases() {
        try {
            const { data, error } = await client
                .from('titles')
                .select('*')
                .in('release_status', ['upcoming', 'announced'])
                .order('release_date', { ascending: true })
            if (error) throw error
            if (data && data.length > 0) return data as Title[]
        } catch {
            // fallback
        }

        return localTitlesForMode('extreme').filter(
            t => t.release_status === 'upcoming' || t.release_status === 'announced'
        )
    }

    async function getRelatedTitles(title: Title, limit = 6) {
        try {
            const { data, error } = await client
                .from('titles')
                .select('id, title, slug, poster_url, phase, chronology_index')
                .eq('franchise_id', title.franchise_id)
                .neq('id', title.id)
                .gte('chronology_index', (title.chronology_index || 0) - 3)
                .lte('chronology_index', (title.chronology_index || 0) + 3)
                .order('chronology_index', { ascending: true })
                .limit(limit)
            if (error) throw error
            return data
        } catch {
            const all = localTitlesForMode('extreme')
            const idx = title.chronology_index || 0
            return all
                .filter(t => t.id !== title.id && Math.abs((t.chronology_index || 0) - idx) <= 3)
                .slice(0, limit)
        }
    }

    return {
        getTitlesForMode,
        getTitleBySlug,
        getRetconsForTitle,
        getUpcomingReleases,
        getRelatedTitles,
    }
}
