export default defineEventHandler(async (event) => {
    await requireAdmin(event)
    const db = adminClient()
    const id = getRouterParam(event, 'id')
    const body = await readBody<{ status?: string }>(event)

    if (!body?.status || !['approved', 'rejected'].includes(body.status)) {
        throw createError({ statusCode: 400, message: 'status must be approved or rejected' })
    }

    const { data: existing, error: fetchError } = await db
        .from('reviews')
        .select('moderation')
        .eq('id', id)
        .single()

    if (fetchError) throw createError({ statusCode: 404, message: 'Review not found' })

    const { data, error } = await db
        .from('reviews')
        .update({
            status: body.status,
            moderation: {
                ...(existing.moderation as Record<string, unknown> | null || {}),
                source: 'admin',
                moderated_at: new Date().toISOString(),
            },
        })
        .eq('id', id)
        .select()
        .single()

    if (error) throw createError({ statusCode: 400, message: error.message })
    return data
})
