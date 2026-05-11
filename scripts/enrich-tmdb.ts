import titlesJson from '../data/mcu-titles.json'
import { writeFileSync } from 'fs'
import { resolve } from 'path'

const TMDB_BASE = 'https://api.themoviedb.org/3'
const TMDB_IMAGE = 'https://image.tmdb.org/t/p'

const API_KEY = process.env.TMDB_API_KEY
if (!API_KEY) {
    console.error('Set TMDB_API_KEY environment variable')
    process.exit(1)
}

interface TmdbTitle {
    tmdb_id: number
    type: string
    title: string
    slug: string
    poster_url?: string | null
    backdrop_url?: string | null
    overview?: string | null
    [key: string]: any
}

async function fetchTmdb(tmdbId: number, mediaType: 'movie' | 'tv') {
    const url = `${TMDB_BASE}/${mediaType}/${tmdbId}?api_key=${API_KEY}&language=nl-NL`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`TMDB ${res.status} for ${tmdbId}`)
    return res.json()
}

interface TmdbVideo {
    key: string
    name: string
    type: string
    site: string
    official: boolean
}

async function fetchVideos(tmdbId: number, mediaType: 'movie' | 'tv') {
    const url = `${TMDB_BASE}/${mediaType}/${tmdbId}/videos?api_key=${API_KEY}`
    const res = await fetch(url)
    if (!res.ok) return { trailerUrl: null, videos: [] }
    const data = await res.json()

    const youtubeVideos: TmdbVideo[] = (data.results || [])
        .filter((v: any) => v.site === 'YouTube' && v.key)
        .map((v: any) => ({
            key: v.key,
            name: v.name,
            type: v.type,
            site: v.site,
            official: v.official ?? false,
        }))

    const trailer = youtubeVideos.find(v => v.type === 'Trailer' && v.official)
        || youtubeVideos.find(v => v.type === 'Trailer')

    return {
        trailerUrl: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null,
        videos: youtubeVideos.map(v => ({
            youtube_key: v.key,
            name: v.name,
            video_type: v.type.toLowerCase().replace(/ /g, '_'),
            official: v.official,
        })),
    }
}

async function main() {
    const titles = titlesJson as TmdbTitle[]
    let enriched = 0

    for (const title of titles) {
        if (!title.tmdb_id) continue

        try {
            const mediaType = title.type === 'series' ? 'tv' : 'movie'

            const [data, videoResult] = await Promise.all([
                (!title.poster_url || !title.backdrop_url || !title.overview)
                    ? fetchTmdb(title.tmdb_id, mediaType)
                    : Promise.resolve(null),
                fetchVideos(title.tmdb_id, mediaType),
            ])

            if (data) {
                if (data.poster_path && !title.poster_url) {
                    title.poster_url = `${TMDB_IMAGE}/w500${data.poster_path}`
                }
                if (data.backdrop_path && !title.backdrop_url) {
                    title.backdrop_url = `${TMDB_IMAGE}/w1280${data.backdrop_path}`
                }
                if (data.overview && !title.overview) {
                    title.overview = data.overview
                }
            }

            if (videoResult.trailerUrl && !title.trailer_url) {
                title.trailer_url = videoResult.trailerUrl
            }

            if (videoResult.videos.length > 0) {
                (title as any).videos = videoResult.videos
            }

            enriched++
            const vCount = videoResult.videos.length
            console.log(`✓ ${title.title} [${[title.poster_url ? 'P' : '', title.trailer_url ? 'T' : '', title.backdrop_url ? 'B' : '', vCount > 0 ? `V:${vCount}` : ''].filter(Boolean).join('')}]`)

            await new Promise(r => setTimeout(r, 350))
        } catch (e: any) {
            console.error(`✗ ${title.title}: ${e.message}`)
        }
    }

    const outPath = resolve(import.meta.dirname!, '../data/mcu-titles.json')
    writeFileSync(outPath, JSON.stringify(titles, null, 2) + '\n')
    console.log(`\nEnriched ${enriched}/${titles.length} titles → ${outPath}`)
}

main()
