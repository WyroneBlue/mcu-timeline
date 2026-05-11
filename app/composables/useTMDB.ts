const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p'

export function useTMDB() {
    function getPosterUrl(path: string | null, size = 'w500'): string | null {
        if (!path) return null
        if (path.startsWith('http')) return path
        return `${TMDB_IMAGE_BASE}/${size}${path}`
    }

    function getBackdropUrl(path: string | null, size = 'w1280'): string | null {
        if (!path) return null
        if (path.startsWith('http')) return path
        return `${TMDB_IMAGE_BASE}/${size}${path}`
    }

    function getProfileUrl(path: string | null, size = 'w185'): string | null {
        if (!path) return null
        return `${TMDB_IMAGE_BASE}/${size}${path}`
    }

    async function fetchTitleDetails(tmdbId: number, type: 'movie' | 'series') {
        return await $fetch(`/api/tmdb/${tmdbId}`, {
            query: { type },
        })
    }

    return {
        getPosterUrl,
        getBackdropUrl,
        getProfileUrl,
        fetchTitleDetails,
    }
}
