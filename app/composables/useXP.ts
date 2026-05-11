import type { Database } from '~/types/supabase'

const LEVEL_NAMES: Record<string, [number, number]> = {
    'Recruit': [1, 5],
    'Agent': [6, 10],
    'Avenger': [11, 15],
    'Guardian': [16, 20],
    'Eternal': [21, Infinity],
}

const XP_VALUES = {
    movie: 100,
    series: 150,
    quiz_correct: 25,
    streak_3: 50,
    streak_7: 150,
    badge: 200,
} as const

export function useXP() {
    const client = useSupabaseClient<Database>()
    const user = useSupabaseUser()

    function getLevelFromXP(xp: number): number {
        return Math.max(1, Math.floor(xp / 500) + 1)
    }

    function getLevelName(level: number): string {
        for (const [name, [min, max]] of Object.entries(LEVEL_NAMES)) {
            if (level >= min && level <= max) return name
        }
        return 'Eternal'
    }

    function getXPForNextLevel(xp: number): { current: number; needed: number; progress: number } {
        const currentLevel = getLevelFromXP(xp)
        const currentLevelXP = (currentLevel - 1) * 500
        const nextLevelXP = currentLevel * 500
        const progress = xp - currentLevelXP
        const needed = nextLevelXP - currentLevelXP
        return { current: progress, needed, progress: Math.round((progress / needed) * 100) }
    }

    async function awardXP(eventType: string, xpDelta: number, titleId?: number, metadata?: Record<string, any>) {
        if (!user.value) return

        const { error } = await client.from('xp_events').insert({
            user_id: user.value.id,
            title_id: titleId || null,
            event_type: eventType as any,
            xp_delta: xpDelta,
            metadata_json: metadata || null,
        })
        if (error) throw error

        await client.rpc('fn_recalc_xp', { uid: user.value.id })
    }

    async function awardWatchXP(titleId: number, type: 'movie' | 'series') {
        const xp = type === 'series' ? XP_VALUES.series : XP_VALUES.movie
        await awardXP('watch', xp, titleId, { type })
    }

    async function getTotalXP(): Promise<number> {
        if (!user.value) return 0
        const { data } = await client
            .from('profiles')
            .select('xp_total')
            .eq('id', user.value.id)
            .single()
        return data?.xp_total || 0
    }

    async function getCurrentLevel(): Promise<{ level: number; name: string; xp: number }> {
        const xp = await getTotalXP()
        const level = getLevelFromXP(xp)
        return { level, name: getLevelName(level), xp }
    }

    return {
        XP_VALUES,
        getLevelFromXP,
        getLevelName,
        getXPForNextLevel,
        awardXP,
        awardWatchXP,
        getTotalXP,
        getCurrentLevel,
    }
}
