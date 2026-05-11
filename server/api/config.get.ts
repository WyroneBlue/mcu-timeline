import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async () => {
    const config = useRuntimeConfig()
    const db = createClient(
        config.public.supabase.url as string,
        config.public.supabase.key as string
    )

    const { data, error } = await db
        .from('app_config')
        .select('key, value')

    if (error) throw createError({ statusCode: 500, message: error.message })

    const result: Record<string, unknown> = {}
    for (const row of data || []) {
        result[row.key] = row.value
    }
    return result
})
