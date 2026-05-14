export function useAdmin() {
    const client = useSupabaseClient()
    const user = useSupabaseUser()
    const isAdmin = useState<boolean | null>('is-admin', () => null)

    const isAuthenticated = computed(() => !!user.value && isAdmin.value === true)
    const isLoading = computed(() => !!user.value && isAdmin.value === null)

    async function checkAdmin() {
        if (!user.value) {
            isAdmin.value = false
            return
        }
        const { data } = await client
            .from('profiles')
            .select('is_admin')
            .eq('id', user.value.id)
            .single()
        isAdmin.value = data?.is_admin ?? false
    }

    async function adminFetch<T>(path: string, options: any = {}): Promise<T> {
        const { data: { session } } = await client.auth.getSession()
        if (!session) throw new Error('Not authenticated')

        return $fetch<T>(path, {
            ...options,
            headers: {
                ...options.headers,
                Authorization: `Bearer ${session.access_token}`,
            },
        })
    }

    return { isAuthenticated, isLoading, isAdmin, checkAdmin, adminFetch }
}
