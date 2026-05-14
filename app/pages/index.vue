<template>
    <div class="space-y-16 pb-24">
        <!-- Hero -->
        <div class="relative min-h-[80vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
            <!-- Ambient glow -->
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none" :style="{ backgroundColor: currentTheme.accentColor + '0D' }" />

            <div class="relative z-10">
                <img src="~/assets/logo/ck-shield.svg" alt="Canonkeeper" class="w-20 h-20 mx-auto mb-6" />

                <h1 class="font-display text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white mb-3">
                    CANONKEEPER
                </h1>
                <p class="text-sm font-display font-medium tracking-widest uppercase mb-6" :style="{ color: currentTheme.accentColor }">
                    {{ $t('home.tagline') }}
                </p>
                <p class="text-white/40 text-base sm:text-lg max-w-lg mx-auto leading-relaxed mb-10">
                    {{ $t('home.subtitle') }}
                </p>

                <!-- Logged in: quick stats -->
                <div v-if="isLoggedIn" class="space-y-6">
                    <div class="flex items-center justify-center gap-6 text-center">
                        <div>
                            <span class="font-display text-3xl font-bold text-white">{{ watchedCount }}</span>
                            <span class="block text-xs text-white/30 mt-1">{{ $t('home.watched') }}</span>
                        </div>
                        <div class="w-px h-10 bg-white/10" />
                        <div>
                            <span class="font-display text-3xl font-bold text-white">{{ progressPercent }}<span class="text-lg text-white/30">%</span></span>
                            <span class="block text-xs text-white/30 mt-1">{{ $t('home.complete') }}</span>
                        </div>
                        <div class="w-px h-10 bg-white/10" />
                        <div>
                            <span class="font-display text-3xl font-bold text-white">{{ level }}</span>
                            <span class="block text-xs text-white/30 mt-1">{{ levelName }}</span>
                        </div>
                    </div>

                    <div class="flex flex-col sm:flex-row gap-3 justify-center">
                        <NuxtLink
                            to="/timeline"
                            class="px-8 py-3 rounded-xl text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2"
                            :style="{ backgroundColor: currentTheme.accentColor, color: currentTheme.bgColor }"
                        >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                            </svg>
                            {{ $t('home.goToTimeline') }}
                        </NuxtLink>
                        <NuxtLink
                            to="/profile"
                            class="px-8 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm font-medium hover:bg-white/10 hover:text-white transition-colors inline-flex items-center justify-center gap-2"
                        >
                            {{ $t('home.myKeep') }}
                        </NuxtLink>
                    </div>
                </div>

                <!-- Not logged in: CTA -->
                <div v-else class="space-y-4">
                    <NuxtLink
                        to="/onboarding"
                        class="px-10 py-3.5 rounded-xl text-sm font-semibold transition-colors inline-block"
                        :style="{ backgroundColor: currentTheme.accentColor, color: currentTheme.bgColor }"
                    >
                        {{ $t('home.startJourney') }}
                    </NuxtLink>
                    <div class="flex items-center justify-center gap-4 text-xs text-white/20">
                        <span>{{ $t('home.alreadyKeeper') }}</span>
                        <NuxtLink to="/login" class="transition-colors underline underline-offset-2" :style="{ color: currentTheme.accentColor + '99' }">
                            {{ $t('common.login') }}
                        </NuxtLink>
                    </div>
                </div>
            </div>
        </div>

        <!-- Franchise Overview -->
        <div class="max-w-5xl mx-auto px-4 sm:px-6">
            <div class="text-center mb-10">
                <h2 class="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">{{ $t('home.chooseFranchise') }}</h2>
                <p class="text-white/30 text-sm">{{ $t('home.chooseFranchiseDesc') }}</p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <!-- MCU — Active -->
                <NuxtLink
                    to="/timeline"
                    class="group relative overflow-hidden rounded-2xl p-6 transition-all duration-300"
                    :style="{
                        borderColor: currentTheme.accentColor + '33',
                        backgroundColor: currentTheme.accentColor + '0D',
                        border: `1px solid ${currentTheme.accentColor}33`,
                    }"
                >
                    <div class="absolute top-3 right-3">
                        <span class="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full" :style="{ color: currentTheme.accentColor, backgroundColor: currentTheme.accentColor + '1A' }">{{ $t('common.live') }}</span>
                    </div>
                    <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-4" :style="{ backgroundColor: currentTheme.accentColor + '1A' }">
                        <svg class="w-6 h-6" :style="{ color: currentTheme.accentColor }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                        </svg>
                    </div>
                    <h3 class="font-display text-lg font-bold text-white mb-1">{{ $t('home.mcuTitle') }}</h3>
                    <p class="text-xs text-white/30 leading-relaxed">{{ $t('home.mcuDesc', { count: totalTitles }) }}</p>
                    <div class="mt-4 flex items-center gap-1.5 text-xs font-medium group-hover:gap-2.5 transition-all" :style="{ color: currentTheme.accentColor }">
                        <span>{{ $t('common.explore') }}</span>
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                    </div>
                </NuxtLink>

                <!-- Star Wars — Coming Soon -->
                <div class="relative overflow-hidden rounded-2xl border border-[#60A5FA]/10 bg-[#60A5FA]/3 p-6 opacity-60">
                    <div class="absolute top-3 right-3">
                        <span class="text-[10px] font-mono font-medium text-white/20 bg-white/5 px-2 py-0.5 rounded-full">{{ $t('common.soon') }}</span>
                    </div>
                    <div class="w-12 h-12 rounded-xl bg-[#60A5FA]/10 flex items-center justify-center mb-4">
                        <svg class="w-6 h-6 text-[#60A5FA]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                        </svg>
                    </div>
                    <h3 class="font-display text-lg font-bold text-white/50 mb-1">{{ $t('home.starWarsTitle') }}</h3>
                    <p class="text-xs text-white/20 leading-relaxed">{{ $t('home.starWarsDesc') }}</p>
                </div>

                <!-- Harry Potter — Coming Soon -->
                <div class="relative overflow-hidden rounded-2xl border border-[#7C3AED]/10 bg-[#7C3AED]/3 p-6 opacity-60">
                    <div class="absolute top-3 right-3">
                        <span class="text-[10px] font-mono font-medium text-white/20 bg-white/5 px-2 py-0.5 rounded-full">{{ $t('common.soon') }}</span>
                    </div>
                    <div class="w-12 h-12 rounded-xl bg-[#7C3AED]/10 flex items-center justify-center mb-4">
                        <svg class="w-6 h-6 text-[#7C3AED]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                        </svg>
                    </div>
                    <h3 class="font-display text-lg font-bold text-white/50 mb-1">{{ $t('home.wizardingTitle') }}</h3>
                    <p class="text-xs text-white/20 leading-relaxed">{{ $t('home.wizardingDesc') }}</p>
                </div>

                <!-- Fast & Furious — Coming Soon -->
                <div class="relative overflow-hidden rounded-2xl border border-[#22C55E]/10 bg-[#22C55E]/3 p-6 opacity-60">
                    <div class="absolute top-3 right-3">
                        <span class="text-[10px] font-mono font-medium text-white/20 bg-white/5 px-2 py-0.5 rounded-full">{{ $t('common.soon') }}</span>
                    </div>
                    <div class="w-12 h-12 rounded-xl bg-[#22C55E]/10 flex items-center justify-center mb-4">
                        <svg class="w-6 h-6 text-[#22C55E]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                        </svg>
                    </div>
                    <h3 class="font-display text-lg font-bold text-white/50 mb-1">{{ $t('home.fastFuriousTitle') }}</h3>
                    <p class="text-xs text-white/20 leading-relaxed">{{ $t('home.fastFuriousDesc') }}</p>
                </div>
            </div>
        </div>

        <!-- Features (not logged in) -->
        <div v-if="!isLoggedIn" class="max-w-4xl mx-auto px-4 sm:px-6">
            <div class="text-center mb-8">
                <h2 class="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">{{ $t('home.whyTitle') }}</h2>
                <p class="text-white/30 text-sm">{{ $t('home.whyDesc') }}</p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div class="glass-card p-6 text-center">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3" :style="{ backgroundColor: currentTheme.accentColor + '1A' }">
                        <svg class="w-5 h-5" :style="{ color: currentTheme.accentColor }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                        </svg>
                    </div>
                    <h3 class="font-display text-sm font-bold tracking-wide text-white mb-1">{{ $t('home.featureTimeline') }}</h3>
                    <p class="text-xs text-white/30 leading-relaxed">{{ $t('home.featureTimelineDesc') }}</p>
                </div>
                <div class="glass-card p-6 text-center">
                    <div class="w-10 h-10 rounded-xl bg-[#8B5CF6]/10 flex items-center justify-center mx-auto mb-3">
                        <svg class="w-5 h-5 text-[#8B5CF6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                    </div>
                    <h3 class="font-display text-sm font-bold tracking-wide text-white mb-1">{{ $t('home.featureSpoiler') }}</h3>
                    <p class="text-xs text-white/30 leading-relaxed">{{ $t('home.featureSpoilerDesc') }}</p>
                </div>
                <div class="glass-card p-6 text-center">
                    <div class="w-10 h-10 rounded-xl bg-[#34D399]/10 flex items-center justify-center mx-auto mb-3">
                        <svg class="w-5 h-5 text-[#34D399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 01-7.54 0" />
                        </svg>
                    </div>
                    <h3 class="font-display text-sm font-bold tracking-wide text-white mb-1">{{ $t('home.featureKeeper') }}</h3>
                    <p class="text-xs text-white/30 leading-relaxed">{{ $t('home.featureKeeperDesc') }}</p>
                </div>
            </div>
        </div>

        <!-- Next Up (logged in) -->
        <div v-if="isLoggedIn && nextUp" class="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 class="font-display text-xl font-bold tracking-tight text-white mb-4">{{ $t('home.nextUp') }}</h2>
            <NuxtLink :to="`/title/${nextUp.slug}`" class="glass-card p-5 flex items-center gap-5 group">
                <div class="w-16 h-24 rounded-lg shrink-0 overflow-hidden transition-colors" :style="{ backgroundColor: currentTheme.accentColor + '0D', border: `1px solid ${currentTheme.accentColor}1A` }">
                    <div class="w-full h-full flex items-center justify-center">
                        <span class="font-display text-lg font-bold" :style="{ color: currentTheme.accentColor + '4D' }">{{ nextUp.chronology_index }}</span>
                    </div>
                </div>
                <div class="flex-1 min-w-0">
                    <h3 class="font-display text-lg font-bold tracking-tight text-white transition-colors truncate">
                        {{ nextUp.title }}
                    </h3>
                    <div class="flex items-center gap-3 mt-1">
                        <span v-if="nextUp.phase" class="text-xs text-white/30">{{ nextUp.phase }}</span>
                        <span v-if="nextUp.type" class="text-xs text-white/20 capitalize">{{ nextUp.type }}</span>
                    </div>
                </div>
                <svg class="w-5 h-5 text-white/20 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
            </NuxtLink>
        </div>

        <!-- Upcoming releases (logged in) -->
        <div v-if="isLoggedIn && upcomingReleases.length > 0" class="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 class="font-display text-xl font-bold tracking-tight text-white mb-4">{{ $t('home.upcomingReleases') }}</h2>
            <div class="space-y-2">
                <NuxtLink
                    v-for="release in upcomingReleases"
                    :key="release.slug"
                    :to="`/title/${release.slug}`"
                    class="glass-card p-4 flex items-center gap-4 group block"
                >
                    <div class="w-10 h-10 rounded-lg bg-[#8B5CF6]/10 flex items-center justify-center shrink-0">
                        <svg class="w-5 h-5 text-[#8B5CF6]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm text-white/70 group-hover:text-white transition-colors truncate">{{ release.title }}</p>
                        <p class="text-xs text-white/25">{{ formatReleaseDate(release.release_date) }}</p>
                    </div>
                    <svg class="w-4 h-4 text-white/15 group-hover:text-white/30 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                </NuxtLink>
            </div>
        </div>

        <!-- Footer -->
        <div class="text-center space-y-2">
            <span class="text-xs text-white/15 font-mono">{{ $t('home.titlesInMcu', { count: totalTitles }) }}</span>
            <p class="text-[10px] text-white/10">{{ $t('home.disclaimer') }}</p>
        </div>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ ssr: false })

