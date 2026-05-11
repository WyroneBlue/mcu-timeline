<template>
    <div ref="timelineContainer">
        <template v-if="!focusMode">
            <!-- 3D Particle starfield background -->
            <TimelineParticleBackground :active-phase="scrollPhase" />

            <!-- Ambient phase background (gradient orbs) -->
            <TimelinePhaseBackground :active-phase="scrollPhase" />

            <!-- Sticky progress bar -->
            <TimelineProgress
                :percent="progressPercent"
                :current-phase="currentPhase"
                :next-up="nextUpTitle"
            />

            <!-- Intro hero -->
            <TimelineIntro
                :posters="introPosters"
                :title-count="titles.length"
                :phase-count="phases.length"
                :percent="progressPercent"
            />

            <!-- Mode selector + Filters (floating) -->
            <div class="sticky top-[7.5rem] z-30 py-4">
                <div class="flex flex-col items-center gap-2">
                    <div class="flex items-center gap-2">
                        <TimelineModeSelector v-model="mode" :sort-by="sortBy" :view-mode="viewMode" @update:sort-by="sortBy = $event" @update:view-mode="onViewModeChange" />
                        <TransitionsTransitionSelector />
                        <TimelineFilters
                            v-model:filters="activeFilters"
                            :titles="allTitles"
                            :filtered-count="filteredTitles.length"
                            :total-count="allTitles.length"
                        />
                    </div>
                </div>
            </div>
        </template>

        <!-- Loading state -->
        <div v-if="loading" class="flex items-center justify-center py-24">
            <div class="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
        </div>

        <!-- Empty state -->
        <div v-else-if="titles.length === 0" class="text-center py-24 px-6">
            <p class="text-white/30 text-sm">Geen titels voor deze modus.</p>
        </div>

        <!-- Universe 3D View -->
        <div v-else-if="viewMode === 'universe'" class="relative">
            <TimelineUniverse
                :titles="sortBy === 'story' ? storyTitles : chronologicalTitles"
                :progress-map="progressMap"
                :active-phase="scrollPhase"
                @mark-watched="handleMarkWatched"
                @mark-skipped="handleMarkSkipped"
            />
        </div>

        <!-- Branches View (Loki-style Sacred Timeline) -->
        <div v-else-if="viewMode === 'branches'" class="relative">
            <TimelineBranchView
                :titles="chronologicalTitles"
                :progress-map="progressMap"
            />
        </div>

        <!-- List View: Phase grouped -->
        <div v-else-if="sortBy === 'phase'" :key="'phase-' + filterKey" class="max-w-4xl mx-auto px-4 sm:px-6 pb-24">
            <template v-for="(phase, phaseIdx) in phases" :key="phase.number">
                <TimelinePhaseTransition
                    v-if="phaseIdx > 0"
                    :from-phase="phases[phaseIdx - 1].number"
                    :to-phase="phase.number"
                />

                <TimelinePhaseHeader
                    :phase="phase.number"
                    :saga="phase.saga"
                />

                <TimelineScrollPosition
                    v-if="nextUpTitle && firstTitleInPhase(phase.number)?.id === nextUpTitle.id"
                />

                <div class="space-y-4 mb-8">
                    <TimelineCard
                        v-for="title in phase.titles"
                        :key="title.id"
                        :title="title"
                        :status="getStatus(title.id)"
                        :can-show="isRevealed(title.id)"
                        :has-retcons="hasRetcon(title.id)"
                        @mark-watched="handleMarkWatched"
                        @mark-skipped="handleMarkSkipped"
                    />
                </div>
            </template>

            <TimelineScrollPosition v-if="!nextUpTitle && progressPercent > 0" />

            <div v-if="progressPercent === 100" class="text-center py-16">
                <div class="font-display text-3xl sm:text-4xl tracking-wider text-white mb-2">
                    JOURNEY COMPLETE
                </div>
                <p class="text-white/40 text-sm">Je hebt alles gezien. Respect.</p>
            </div>
        </div>

        <!-- List View: Release order -->
        <div v-else-if="sortBy === 'chronological'" :key="'chrono-' + filterKey" class="max-w-4xl mx-auto px-4 sm:px-6 pb-24">
            <div class="space-y-4">
                <template v-for="(title, idx) in chronologicalTitles" :key="title.id">
                    <TimelineScrollPosition
                        v-if="nextUpTitle && title.id === nextUpTitle.id"
                    />
                    <TimelineCard
                        :title="title"
                        :status="getStatus(title.id)"
                        :can-show="isRevealed(title.id)"
                        :has-retcons="hasRetcon(title.id)"
                        @mark-watched="handleMarkWatched"
                        @mark-skipped="handleMarkSkipped"
                    />
                </template>
            </div>

            <TimelineScrollPosition v-if="!nextUpTitle && progressPercent > 0" />

            <div v-if="progressPercent === 100" class="text-center py-16">
                <div class="font-display text-3xl sm:text-4xl tracking-wider text-white mb-2">
                    JOURNEY COMPLETE
                </div>
                <p class="text-white/40 text-sm">Je hebt alles gezien. Respect.</p>
            </div>
        </div>

        <!-- List View: Story chronological -->
        <div v-else :key="'story-' + filterKey" class="max-w-4xl mx-auto px-4 sm:px-6 pb-24">
            <div class="space-y-4">
                <template v-for="title in storyTitles" :key="title.id">
                    <TimelineScrollPosition
                        v-if="nextUpTitle && title.id === nextUpTitle.id"
                    />
                    <TimelineCard
                        :title="title"
                        :status="getStatus(title.id)"
                        :can-show="isRevealed(title.id)"
                        :has-retcons="hasRetcon(title.id)"
                        :show-story-year="true"
                        @mark-watched="handleMarkWatched"
                        @mark-skipped="handleMarkSkipped"
                    />
                </template>
            </div>

            <TimelineScrollPosition v-if="!nextUpTitle && progressPercent > 0" />

            <div v-if="progressPercent === 100" class="text-center py-16">
                <div class="font-display text-3xl sm:text-4xl tracking-wider text-white mb-2">
                    JOURNEY COMPLETE
                </div>
                <p class="text-white/40 text-sm">Je hebt alles gezien. Respect.</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ ssr: false })

