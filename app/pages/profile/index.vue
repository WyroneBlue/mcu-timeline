<template>
    <div class="max-w-4xl mx-auto px-4 sm:px-6 space-y-8 pb-24">
        <!-- Hero section -->
        <div class="text-center pt-8">
            <div class="relative inline-block mb-4">
                <div class="w-24 h-24 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center">
                    <span class="font-display text-4xl text-white">{{ userInitial }}</span>
                </div>
                <div class="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-[10px] font-mono text-white/60">
                    {{ $t('profile.lvl') }} {{ level }}
                </div>
            </div>
            <h1 class="font-display text-3xl sm:text-4xl tracking-wider text-white mb-1">{{ displayName }}</h1>
            <p class="text-white/30 text-sm">{{ levelName }}</p>
        </div>

        <!-- XP Bar -->
        <div class="glass-card p-6">
            <UiXPBar :xp="totalXP" :level="level" :level-name="levelName" />
        </div>

        <!-- Stats grid -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div class="glass-card p-4 text-center">
                <span class="text-xs text-white/30 uppercase tracking-wider block mb-1">{{ $t('profile.watched') }}</span>
                <span class="font-display text-2xl text-white">{{ watchedCount }}</span>
            </div>
            <div class="glass-card p-4 text-center">
                <span class="text-xs text-white/30 uppercase tracking-wider block mb-1">{{ $t('profile.watchTime') }}</span>
                <span class="font-display text-2xl text-white">{{ formattedWatchTime }}</span>
            </div>
            <div class="glass-card p-4 text-center">
                <span class="text-xs text-white/30 uppercase tracking-wider block mb-1">{{ $t('profile.streak') }}</span>
                <span class="font-display text-2xl text-white">{{ streak }}<span class="text-sm text-white/30">d</span></span>
            </div>
            <div class="glass-card p-4 text-center">
                <span class="text-xs text-white/30 uppercase tracking-wider block mb-1">{{ $t('profile.badges') }}</span>
                <span class="font-display text-2xl text-white">{{ earnedBadgeCount }}</span>
            </div>
        </div>

        <!-- Progress overview -->
        <div class="glass-card p-6">
            <h2 class="font-display text-xl tracking-wider text-white mb-4">{{ $t('profile.progress') }}</h2>
            <div class="space-y-3">
                <div v-for="phase in phaseProgress" :key="phase.number" class="flex items-center gap-4">
                    <span class="text-xs text-white/30 font-mono w-16 shrink-0">{{ $t('common.phase') }} {{ phase.number }}</span>
                    <div class="flex-1 relative h-2 rounded-full bg-white/5 overflow-hidden">
                        <div
                            class="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                            :style="{ width: phase.percent + '%', background: phaseColor(phase.number) }"
                        />
                    </div>
                    <span class="text-xs text-white/30 font-mono w-16 text-right">{{ phase.watched }}/{{ phase.total }}</span>
                </div>
            </div>
        </div>

        <!-- Recent Activity -->
        <div v-if="recentActivity.length > 0" class="glass-card p-6">
            <h2 class="font-display text-xl tracking-wider text-white mb-4">{{ $t('profile.recentActivity') }}</h2>
            <div class="space-y-3">
                <div
                    v-for="(event, i) in recentActivity"
                    :key="i"
                    class="flex items-center gap-3 text-sm"
                >
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" :class="activityBg(event.type)">
                        <span class="text-xs">{{ activityIcon(event.type) }}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                        <span class="text-white/60">{{ activityLabel(event) }}</span>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                        <span class="font-mono text-xs text-green-400">+{{ event.xp }}XP</span>
                        <span class="text-[10px] text-white/20">{{ formatTimeAgo(event.date) }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Badges -->
        <div>
            <h2 class="font-display text-xl tracking-wider text-white mb-4">{{ $t('profile.badges') }}</h2>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                <UiBadgeCard
                    v-for="badge in allBadges"
                    :key="badge.code"
                    :icon="badge.icon"
                    :name="badge.name"
                    :description="badge.description"
                    :earned="earnedCodes.has(badge.code)"
                    :awarded-at="getBadgeDate(badge.code)"
                />
            </div>
        </div>

        <!-- Settings -->
        <div>
            <h2 class="font-display text-xl tracking-wider text-white mb-4">{{ $t('profile.settings') }}</h2>

            <!-- Spoiler toggle (kept in its own card) -->
            <div class="glass-card p-5 mb-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-white/80">{{ $t('profile.spoilerProtection') }}</p>
                        <p class="text-xs text-white/30">{{ spoilerMode === 'smart' ? $t('profile.spoilerSmart') : $t('profile.spoilerOff') }}</p>
                    </div>
                    <button
                        :class="[
                            'px-4 py-1.5 rounded-lg text-xs font-medium transition-colors',
                            spoilerMode === 'smart'
                                ? 'bg-white/10 text-white border border-white/10'
                                : 'bg-white/5 text-white/40 border border-white/5',
                        ]"
                        @click="toggleSpoilerMode"
                    >
                        {{ spoilerMode === 'smart' ? $t('profile.spoilerSmartLabel') : $t('profile.spoilerShowAll') }}
                    </button>
                </div>
            </div>

            <UiSettingsPanel />

            <!-- Sign out -->
            <div class="pt-4 mt-2 border-t border-white/5">
                <button
                    class="text-sm text-white/30 hover:text-red-400 transition-colors"
                    @click="handleSignOut"
                >
                    {{ $t('profile.signOut') }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ ssr: false })

