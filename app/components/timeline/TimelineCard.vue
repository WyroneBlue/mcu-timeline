<template>
    <div ref="cardEl" class="timeline-card-item group relative">
        <NuxtLink :to="`/title/${title.slug}`" class="block" @click="onCardClick">
            <!-- Mobile: poster backdrop card -->
            <div class="sm:hidden glass-card !rounded-[20px] overflow-hidden isolate transition-all duration-300 hover:border-white/15 relative">
                <img
                    v-if="title.poster_url"
                    :src="title.poster_url"
                    :alt="title.title"
                    class="absolute inset-0 w-full h-full object-cover opacity-[0.12] blur-[1px] pointer-events-none"
                    loading="lazy"
                />
                <div class="relative p-3.5">
                    <div class="flex items-center justify-between gap-2">
                        <h3 class="font-display text-base tracking-wide text-white leading-tight truncate">
                            {{ title.title }}
                        </h3>
                        <div v-if="status === 'watched'" class="shrink-0 w-5 h-5 rounded-full bg-green-500/90 flex items-center justify-center">
                            <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    </div>
                    <div class="flex items-center gap-1.5 mt-1 text-[11px] text-white/40">
                        <span v-if="showStoryYear && title.story_year" class="text-amber-400/70 font-medium">{{ title.story_year }}</span>
                        <span v-if="showStoryYear && title.story_year" class="text-white/15">&middot;</span>
                        <span>{{ releaseYear }}</span>
                        <span v-if="title.runtime_minutes" class="text-white/15">&middot;</span>
                        <span v-if="title.runtime_minutes">{{ formatRuntime(title.runtime_minutes) }}</span>
                        <span class="text-white/15">&middot;</span>
                        <span>{{ title.type === 'series' ? 'Serie' : 'Film' }}</span>
                    </div>
                    <div class="flex items-center gap-1.5 mt-2">
                        <UiPhaseTag v-if="title.phase" :phase="title.phase" show-number />
                        <UiCanonBadge v-if="title.canon_level" :canon-level="title.canon_level" :relevance-score="title.mcu_relevance_score" />
                        <UiRetconTag v-if="hasRetcons" description="Deze titel is beïnvloed door een latere release" />
                    </div>
                    <div class="flex items-center gap-1.5 mt-2.5" @click.prevent.stop>
                        <button
                            v-if="status !== 'watched'"
                            class="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-white/5 hover:bg-green-500/20 hover:text-green-400 text-white/50 transition-colors"
                            @click="$emit('markWatched', title.id)"
                        >
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                            </svg>
                            Watched
                        </button>
                        <button
                            v-if="status !== 'skipped' && status !== 'watched'"
                            class="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-white/5 hover:bg-orange-500/20 hover:text-orange-400 text-white/50 transition-colors"
                            @click="$emit('markSkipped', title.id)"
                        >
                            Skip
                        </button>
                        <NuxtLink
                            v-if="title.trailer_url"
                            :to="`/title/${title.slug}#videos`"
                            class="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-white/50 transition-colors"
                        >
                            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                            Trailer
                        </NuxtLink>
                        <NuxtLink
                            :to="`/title/${title.slug}#previously-on`"
                            class="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-white/5 hover:bg-purple-500/20 hover:text-purple-400 text-white/50 transition-colors"
                        >
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Recap
                        </NuxtLink>
                        <UiStatusBadge v-if="status" :status="status" />
                    </div>
                </div>
            </div>

            <!-- Desktop: compact horizontal card -->
            <div class="hidden sm:block glass-card !rounded-[20px] overflow-hidden isolate transition-all duration-300 hover:border-white/15">
                <div class="relative flex flex-row">
                    <div :class="['relative shrink-0 overflow-hidden rounded-l-[19px]', posterSizeClass]">
                        <div class="absolute inset-0 overflow-hidden">
                            <img
                                v-if="title.poster_url"
                                ref="posterImg"
                                :src="title.poster_url"
                                :alt="title.title"
                                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 will-change-transform"
                                loading="lazy"
                            />
                            <div v-else class="w-full h-full bg-white/5 flex items-center justify-center">
                                <svg class="w-8 h-8 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                                </svg>
                            </div>
                        </div>
                        <div v-if="status === 'watched'" class="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-green-500/90 flex items-center justify-center">
                            <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    </div>

                    <div class="flex-1 p-3 flex flex-col justify-between min-w-0">
                        <div>
                            <div class="flex items-center justify-between gap-2">
                                <h3 class="font-display text-base lg:text-lg tracking-wide text-white leading-tight truncate">
                                    {{ title.title }}
                                </h3>
                                <div class="flex items-center gap-1.5 shrink-0">
                                    <UiPhaseTag v-if="title.phase" :phase="title.phase" show-number />
                                    <UiCanonBadge v-if="title.canon_level" :canon-level="title.canon_level" :relevance-score="title.mcu_relevance_score" />
                                    <UiRetconTag v-if="hasRetcons" description="Deze titel is beïnvloed door een latere release" />
                                </div>
                            </div>
                            <div class="flex items-center gap-1.5 mt-0.5 text-[11px] text-white/40">
                                <span v-if="showStoryYear && title.story_year" class="text-amber-400/70 font-medium">{{ title.story_year }}</span>
                                <span v-if="showStoryYear && title.story_year" class="text-white/15">&middot;</span>
                                <span>{{ releaseYear }}</span>
                                <span v-if="title.runtime_minutes" class="text-white/15">&middot;</span>
                                <span v-if="title.runtime_minutes">{{ formatRuntime(title.runtime_minutes) }}</span>
                                <span class="text-white/15">&middot;</span>
                                <span>{{ title.type === 'series' ? 'Serie' : 'Film' }}</span>
                            </div>
                            <p v-if="title.overview" :class="[
                                'mt-1 text-xs text-white/30 line-clamp-1',
                                !canShow && 'spoiler-blur pointer-events-none'
                            ]">
                                {{ title.overview }}
                            </p>
                        </div>

                        <div class="flex items-center gap-1.5 mt-2" @click.prevent.stop>
                            <button
                                v-if="status !== 'watched'"
                                class="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-white/5 hover:bg-green-500/20 hover:text-green-400 text-white/50 transition-colors"
                                @click="$emit('markWatched', title.id)"
                            >
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                </svg>
                                Watched
                            </button>
                            <button
                                v-if="status !== 'skipped' && status !== 'watched'"
                                class="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-white/5 hover:bg-orange-500/20 hover:text-orange-400 text-white/50 transition-colors"
                                @click="$emit('markSkipped', title.id)"
                            >
                                Skip
                            </button>
                            <NuxtLink
                                v-if="title.trailer_url"
                                :to="`/title/${title.slug}#videos`"
                                class="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-white/50 transition-colors"
                            >
                                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                                Trailer
                            </NuxtLink>
                            <NuxtLink
                                :to="`/title/${title.slug}#previously-on`"
                                class="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-white/5 hover:bg-purple-500/20 hover:text-purple-400 text-white/50 transition-colors"
                            >
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Recap
                            </NuxtLink>
                            <UiStatusBadge v-if="status" :status="status" />
                        </div>
                    </div>
                </div>
            </div>
        </NuxtLink>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    title: {
        id: number
        slug: string
        title: string
        poster_url?: string | null
        overview?: string | null
        phase?: string | null
        type: string
        chronology_index: number | null
        story_year?: string | null
        story_order?: number | null
        runtime_minutes?: number | null
        canon_level?: string | null
        mcu_relevance_score?: number | null
        release_date?: string | null
        retconned_by?: number[] | null
        trailer_url?: string | null
    }
    status?: 'queued' | 'watching' | 'watched' | 'skipped' | null
    canShow?: boolean
    hasRetcons?: boolean
    showStoryYear?: boolean
}>()

