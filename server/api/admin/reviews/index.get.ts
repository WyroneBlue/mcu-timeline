export default defineEventHandler(async (event) => {
    await requireAdmin(event)
    const db = adminClient()

    const query = getQuery(event)
    const status = typeof query.status === 'string' ? query.status : null

    let builder = db
        .from('reviews')
        .select('*, titles(title), profiles(username)')
        .order('created_at', { ascending: false })

    if (status && ['pending', 'approved', 'rejected', 'flagged'].includes(status)) {
        builder = builder.eq('status', status)
    }

    const { data, error } = await builder

    if (error) throw createError({ statusCode: 500, message: error.message })
    return data
})