import mcuTitlesJson from '../../../data/mcu-titles.json'

const { t } = useI18n()
const user = useSupabaseUser()
const { getLevelFromXP, getLevelName, getTotalXP } = useXP()
const { signOut } = useAuth()
const { spoilerMode: guardSpoilerMode, toggleSpoilerMode: guardToggleSpoiler } = useSpoilerGuard()

const allTitles = mcuTitlesJson as any[]

const totalXP = ref(0)
const watchedCount = ref(0)
const watchedTotalMinutes = ref(0)
const streak = ref(0)
const earnedCodes = ref(new Set<string>())
const earnedBadges = ref<{ code: string; awarded_at: string }[]>([])
const progressMap = ref<Record<number, string>>({})
const titleIdMap = ref<Map<string, number>>(new Map())
const spoilerMode = guardSpoilerMode

interface ActivityEvent {
    type: 'watch' | 'quiz' | 'badge' | 'streak'
    title?: string
    xp: number
    date: string
}
const recentActivity = ref<ActivityEvent[]>([])

const level = computed(() => getLevelFromXP(totalXP.value))
const levelName = computed(() => getLevelName(level.value))
const displayName = computed(() => user.value?.email?.split('@')[0] || t('profile.user'))
const userInitial = computed(() => displayName.value.charAt(0).toUpperCase())
const earnedBadgeCount = computed(() => earnedCodes.value.size)

const formattedWatchTime = computed(() => {
    const hours = Math.floor(watchedTotalMinutes.value / 60)
    if (hours === 0) return t('profile.timeMinutes', { n: watchedTotalMinutes.value })
    return t('profile.timeHours', { n: hours })
})

const allBadges = computed(() => [
    { code: 'first_watch', name: t('badges.firstWatch'), description: t('badges.firstWatchDesc'), icon: '🎬' },
    { code: 'half_way', name: t('badges.halfway'), description: t('badges.halfwayDesc'), icon: '⚡' },
    { code: 'streak_7', name: t('badges.weekStreak'), description: t('badges.weekStreakDesc'), icon: '🔥' },
    { code: 'binge_master', name: t('badges.bingeMaster'), description: t('badges.bingeMasterDesc'), icon: '🍿' },
    { code: 'completionist', name: t('badges.completionist'), description: t('badges.completionistDesc'), icon: '🏆' },
])

const phaseProgress = computed(() => {
    const phases: { number: number; watched: number; total: number; percent: number }[] = []
    for (let p = 1; p <= 6; p++) {
        const phaseTitles = allTitles.filter(t => {
            const match = t.phase?.match(/\d+/)
            return match && parseInt(match[0]) === p
        })
        const watched = phaseTitles.filter(t => {
            const titleId = titleIdMap.value.get(t.slug)
            return titleId !== undefined && progressMap.value[titleId] === 'watched'
        }).length
        phases.push({
            number: p,
            watched,
            total: phaseTitles.length,
            percent: phaseTitles.length > 0 ? Math.round((watched / phaseTitles.length) * 100) : 0,
        })
    }
    return phases.filter(p => p.total > 0)
})

function phaseColor(n: number): string {
    if (n <= 3) return '#E53E3E'
    if (n <= 5) return '#805AD5'
    return '#38B2AC'
}

