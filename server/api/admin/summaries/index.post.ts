export default defineEventHandler(async (event) => {
    await requireAdmin(event)
    const db = adminClient()
    const body = await readBody(event)

    const { data, error } = await db
        .from('context_summaries')
        .insert(body)
        .select()
        .single()

    if (error) throw createError({ statusCode: 400, message: error.message })
    return data
})
