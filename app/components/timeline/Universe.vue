<template>
    <div
        ref="containerEl"
        :class="[
            'universe-container relative w-full bg-[#050508]',
            focusMode ? 'fixed inset-0 z-[100]' : ''
        ]"
        :style="focusMode ? undefined : { height: containerHeight }"
    >
        <ClientOnly>
            <TresCanvas
                v-if="!prefersReducedMotion"
                :alpha="false"
                :antialias="true"
                :power-preference="'high-performance'"
                :clear-color="'#050508'"
                class="!absolute inset-0 !z-0"
            >
                <TresPerspectiveCamera ref="cameraRef" :position="[0, 5, 18]" :fov="55" :near="0.1" :far="500" />
                <component
                    :is="UniverseScene"
                    :titles="titles"
                    :progress-map="progressMap"
                    :hovered-id="hoveredId"
                    :selected-id="selectedId"
                    :focused-index="focusedIndex"
                    @hover="hoveredId = $event"
                    @select="handleSelect"
                    @update:focused-index="focusedIndex = $event"
                />
            </TresCanvas>

            <template #fallback>
                <div class="flex items-center justify-center h-full bg-[#050508]">
                    <div class="flex flex-col items-center gap-3">
                        <div class="w-8 h-8 border-2 border-purple-500/20 border-t-purple-500/60 rounded-full animate-spin" />
                        <span class="text-white/20 text-xs tracking-widest uppercase">Loading Universe</span>
                    </div>
                </div>
            </template>
        </ClientOnly>

        <!-- Controls -->
        <div class="absolute top-4 left-4 z-30 flex flex-col gap-2">
            <button
                class="group w-10 h-10 rounded-xl bg-black/40 border border-white/[0.06] backdrop-blur-md flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/[0.06] hover:border-white/10 transition-all duration-300"
                title="Reset camera"
                @click="resetCamera"
            >
                <svg class="w-4.5 h-4.5 transition-transform duration-300 group-hover:rotate-[-45deg]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
            </button>

            <button
                :class="[
                    'group w-10 h-10 rounded-xl border backdrop-blur-md flex items-center justify-center transition-all duration-300',
                    focusMode
                        ? 'bg-purple-500/20 border-purple-500/30 text-purple-300 hover:bg-purple-500/30'
                        : 'bg-black/40 border-white/[0.06] text-white/40 hover:text-white/80 hover:bg-white/[0.06] hover:border-white/10'
                ]"
                :title="focusMode ? 'Exit focus mode' : 'Focus mode'"
                @click="toggleFocusMode"
            >
                <svg v-if="!focusMode" class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                </svg>
                <svg v-else class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                </svg>
            </button>

        </div>

        <!-- Navigation controls (Prev / Next) — buttons fixed, title centered between them -->
        <div class="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-[300px] sm:w-[340px]">
            <div class="relative flex items-center justify-between">
                <button
                    :disabled="focusedIndex <= 0"
                    class="shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/60 border border-white/10 backdrop-blur-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200 disabled:opacity-20 disabled:pointer-events-none"
                    title="Vorige"
                    @click="goPrev"
                >
                    <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div class="px-5 py-2.5 rounded-full bg-black/60 border border-white/[0.08] backdrop-blur-xl text-center">
                        <div class="text-white/90 text-xs sm:text-sm font-medium truncate max-w-[160px] sm:max-w-[200px]">{{ focusedTitle?.title ?? '—' }}</div>
                        <div class="text-white/30 text-[10px] sm:text-[11px] mt-0.5">{{ focusedIndex + 1 }} / {{ sortedTitles.length }}</div>
                    </div>
                </div>

                <button
                    :disabled="focusedIndex >= sortedTitles.length - 1"
                    class="shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/60 border border-white/10 backdrop-blur-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200 disabled:opacity-20 disabled:pointer-events-none"
                    title="Volgende"
                    @click="goNext"
                >
                    <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>

        <!-- Drag hint (shows initially, hides after interaction) -->
        <Transition name="fade">
            <div
                v-if="showDragHint"
                class="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 px-5 py-2.5 rounded-full bg-black/50 border border-white/[0.06] backdrop-blur-md text-white/30 text-xs flex items-center gap-3 tracking-wide"
            >
                <svg class="w-4 h-4 opacity-50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                <span>Drag to explore</span>
                <span class="w-px h-3 bg-white/10 hidden sm:block" />
                <span class="hidden sm:inline">Scroll to zoom</span>
                <span class="w-px h-3 bg-white/10 hidden sm:block" />
                <span class="hidden sm:inline">Click a title</span>
            </div>
        </Transition>

        <!-- Info panel -->
        <Transition :name="isMobile ? 'panel-bottom' : 'panel'">
            <div
                v-if="selectedTitle"
                :class="[
                    'absolute z-20 flex flex-col',
                    isMobile
                        ? 'left-0 right-0 bottom-0 max-h-[70vh]'
                        : 'right-0 top-0 bottom-0 w-[340px] max-w-[85vw]'
                ]"
            >
                <div :class="[
                    'h-full bg-black/70 backdrop-blur-xl p-5 sm:p-6 flex flex-col overflow-y-auto',
                    isMobile
                        ? 'border-t border-white/[0.06] rounded-t-2xl'
                        : 'border-l border-white/[0.06]'
                ]">
                    <button
                        class="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.08] transition-all duration-200"
                        @click="selectedId = null"
                    >
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <!-- Chronology number -->
                    <div class="text-white/[0.04] font-display text-6xl tracking-tighter mb-2">#{{ selectedTitle.chronology_index }}</div>

                    <h3 class="font-display text-2xl tracking-wide text-white/95 mb-2 pr-8 leading-tight">{{ selectedTitle.title }}</h3>

                    <div class="flex items-center gap-2 text-xs text-white/30 mb-5">
                        <span>{{ selectedTitle.release_date?.slice(0, 4) }}</span>
                        <template v-if="selectedTitle.runtime_minutes">
                            <span class="w-0.5 h-0.5 rounded-full bg-white/15" />
                            <span>{{ Math.floor(selectedTitle.runtime_minutes / 60) }}h {{ selectedTitle.runtime_minutes % 60 }}m</span>
                        </template>
                        <span class="w-0.5 h-0.5 rounded-full bg-white/15" />
                        <span>{{ selectedTitle.type === 'series' ? 'Serie' : 'Film' }}</span>
                    </div>

                    <div class="flex flex-wrap gap-1.5 mb-5">
                        <UiPhaseTag v-if="selectedTitle.phase" :phase="selectedTitle.phase" show-number />
                        <UiCanonBadge
                            v-if="selectedTitle.canon_level"
                            :canon-level="selectedTitle.canon_level"
                            :relevance-score="selectedTitle.mcu_relevance_score"
                            show-relevance
                        />
                    </div>

                    <div class="w-full h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent mb-5" />

                    <!-- Trailer button -->
                    <NuxtLink
                        v-if="selectedTitle.trailer_url"
                        :to="`/title/${selectedTitle.slug}#videos`"
                        class="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium bg-red-500/10 hover:bg-red-500/15 text-red-400/80 border border-red-500/10 hover:border-red-500/20 transition-all duration-200 mb-4"
                    >
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                        Bekijk trailer
                    </NuxtLink>

                    <p v-if="selectedTitle.overview" class="text-sm text-white/30 leading-relaxed mb-5">
                        {{ selectedTitle.overview }}
                    </p>

                    <!-- Status -->
                    <div v-if="selectedStatus" class="mb-5">
                        <span
                            :class="[
                                'text-xs px-3 py-1.5 rounded-full border',
                                selectedStatus === 'watched' ? 'bg-green-500/10 text-green-400/80 border-green-500/15' :
                                selectedStatus === 'skipped' ? 'bg-orange-500/10 text-orange-400/80 border-orange-500/15' :
                                'bg-white/[0.04] text-white/40 border-white/[0.06]'
                            ]"
                        >
                            {{ selectedStatus === 'watched' ? '✓ Watched' : selectedStatus === 'skipped' ? 'Skipped' : selectedStatus }}
                        </span>
                    </div>

                    <div class="mt-auto flex flex-col gap-2">
                        <div class="flex items-center gap-2">
                            <button
                                v-if="selectedStatus !== 'watched'"
                                class="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-medium bg-green-500/10 hover:bg-green-500/15 text-green-400/90 border border-green-500/10 hover:border-green-500/20 transition-all duration-200"
                                @click="$emit('markWatched', selectedTitle.id)"
                            >
                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                </svg>
                                Watched
                            </button>
                            <button
                                v-if="selectedStatus !== 'skipped' && selectedStatus !== 'watched'"
                                class="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-medium bg-white/[0.03] hover:bg-white/[0.06] text-white/40 border border-white/[0.06] hover:border-white/10 transition-all duration-200"
                                @click="$emit('markSkipped', selectedTitle.id)"
                            >
                                Skip
                            </button>
                        </div>

                        <!-- Next in flow button -->
                        <button
                            v-if="focusedIndex < sortedTitles.length - 1"
                            class="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-medium bg-purple-500/10 hover:bg-purple-500/15 text-purple-300/80 border border-purple-500/10 hover:border-purple-500/20 transition-all duration-200"
                            @click="goNext"
                        >
                            Next: {{ sortedTitles[focusedIndex + 1]?.title }}
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>

                        <!-- View details link (secondary) -->
                        <NuxtLink
                            :to="`/title/${selectedTitle.slug}`"
                            class="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-[11px] text-white/30 hover:text-white/50 transition-colors"
                        >
                            Bekijk details
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </NuxtLink>
                    </div>
                </div>
            </div>
        </Transition>

        <!-- Hover tooltip -->
        <Transition name="fade">
            <div
                v-if="hoveredTitle && !selectedId"
                class="absolute z-10 pointer-events-none"
                :style="{ left: tooltipPos.x + 'px', top: tooltipPos.y + 'px', transform: 'translate(-50%, -100%) translateY(-12px)' }"
            >
                <div class="px-3.5 py-2 rounded-lg bg-black/80 border border-white/[0.08] backdrop-blur-md text-xs">
                    <div class="text-white/90 font-medium">{{ hoveredTitle.title }}</div>
                    <div class="text-white/30 mt-0.5">{{ hoveredTitle.release_date?.slice(0, 4) }} · {{ hoveredTitle.type === 'series' ? 'Serie' : 'Film' }}</div>
                </div>
            </div>
        </Transition>
    </div>
