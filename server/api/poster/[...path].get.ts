export default defineEventHandler(async (event) => {
    const path = getRouterParam(event, 'path')
    if (!path || !/^w\d+\/[a-zA-Z0-9]+\.jpg$/.test(path)) {
        throw createError({ statusCode: 400, message: 'Invalid path' })
    }

    const url = `https://image.tmdb.org/t/p/${path}`
    const response = await fetch(url)
    if (!response.ok) {
        throw createError({ statusCode: response.status, message: 'Image not found' })
    }

    setResponseHeaders(event, {
        'Content-Type': response.headers.get('content-type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=604800, immutable',
    })

    const buffer = await response.arrayBuffer()
    return new Uint8Array(buffer)
})