import mcuTitlesJson from '../../data/mcu-titles.json'

const { t, locale } = useI18n()
const user = useSupabaseUser()
const { getLevelFromXP, getLevelName, getTotalXP } = useXP()
const { currentTheme } = useSettings()

const allTitles = mcuTitlesJson as any[]
const totalTitles = allTitles.length

const upcomingReleases = computed(() => {
    return allTitles
        .filter(t => t.release_status === 'upcoming' || t.release_status === 'announced')
        .sort((a, b) => {
            if (!a.release_date) return 1
            if (!b.release_date) return -1
            return new Date(a.release_date).getTime() - new Date(b.release_date).getTime()
        })
        .slice(0, 5)
})

function formatReleaseDate(date: string | null): string {
    if (!date) return t('common.dateTBA')
    return new Date(date).toLocaleDateString(locale.value, { day: 'numeric', month: 'long', year: 'numeric' })
}

const isLoggedIn = computed(() => !!user.value)

const watchedCount = ref(0)
const progressPercent = ref(0)
const totalXP = ref(0)
const nextUp = ref<any>(null)

const level = computed(() => getLevelFromXP(totalXP.value))
const levelName = computed(() => getLevelName(level.value))

onMounted(async () => {
    if (!user.value) return

    try {
        totalXP.value = await getTotalXP()
    } catch { /* no auth */ }

    try {
        const { getProgressForUser, getNextUp } = useProgress()
        const progress = await getProgressForUser()
        const watched = progress.filter(p => p.status === 'watched')
        watchedCount.value = watched.length
        progressPercent.value = allTitles.length > 0
            ? Math.round((watched.length / allTitles.length) * 100)
            : 0

        const titlesWithId = allTitles.map(t => ({
            ...t,
            id: t.chronology_index,
        }))
        const next = await getNextUp(titlesWithId)
        if (next) nextUp.value = next
    } catch { /* no progress */ }
})
</script>
