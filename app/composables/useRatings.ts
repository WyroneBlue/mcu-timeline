import type { Database } from '~/types/supabase'

export function useRatings() {
    const client = useSupabaseClient<Database>()
    const user = useSupabaseUser()
    const { XP_VALUES, awardXP } = useXP()

    async function getMyRating(titleId: number): Promise<number | null> {
        if (!user.value) return null
        const { data, error } = await client
            .from('ratings')
            .select('rating')
            .eq('user_id', user.value.id)
            .eq('title_id', titleId)
            .maybeSingle()
        if (error) throw error
        return data?.rating ?? null
    }

    async function setRating(titleId: number, rating: number): Promise<{ isFirst: boolean }> {
        if (!user.value) return { isFirst: false }

        const existing = await getMyRating(titleId)
        const isFirst = existing === null

        const { error } = await client
            .from('ratings')
            .upsert({
                user_id: user.value.id,
                title_id: titleId,
                rating,
            }, { onConflict: 'user_id,title_id' })
        if (error) throw error

        if (isFirst) {
            await awardXP('rating', XP_VALUES.rating, titleId, { rating })
        }

        return { isFirst }
    }

    async function clearRating(titleId: number): Promise<void> {
        if (!user.value) return
        const { error } = await client
            .from('ratings')
            .delete()
            .eq('user_id', user.value.id)
            .eq('title_id', titleId)
        if (error) throw error
    }

    async function getStats(titleId: number): Promise<{ avg: number; count: number } | null> {
        const { data, error } = await client
            .from('title_rating_stats')
            .select('avg_rating, rating_count')
            .eq('title_id', titleId)
            .maybeSingle()
        if (error) throw error
        if (!data) return null
        return { avg: Number(data.avg_rating), count: Number(data.rating_count) }
    }

    return {
        getMyRating,
        setRating,
        clearRating,
        getStats,
    }
}