import type { Database } from '~/types/supabase'

type Title = Database['public']['Tables']['titles']['Row']
type ProgressStatus = 'queued' | 'watching' | 'watched' | 'skipped'

const timelineContainer = ref<HTMLElement | null>(null)
const { focusMode, exitFocusMode } = useFocusMode()
const { playTransition } = useMultiverseTransitions()

interface Filters {
    franchises: Set<string>
    teams: Set<string>
    characters: Set<string>
    years: Set<string>
    types: Set<string>
    statuses: Set<string>
    canonLevels: Set<string>
    sagas: Set<string>
    releaseStatuses: Set<string>
}

const mode = ref<'simple' | 'in_depth' | 'extreme'>(
    (typeof localStorage !== 'undefined' && localStorage.getItem('ck:mode') as any) || 'in_depth'
)
const sortBy = ref<'phase' | 'chronological' | 'story'>(
    (typeof localStorage !== 'undefined' && localStorage.getItem('ck:sortBy') as any) || 'phase'
)
const viewMode = ref<'list' | 'universe' | 'branches'>(
    (typeof localStorage !== 'undefined' && localStorage.getItem('ck:viewMode') as any) || 'list'
)

watch(mode, v => localStorage.setItem('ck:mode', v))
watch(sortBy, v => localStorage.setItem('ck:sortBy', v))
watch(viewMode, (v) => {
    localStorage.setItem('ck:viewMode', v)
    if (v === 'list') exitFocusMode()
})

function onViewModeChange(v: 'list' | 'universe' | 'branches') {
    const from3D = viewMode.value === 'universe' || viewMode.value === 'branches'
    const to3D = v === 'universe' || v === 'branches'
    if (from3D && to3D && v !== viewMode.value) {
        playTransition()
    }
    viewMode.value = v
}
const loading = ref(true)
const allTitles = ref<Title[]>([])
const progressMap = ref<Map<number, ProgressStatus>>(new Map())
const activeFilters = ref<Filters>({
    franchises: new Set(),
    teams: new Set(),
    characters: new Set(),
    years: new Set(),
    types: new Set(),
    statuses: new Set(),
    canonLevels: new Set(),
    sagas: new Set(),
    releaseStatuses: new Set(),
})

