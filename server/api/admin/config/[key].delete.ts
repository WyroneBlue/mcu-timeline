export default defineEventHandler(async (event) => {
    requireAdmin(event)
    const db = adminClient()
    const key = getRouterParam(event, 'key')

    const { error } = await db
        .from('app_config')
        .delete()
        .eq('key', key)

    if (error) throw createError({ statusCode: 400, message: error.message })
    return { deleted: true }
})
