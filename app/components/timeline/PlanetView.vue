<template>
    <div
        ref="containerEl"
        class="planet-container w-full relative"
        :style="{ height: containerHeight }"
    >
        <ClientOnly>
            <TresCanvas
                v-if="!prefersReducedMotion"
                :alpha="false"
                :antialias="true"
                power-preference="high-performance"
                :clear-color="currentTheme.bgColor"
                class="!absolute inset-0 !z-0"
            >
                <TresPerspectiveCamera ref="cameraRef" :position="[0, 5, 30]" :fov="50" :near="0.1" :far="500" />
                <component
                    v-if="planetMode.viewState.value !== 'earth-detail'"
                    :is="SolarSystemScene"
                    ref="solarRef"
                    :titles="titles"
                    :progress-map="progressMap"
                    :hovered-code="hoveredCode"
                    :selected-code="planetMode.selectedLocationCode.value"
                    :focused-index="focusedIndex"
                    :layout="layout"
                    :entry-from-earth="returnFromEarth"
                    @hover="hoveredCode = $event"
                    @select="onSelect"
                    @update:focused-index="focusedIndex = $event"
                />
                <component
                    v-else
                    :is="EarthGlobeScene"
                    ref="earthRef"
                    :hovered-code="earthHoveredCode"
                    :selected-code="planetMode.selectedLocationCode.value"
                    :entry-dive="cameFromDive"
                    @hover="earthHoveredCode = $event"
                    @select="onEarthPinSelect"
                />
            </TresCanvas>

            <template #fallback>
                <div class="flex items-center justify-center h-full" :style="{ backgroundColor: currentTheme.bgColor }">
                    <div class="flex flex-col items-center gap-3">
                        <div class="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500/60 rounded-full animate-spin" />
                        <span class="text-white/20 text-xs tracking-widest uppercase">{{ $t('timeline.loadingSolarSystem') }}</span>
                    </div>
                </div>
            </template>
        </ClientOnly>

        <!-- Dive skip layer: any tap/click during the travel skips the animation -->
        <div
            v-if="planetMode.viewState.value === 'traveling' || returning"
            class="absolute inset-0 z-30 cursor-pointer"
            @pointerdown="skipDive"
        />

        <!-- Dive flash at the swap peak -->
        <Transition name="dive-flash">
            <div v-if="diveFlash" class="dive-flash absolute inset-0 z-40 pointer-events-none" />
        </Transition>

        <!-- Earth back button -->
        <Transition name="fade">
            <button
                v-if="planetMode.viewState.value === 'earth-detail'"
                class="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 border border-white/[0.08] backdrop-blur-xl text-white/60 hover:text-white/90 hover:bg-white/[0.08] hover:border-white/15 transition-all duration-300 text-xs tracking-wider"
                @click="onExitEarth"
            >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
                <span class="uppercase">Solar System</span>
                <span class="text-white/20">/</span>
                <span class="text-blue-400/80 uppercase">Earth</span>
            </button>
        </Transition>

        <!-- Controls -->
        <div v-if="planetMode.viewState.value !== 'earth-detail'" class="absolute top-4 left-4 z-30 flex flex-col gap-2">
            <!-- Settings toggle -->
            <button
                :class="[
                    'group w-10 h-10 rounded-xl border backdrop-blur-md flex items-center justify-center transition-all duration-300',
                    controlsOpen
                        ? 'bg-white/[0.08] border-white/10 text-white/80'
                        : 'bg-black/40 border-white/[0.06] text-white/40 hover:text-white/80 hover:bg-white/[0.06] hover:border-white/10'
                ]"
                title="Settings"
                @click="controlsOpen = !controlsOpen"
            >
                <svg class="w-4.5 h-4.5 transition-transform duration-300" :class="controlsOpen ? 'rotate-90' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7 7 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.248a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a7 7 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.282c-.062-.373-.312-.686-.644-.87a7 7 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a7 7 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </button>

            <!-- Quick actions -->
            <button
                class="group w-10 h-10 rounded-xl bg-black/40 border border-white/[0.06] backdrop-blur-md flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/[0.06] hover:border-white/10 transition-all duration-300"
                :title="$t('timeline.resetCamera')"
                @click="resetCamera"
            >
                <svg class="w-4.5 h-4.5 transition-transform duration-300 group-hover:rotate-[-45deg]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
            </button>

            <!-- Collapsible settings panel (desktop popover) -->
            <Transition name="settings-panel">
                <div
                    v-if="controlsOpen && !isMobile"
                    class="w-56 rounded-xl bg-black/60 border border-white/[0.06] backdrop-blur-xl overflow-hidden"
                >
                    <TimelineViewSettingsPanel
                        :layout="layout"
                        :layout-options="layouts"
                        @update:layout="layout = $event as PlanetLayout"
                    />
                </div>
            </Transition>
        </div>

        <!-- Settings bottom sheet (mobile) -->
        <UiBottomSheet
            v-if="isMobile"
            :open="controlsOpen"
            :title="$t('viewSettings.title')"
            @update:open="controlsOpen = $event"
        >
            <TimelineViewSettingsPanel
                :layout="layout"
                :layout-options="layouts"
                @update:layout="layout = $event as PlanetLayout"
            />
        </UiBottomSheet>

        <!-- Type legend -->
        <div v-if="planetMode.viewState.value !== 'earth-detail'" class="absolute top-4 right-4 z-10 flex flex-col gap-1.5 p-3 rounded-xl bg-black/40 border border-white/[0.06] backdrop-blur-xl">
            <div class="text-[10px] text-white/30 uppercase tracking-wider mb-1">{{ $t('location.types') }}</div>
            <div v-for="t in typeEntries" :key="t.type" class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full" :style="{ backgroundColor: t.color }" />
                <span class="text-[11px] text-white/50 capitalize">{{ t.label }}</span>
            </div>
        </div>

        <!-- Navigation controls (Prev / Next) — re-centers within the visible
             scene when the location panel is open. -->
        <div
            v-if="planetMode.viewState.value !== 'traveling'"
            :class="[
                'absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] -translate-x-1/2 z-30 w-[min(340px,calc(100vw-2rem))] transition-[left] duration-500',
                planetMode.selectedLocation.value && !isMobile ? 'left-[calc((100%-340px)/2)]' : 'left-1/2'
            ]"
        >
            <div class="relative flex items-center justify-between">
                <button
                    :disabled="navIndex <= 0"
                    class="shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/60 border border-white/10 backdrop-blur-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200 disabled:opacity-20 disabled:pointer-events-none"
                    :title="$t('timeline.previous')"
                    @click="goPrev"
                >
                    <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div class="px-5 py-2.5 rounded-full bg-black/60 border border-white/[0.08] backdrop-blur-xl text-center">
                        <div class="text-white/90 text-xs sm:text-sm font-medium truncate max-w-[160px] sm:max-w-[200px]">{{ navPrimary }}</div>
                        <div class="text-white/30 text-[10px] sm:text-[11px] mt-0.5 truncate max-w-[160px] sm:max-w-[200px]">
                            {{ navIndex >= 0 ? navIndex + 1 : '—' }} / {{ navTotal }}<template v-if="navSecondary"> &middot; {{ navSecondary }}</template>
                        </div>
                    </div>
                </div>

                <button
                    :disabled="navIndex >= navTotal - 1"
                    class="shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/60 border border-white/10 backdrop-blur-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200 disabled:opacity-20 disabled:pointer-events-none"
                    :title="$t('timeline.nextTitle')"
                    @click="goNext"
                >
                    <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>

        <!-- Drag hint -->
        <Transition name="fade">
            <div
                v-if="showDragHint && planetMode.viewState.value !== 'earth-detail'"
                class="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 px-5 py-2.5 rounded-full bg-black/50 border border-white/[0.06] backdrop-blur-md text-white/30 text-xs flex items-center gap-3 tracking-wide"
            >
                <svg class="w-4 h-4 opacity-50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                <span>{{ $t('location.dragToExplore') }}</span>
                <span class="w-px h-3 bg-white/10 hidden sm:block" />
                <span class="hidden sm:inline">{{ $t('location.scrollToZoom') }}</span>
                <span class="w-px h-3 bg-white/10 hidden sm:block" />
                <span class="hidden sm:inline">{{ $t('location.clickPlanet') }}</span>
            </div>
        </Transition>

        <!-- Hover tooltip -->
        <Transition name="fade">
            <div
                v-if="activeHoveredLocation && !planetMode.selectedLocationCode.value"
                class="absolute z-10 pointer-events-none"
                :style="{ left: tooltipPos.x + 'px', top: tooltipPos.y + 'px', transform: 'translate(-50%, -100%) translateY(-12px)' }"
            >
                <div class="px-3.5 py-2 rounded-lg bg-black/80 border border-white/[0.08] backdrop-blur-md text-xs">
                    <div class="text-white/90 font-medium">{{ activeHoveredLocation.name }}</div>
                    <div class="text-white/30 mt-0.5 capitalize">{{ activeHoveredLocation.type }} · {{ activeHoveredLocation.title_slugs.length }} titles</div>
                </div>
            </div>
        </Transition>

        <!-- Info panel -->
        <Transition :name="isMobile ? 'panel-bottom' : 'panel'">
            <div
                v-if="planetMode.selectedLocation.value"
                :class="[
                    'absolute z-20 flex flex-col',
                    isMobile
                        ? 'left-0 right-0 bottom-0 max-h-[70vh]'
                        : 'right-0 top-0 bottom-0 w-[340px] max-w-[85vw]'
                ]"
            >
                <button
                    class="absolute top-4 right-4 z-30 w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.08] transition-all duration-200"
                    @click="planetMode.selectLocation(null)"
                >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <div :class="[
                    'h-full bg-black/70 backdrop-blur-xl p-5 sm:p-6 flex flex-col overflow-y-auto',
                    isMobile
                        ? 'border-t border-white/[0.06] rounded-t-2xl'
                        : 'border-l border-white/[0.06]'
                ]">
                    <!-- Location type badge -->
                    <span :class="[
                        'inline-flex items-center self-start px-2.5 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider mb-3',
                        typeBadgeClass(planetMode.selectedLocation.value.type)
                    ]">
                        {{ planetMode.selectedLocation.value.type }}
                    </span>

                    <h3 class="font-display text-2xl tracking-wide text-white/95 mb-2 pr-8 leading-tight">
                        {{ planetMode.selectedLocation.value.name }}
                    </h3>

                    <p class="text-sm text-white/30 leading-relaxed mb-5">
                        {{ planetMode.selectedLocation.value.description }}
                    </p>

                    <div class="w-full h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent mb-5" />

                    <!-- Titles at this location -->
                    <div class="text-[10px] text-white/30 uppercase tracking-wider mb-3">
                        {{ planetMode.titlesForLocation.value.length }} titles
                    </div>

                    <div class="flex flex-col gap-2 overflow-y-auto flex-1">
                        <button
                            v-for="title in planetMode.titlesForLocation.value"
                            :key="title.id"
                            :class="[
                                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 group',
                                title.slug === planetMode.selectedTitleSlug.value
                                    ? 'bg-white/[0.08] border border-white/[0.1]'
                                    : 'bg-white/[0.02] border border-transparent hover:bg-white/[0.05] hover:border-white/[0.06]'
                            ]"
                            @click="onTitleClick(title)"
                        >
                            <div class="shrink-0 w-8 h-12 rounded overflow-hidden bg-white/[0.04]">
                                <img
                                    v-if="title.poster_url"
                                    :src="title.poster_url"
                                    :alt="title.title"
                                    class="w-full h-full object-cover"
                                />
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="text-xs text-white/80 font-medium truncate group-hover:text-white/95 transition-colors">
                                    {{ title.title }}
                                </div>
                                <div class="flex items-center gap-1.5 mt-0.5">
                                    <span class="text-[10px] text-white/25">{{ title.release_date?.slice(0, 4) }}</span>
                                    <span
                                        v-if="progressMap.get(title.id)"
                                        :class="[
                                            'text-[10px] px-1.5 py-0.5 rounded-full',
                                            progressMap.get(title.id) === 'watched' ? 'bg-green-500/10 text-green-400/70' :
                                            progressMap.get(title.id) === 'skipped' ? 'bg-orange-500/10 text-orange-400/70' :
                                            'bg-white/[0.04] text-white/30'
                                        ]"
                                    >
                                        {{ progressMap.get(title.id) === 'watched' ? 'watched' : progressMap.get(title.id) }}
                                    </span>
                                </div>
                            </div>
                        </button>
                    </div>

                    <!-- Selected title actions -->
                    <Transition name="fade">
                        <div v-if="planetMode.selectedTitle.value" class="mt-4 pt-4 border-t border-white/[0.06] flex flex-col gap-2">
                            <div class="text-xs text-white/50 font-medium mb-1">{{ planetMode.selectedTitle.value.title }}</div>

                            <!-- Previously On recap -->
                            <button
                                v-if="!showRecap"
                                class="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium bg-purple-500/10 hover:bg-purple-500/15 text-purple-400/80 border border-purple-500/10 hover:border-purple-500/20 transition-all duration-200"
                                @click="showRecap = true"
                            >
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Previously On...
                            </button>
                            <div v-if="showRecap" class="mb-2">
                                <TitlePreviouslyOn
                                    :current-title-id="planetMode.selectedTitle.value.id"
                                    :current-title-slug="planetMode.selectedTitle.value.slug"
                                    :watched-ids="watchedIds"
                                />
                            </div>

                            <div class="flex items-center gap-2">
                                <button
                                    v-if="progressMap.get(planetMode.selectedTitle.value.id) !== 'watched'"
                                    class="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-medium bg-green-500/10 hover:bg-green-500/15 text-green-400/90 border border-green-500/10 hover:border-green-500/20 transition-all duration-200"
                                    @click="$emit('markWatched', planetMode.selectedTitle.value!.id)"
                                >
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                    Watched
                                </button>
                                <button
                                    v-if="progressMap.get(planetMode.selectedTitle.value.id) !== 'skipped' && progressMap.get(planetMode.selectedTitle.value.id) !== 'watched'"
                                    class="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-medium bg-white/[0.03] hover:bg-white/[0.06] text-white/40 border border-white/[0.06] hover:border-white/10 transition-all duration-200"
                                    @click="$emit('markSkipped', planetMode.selectedTitle.value!.id)"
                                >
                                    Skip
                                </button>
                            </div>

                            <NuxtLink
                                :to="`/title/${planetMode.selectedTitle.value.slug}`"
                                class="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-[11px] text-white/30 hover:text-white/50 transition-colors"
                            >
                                Bekijk details
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </NuxtLink>
                        </div>
                    </Transition>
                </div>
            </div>
        </Transition>
    </div>