function getBadgeDate(code: string): string | undefined {
    return earnedBadges.value.find(b => b.code === code)?.awarded_at
}

function activityIcon(type: string): string {
    const icons: Record<string, string> = { watch: '🎬', quiz: '🧠', badge: '🏅', streak: '🔥' }
    return icons[type] || '⚡'
}

function activityBg(type: string): string {
    const bgs: Record<string, string> = {
        watch: 'bg-green-500/10',
        quiz: 'bg-purple-500/10',
        badge: 'bg-amber-500/10',
        streak: 'bg-orange-500/10',
    }
    return bgs[type] || 'bg-white/5'
}

function activityLabel(event: ActivityEvent): string {
    if (event.type === 'watch') return event.title ? t('profile.titleWatched', { title: event.title }) : t('profile.watchedTitle')
    if (event.type === 'quiz') return t('profile.quizCorrect')
    if (event.type === 'badge') return t('profile.badgeEarned')
    if (event.type === 'streak') return t('profile.streakBonus')
    return t('profile.xpEarned')
}

function formatTimeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return t('profile.timeAgoMinutes', { n: mins })
    const hours = Math.floor(mins / 60)
    if (hours < 24) return t('profile.timeAgoHours', { n: hours })
    const days = Math.floor(hours / 24)
    if (days < 7) return t('profile.timeAgoDays', { n: days })
    return t('profile.timeAgoWeeks', { n: Math.floor(days / 7) })
}

function toggleSpoilerMode() {
    guardToggleSpoiler()
}

async function handleSignOut() {
    try {
        await signOut()
        navigateTo('/login')
    } catch {
        navigateTo('/login')
    }
}

onMounted(async () => {
    if (!user.value) return

    const client = useSupabaseClient()

    try {
        const { data: dbTitles } = await client
            .from('titles')
            .select('id, slug, runtime_minutes, title')
        if (dbTitles && dbTitles.length > 0) {
            for (const t of dbTitles) {
                titleIdMap.value.set(t.slug, t.id)
            }
        } else {
            allTitles.forEach((t: any, i: number) => {
                titleIdMap.value.set(t.slug, i + 1)
            })
        }
    } catch {
        allTitles.forEach((t: any, i: number) => {
            titleIdMap.value.set(t.slug, i + 1)
        })
    }

    try {
        totalXP.value = await getTotalXP()
    } catch { /* no auth */ }

    try {
        const { getProgressForUser } = useProgress()
        const progress = await getProgressForUser()
        const watched = progress.filter(p => p.status === 'watched')
        watchedCount.value = watched.length

        for (const p of progress) {
            progressMap.value[p.title_id] = p.status as string
        }

        const watchedIds = new Set(watched.map(p => p.title_id))
        const idToRuntime = new Map<number, number>()
        for (const t of allTitles) {
            const id = titleIdMap.value.get(t.slug)
            if (id !== undefined) idToRuntime.set(id, t.runtime_minutes || 0)
        }
        watchedTotalMinutes.value = Array.from(watchedIds)
            .reduce((sum, id) => sum + (idToRuntime.get(id) || 0), 0)
    } catch { /* no progress */ }

    try {
        const { data: xpEvents } = await client
            .from('xp_events')
            .select('event_type, xp_delta, created_at, title_id, metadata_json')
            .eq('user_id', user.value.id)
            .order('created_at', { ascending: false })
            .limit(10)

        if (xpEvents) {
            const idToTitle = new Map<number, string>()
            for (const t of allTitles) {
                const id = titleIdMap.value.get(t.slug)
                if (id !== undefined) idToTitle.set(id, t.title)
            }
            recentActivity.value = xpEvents.map(e => ({
                type: e.event_type as ActivityEvent['type'],
                title: e.title_id ? idToTitle.get(e.title_id) || undefined : undefined,
                xp: e.xp_delta,
                date: e.created_at,
            }))
        }
    } catch { /* xp events unavailable */ }

    try {
        const { getUserBadges } = useBadges()
        const badges = await getUserBadges()
        earnedCodes.value = new Set(badges.map(b => b.badge.code))
        earnedBadges.value = badges.map(b => ({ code: b.badge.code, awarded_at: b.awarded_at }))
    } catch { /* no badges */ }

    try {
        const { loadSpoilerPreference } = useSpoilerGuard()
        await loadSpoilerPreference()
    } catch { /* spoiler pref unavailable */ }
})
</script>
