import type { Database } from '~/types/supabase'

type Badge = Database['public']['Tables']['badges']['Row']

export function useBadges() {
    const client = useSupabaseClient<Database>()
    const user = useSupabaseUser()

    async function getAllBadges(): Promise<Badge[]> {
        const { data, error } = await client.from('badges').select('*')
        if (error) throw error
        return data as Badge[]
    }

    async function getUserBadges(): Promise<{ badge: Badge; awarded_at: string }[]> {
        if (!user.value) return []
        const { data, error } = await client
            .from('user_badges')
            .select('awarded_at, badge:badges(*)')
            .eq('user_id', user.value.id)
        if (error) throw error
        return (data || []).map((row: any) => ({
            badge: row.badge as Badge,
            awarded_at: row.awarded_at,
        }))
    }

    async function getUserBadgeCodes(): Promise<Set<string>> {
        const badges = await getUserBadges()
        return new Set(badges.map(b => b.badge.code))
    }

    async function awardBadge(badgeCode: string): Promise<boolean> {
        if (!user.value) return false

        const existing = await getUserBadgeCodes()
        if (existing.has(badgeCode)) return false

        const { data: badge } = await client
            .from('badges')
            .select('id')
            .eq('code', badgeCode)
            .single()
        if (!badge) return false

        const { error } = await client.from('user_badges').insert({
            user_id: user.value.id,
            badge_id: badge.id,
        })
        if (error) throw error

        const { awardXP } = useXP()
        await awardXP('badge', 200, undefined, { badge_code: badgeCode })

        return true
    }

    async function checkAndAwardBadges(context: {
        watchedCount: number
        totalCount: number
        recentWatchDates?: string[]
        streakDays?: number
    }) {
        const earned = await getUserBadgeCodes()
        const awarded: string[] = []

        if (context.watchedCount >= 1 && !earned.has('first_watch')) {
            if (await awardBadge('first_watch')) awarded.push('first_watch')
        }

        if (context.watchedCount >= Math.ceil(context.totalCount / 2) && !earned.has('half_way')) {
            if (await awardBadge('half_way')) awarded.push('half_way')
        }

        if ((context.streakDays ?? 0) >= 7 && !earned.has('streak_7')) {
            if (await awardBadge('streak_7')) awarded.push('streak_7')
        }

        const last7Days = (context.recentWatchDates ?? []).filter(d => {
            const diff = Date.now() - new Date(d).getTime()
            return diff <= 7 * 24 * 60 * 60 * 1000
        })
        if (last7Days.length >= 5 && !earned.has('binge_master')) {
            if (await awardBadge('binge_master')) awarded.push('binge_master')
        }

        if (context.watchedCount >= context.totalCount && context.totalCount > 0 && !earned.has('completionist')) {
            if (await awardBadge('completionist')) awarded.push('completionist')
        }

        return awarded
    }

    return {
        getAllBadges,
        getUserBadges,
        getUserBadgeCodes,
        awardBadge,
        checkAndAwardBadges,
    }
}