</template>

<script setup lang="ts">
import type { Database } from '~/types/supabase'
import SolarSystemScene from '../planet/SolarSystemScene.vue'
import EarthGlobeScene from '../planet/EarthGlobeScene.vue'
import { usePlanetLayout, type PlanetLayout } from '~/composables/usePlanetLayout'
import type { JourneyStop } from '~/composables/usePlanetMode'

type Title = Database['public']['Tables']['titles']['Row']
type ProgressStatus = 'queued' | 'watching' | 'watched' | 'skipped'

const props = withDefaults(defineProps<{
    titles: Title[]
    progressMap: Map<number, ProgressStatus>
    fullscreen?: boolean
}>(), { fullscreen: false })

defineEmits<{
    markWatched: [id: number]
    markSkipped: [id: number]
}>()

const { t } = useI18n()
const { settings, currentTheme } = useSettings()
const titlesRef = computed(() => props.titles)
const planetMode = usePlanetMode(titlesRef)
const { layout, layouts } = usePlanetLayout()

const controlsOpen = ref(false)

const containerEl = ref<HTMLElement | null>(null)
const solarRef = ref<{ diveToEarth: (onPeak: () => void) => void; cancelDive: () => void } | null>(null)
const earthRef = ref<{ zoomOut: (onDone: () => void) => void; cancelZoomOut: () => void } | null>(null)
const cameFromDive = ref(false)
const returnFromEarth = ref(false)
const returning = ref(false)
const diveFlash = ref(false)
let diveFlashTimeout: ReturnType<typeof setTimeout> | null = null
const hoveredCode = ref<string | null>(null)
const earthHoveredCode = ref<string | null>(null)
const focusedIndex = ref(0)
const showDragHint = ref(true)
const tooltipPos = ref({ x: 0, y: 0 })
const prefersReducedMotion = ref(false)

