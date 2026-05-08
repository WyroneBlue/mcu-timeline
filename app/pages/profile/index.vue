<template>
    <div class="max-w-4xl mx-auto space-y-6">
        <div class="text-center space-y-4">
            <div
                class="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto">
                <UIcon name="i-heroicons-user" class="w-10 h-10 text-white" />
            </div>
            <h1 class="text-3xl font-bold text-gray-900">Mijn Profiel</h1>
            <p class="text-gray-600">Bekijk je voortgang en prestaties</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- XP & Levels -->
            <UCard class="card-hover">
                <template #header>
                    <div class="flex items-center space-x-2">
                        <UIcon name="i-heroicons-chart-bar" class="w-5 h-5 text-blue-600" />
                        <h2 class="text-xl font-semibold">XP & Levels</h2>
                    </div>
                </template>
                <div class="space-y-4">
                    <div class="text-center">
                        <div class="text-4xl font-bold text-blue-600 mb-2">{{ totalXp }}</div>
                        <p class="text-gray-600">Totaal XP</p>
                    </div>
                    <div class="space-y-2">
                        <div class="flex justify-between text-sm">
                            <span>Level {{ currentLevel }}</span>
                            <span>{{ xpToNext }} XP naar volgende level</span>
                        </div>
                        <UProgress :value="levelProgress" size="lg" color="primary" />
                    </div>
                </div>
            </UCard>

            <!-- Badges -->
            <UCard class="card-hover">
                <template #header>
                    <div class="flex items-center space-x-2">
                        <UIcon name="i-heroicons-trophy" class="w-5 h-5 text-yellow-600" />
                        <h2 class="text-xl font-semibold">Badges</h2>
                    </div>
                </template>
                <div class="space-y-4">
                    <div v-if="badges.length === 0" class="text-center py-4">
                        <UIcon name="i-heroicons-trophy" class="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p class="text-gray-500">Nog geen badges verdiend</p>
                        <p class="text-sm text-gray-400">Bekijk films om je eerste badge te verdienen!</p>
                    </div>
                    <div v-else class="grid grid-cols-2 gap-3">
                        <div v-for="badge in badges" :key="badge.id"
                            class="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                            <div class="text-center">
                                <div class="text-2xl mb-1">🏆</div>
                                <p class="text-sm font-medium text-gray-900">{{ badge.name }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </UCard>
        </div>

        <!-- Recent Activity -->
        <UCard class="card-hover">
            <template #header>
                <div class="flex items-center space-x-2">
                    <UIcon name="i-heroicons-clock" class="w-5 h-5 text-green-600" />
                    <h2 class="text-xl font-semibold">Recente Activiteit</h2>
                </div>
            </template>
            <div class="space-y-3">
                <div class="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-green-600" />
                    <div>
                        <p class="font-medium text-gray-900">Eerste film bekeken!</p>
                        <p class="text-sm text-gray-600">+120 XP verdiend</p>
                    </div>
                </div>
                <div class="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <UIcon name="i-heroicons-trophy" class="w-5 h-5 text-blue-600" />
                    <div>
                        <p class="font-medium text-gray-900">Badge verdiend: First Watch</p>
                        <p class="text-sm text-gray-600">Je eerste titel gemarkeerd als bekeken</p>
                    </div>
                </div>
            </div>
        </UCard>
    </div>
</template>

<script setup lang="ts">
const client = useSupabaseClient()
const user = useSupabaseUser()

type Badge = { id: number; name: string }
const { data: badgeData } = await useAsyncData('badges', async () => {
    if (!user.value) return [] as Badge[]
    const { data } = await client
        .from('user_badges')
        .select('badge_id, badges(name, id)')
        .select('badges!inner(id, name)')
    // Some drivers require explicit join; fall back to a direct badges read
    if (!data || !Array.isArray(data)) {
        const { data: all } = await client.from('badges').select('id, name')
        return (all || []) as Badge[]
    }
    return (data as Array<{ badges: { id: number; name: string } }>).map((r) => ({ id: r.badges.id, name: r.badges.name })) as Badge[]
})
const badges = computed(() => badgeData.value || [])

const { data: xpData } = await useAsyncData('xp', async () => {
    if (!user.value) return 0
    // Fallback: sum client-side
    const { data: events } = await client.from('xp_events').select('xp_delta')
    return ((events || []) as { xp_delta: number }[]).reduce((s, e) => s + (e.xp_delta || 0), 0)
})
const totalXp = computed(() => xpData.value || 0)

// Simple level calculation
const currentLevel = computed(() => Math.floor(totalXp.value / 1000) + 1)
const xpToNext = computed(() => 1000 - (totalXp.value % 1000))
const levelProgress = computed(() => (totalXp.value % 1000) / 10)
</script>