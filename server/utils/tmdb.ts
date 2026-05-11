const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p'

export function getTmdbApiKey(): string {
    const key = useRuntimeConfig().tmdbApiKey
    if (!key) throw createError({ statusCode: 500, message: 'TMDB API key not configured' })
    return key
}

export async function fetchTmdbTitle(tmdbId: number, type: 'movie' | 'series') {
    const apiKey = getTmdbApiKey()
    const mediaType = type === 'series' ? 'tv' : 'movie'

    const data = await $fetch<Record<string, any>>(`${TMDB_BASE_URL}/${mediaType}/${tmdbId}`, {
        query: {
            api_key: apiKey,
            language: 'nl-NL',
            append_to_response: 'credits',
        },
    })

    return {
        poster_path: data.poster_path,
        backdrop_path: data.backdrop_path,
        overview: data.overview,
        runtime: type === 'movie' ? data.runtime : null,
        cast: (data.credits?.cast || []).slice(0, 15).map((c: any) => ({
            name: c.name,
            character: c.character,
            profile_path: c.profile_path,
        })),
    }
}

export function posterUrl(path: string | null, size = 'w500'): string | null {
    if (!path) return null
    return `${TMDB_IMAGE_BASE}/${size}${path}`
}

export function backdropUrl(path: string | null, size = 'w1280'): string | null {
    if (!path) return null
    return `${TMDB_IMAGE_BASE}/${size}${path}`
}
