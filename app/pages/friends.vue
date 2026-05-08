<template>
    <div class="max-w-4xl mx-auto space-y-6">
        <div class="text-center space-y-4">
            <h1 class="text-3xl font-bold text-gray-900">Vrienden</h1>
            <p class="text-gray-600">Voeg vrienden toe en vergelijk je voortgang</p>
        </div>

        <!-- Add Friend Form -->
        <UCard class="card-hover">
            <template #header>
                <h2 class="text-xl font-semibold">Vriend toevoegen</h2>
            </template>
            <form @submit.prevent="add" class="space-y-4">
                <UFormGroup label="Friend UUID" required>
                    <UInput v-model="friendId" placeholder="Voer de UUID van je vriend in" :disabled="isAdding" />
                </UFormGroup>
                <UButton type="submit" color="primary" :loading="isAdding" :disabled="!friendId.trim()">
                    <UIcon name="i-heroicons-user-plus" class="w-4 h-4 mr-2" />
                    Vriend toevoegen
                </UButton>
            </form>
        </UCard>

        <!-- Friends List -->
        <UCard class="card-hover">
            <template #header>
                <div class="flex items-center justify-between">
                    <h2 class="text-xl font-semibold">Mijn Vrienden</h2>
                    <UBadge color="blue" variant="soft">{{ list.length }}</UBadge>
                </div>
            </template>
            <div class="space-y-3">
                <div v-if="list.length === 0" class="text-center py-8">
                    <UIcon name="i-heroicons-users" class="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">Nog geen vrienden</h3>
                    <p class="text-gray-600">Voeg je eerste vriend toe om je voortgang te vergelijken!</p>
                </div>
                <div v-else class="space-y-3">
                    <div v-for="friend in list" :key="friend.friend_id"
                        class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div class="flex items-center space-x-3">
                            <div
                                class="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                <span class="text-white font-bold text-sm">{{ friend.friend_id.slice(0, 2).toUpperCase()
                                    }}</span>
                            </div>
                            <div>
                                <p class="font-medium text-gray-900">{{ friend.friend_id }}</p>
                                <p class="text-sm text-gray-500">Toegevoegd {{ formatDate(friend.created_at) }}</p>
                            </div>
                        </div>
                        <div class="flex items-center space-x-2">
                            <UBadge :color="friend.status === 'accepted' ? 'green' : 'yellow'" variant="soft">
                                {{ friend.status === 'accepted' ? 'Geaccepteerd' : 'In behandeling' }}
                            </UBadge>
                            <UButton v-if="friend.status === 'pending'" variant="ghost" color="gray" size="sm"
                                @click="removeFriend(friend.friend_id)">
                                <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
                            </UButton>
                        </div>
                    </div>
                </div>
            </div>
        </UCard>
    </div>
</template>

<script setup lang="ts">
const client = useSupabaseClient()
const user = useSupabaseUser()
const friendId = ref('')
const isAdding = ref(false)

const { data, refresh } = await useAsyncData('friends', async () => {
    if (!user.value) return []
    const { data } = await client
        .from('friends')
        .select('friend_id, status, created_at')
        .order('created_at', { ascending: false })
    return data || []
})
const list = computed(() => data.value || [])

async function add() {
    if (!user.value || !friendId.value.trim()) return
    isAdding.value = true
    try {
        await client.from('friends').upsert({
            user_id: user.value.id,
            friend_id: friendId.value.trim(),
            status: 'pending'
        })
        friendId.value = ''
        await refresh()
    } catch (error) {
        console.error('Error adding friend:', error)
    } finally {
        isAdding.value = false
    }
}

async function removeFriend(friendId: string) {
    if (!user.value) return
    try {
        await client.from('friends').delete().eq('user_id', user.value.id).eq('friend_id', friendId)
        await refresh()
    } catch (error) {
        console.error('Error removing friend:', error)
    }
}

function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('nl-NL')
}
</script>