import { createClient } from '@supabase/supabase-js'
import type { H3Event } from 'h3'

export function requireAdmin(event: H3Event) {
    const config = useRuntimeConfig()
    const authHeader = getHeader(event, 'authorization')

    if (!config.supabase.serviceKey || authHeader !== `Bearer ${config.supabase.serviceKey}`) {
        throw createError({ statusCode: 403, message: 'Forbidden' })
    }
}

export function adminClient() {
    const config = useRuntimeConfig()
    return createClient(
        config.public.supabase.url as string,
        config.supabase.serviceKey as string
    )
}