const watchedIds = computed(() => {
    const ids = new Set<number>()
    for (const [id, status] of props.progressMap) {
        if (status === 'watched') ids.add(id)
    }
    return ids
})

const showRecap = ref(false)
watch(() => planetMode.selectedTitle.value, () => { showRecap.value = false })

const sortedLocations = computed(() => planetMode.solarSystemLocations.value)


// The prev/next bar serves both scenes. In the solar system it tracks
// focusedIndex; on the globe there is no index, so it tracks the selected
// pin's position in the (story-ordered) earth location list — hence -1 while
// nothing is selected there.
const isEarthDetail = computed(() => planetMode.viewState.value === 'earth-detail')

// In the solar system the bar walks the story itself — one stop per title, the
// camera hopping to wherever that title plays. On the globe there is no such
// journey, so it falls back to stepping through Earth's own locations.
const journey = computed(() => planetMode.journey.value)
const journeyIndex = ref(0)

// The bar previews the first stop before the journey starts, so the opening
// Next travels to that stop instead of skipping past it.
const journeyStarted = ref(false)
const navIndex = computed(() => journeyIndex.value)
const navTotal = computed(() => journey.value.length)
const navStop = computed(() => journey.value[journeyIndex.value] ?? null)
const navPrimary = computed(() => navStop.value?.title.title ?? '—')
const navSecondary = computed(() => {
    const stop = navStop.value
    if (!stop) return null
    return stop.earthLocation?.name ?? stop.location.name
})

