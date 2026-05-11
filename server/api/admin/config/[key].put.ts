export default defineEventHandler(async (event) => {
    requireAdmin(event)
    const db = adminClient()
    const key = getRouterParam(event, 'key')
    const body = await readBody(event)

    const { data, error } = await db
        .from('app_config')
        .upsert({ key, value: body.value, description: body.description }, { onConflict: 'key' })
        .select()
        .single()

    if (error) throw createError({ statusCode: 400, message: error.message })
    return data
})
