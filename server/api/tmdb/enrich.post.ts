import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()

    // Admin-only: require service key as authorization header
    const authHeader = getHeader(event, 'authorization')
    if (!config.supabase.serviceKey || authHeader !== `Bearer ${config.supabase.serviceKey}`) {
        throw createError({ statusCode: 403, message: 'Forbidden' })
    }

    const supabase = createClient(
        config.public.supabase.url as string,
        config.supabase.serviceKey as string
    )

    const { data: titles, error: fetchError } = await supabase
        .from('titles')
        .select('id, tmdb_id, type, poster_url')
        .not('tmdb_id', 'is', null)

    if (fetchError) throw createError({ statusCode: 500, message: fetchError.message })
    if (!titles || titles.length === 0) return { enriched: 0 }

    const toEnrich = titles.filter(t => !t.poster_url && t.tmdb_id)
    let enriched = 0

    for (const title of toEnrich) {
        try {
            const type = title.type === 'series' ? 'series' : 'movie'
            const data = await fetchTmdbTitle(title.tmdb_id!, type as 'movie' | 'series')

            await supabase.from('titles').update({
                poster_url: posterUrl(data.poster_path),
                backdrop_url: backdropUrl(data.backdrop_path),
                overview: data.overview || undefined,
                runtime_minutes: data.runtime || undefined,
            }).eq('id', title.id)

            enriched++

            // TMDB rate limit: ~40 req/10 sec
            await new Promise(resolve => setTimeout(resolve, 300))
        } catch (e) {
            console.error(`Failed to enrich title ${title.id} (tmdb: ${title.tmdb_id}):`, e)
        }
    }

    return { enriched, total: toEnrich.length }
})
