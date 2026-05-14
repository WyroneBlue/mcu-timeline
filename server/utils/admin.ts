import { createClient } from '@supabase/supabase-js'
import type { H3Event } from 'h3'

export async function requireAdmin(event: H3Event) {
    const config = useRuntimeConfig()
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

    const { data: profile } = await db
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

    if (!profile?.is_admin) {
        throw createError({ statusCode: 403, message: 'Forbidden' })
    }

    return user
}

export function adminClient() {
    const config = useRuntimeConfig()
    return createClient(
        config.public.supabase.url as string,
        config.supabase.serviceKey as string
    )
}
