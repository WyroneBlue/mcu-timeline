export default defineEventHandler(async (event) => {
    const tmdbId = Number(getRouterParam(event, 'tmdbId'))
    if (!tmdbId || isNaN(tmdbId)) {
        throw createError({ statusCode: 400, message: 'Invalid tmdbId' })
    }

    const query = getQuery(event)
    const type = (query.type as string) === 'series' ? 'tv' : 'movie'

    const apiKey = getTmdbApiKey()
    const data = await $fetch<Record<string, any>>(
        `https://api.themoviedb.org/3/${type}/${tmdbId}/videos`,
        { query: { api_key: apiKey } },
    )

    const results = (data.results || [])
        .filter((v: any) => v.site === 'YouTube' && v.key)
        .map((v: any) => ({
            key: v.key,
            name: v.name,
            type: v.type,
            official: v.official ?? false,
        }))

    return { videos: results }
})
