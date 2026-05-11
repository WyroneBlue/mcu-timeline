export function useAuth() {
    const user = useSupabaseUser()
    const client = useSupabaseClient()

    const isLoggedIn = computed(() => !!user.value)

    async function signOut() {
        await client.auth.signOut()
        await navigateTo('/login')
    }

    async function requireAuth() {
        if (!user.value) {
            await navigateTo('/login')
            return false
        }
        return true
    }

    return {
        user,
        isLoggedIn,
        signOut,
        requireAuth,
    }
}