const hoveredLocation = computed(() => {
    if (!hoveredCode.value) return null
    return planetMode.allLocations.value.find(l => l.id === hoveredCode.value) ?? null
})

const earthHoveredLocation = computed(() => {
    if (!earthHoveredCode.value) return null
    return planetMode.allLocations.value.find(l => l.id === earthHoveredCode.value) ?? null
})

const activeHoveredLocation = computed(() => {
    if (planetMode.viewState.value === 'earth-detail') return earthHoveredLocation.value
    return hoveredLocation.value
})

const typeEntries = computed(() => [
    { type: 'planet', color: '#4299E1', label: t('location.type_planet') },
    { type: 'realm', color: '#D69E2E', label: t('location.type_realm') },
    { type: 'dimension', color: '#9F7AEA', label: t('location.type_dimension') },
    { type: 'construct', color: '#ED8936', label: t('location.type_construct') },
])

function typeBadgeClass(type: string) {
    switch (type) {
        case 'planet': return 'bg-blue-500/10 text-blue-400/80 border border-blue-500/15'
        case 'realm': return 'bg-yellow-500/10 text-yellow-400/80 border border-yellow-500/15'
        case 'dimension': return 'bg-purple-500/10 text-purple-400/80 border border-purple-500/15'
        case 'construct': return 'bg-orange-500/10 text-orange-400/80 border border-orange-500/15'
        default: return 'bg-white/[0.04] text-white/40 border border-white/[0.06]'
    }
}