const filteredTitles = computed(() => {
    const f = activeFilters.value
    const hasFilters = f.franchises.size > 0 || f.teams.size > 0 || f.characters.size > 0 ||
        f.years.size > 0 || f.types.size > 0 || f.statuses.size > 0 ||
        f.canonLevels.size > 0 || f.sagas.size > 0 || f.releaseStatuses.size > 0

    if (!hasFilters) return allTitles.value

    return allTitles.value.filter((t: any) => {
        if (f.franchises.size > 0 && !f.franchises.has(t.franchise ?? '')) return false
        if (f.teams.size > 0 && !(t.teams ?? []).some((tm: string) => f.teams.has(tm))) return false
        if (f.characters.size > 0 && !(t.characters ?? []).some((c: string) => f.characters.has(c))) return false
        if (f.years.size > 0 && !f.years.has(t.release_date?.slice(0, 4) ?? '')) return false
        if (f.types.size > 0 && !f.types.has(t.type ?? '')) return false
        if (f.canonLevels.size > 0 && !f.canonLevels.has(t.canon_level ?? '')) return false
        if (f.sagas.size > 0 && !f.sagas.has(t.saga ?? '')) return false
        if (f.releaseStatuses.size > 0 && !f.releaseStatuses.has(t.release_status ?? '')) return false
        if (f.statuses.size > 0) {
            const status = progressMap.value.get(t.id) ?? 'none'
            if (!f.statuses.has(status)) return false
        }
        return true
    })
})

const titles = filteredTitles

const filterKey = computed(() => {
    const f = activeFilters.value
    const parts: string[] = []
    f.franchises.forEach(v => parts.push('f:' + v))
    f.teams.forEach(v => parts.push('t:' + v))
    f.characters.forEach(v => parts.push('c:' + v))
    f.years.forEach(v => parts.push('y:' + v))
    f.types.forEach(v => parts.push('tp:' + v))
    f.statuses.forEach(v => parts.push('s:' + v))
    f.canonLevels.forEach(v => parts.push('cl:' + v))
    f.sagas.forEach(v => parts.push('sg:' + v))
    f.releaseStatuses.forEach(v => parts.push('rs:' + v))
    return parts.sort().join('|') || 'none'
})

const retconTitleIds = ref<Set<number>>(new Set())
const scrollPhase = ref<number | null>(1)

const { getTitlesForMode } = useTitles()
const { getProgressForUser, markWatched, markSkipped } = useProgress()
const { awardWatchXP } = useXP()
const { checkAndAwardBadges } = useBadges()
const { isRevealed: spoilerRevealed } = useSpoilerGuard()
const user = useSupabaseUser()
const client = useSupabaseClient<Database>()

const watchedIds = computed(() => {
    const ids = new Set<number>()
    for (const [id, status] of progressMap.value) {
        if (status === 'watched') ids.add(id)
    }
    return ids
})

function isRevealed(titleId: number) {
    return spoilerRevealed(titleId, watchedIds.value)
}

function getStatus(titleId: number): ProgressStatus | null {
    return progressMap.value.get(titleId) ?? null
}

function hasRetcon(titleId: number) {
    return retconTitleIds.value.has(titleId)
}

// Group titles by phase
const phases = computed(() => {
    const map = new Map<number, { number: number; saga: string; titles: Title[] }>()

    for (const title of titles.value) {
        const phaseMatch = title.phase?.match(/\d+/)
        const num = phaseMatch ? parseInt(phaseMatch[0]) : 0
        if (!map.has(num)) {
            let saga = ''
            if (num <= 3) saga = 'The Infinity Saga'
            else if (num <= 5) saga = 'The Multiverse Saga'
            else saga = 'The Secret Wars Saga'
            map.set(num, { number: num, saga, titles: [] })
        }
        map.get(num)!.titles.push(title)
    }

    return Array.from(map.values()).sort((a, b) => a.number - b.number)
})

