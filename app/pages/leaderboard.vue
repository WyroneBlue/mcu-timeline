<template>
    <div class="max-w-4xl mx-auto px-4 sm:px-6 space-y-6 pb-24">
        <div class="pt-4">
            <h1 class="font-display text-3xl tracking-wider text-white mb-1">LEADERBOARD</h1>
            <p class="text-white/30 text-sm">Zie hoe je presteert ten opzichte van andere MCU-fans.</p>
        </div>

        <!-- Your rank -->
        <div v-if="myRank" class="glass-card-accent p-5">
            <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                    <span class="font-display text-lg text-white">{{ myRank.initial }}</span>
                </div>
                <div class="flex-1 min-w-0">
                    <span class="text-sm text-white font-medium block truncate">{{ myRank.username }}</span>
                    <span class="text-xs text-white/30">{{ myRank.levelName }} · Lvl {{ myRank.level }}</span>
                </div>
                <div class="text-right shrink-0">
                    <span class="font-mono text-lg text-white">{{ myRank.xp.toLocaleString() }}</span>
                    <span class="text-xs text-white/30 block">XP</span>
                </div>
                <div class="w-10 text-center shrink-0">
                    <span class="font-display text-2xl" :class="rankColor(myRank.rank)">{{ myRank.rank }}</span>
                </div>
            </div>
        </div>

        <!-- Top players -->
        <div class="space-y-2">
            <div
                v-for="(player, i) in leaderboard"
                :key="player.id"
                :class="[
                    'glass-card p-4 flex items-center gap-4 transition-colors',
                    player.isMe && 'border-white/15 bg-white/5',
                ]"
            >
                <!-- Rank -->
                <div class="w-8 text-center shrink-0">
                    <span v-if="i < 3" class="font-display text-2xl" :class="rankColor(i + 1)">
                        {{ i + 1 }}
                    </span>
                    <span v-else class="font-mono text-sm text-white/30">{{ i + 1 }}</span>
                </div>

                <!-- Avatar -->
                <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0" :class="i < 3 ? avatarBg(i) : 'bg-white/5 border border-white/10'">
                    <span class="font-display text-lg" :class="i < 3 ? 'text-white' : 'text-white/40'">
                        {{ player.initial }}
                    </span>
                </div>

                <!-- Info -->
                <div class="flex-1 min-w-0">
                    <span class="text-sm text-white font-medium block truncate">{{ player.username }}</span>
                    <span class="text-xs text-white/30">{{ player.levelName }} · Lvl {{ player.level }}</span>
                </div>

                <!-- XP -->
                <div class="text-right shrink-0">
                    <span class="font-mono text-sm text-white">{{ player.xp.toLocaleString() }}</span>
                    <span class="text-[10px] text-white/20 ml-1">XP</span>
                </div>
            </div>
        </div>

        <!-- Empty state (no Supabase) -->
        <div v-if="leaderboard.length === 0 && !loading" class="glass-card p-8 text-center">
            <svg class="w-10 h-10 text-white/10 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.003 6.003 0 01-5.54 0" />
            </svg>
            <p class="text-white/40 text-sm">Nog geen spelers op het leaderboard.</p>
            <p class="text-white/20 text-xs mt-1">Verdien XP door titels te kijken en quizzes te doen.</p>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="flex justify-center py-8">
            <div class="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
        </div>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ ssr: false })

import type { Database } from '~/types/supabase'

interface LeaderboardEntry {
    id: string
    username: string
    initial: string
    xp: number
    level: number
    levelName: string
    isMe: boolean
}

const client = useSupabaseClient<Database>()
const user = useSupabaseUser()
const { getLevelFromXP, getLevelName } = useXP()

const loading = ref(true)
const leaderboard = ref<LeaderboardEntry[]>([])

const myRank = computed(() => {
    if (!user.value) return null
    const idx = leaderboard.value.findIndex(p => p.isMe)
    if (idx === -1) return null
    return { ...leaderboard.value[idx], rank: idx + 1 }
})

function rankColor(rank: number): string {
    if (rank === 1) return 'text-yellow-400'
    if (rank === 2) return 'text-gray-300'
    if (rank === 3) return 'text-amber-600'
    return 'text-white/30'
}

function avatarBg(index: number): string {
    if (index === 0) return 'bg-yellow-500/20 border border-yellow-500/30'
    if (index === 1) return 'bg-gray-300/10 border border-gray-300/20'
    return 'bg-amber-600/10 border border-amber-600/20'
}

onMounted(async () => {
    try {
        const { data } = await client
            .from('profiles')
            .select('id, username, xp_total, level_int')
            .order('xp_total', { ascending: false })
            .limit(50)

        if (data) {
            leaderboard.value = data.map(p => {
                const level = p.level_int || getLevelFromXP(p.xp_total || 0)
                const name = p.username || 'Anoniem'
                return {
                    id: p.id,
                    username: name,
                    initial: name.charAt(0).toUpperCase(),
                    xp: p.xp_total || 0,
                    level,
                    levelName: getLevelName(level),
                    isMe: p.id === user.value?.id,
                }
            })
        }
    } catch {
        // Supabase unavailable
    } finally {
        loading.value = false
    }
})
</script>
