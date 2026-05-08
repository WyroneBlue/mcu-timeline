<template>
    <div class="max-w-6xl mx-auto space-y-6">
        <div class="text-center space-y-4">
            <h1 class="text-3xl font-bold text-gray-900">Leaderboard</h1>
            <p class="text-gray-600">Zie hoe je presteert ten opzichte van andere MCU-fans</p>
        </div>

        <!-- Time Period Tabs -->
        <div class="flex justify-center">
            <UTabs :items="timePeriods" v-model="selectedPeriod" class="w-full max-w-md">
                <template #default="{ item }">
                    <div class="flex items-center space-x-2">
                        <UIcon :name="item.icon" class="w-4 h-4" />
                        <span>{{ item.label }}</span>
                    </div>
                </template>
            </UTabs>
        </div>

        <!-- Leaderboard Content -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Main Leaderboard -->
            <div class="lg:col-span-2">
                <UCard class="card-hover">
                    <template #header>
                        <div class="flex items-center justify-between">
                            <h2 class="text-xl font-semibold">Top Spelers</h2>
                            <UBadge color="primary" variant="soft">{{ leaderboard.length }}</UBadge>
                        </div>
                    </template>
                    <div class="space-y-3">
                        <div v-if="leaderboard.length === 0" class="text-center py-8">
                            <UIcon name="i-heroicons-trophy" class="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 class="text-lg font-semibold text-gray-900 mb-2">Geen data</h3>
                            <p class="text-gray-600">Er zijn nog geen scores beschikbaar voor deze periode.</p>
                        </div>
                        <div v-else class="space-y-2">
                            <div v-for="(player, index) in leaderboard" :key="player.id" :class="[
                                'flex items-center justify-between p-4 rounded-lg transition-colors',
                                index === 0 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200' :
                                    index === 1 ? 'bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200' :
                                        index === 2 ? 'bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200' :
                                            'bg-gray-50 border border-gray-100'
                            ]">
                                <div class="flex items-center space-x-4">
                                    <div class="flex-shrink-0">
                                        <div v-if="index < 3"
                                            class="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                                            :class="index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'">
                                            {{ index + 1 }}
                                        </div>
                                        <div v-else
                                            class="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold text-sm">
                                            {{ index + 1 }}
                                        </div>
                                    </div>
                                    <div>
                                        <p class="font-semibold text-gray-900">{{ player.username || 'Anonieme speler'
                                            }}</p>
                                        <p class="text-sm text-gray-600">{{ player.total_xp }} XP</p>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <div class="flex items-center space-x-2">
                                        <UIcon name="i-heroicons-trophy" class="w-4 h-4 text-yellow-500" />
                                        <span class="font-semibold">{{ player.badges_count }}</span>
                                    </div>
                                    <p class="text-xs text-gray-500">badges</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </UCard>
            </div>

            <!-- Sidebar Stats -->
            <div class="space-y-6">
                <UCard class="card-hover">
                    <template #header>
                        <h2 class="text-xl font-semibold">Jouw Positie</h2>
                    </template>
                    <div class="text-center space-y-4">
                        <div v-if="userRank" class="space-y-2">
                            <div class="text-4xl font-bold text-blue-600">#{{ userRank.rank }}</div>
                            <p class="text-gray-600">van {{ leaderboard.length }} spelers</p>
                            <div class="text-2xl font-semibold">{{ userRank.total_xp }} XP</div>
                        </div>
                        <div v-else class="text-center py-4">
                            <UIcon name="i-heroicons-user" class="w-12 h-12 text-gray-300 mx-auto mb-2" />
                            <p class="text-gray-500">Nog niet ingelogd</p>
                        </div>
                    </div>
                </UCard>

                <UCard class="card-hover">
                    <template #header>
                        <h2 class="text-xl font-semibold">Statistieken</h2>
                    </template>
                    <div class="space-y-4">
                        <div class="flex justify-between">
                            <span class="text-gray-600">Totaal spelers</span>
                            <span class="font-semibold">{{ leaderboard.length }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Gemiddelde XP</span>
                            <span class="font-semibold">{{ averageXp }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Hoogste score</span>
                            <span class="font-semibold">{{ maxXp }}</span>
                        </div>
                    </div>
                </UCard>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const client = useSupabaseClient()
const user = useSupabaseUser()

const timePeriods = [
    { key: 'all', label: 'Alles', icon: 'i-heroicons-clock' },
    { key: 'week', label: 'Deze week', icon: 'i-heroicons-calendar-days' },
    { key: 'month', label: 'Deze maand', icon: 'i-heroicons-calendar' }
]

const selectedPeriod = ref('all')

type LeaderboardEntry = {
    id: string
    username: string | null
    total_xp: number
    badges_count: number
}

const { data: leaderboardData, refresh } = await useAsyncData('leaderboard', async () => {
    // Mock data for now - in real app, this would query Supabase
    return [
        { id: '1', username: 'MCU_Master', total_xp: 15420, badges_count: 12 },
        { id: '2', username: 'IronManFan', total_xp: 12850, badges_count: 8 },
        { id: '3', username: 'SpiderManLover', total_xp: 11200, badges_count: 10 },
        { id: '4', username: 'ThorFan', total_xp: 9800, badges_count: 6 },
        { id: '5', username: 'CapAmerica', total_xp: 8750, badges_count: 7 }
    ] as LeaderboardEntry[]
})

const leaderboard = computed(() => leaderboardData.value || [])

const userRank = computed(() => {
    if (!user.value) return null
    // Mock user rank - in real app, calculate from actual data
    return { rank: 3, total_xp: 11200 }
})

const averageXp = computed(() => {
    if (leaderboard.value.length === 0) return 0
    const total = leaderboard.value.reduce((sum, player) => sum + player.total_xp, 0)
    return Math.round(total / leaderboard.value.length)
})

const maxXp = computed(() => {
    if (leaderboard.value.length === 0) return 0
    return Math.max(...leaderboard.value.map(player => player.total_xp))
})
</script>
