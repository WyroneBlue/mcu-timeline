export default defineEventHandler(async (event) => {
    requireAdmin(event)
    const db = adminClient()
    const body = await readBody(event)

    const { data, error } = await db
        .from('titles')
        .insert(body)
        .select()
        .single()

    if (error) throw createError({ statusCode: 400, message: error.message })
    return data
})
