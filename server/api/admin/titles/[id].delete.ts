export default defineEventHandler(async (event) => {
    requireAdmin(event)
    const db = adminClient()
    const id = getRouterParam(event, 'id')

    const { error } = await db
        .from('titles')
        .delete()
        .eq('id', id)

    if (error) throw createError({ statusCode: 400, message: error.message })
    return { deleted: true }
})
