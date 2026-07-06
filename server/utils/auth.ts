import type { H3Event } from 'h3'

export async function requireUser(event: H3Event) {
    const authHeader = getHeader(event, 'authorization')

    if (!authHeader?.startsWith('Bearer ')) {
        throw createError({ statusCode: 401, message: 'Unauthorized' })
    }

    const token = authHeader.slice(7)
    const db = adminClient()

    const { data: { user }, error: authError } = await db.auth.getUser(token)
    if (authError || !user) {
        throw createError({ statusCode: 401, message: 'Unauthorized' })
    }

    return user
}