const chronologicalTitles = computed(() => {
    return [...titles.value].sort((a, b) => (a.chronology_index ?? 0) - (b.chronology_index ?? 0))
})

const storyTitles = computed(() => {
    return [...titles.value].sort((a, b) => {
        const aOrder = 'story_order' in a ? (a as any).story_order : null
        const bOrder = 'story_order' in b ? (b as any).story_order : null
        return (aOrder ?? 999) - (bOrder ?? 999)
    })
})

const introPosters = computed(() => {
    return titles.value
        .slice(0, 24)
        .map(t => t.poster_url || null)
})

const progressPercent = computed(() => {
    if (titles.value.length === 0) return 0
    const watched = titles.value.filter(t => progressMap.value.get(t.id) === 'watched').length
    return Math.round((watched / titles.value.length) * 100)
})

const currentPhase = computed(() => {
    const next = nextUpTitle.value
    if (!next) return phases.value[phases.value.length - 1]?.number ?? null
    const match = next.phase?.match(/\d+/)
    return match ? parseInt(match[0]) : null
})

const nextUpTitle = computed(() => {
    const sorted = [...titles.value].sort((a, b) => (a.chronology_index ?? 0) - (b.chronology_index ?? 0))
    const doneIds = new Set<number>()
    for (const [id, status] of progressMap.value) {
        if (status === 'watched' || status === 'skipped') doneIds.add(id)
    }
    return sorted.find(t => !doneIds.has(t.id)) ?? null
})

function firstTitleInPhase(phaseNumber: number) {
    const phase = phases.value.find(p => p.number === phaseNumber)
    return phase?.titles[0] ?? null
}

async function loadData() {
    loading.value = true
    try {
        allTitles.value = await getTitlesForMode(mode.value)

        if (user.value) {
            const progress = await getProgressForUser()
            const map = new Map<number, ProgressStatus>()
            for (const p of progress) {
                map.set(p.title_id, p.status as ProgressStatus)
            }
            progressMap.value = map
        }

        try {
            const { data: retcons } = await client.from('retcons').select('affected_title_id')
            if (retcons) {
                retconTitleIds.value = new Set(retcons.map(r => r.affected_title_id))
            }
        } catch {
            // Retcons unavailable, non-critical
        }
    } catch (e) {
        console.error('Failed to load timeline data:', e)
    } finally {
        loading.value = false
    }
}

watch(mode, () => loadData())

let phaseObserver: IntersectionObserver | null = null

onMounted(() => {
    loadData()

    nextTick(() => {
        phaseObserver = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        const phase = parseInt((entry.target as HTMLElement).dataset.phase || '1')
                        if (!isNaN(phase)) scrollPhase.value = phase
                    }
                }
            },
            { rootMargin: '-30% 0px -50% 0px' }
        )
    })
})

watch([loading, phases], () => {
    nextTick(() => {
        if (!phaseObserver) return
        phaseObserver.disconnect()
        document.querySelectorAll('.phase-header-section').forEach((el) => {
            phaseObserver!.observe(el)
        })
    })
})

onUnmounted(() => {
    phaseObserver?.disconnect()
})

async function handleMarkWatched(titleId: number) {
    progressMap.value.set(titleId, 'watched')
    progressMap.value = new Map(progressMap.value)

    if (user.value) {
        try {
            await markWatched(titleId)
            const title = titles.value.find(t => t.id === titleId)
            if (title) {
                await awardWatchXP(titleId, title.type as 'movie' | 'series')
                await checkAndAwardBadges({
                    watchedCount: watchedIds.value.size,
                    totalCount: titles.value.length,
                })
            }
        } catch (e) {
            progressMap.value.delete(titleId)
            progressMap.value = new Map(progressMap.value)
            console.error('Failed to mark watched:', e)
        }
    }
}

async function handleMarkSkipped(titleId: number) {
    progressMap.value.set(titleId, 'skipped')
    progressMap.value = new Map(progressMap.value)

    if (user.value) {
        try {
            await markSkipped(titleId)
        } catch (e) {
            progressMap.value.delete(titleId)
            progressMap.value = new Map(progressMap.value)
            console.error('Failed to mark skipped:', e)
        }
    }
}
</script>