const { height: viewportHeight, isMobile } = useViewport()

const containerHeight = computed(() => {
    if (props.fullscreen) return '100%'
    const bottomNavOffset = isMobile.value ? 80 : 0
    return `${Math.max(500, viewportHeight.value - 140 - bottomNavOffset)}px`
})

onMounted(() => {
    prefersReducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setTimeout(() => { showDragHint.value = false }, 5000)

    const onKeydown = (e: KeyboardEvent) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
                e.preventDefault()
                goNext()
                break
            case 'ArrowLeft':
            case 'ArrowUp':
                e.preventDefault()
                goPrev()
                break
            case 'Enter': {
                e.preventDefault()
                const stop = navStop.value
                const loc = isEarthDetail.value ? stop?.earthLocation : stop?.location
                if (!loc) break
                if (planetMode.selectedLocationCode.value === loc.id) {
                    planetMode.selectLocation(null)
                } else {
                    onSelect(loc.id)
                }
                break
            }
            case 'Escape':
                if (planetMode.selectedLocationCode.value) {
                    planetMode.selectLocation(null)
                    if (!isEarthDetail.value) focusedIndex.value = 0
                } else if (isEarthDetail.value) {
                    onExitEarth()
                } else {
                    skipDive()
                }
                break
        }
    }
    window.addEventListener('keydown', onKeydown)
    onUnmounted(() => {
        window.removeEventListener('keydown', onKeydown)
        if (diveFlashTimeout) clearTimeout(diveFlashTimeout)
    })
})