defineEmits<{
    markWatched: [id: number]
    markSkipped: [id: number]
}>()

const { settings } = useSettings()
const { playTransition } = useTransitionEffects()

const cardEl = ref<HTMLElement | null>(null)
const posterImg = ref<HTMLElement | null>(null)

// Plain left-clicks open a sparking portal to the title page; modified
// clicks (new tab etc.) and keyboard navigation fall through untouched.
function onCardClick(e: MouseEvent) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
    if (e.detail === 0) return // keyboard-activated
    e.preventDefault()
    playTransition('portal', {
        origin: { x: e.clientX, y: e.clientY },
        midpoint: () => { navigateTo(`/title/${props.title.slug}`) },
    })
}

const posterSizeClass = computed(() => {
    const map: Record<string, string> = {
        small: 'w-20 min-h-[80px]',
        medium: 'w-28 min-h-[112px]',
        large: 'w-36 min-h-[144px]',
    }
    return map[settings.cardSize] ?? map.medium
})

const releaseYear = computed(() => {
    if (!props.title.release_date) return ''
    return new Date(props.title.release_date).getFullYear()
})

function formatRuntime(minutes: number) {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return h > 0 ? `${h}u ${m}m` : `${m}m`
}

const { useFadeIn, gsap, ScrollTrigger, prefersReducedMotion } = useScrollAnimation()
useFadeIn(cardEl, { y: 30 })

onMounted(() => {
    if (prefersReducedMotion.value || !posterImg.value || !cardEl.value) return
    gsap.fromTo(posterImg.value,
        { yPercent: -8 },
        {
            yPercent: 8,
            ease: 'none',
            scrollTrigger: {
                trigger: cardEl.value,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true,
            },
        }
    )
})
</script>
