<template>
    <div ref="cardEl" class="group relative">
        <NuxtLink :to="`/title/${title.slug}`" class="block">
            <div class="glass-card overflow-hidden transition-all duration-300 hover:border-white/15">
                <div class="relative flex flex-col sm:flex-row">
                    <!-- Poster -->
                    <div :class="['relative shrink-0 overflow-hidden', posterSizeClass]">
                        <div class="aspect-[2/3] sm:aspect-auto sm:absolute sm:inset-0 overflow-hidden">
                            <img
                                v-if="title.poster_url"
                                ref="posterImg"
                                :src="title.poster_url"
                                :alt="title.title"
                                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 will-change-transform"
                                loading="lazy"
                            />
                            <div v-else class="w-full h-full bg-white/5 flex items-center justify-center min-h-[200px] sm:min-h-0">
                                <svg class="w-10 h-10 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                                </svg>
                            </div>
                        </div>
                        <!-- Status overlay -->
                        <div v-if="status === 'watched'" class="absolute top-2 right-2 w-8 h-8 rounded-full bg-green-500/90 flex items-center justify-center">
                            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    </div>

                    <!-- Info -->
                    <div class="flex-1 p-4 sm:p-5 flex flex-col justify-between">
                        <div>
                            <div class="flex items-start justify-between gap-2 mb-2">
                                <div>
                                    <h3 class="font-display text-xl sm:text-2xl tracking-wide text-white leading-tight">
                                        {{ title.title }}
                                    </h3>
                                    <div class="flex items-center gap-2 mt-1 text-xs text-white/40">
                                        <span v-if="showStoryYear && title.story_year" class="text-amber-400/70 font-medium">{{ title.story_year }}</span>
                                        <span v-if="showStoryYear && title.story_year" class="w-0.5 h-0.5 rounded-full bg-white/20" />
                                        <span>{{ releaseYear }}</span>
                                        <span v-if="title.runtime_minutes" class="flex items-center gap-1">
                                            <span class="w-0.5 h-0.5 rounded-full bg-white/20" />
                                            {{ formatRuntime(title.runtime_minutes) }}
                                        </span>
                                        <span class="flex items-center gap-1">
                                            <span class="w-0.5 h-0.5 rounded-full bg-white/20" />
                                            {{ title.type === 'series' ? 'Serie' : 'Film' }}
                                        </span>
                                    </div>
                                </div>
                                <span class="font-mono text-xs text-white/20 shrink-0">#{{ showStoryYear ? (title.story_order ?? title.chronology_index) : title.chronology_index }}</span>
                            </div>

                            <!-- Tags -->
                            <div class="flex flex-wrap items-center gap-1.5 mt-3">
                                <UiPhaseTag v-if="title.phase" :phase="title.phase" show-number />
                                <UiCanonBadge
                                    v-if="title.canon_level"
                                    :canon-level="title.canon_level"
                                    :relevance-score="title.mcu_relevance_score"
                                    show-relevance
                                />
                                <UiRetconTag
                                    v-if="hasRetcons"
                                    description="Deze titel is beïnvloed door een latere release"
                                />
                            </div>

                            <!-- Synopsis (spoiler guarded) -->
                            <p v-if="title.overview" :class="[
                                'mt-3 text-sm text-white/40 line-clamp-2',
                                !canShow && 'spoiler-blur pointer-events-none'
                            ]">
                                {{ title.overview }}
                            </p>
                        </div>

                        <!-- Actions -->
                        <div class="flex items-center gap-2 mt-4" @click.prevent.stop>
                            <button
                                v-if="status !== 'watched'"
                                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-green-500/20 hover:text-green-400 text-white/50 transition-colors"
                                @click="$emit('markWatched', title.id)"
                            >
                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                </svg>
                                Watched
                            </button>
                            <button
                                v-if="status !== 'skipped' && status !== 'watched'"
                                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-orange-500/20 hover:text-orange-400 text-white/50 transition-colors"
                                @click="$emit('markSkipped', title.id)"
                            >
                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                Skip
                            </button>
                            <NuxtLink
                                v-if="title.trailer_url"
                                :to="`/title/${title.slug}#videos`"
                                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-white/50 transition-colors"
                            >
                                <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                                Trailer
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

const cardEl = ref<HTMLElement | null>(null)
const posterImg = ref<HTMLElement | null>(null)

const posterSizeClass = computed(() => {
    const map: Record<string, string> = {
        small: 'sm:w-28 sm:min-h-[168px]',
        medium: 'sm:w-40 md:w-48 sm:min-h-[240px]',
        large: 'sm:w-52 md:w-60 sm:min-h-[312px]',
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
