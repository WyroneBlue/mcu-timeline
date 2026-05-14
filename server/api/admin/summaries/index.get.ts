export default defineEventHandler(async (event) => {
    await requireAdmin(event)
    const db = adminClient()

    const { data, error } = await db
        .from('context_summaries')
        .select('*, titles(slug, title)')
        .order('id', { ascending: true })

    if (error) throw createError({ statusCode: 500, message: error.message })
    return data
})
