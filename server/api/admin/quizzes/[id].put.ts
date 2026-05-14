export default defineEventHandler(async (event) => {
    await requireAdmin(event)
    const db = adminClient()
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)

    const { data, error } = await db
        .from('quiz_questions')
        .update(body)
        .eq('id', id)
        .select()
        .single()

    if (error) throw createError({ statusCode: 400, message: error.message })
    return data
})
