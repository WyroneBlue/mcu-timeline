export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const titleId = Number(query.title_id)

    if (!Number.isInteger(titleId) || titleId <= 0) {
        throw createError({ statusCode: 400, message: 'Invalid title_id' })
    }

    const db = adminClient()

    const { data, error } = await db
        .from('reviews')
        .select('id, user_id, title_id, body, locale, created_at, updated_at, profiles(username, avatar_url)')
        .eq('title_id', titleId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(50)

    if (error) throw createError({ statusCode: 500, message: error.message })
    return data
})
