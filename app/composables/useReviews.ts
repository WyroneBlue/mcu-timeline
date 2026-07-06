import type { Database } from '~/types/supabase'

export interface ApprovedReview {
    id: number
    user_id: string
    title_id: number
    body: string
    locale: string
    created_at: string
    updated_at: string
    profiles: { username: string | null, avatar_url: string | null } | null
}

export type MyReview = Database['public']['Tables']['reviews']['Row']

export function useReviews() {
    const client = useSupabaseClient<Database>()
    const user = useSupabaseUser()

    async function authedFetch<T>(path: string, options: { method?: 'POST' | 'PUT' | 'DELETE', body?: Record<string, unknown> } = {}): Promise<T> {
        const { data: { session } } = await client.auth.getSession()
        if (!session) throw new Error('Not authenticated')

        return $fetch<T>(path, {
            ...options,
            headers: {
                Authorization: `Bearer ${session.access_token}`,
            },
        })
    }

    async function getApprovedReviews(titleId: number): Promise<ApprovedReview[]> {
        return $fetch<ApprovedReview[]>('/api/reviews', { query: { title_id: titleId } })
    }

    async function getMyReview(titleId: number): Promise<MyReview | null> {
        if (!user.value) return null
        const { data, error } = await client
            .from('reviews')
            .select('*')
            .eq('user_id', user.value.id)
            .eq('title_id', titleId)
            .maybeSingle()
        if (error) throw error
        return data
    }

    async function submitReview(titleId: number, body: string, locale: string): Promise<{ review: MyReview, status: string }> {
        return authedFetch<{ review: MyReview, status: string }>('/api/reviews', {
            method: 'POST',
            body: { title_id: titleId, body, locale },
        })
    }

    async function reportReview(id: number, reason?: string): Promise<{ report_count: number, status: string }> {
        return authedFetch<{ report_count: number, status: string }>(`/api/reviews/${id}/report`, {
            method: 'POST',
            body: { reason: reason || null },
        })
    }

    async function deleteMyReview(id: number): Promise<void> {
        if (!user.value) return
        const { error } = await client
            .from('reviews')
            .delete()
            .eq('id', id)
            .eq('user_id', user.value.id)
        if (error) throw error
    }

    return {
        getApprovedReviews,
        getMyReview,
        submitReview,
        reportReview,
        deleteMyReview,
    }
}
