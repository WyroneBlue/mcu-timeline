import type { Database } from '~/types/supabase'

type Notification = Database['public']['Tables']['notifications']['Row']

export function useNotifications() {
    const client = useSupabaseClient<Database>()
    const user = useSupabaseUser()

    const unreadCount = useState<number>('notification-unread', () => 0)

    async function getNotifications(limit = 20): Promise<Notification[]> {
        if (!user.value) return []
        const { data, error } = await client
            .from('notifications')
            .select('*')
            .eq('user_id', user.value.id)
            .order('created_at', { ascending: false })
            .limit(limit)
        if (error) throw error
        return data as Notification[]
    }

    async function getUnreadCount(): Promise<number> {
        if (!user.value) return 0
        const { count, error } = await client
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.value.id)
            .eq('read', false)
        if (error) throw error
        unreadCount.value = count || 0
        return count || 0
    }

    async function markAsRead(notificationId: number) {
        if (!user.value) return
        await client
            .from('notifications')
            .update({ read: true })
            .eq('id', notificationId)
            .eq('user_id', user.value.id)
        await getUnreadCount()
    }

    async function markAllAsRead() {
        if (!user.value) return
        await client
            .from('notifications')
            .update({ read: true })
            .eq('user_id', user.value.id)
            .eq('read', false)
        unreadCount.value = 0
    }

    return {
        unreadCount: readonly(unreadCount),
        getNotifications,
        getUnreadCount,
        markAsRead,
        markAllAsRead,
    }
}
