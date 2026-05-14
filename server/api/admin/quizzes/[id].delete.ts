export default defineEventHandler(async (event) => {
    await requireAdmin(event)
    const db = adminClient()
    const id = getRouterParam(event, 'id')

    const { error } = await db
        .from('quiz_questions')
        .delete()
        .eq('id', id)

    if (error) throw createError({ statusCode: 400, message: error.message })
    return { deleted: true }
})
