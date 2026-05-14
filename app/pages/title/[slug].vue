<template>
    <div>
        <!-- Loading -->
        <div v-if="loading" class="flex items-center justify-center min-h-[60vh]">
            <div class="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
        </div>

        <template v-else-if="title">
            <!-- Hero -->
            <TitleHero
                :title="title.title"
                :poster-url="title.poster_url"
                :backdrop-url="title.backdrop_url"
                :year="releaseYear"
                :runtime="formattedRuntime"
                :type="title.type"
            >
                <template #tags>
                    <UiPhaseTag v-if="title.phase" :phase="title.phase" show-number />
                    <UiCanonBadge
                        v-if="title.canon_level"
                        :canon-level="title.canon_level"
                        :relevance-score="title.mcu_relevance_score"
                        show-relevance
                    />
                </template>
            </TitleHero>

            <!-- Main content -->
            <div class="max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-24 space-y-8">
                <!-- Back link -->
                <NuxtLink
                    to="/timeline"
                    class="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors"
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                    {{ $t('titlePage.backToTimeline') }}
                </NuxtLink>

                <!-- New release banner -->
                <UiNewReleaseBanner
                    v-if="title.release_status === 'upcoming' || title.release_status === 'announced'"
                    :status="title.release_status as 'upcoming' | 'announced'"
                    :release-date="title.release_date"
                />

                <!-- Actions -->
                <TitleActions
                    :status="currentStatus"
                    @mark-watched="handleMarkWatched"
                    @mark-skipped="handleMarkSkipped"
                    @mark-queued="handleMarkQueued"
                />

                <!-- XP Toast -->
                <Transition name="float">
                    <div v-if="showXpToast" class="fixed top-24 right-6 z-50 flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 font-mono text-sm animate-float-up">
                        +{{ xpAmount }} XP
                    </div>
                </Transition>

                <!-- Before You Watch -->
                <TitleBeforeYouWatch
                    v-if="skippedSlugs.size > 0"
                    :current-slug="slug"
                    :skipped-slugs="skippedSlugs"
                />

                <!-- Retcon info -->
                <div v-if="retcons.causedBy.length > 0 || retcons.causes.length > 0" class="glass-card p-5 border-l-3 border-l-amber-500/50">
                    <h3 class="font-display text-lg tracking-wider text-amber-400 mb-3 flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                        </svg>
                        {{ $t('titlePage.retconInfo') }}
                    </h3>
                    <div v-if="retcons.causedBy.length > 0" class="space-y-2">
                        <p v-for="r in retcons.causedBy" :key="r.id" class="text-sm text-white/50">
                            {{ $t('titlePage.retconCausedBy', { source: r.source_title?.title, desc: r.description }) }}
                        </p>
                    </div>
                    <div v-if="retcons.causes.length > 0" class="space-y-2 mt-3">
                        <p v-for="r in retcons.causes" :key="r.id" class="text-sm text-white/50">
                            {{ $t('titlePage.retconCauses', { affected: r.affected_title?.title, desc: r.description }) }}
                        </p>
                    </div>
                </div>

                <!-- Synopsis (spoiler guarded) -->
                <div ref="synopsisEl" class="glass-card p-6">
                    <h3 class="font-display text-xl tracking-wider text-white mb-3">{{ $t('titlePage.synopsis') }}</h3>
                    <div :class="[!canRevealSynopsis && 'spoiler-blur']">
                        <p class="text-white/50 leading-relaxed">
                            {{ title.overview || $t('titlePage.noSynopsis') }}
                        </p>
                    </div>
                    <button
                        v-if="!canRevealSynopsis && title.overview"
                        class="mt-3 text-xs text-white/30 hover:text-white/50 transition-colors"
                        @click="handleMarkWatched"
                    >
                        {{ $t('titlePage.markWatchedToReveal') }}
                    </button>
                </div>

                <!-- Cast -->
                <TitleCastCarousel :tmdb-id="title.tmdb_id" :type="title.type" />

                <!-- Videos (trailers, clips, behind the scenes) -->
                <div id="videos">
                    <TitleVideos :tmdb-id="title.tmdb_id" :type="title.type" />
                </div>

                <!-- Metadata grid -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div class="glass-card p-4 text-center">
                        <span class="text-xs text-white/30 uppercase tracking-wider block mb-1">{{ $t('titlePage.position') }}</span>
                        <span class="font-display text-2xl text-white">{{ title.chronology_index }}</span>
                    </div>
                    <div class="glass-card p-4 text-center">
                        <span class="text-xs text-white/30 uppercase tracking-wider block mb-1">{{ $t('titlePage.phaseLabel') }}</span>
                        <span class="font-display text-2xl text-white">{{ phaseNumber || '—' }}</span>
                    </div>
                    <div class="glass-card p-4 text-center">
                        <span class="text-xs text-white/30 uppercase tracking-wider block mb-1">{{ $t('titlePage.relevance') }}</span>
                        <span class="font-display text-2xl text-white">{{ title.mcu_relevance_score || '—' }}<span class="text-sm text-white/30">/10</span></span>
                    </div>
                    <div class="glass-card p-4 text-center">
                        <span class="text-xs text-white/30 uppercase tracking-wider block mb-1">{{ $t('titlePage.statusLabel') }}</span>
                        <span class="font-display text-2xl" :class="statusColor">{{ statusLabel }}</span>
                    </div>
                </div>

                <!-- Streaming -->
                <TitleStreamingLink
                    v-if="title.streaming_platform && title.release_status === 'released'"
                    :platform="title.streaming_platform"
                    :url="title.streaming_url"
                />

                <!-- Ticket links (upcoming titles) -->
                <TitleTicketLinks
                    v-if="title.release_status === 'upcoming'"
                />

                <!-- Related titles -->
                <TitleRelatedTitles :titles="relatedTitles" />

                <!-- Retcon notes -->
                <div v-if="title.retcon_notes" class="text-xs text-white/30 italic">
                    {{ title.retcon_notes }}
                </div>
            </div>
        </template>

        <!-- Not found -->
        <div v-else class="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
            <div class="font-display text-4xl text-white mb-2">404</div>
            <p class="text-white/40 text-sm mb-6">{{ $t('titlePage.notFound') }}</p>
            <NuxtLink to="/timeline" class="text-sm text-white/50 hover:text-white transition-colors">
                {{ $t('titlePage.backToTimelineShort') }}
            </NuxtLink>
        </div>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ ssr: false })