</template>

<script setup lang="ts">
import type { Database } from '~/types/supabase'
import UniverseScene from './UniverseScene.vue'

type Title = Database['public']['Tables']['titles']['Row']
type ProgressStatus = 'queued' | 'watching' | 'watched' | 'skipped'

const props = defineProps<{
    titles: Title[]
    progressMap: Map<number, ProgressStatus>
    activePhase: number | null
}>()

const emit = defineEmits<{
    markWatched: [id: number]
    markSkipped: [id: number]
}>()

const { focusMode, toggleFocusMode } = useFocusMode()

const containerEl = ref<HTMLElement | null>(null)
const cameraRef = ref<any>(null)
const hoveredId = ref<number | null>(null)
const selectedId = ref<number | null>(null)
const focusedIndex = ref(0)
const showDragHint = ref(true)
const tooltipPos = ref({ x: 0, y: 0 })
const prefersReducedMotion = ref(false)

const sortedTitles = computed(() =>
    [...props.titles].sort((a, b) => (a.chronology_index ?? 0) - (b.chronology_index ?? 0))
)

const focusedTitle = computed(() => sortedTitles.value[focusedIndex.value] ?? null)

onMounted(() => {
    prefersReducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setTimeout(() => { showDragHint.value = false }, 5000)

    const onKeydown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && focusMode.value) {
            toggleFocusMode()
        }
    }
    window.addEventListener('keydown', onKeydown)
    onUnmounted(() => window.removeEventListener('keydown', onKeydown))
})