onMounted(() => {
    const el = containerEl.value
    if (!el) return
    el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect()
        tooltipPos.value = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    })
})

function flashAndSwap() {
    diveFlash.value = true
    planetMode.completeTravel()
    consumePendingStop()
    if (diveFlashTimeout) clearTimeout(diveFlashTimeout)
    diveFlashTimeout = setTimeout(() => { diveFlash.value = false }, 280)
}

function onSelect(code: string | null) {
    if (code === 'earth') {
        showDragHint.value = false
        if (prefersReducedMotion.value || settings.reducedMotion || !solarRef.value) {
            cameFromDive.value = false
            planetMode.enterEarth()
            return
        }
        cameFromDive.value = true
        planetMode.beginTravel()
        solarRef.value.diveToEarth(flashAndSwap)
        return
    }
    planetMode.selectLocation(code)
    if (code) {
        showDragHint.value = false
        const idx = sortedLocations.value.findIndex(l => l.id === code)
        if (idx >= 0) focusedIndex.value = idx
        syncJourneyTo(s => s.location.id === code)
    }
}

// Clicking a planet, pin or title bypasses the prev/next bar, so the journey
// position is realigned — otherwise the bar keeps naming a film you left.
function syncJourneyTo(match: (stop: JourneyStop) => boolean) {
    const idx = journey.value.findIndex(match)
    if (idx < 0) return
    journeyIndex.value = idx
    journeyStarted.value = true
}

function finishReturn() {
    if (!returning.value) return
    returning.value = false
    diveFlash.value = true
    cameFromDive.value = false
    returnFromEarth.value = true
    planetMode.exitEarth()
    consumePendingStop()
    if (diveFlashTimeout) clearTimeout(diveFlashTimeout)
    diveFlashTimeout = setTimeout(() => { diveFlash.value = false }, 280)
}

// enterEarth/exitEarth reset the selection as they swap scenes, so the stop is
// applied on the far side of the transition rather than before it.
function consumePendingStop() {
    const stop = pendingStop.value
    if (!stop) return
    pendingStop.value = null
    nextTick(() => applyStop(stop))
}

function skipDive() {
    if (planetMode.viewState.value === 'traveling') {
        solarRef.value?.cancelDive()
        flashAndSwap()
    } else if (returning.value) {
        earthRef.value?.cancelZoomOut()
        finishReturn()
    }
}

function onEarthPinSelect(code: string | null) {
    planetMode.selectLocation(code)
    if (code) syncJourneyTo(s => s.earthLocation?.id === code)
}

function onExitEarth() {
    if (returning.value) return
    if (prefersReducedMotion.value || settings.reducedMotion || !earthRef.value) {
        cameFromDive.value = false
        returnFromEarth.value = false
        planetMode.exitEarth()
        return
    }
    returning.value = true
    earthRef.value.zoomOut(finishReturn)
}

