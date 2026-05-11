export default defineEventHandler(async (event) => {
    requireAdmin(event)
    const db = adminClient()

    const { data, error } = await db
        .from('ticket_providers')
        .select('*')
        .order('name', { ascending: true })

    if (error) throw createError({ statusCode: 500, message: error.message })
    return data
})
