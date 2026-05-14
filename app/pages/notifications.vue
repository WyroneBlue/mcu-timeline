<template>
    <div class="max-w-4xl mx-auto px-4 sm:px-6 space-y-6 pb-24">
        <div class="pt-4">
            <h1 class="font-display text-3xl tracking-wider text-white mb-1">{{ $t('notifications.title') }}</h1>
            <p class="text-white/30 text-sm">{{ $t('notifications.subtitle') }}</p>
        </div>

        <!-- Upcoming releases -->
        <div v-if="upcomingReleases.length > 0">
            <h2 class="font-display text-lg tracking-wider text-white/60 mb-3">{{ $t('notifications.upcoming') }}</h2>
            <div class="space-y-2">
                <NuxtLink
                    v-for="release in upcomingReleases"
                    :key="release.slug"
                    :to="`/title/${release.slug}`"
                    class="glass-card p-4 flex items-center gap-4 hover:border-white/15 transition-colors block"
                >
                    <div class="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                        <svg class="w-5 h-5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0118 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 016 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25C6 11.496 5.496 12 4.875 12M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m-12 5.25v-5.25m0 5.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125m-12 0v-1.5c0-.621-.504-1.125-1.125-1.125M18 18.375v-5.25m0 5.25v-1.5c0-.621.504-1.125 1.125-1.125M18 13.125v1.5c0 .621.504 1.125 1.125 1.125M18 13.125c0-.621.504-1.125 1.125-1.125M6 13.125v1.5c0 .621-.504 1.125-1.125 1.125M6 13.125C6 12.504 5.496 12 4.875 12m-1.5 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M19.125 12h1.5m0 0c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h1.5m14.25 0h1.5" />
                        </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm text-white/80 truncate">{{ release.title }}</p>
                        <p class="text-xs text-white/30">{{ formatReleaseDate(release.release_date) }}</p>
                    </div>
                    <span class="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0" :style="{ backgroundColor: currentTheme.accentColor + '1A', color: currentTheme.accentColor + 'B3', borderColor: currentTheme.accentColor + '33' }">
                        {{ release.release_status === 'announced' ? $t('notifications.announced') : $t('notifications.comingSoon') }}
                    </span>
                </NuxtLink>
            </div>
        </div>

        <!-- Notifications list -->
        <div>
            <h2 v-if="upcomingReleases.length > 0" class="font-display text-lg tracking-wider text-white/60 mb-3">{{ $t('notifications.alerts') }}</h2>

            <div v-if="notifications.length === 0" class="glass-card p-8 text-center">
                <svg class="w-10 h-10 text-white/10 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
                <p class="text-white/40 text-sm">{{ $t('notifications.noAlerts') }}</p>
                <p class="text-white/20 text-xs mt-1">{{ $t('notifications.alertsDesc') }}</p>
            </div>

            <div v-else class="space-y-2">
                <button
                    v-if="hasUnread"
                    class="text-xs text-white/30 hover:text-white/50 transition-colors mb-2"
                    @click="handleMarkAllRead"
                >
                    {{ $t('notifications.markAllRead') }}
                </button>
                <div
                    v-for="n in notifications"
                    :key="n.id"
                    :class="[
                        'glass-card p-4 flex items-start gap-4 transition-colors cursor-pointer',
                        !n.read && 'border-l-2 border-l-green-500/50',
                    ]"
                    @click="handleRead(n)"
                >
                    <div :class="['w-2 h-2 rounded-full mt-2 shrink-0', n.read ? 'bg-white/10' : 'bg-green-500']" />
                    <div class="flex-1 min-w-0">
                        <p class="text-sm text-white/80">{{ n.title }}</p>
                        <p class="text-xs text-white/30 mt-1">{{ n.message }}</p>
                    </div>
                    <span class="text-[10px] text-white/20 font-mono shrink-0">{{ formatDate(n.created_at) }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ ssr: false })

import mcuTitlesJson from '../../data/mcu-titles.json'

const { t, locale } = useI18n()
const { currentTheme } = useSettings()
const notifications = ref<any[]>([])

const upcomingReleases = computed(() => {
    return (mcuTitlesJson as any[])
        .filter(t => t.release_status === 'upcoming' || t.release_status === 'announced')
        .sort((a, b) => {
            if (!a.release_date) return 1
            if (!b.release_date) return -1
            return new Date(a.release_date).getTime() - new Date(b.release_date).getTime()
        })
})

const hasUnread = computed(() => notifications.value.some(n => !n.read))

function formatDate(date: string): string {
    return new Date(date).toLocaleDateString(locale.value, { day: 'numeric', month: 'short' })
}

function formatReleaseDate(date: string | null): string {
    if (!date) return t('common.dateUnknown')
    return new Date(date).toLocaleDateString(locale.value, { day: 'numeric', month: 'long', year: 'numeric' })
}

async function handleRead(n: any) {
    if (n.read) return
    try {
        const { markAsRead } = useNotifications()
        await markAsRead(n.id)
        n.read = true
    } catch { /* silent */ }
}

async function handleMarkAllRead() {
    try {
        const { markAllAsRead } = useNotifications()
        await markAllAsRead()
        notifications.value.forEach(n => { n.read = true })
    } catch { /* silent */ }
}

onMounted(async () => {
    try {
        const { getNotifications } = useNotifications()
        notifications.value = await getNotifications()
    } catch { /* no notifications */ }
})
</script>