function onTitleClick(title: Title) {
    const deselecting = title.slug === planetMode.selectedTitleSlug.value
    planetMode.selectTitle(deselecting ? null : title.slug)
    if (deselecting) return

    // Only follow the click when this title's stop is the place we are already
    // looking at. A location lists titles that play elsewhere too (Asgard lists
    // Love and Thunder, whose stop is New Asgard on Earth), and pointing the bar
    // there without travelling would just mislabel the view.
    const here = planetMode.selectedLocationCode.value
    syncJourneyTo(s => s.title.slug === title.slug
        && (isEarthDetail.value ? s.earthLocation?.id === here : s.location.id === here))
}

// Applied once a dive or return finishes, since both clear the selection as
// they swap scenes.
const pendingStop = ref<JourneyStop | null>(null)

function applyStop(stop: JourneyStop) {
    if (stop.location.id === 'earth') {
        if (stop.earthLocation) planetMode.selectLocation(stop.earthLocation.id)
        else planetMode.selectLocation(null)
        return
    }
    const locIdx = sortedLocations.value.findIndex(l => l.id === stop.location.id)
    if (locIdx >= 0) focusedIndex.value = locIdx
    planetMode.selectLocation(stop.location.id)
    planetMode.selectTitle(stop.title.slug)
}

function stepNav(delta: number) {
    // Mid-flight presses would fight the dive/return animation.
    if (planetMode.viewState.value === 'traveling' || returning.value) return

    const target = journeyStarted.value ? journeyIndex.value + delta : journeyIndex.value
    const stop = journey.value[target]
    if (!stop) return

    journeyStarted.value = true
    journeyIndex.value = target
    showDragHint.value = false

    const wantsEarth = stop.location.id === 'earth'
    const onEarth = isEarthDetail.value
    const instant = prefersReducedMotion.value || settings.reducedMotion

    // The journey crosses between the two scenes on its own: Earth-bound
    // titles zoom into the globe, off-world ones pull back out to the system.
    if (wantsEarth && !onEarth) {
        if (instant || !solarRef.value) {
            cameFromDive.value = false
            planetMode.enterEarth()
            applyStop(stop)
        } else {
            cameFromDive.value = true
            pendingStop.value = stop
            planetMode.beginTravel()
            solarRef.value.diveToEarth(flashAndSwap)
        }
        return
    }

    if (!wantsEarth && onEarth) {
        if (instant || !earthRef.value) {
            cameFromDive.value = false
            returnFromEarth.value = false
            planetMode.exitEarth()
            applyStop(stop)
        } else {
            pendingStop.value = stop
            returning.value = true
            earthRef.value.zoomOut(finishReturn)
        }
        return
    }

    applyStop(stop)
}

function goNext() {
    stepNav(1)
}

function goPrev() {
    stepNav(-1)
}

function resetCamera() {
    planetMode.selectLocation(null)
    hoveredCode.value = null
    focusedIndex.value = 0
}
</script>

<style scoped>
.planet-container :deep(canvas) {
    cursor: grab;
}
.planet-container :deep(canvas):active {
    cursor: grabbing;
}
.planet-container :deep([data-tres]) {
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

.dive-flash {
    background: radial-gradient(circle at center, rgba(255, 255, 255, 0.95) 0%, rgba(66, 153, 225, 0.55) 40%, transparent 75%);
}
.dive-flash-enter-active {
    transition: opacity 0.1s ease-out;
}
.dive-flash-leave-active {
    transition: opacity 0.45s ease-in;
}
.dive-flash-enter-from,
.dive-flash-leave-to {
    opacity: 0;
}

.settings-panel-enter-active {
    transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.settings-panel-leave-active {
    transition: opacity 0.15s ease, transform 0.15s ease;
}
.settings-panel-enter-from {
    opacity: 0;
    transform: translateY(-8px) scale(0.95);
}
.settings-panel-leave-to {
    opacity: 0;
    transform: translateY(-4px) scale(0.98);
}

</style>
