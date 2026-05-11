export default defineEventHandler(async (event) => {
    const tmdbId = Number(getRouterParam(event, 'tmdbId'))
    if (!tmdbId || isNaN(tmdbId)) {
        throw createError({ statusCode: 400, message: 'Invalid tmdbId' })
    }

    const query = getQuery(event)
    const type = (query.type as string) === 'series' ? 'series' : 'movie'

    const data = await fetchTmdbTitle(tmdbId, type as 'movie' | 'series')

    return {
        tmdb_id: tmdbId,
        poster_url: posterUrl(data.poster_path),
        backdrop_url: backdropUrl(data.backdrop_path),
        overview: data.overview,
        runtime: data.runtime,
        cast: data.cast,
    }
})