import type { Database } from '~/types/supabase'

type Title = Database['public']['Tables']['titles']['Row']

const { t } = useI18n()
const route = useRoute()
const slug = computed(() => route.params.slug as string)

const { getTitleBySlug, getRetconsForTitle, getRelatedTitles } = useTitles()
const { setStatus, getProgressForUser } = useProgress()
const { awardWatchXP } = useXP()
const { checkAndAwardBadges } = useBadges()
const { isRevealed } = useSpoilerGuard()
const user = useSupabaseUser()

const loading = ref(true)
const title = ref<Title | null>(null)
const currentStatus = ref<'queued' | 'watching' | 'watched' | 'skipped' | null>(null)
const retcons = ref<{ causedBy: any[]; causes: any[] }>({ causedBy: [], causes: [] })
const relatedTitles = ref<any[]>([])
const showXpToast = ref(false)
const xpAmount = ref(0)
const skippedSlugs = ref<Set<string>>(new Set())

const releaseYear = computed(() => {
    if (!title.value?.release_date) return ''
    return new Date(title.value.release_date).getFullYear().toString()
})

const formattedRuntime = computed(() => {
    const mins = title.value?.runtime_minutes
    if (!mins) return ''
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return h > 0 ? `${h}u ${m}m` : `${m}m`
})

