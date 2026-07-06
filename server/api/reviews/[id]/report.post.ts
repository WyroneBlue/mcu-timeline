export default defineEventHandler(async (event) => {
    const user = await requireUser(event)
    const db = adminClient()

    const id = Number(getRouterParam(event, 'id'))
    if (!Number.isInteger(id) || id <= 0) {
        throw createError({ statusCode: 400, message: 'Invalid review id' })
    }

    const body = await readBody<{ reason?: string }>(event).catch(() => ({} as { reason?: string }))
    const reason = typeof body?.reason === 'string' ? body.reason.trim().slice(0, 500) : null

    const { data: review, error: reviewError } = await db
        .from('reviews')
        .select('id, status')
        .eq('id', id)
        .maybeSingle()

    if (reviewError) throw createError({ statusCode: 500, message: reviewError.message })
    if (!review) throw createError({ statusCode: 404, message: 'Review not found' })

    // Idempotent insert: unique(review_id, user_id) makes duplicate reports a no-op
    const { error: insertError } = await db
        .from('review_reports')
        .upsert({ review_id: id, user_id: user.id, reason }, {
            onConflict: 'review_id,user_id',
            ignoreDuplicates: true,
        })

    if (insertError) throw createError({ statusCode: 400, message: insertError.message })

    // Recount and persist
    const { count, error: countError } = await db
        .from('review_reports')
        .select('id', { count: 'exact', head: true })
        .eq('review_id', id)

    if (countError) throw createError({ statusCode: 500, message: countError.message })
    const reportCount = count ?? 0

    let status = review.status as string
    const update: Record<string, unknown> = { report_count: reportCount }
    if (reportCount >= 3 && status === 'approved') {
        status = 'flagged'
        update.status = 'flagged'
    }

    const { error: updateError } = await db
        .from('reviews')
        .update(update)
        .eq('id', id)

    if (updateError) throw createError({ statusCode: 500, message: updateError.message })

    return { report_count: reportCount, status }
})
