import type { Database } from '~/types/supabase'

type ProgressStatus = 'queued' | 'watching' | 'watched' | 'skipped'
type ProgressRow = Database['public']['Tables']['progress']['Row']

export function useProgress() {
    const client = useSupabaseClient<Database>()
    const user = useSupabaseUser()

    async function getProgressForUser() {
        if (!user.value) return []
        const { data, error } = await client
            .from('progress')
            .select('*')
            .eq('user_id', user.value.id)
        if (error) throw error
        return data as ProgressRow[]
    }

    async function getWatchedTitleIds(): Promise<Set<number>> {
        const progress = await getProgressForUser()
        return new Set(
            progress
                .filter(p => p.status === 'watched')
                .map(p => p.title_id)
        )
    }

    async function getSkippedTitleIds(): Promise<Set<number>> {
        const progress = await getProgressForUser()
        return new Set(
            progress
                .filter(p => p.status === 'skipped')
                .map(p => p.title_id)
        )
    }

    async function setStatus(titleId: number, status: ProgressStatus) {
        if (!user.value) return
        const payload: Record<string, any> = {
            user_id: user.value.id,
            title_id: titleId,
            status,
        }
        if (status === 'watched') {
            payload.watched_at = new Date().toISOString()
        }
        const { error } = await client
            .from('progress')
            .upsert(payload, { onConflict: 'user_id,title_id' })
        if (error) throw error
    }

    async function markWatched(titleId: number) {
        await setStatus(titleId, 'watched')
    }

    async function markSkipped(titleId: number) {
        await setStatus(titleId, 'skipped')
    }

    async function getProgressPercent(titles: { id: number }[]): Promise<number> {
        if (!user.value || titles.length === 0) return 0
        const watched = await getWatchedTitleIds()
        const count = titles.filter(t => watched.has(t.id)).length
        return Math.round((count / titles.length) * 100)
    }

    async function getNextUp(titles: { id: number; chronology_index: number | null }[]) {
        if (!user.value) return titles[0] || null
        const progress = await getProgressForUser()
        const doneIds = new Set(
            progress
                .filter(p => p.status === 'watched' || p.status === 'skipped')
                .map(p => p.title_id)
        )
        const sorted = [...titles].sort((a, b) => (a.chronology_index || 0) - (b.chronology_index || 0))
        return sorted.find(t => !doneIds.has(t.id)) || null
    }

    async function getRemainingWatchTime(titles: { id: number; runtime_minutes: number | null }[]): Promise<number> {
        const watched = await getWatchedTitleIds()
        return titles
            .filter(t => !watched.has(t.id))
            .reduce((sum, t) => sum + (t.runtime_minutes || 0), 0)
    }

    return {
        getProgressForUser,
        getWatchedTitleIds,
        getSkippedTitleIds,
        setStatus,
        markWatched,
        markSkipped,
        getProgressPercent,
        getNextUp,
        getRemainingWatchTime,
    }
}