const phaseNumber = computed(() => {
    const match = title.value?.phase?.match(/\d+/)
    return match ? match[0] : null
})

const canRevealSynopsis = computed(() => {
    if (!title.value) return false
    const watchedSet = new Set(currentStatus.value === 'watched' ? [title.value.id] : [])
    return isRevealed(title.value.id, watchedSet)
})

const statusLabel = computed(() => {
    const labels: Record<string, string> = {
        queued: t('titlePage.statusQueued'),
        watching: t('titlePage.statusWatching'),
        watched: t('titlePage.statusWatched'),
        skipped: t('titlePage.statusSkipped'),
    }
    return currentStatus.value ? labels[currentStatus.value] : '—'
})

const statusColor = computed(() => {
    const colors: Record<string, string> = {
        queued: 'text-gray-400',
        watching: 'text-blue-400',
        watched: 'text-green-400',
        skipped: 'text-orange-400',
    }
    return currentStatus.value ? colors[currentStatus.value] : 'text-white/30'
})

const synopsisEl = ref<HTMLElement | null>(null)
const { useFadeIn } = useScrollAnimation()
useFadeIn(synopsisEl, { y: 20 })

async function loadTitle() {
    loading.value = true
    try {
        title.value = await getTitleBySlug(slug.value)

        if (user.value && title.value) {
            try {
                const progress = await getProgressForUser()
                const match = progress.find(p => p.title_id === title.value!.id)
                currentStatus.value = (match?.status as any) ?? null

                const allTitles = (await import('../../../data/mcu-titles.json')).default as { slug: string }[]
                const skippedIds = new Set(
                    progress.filter(p => p.status === 'skipped').map(p => p.title_id)
                )
                const slugSet = new Set<string>()
                allTitles.forEach((t, i) => {
                    if (skippedIds.has(i + 1)) slugSet.add(t.slug)
                })
                skippedSlugs.value = slugSet
            } catch { /* no auth */ }
        }

        if (title.value) {
            try {
                retcons.value = await getRetconsForTitle(title.value.id)
            } catch { /* retcons unavailable */ }

            try {
                relatedTitles.value = await getRelatedTitles(title.value)
            } catch { /* related unavailable */ }
        }
    } catch (e) {
        console.error('Failed to load title:', e)
        title.value = null
    } finally {
        loading.value = false
    }
}

onMounted(async () => {
    await loadTitle()
    if (route.hash) {
        await nextTick()
        setTimeout(() => {
            document.querySelector(route.hash)?.scrollIntoView({ behavior: 'smooth' })
        }, 600)
    }
})

watch(slug, () => loadTitle())

async function handleMarkWatched() {
    if (!title.value) return
    const prevStatus = currentStatus.value
    currentStatus.value = 'watched'

    if (user.value) {
        try {
            await setStatus(title.value.id, 'watched')
            await awardWatchXP(title.value.id, title.value.type as 'movie' | 'series')
            xpAmount.value = title.value.type === 'series' ? 150 : 100
            showXpToast.value = true
            setTimeout(() => { showXpToast.value = false }, 2000)
            await checkAndAwardBadges({ watchedCount: 1, totalCount: 1 })
        } catch {
            currentStatus.value = prevStatus
        }
    }
}

async function handleMarkSkipped() {
    if (!title.value) return
    const prevStatus = currentStatus.value
    currentStatus.value = 'skipped'
    if (user.value) {
        try {
            await setStatus(title.value.id, 'skipped')
        } catch {
            currentStatus.value = prevStatus
        }
    }
}

async function handleMarkQueued() {
    if (!title.value) return
    const prevStatus = currentStatus.value
    currentStatus.value = 'queued'
    if (user.value) {
        try {
            await setStatus(title.value.id, 'queued')
        } catch {
            currentStatus.value = prevStatus
        }
    }
}
</script>

<style scoped>
.float-enter-active {
    animation: float-up 2s ease-out forwards;
}
</style>
