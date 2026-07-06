export default defineEventHandler(async (event) => {
    const user = await requireUser(event)
    const db = adminClient()

    const body = await readBody<{ title_id?: number, body?: string, locale?: string }>(event)

    const titleId = Number(body?.title_id)
    const text = typeof body?.body === 'string' ? body.body.trim() : ''
    const locale = typeof body?.locale === 'string' && /^[a-z]{2}$/.test(body.locale) ? body.locale : 'en'

    if (!Number.isInteger(titleId) || titleId <= 0) {
        throw createError({ statusCode: 400, message: 'Invalid title_id' })
    }
    if (text.length < 10 || text.length > 2000) {
        throw createError({ statusCode: 400, message: 'Review must be between 10 and 2000 characters' })
    }

    // DB-based rate limit: max 3 review writes per user per hour (creates + edits)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count: recentCount, error: countError } = await db
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('updated_at', oneHourAgo)

    if (countError) throw createError({ statusCode: 500, message: countError.message })
    if ((recentCount ?? 0) >= 3) {
        throw createError({ statusCode: 429, message: 'Too many reviews, try again later' })
    }

    const moderation = await moderateReview(text, locale)

    const { data: review, error } = await db
        .from('reviews')
        .upsert({
            user_id: user.id,
            title_id: titleId,
            body: text,
            locale,
            status: moderation.status,
            moderation: {
                source: moderation.source,
                reason: moderation.reason,
                moderated_at: new Date().toISOString(),
            },
        }, { onConflict: 'user_id,title_id' })
        .select()
        .single()

    if (error) throw createError({ statusCode: 400, message: error.message })

    // Award XP once per (user, title) for an approved review
    if (moderation.status === 'approved') {
        const { data: existingXp } = await db
            .from('xp_events')
            .select('id')
            .eq('user_id', user.id)
            .eq('title_id', titleId)
            .eq('event_type', 'review')
            .limit(1)
            .maybeSingle()

        if (!existingXp) {
            const { error: xpError } = await db.from('xp_events').insert({
                user_id: user.id,
                title_id: titleId,
                event_type: 'review',
                xp_delta: 50,
                metadata_json: { review_id: review.id },
            })
            if (!xpError) {
                await db.rpc('fn_recalc_xp', { uid: user.id })
            }
        }
    }

    return { review, status: moderation.status }
})
