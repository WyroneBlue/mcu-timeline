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
                    level_int: 1,
                    xp_total: 0
                })
            } catch (error) {
                console.error('Error creating profile:', error)
            }
        }
    }, { immediate: true })
})

