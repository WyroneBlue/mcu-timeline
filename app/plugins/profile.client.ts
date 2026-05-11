export default defineNuxtPlugin(async () => {
    const client = useSupabaseClient()
    const user = useSupabaseUser()

    watch(user, async (newUser) => {
        if (newUser) {
            try {
                await client.from('profiles').upsert({
                    id: newUser.id,
                    username: newUser.user_metadata?.user_name || newUser.email?.split('@')[0] || 'Nieuwe gebruiker',
                    avatar_url: newUser.user_metadata?.avatar_url,
                }, { onConflict: 'id', ignoreDuplicates: true })
            } catch {
                // Profile creation may fail with placeholder Supabase
            }
        }
    }, { immediate: true })
})

