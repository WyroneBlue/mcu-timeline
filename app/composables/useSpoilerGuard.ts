import type { Database } from '~/types/supabase'

export function useSpoilerGuard() {
    const client = useSupabaseClient<Database>()
    const user = useSupabaseUser()

    const spoilerMode = useState<'smart' | 'reveal_all'>('spoiler-mode', () => 'smart')

    async function loadSpoilerPreference() {
        if (!user.value) return
        const { data } = await client
            .from('profiles')
            .select('spoiler_mode')
            .eq('id', user.value.id)
            .single()
        if (data?.spoiler_mode) {
            spoilerMode.value = data.spoiler_mode as 'smart' | 'reveal_all'
        }
    }

    async function toggleSpoilerMode() {
        const newMode = spoilerMode.value === 'smart' ? 'reveal_all' : 'smart'
        spoilerMode.value = newMode

        if (user.value) {
            await client
                .from('profiles')
                .update({ spoiler_mode: newMode })
                .eq('id', user.value.id)
        }
    }

    function canReveal(titleId: number, watchedIds: Set<number>): boolean {
        if (spoilerMode.value === 'reveal_all') return true
        return watchedIds.has(titleId)
    }

    function isRevealed(titleId: number, watchedIds: Set<number>): boolean {
        return canReveal(titleId, watchedIds)
    }

    return {
        spoilerMode: readonly(spoilerMode),
        loadSpoilerPreference,
        toggleSpoilerMode,
        canReveal,
        isRevealed,
    }
}