const windowHeight = ref(typeof window !== 'undefined' ? window.innerHeight : 800)

onMounted(() => {
    const onResize = () => { windowHeight.value = window.innerHeight }
    window.addEventListener('resize', onResize)
    onUnmounted(() => window.removeEventListener('resize', onResize))
})

const isMobile = computed(() => typeof window !== 'undefined' && window.innerWidth < 640)

const containerHeight = computed(() => {
    const bottomNavOffset = isMobile.value ? 80 : 0
    return `${Math.max(500, windowHeight.value - 140 - bottomNavOffset)}px`
})

onUnmounted(() => {
    if (focusMode.value) toggleFocusMode()
})

const selectedTitle = computed(() => {
    if (!selectedId.value) return null
    return props.titles.find(t => t.id === selectedId.value) ?? null
})

const hoveredTitle = computed(() => {
    if (!hoveredId.value) return null
    return props.titles.find(t => t.id === hoveredId.value) ?? null
})

const selectedStatus = computed(() => {
    if (!selectedId.value) return null
    return props.progressMap.get(selectedId.value) ?? null
})

function handleSelect(id: number | null) {
    selectedId.value = id
    if (id) showDragHint.value = false
}

function goNext() {
    if (focusedIndex.value < sortedTitles.value.length - 1) {
        focusedIndex.value++
        const nextTitle = sortedTitles.value[focusedIndex.value]
        if (nextTitle) {
            selectedId.value = nextTitle.id
        }
    }
}

function goPrev() {
    if (focusedIndex.value > 0) {
        focusedIndex.value--
        const prevTitle = sortedTitles.value[focusedIndex.value]
        if (prevTitle) {
            selectedId.value = prevTitle.id
        }
    }
}

function resetCamera() {
    selectedId.value = null
    hoveredId.value = null
    focusedIndex.value = 0
}

onMounted(() => {
    const el = containerEl.value
    if (!el) return
    el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect()
        tooltipPos.value = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    })
})
</script>

<style scoped>
.universe-container :deep(canvas) {
    cursor: grab;
}
.universe-container :deep(canvas):active {
    cursor: grabbing;
}
.universe-container :deep([data-tres]) {
    z-index: 0 !important;
}

.panel-enter-active {
    transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease;
}
.panel-leave-active {
    transition: transform 0.3s cubic-bezier(0.4, 0, 1, 1), opacity 0.2s ease;
}
.panel-enter-from {
    transform: translateX(100%);
    opacity: 0;
}
.panel-leave-to {
    transform: translateX(100%);
    opacity: 0;
}

.panel-bottom-enter-active {
    transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease;
}
.panel-bottom-leave-active {
    transition: transform 0.3s cubic-bezier(0.4, 0, 1, 1), opacity 0.2s ease;
}
.panel-bottom-enter-from {
    transform: translateY(100%);
    opacity: 0;
}
.panel-bottom-leave-to {
    transform: translateY(100%);
    opacity: 0;
}

.fade-enter-active {
    transition: opacity 0.25s ease;
}
.fade-leave-active {
    transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
