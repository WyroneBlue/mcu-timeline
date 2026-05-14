<template>
    <div class="relative w-full" :style="{ height: containerHeight + 'px' }">
        <!-- Type filter pills -->
        <div class="absolute top-4 left-4 z-10 flex flex-wrap gap-1.5">
            <button
                :class="[
                    'px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border backdrop-blur-xl',
                    !filterType
                        ? 'bg-white/15 border-white/20 text-white/90'
                        : 'bg-black/40 border-white/[0.06] text-white/40 hover:text-white/60 hover:border-white/10'
                ]"
                @click="filterType = null"
            >
                {{ $t('common.all') }}
            </button>
            <button
                v-for="t in typeOptions"
                :key="t.value"
                :class="[
                    'px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border backdrop-blur-xl',
                    filterType === t.value
                        ? 'bg-white/15 border-white/20 text-white/90'
                        : 'bg-black/40 border-white/[0.06] text-white/40 hover:text-white/60 hover:border-white/10'
                ]"
                @click="filterType = t.value"
            >
                {{ t.label }}
            </button>
        </div>

        <!-- Reset camera button -->
        <button
            class="absolute top-4 right-4 z-10 w-9 h-9 rounded-lg bg-black/40 border border-white/[0.06] backdrop-blur-xl flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.08] transition-all duration-200"
            :title="$t('location.resetCamera')"
            @click="resetCamera"
        >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
        </button>

        <!-- 3D Canvas -->
        <ClientOnly>
            <TresCanvas
                :style="{ height: containerHeight + 'px' }"
                class="w-full"
                :clear-color="currentTheme.bgColor"
                antialias
                power-preference="high-performance"
                @wheel.prevent="() => {}"
            >
                <TresPerspectiveCamera :position="[0, 5, 30]" :fov="50" :near="0.1" :far="500" />
                <component
                    :is="PlanetSceneComponent"
                    :hovered-code="hoveredCode"
                    :selected-code="selectedCode"
                    :focused-index="focusedIndex"
                    :filter-type="filterType"
                    @hover="hoveredCode = $event"
                    @select="onSelect"
                    @update:focused-index="focusedIndex = $event"
                />
                <component
                    v-if="settings.showEasterEggs && watcherPosition"
                    :is="TheWatcherSprite"
                    :position="watcherPosition"
                />
            </TresCanvas>
        </ClientOnly>

        <!-- Bottom navigation -->
        <div class="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-[300px] sm:w-[340px]">
            <div class="relative flex items-center justify-between">
                <button
                    :disabled="focusedIndex <= 0"
                    class="shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/60 border border-white/10 backdrop-blur-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200 disabled:opacity-20 disabled:pointer-events-none"
                    @click="goPrev"
                >
                    <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div class="px-5 py-2.5 rounded-full bg-black/60 border border-white/[0.08] backdrop-blur-xl text-center">
                        <div class="text-white/90 text-xs sm:text-sm font-medium truncate max-w-[160px] sm:max-w-[200px]">{{ focusedLocation?.name ?? '...' }}</div>
                        <div class="text-white/30 text-[10px] sm:text-[11px] mt-0.5">{{ focusedIndex + 1 }} / {{ filteredLocations.length }}</div>
                    </div>
                </div>

                <button
                    :disabled="focusedIndex >= filteredLocations.length - 1"
                    class="shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/60 border border-white/10 backdrop-blur-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200 disabled:opacity-20 disabled:pointer-events-none"
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
                v-if="showDragHint"
                class="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 px-5 py-2.5 rounded-full bg-black/50 border border-white/[0.06] backdrop-blur-md text-white/30 text-xs flex items-center gap-3 tracking-wide"
            >
                <svg class="w-4 h-4 opacity-50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                <span>{{ $t('location.dragToExplore') }}</span>
                <span class="w-px h-3 bg-white/10 hidden sm:block" />
                <span class="hidden sm:inline">{{ $t('location.clickLocation') }}</span>
            </div>
        </Transition>

        <!-- Location detail panel -->
        <PlanetLocationPanel
            :location="selectedLocation"
            @close="selectedCode = null"
        />

        <!-- Hover tooltip -->
        <div
            v-if="hoveredCode && !selectedCode"
            class="absolute z-10 pointer-events-none px-3 py-1.5 rounded-lg bg-black/70 border border-white/10 backdrop-blur-md text-white/80 text-xs"
            :style="{ left: '50%', top: '40%', transform: 'translate(-50%, -50%)' }"
        >
            {{ hoveredLocation?.name }}
        </div>
    </div>
</template>

<script setup lang="ts">
import type { LocationJson } from '~/types/multiverse'
import PlanetSceneComponent from '~/components/planet/PlanetScene.vue'
import TheWatcherSprite from '~/components/easter-eggs/TheWatcherSprite.vue'
import locationsJson from '../../data/locations.json'

definePageMeta({ ssr: false })

const { t } = useI18n()
const { settings, currentTheme } = useSettings()
const { discoverEasterEgg } = useEasterEggs()

const hoveredCode = ref<string | null>(null)
const selectedCode = ref<string | null>(null)
const focusedIndex = ref(0)
const filterType = ref<string | null>(null)
const showDragHint = ref(true)

const watcherPosition = ref<[number, number, number] | null>(null)

function pickWatcherPosition(): [number, number, number] {
    const spots: [number, number, number][] = [
        [-25, 12, -15],
        [22, 18, -25],
        [-15, 20, -35],
        [30, 14, -12],
        [0, 22, -40],
        [-30, 10, 8],
    ]
    return spots[Math.floor(Math.random() * spots.length)]
}

watch(() => settings.showEasterEggs, (enabled) => {
    if (enabled && !watcherPosition.value) {
        watcherPosition.value = pickWatcherPosition()
        discoverEasterEgg('the-watcher')
    }
}, { immediate: true })

const typeOptions = computed(() => [
    { value: 'planet', label: t('location.type_planets') },
    { value: 'realm', label: t('location.type_realms') },
    { value: 'dimension', label: t('location.type_dimensions') },
    { value: 'construct', label: t('location.type_constructs') },
    { value: 'region', label: t('location.type_regions') },
])

const filteredLocations = computed(() => {
    let locs = locationsJson as LocationJson[]
    if (filterType.value) {
        locs = locs.filter(l => l.type === filterType.value)
    }
    return locs
})

const focusedLocation = computed(() => filteredLocations.value[focusedIndex.value] ?? null)
const selectedLocation = computed(() => {
    if (!selectedCode.value) return null
    return (locationsJson as LocationJson[]).find(l => l.id === selectedCode.value) ?? null
})
const hoveredLocation = computed(() => {
    if (!hoveredCode.value) return null
    return (locationsJson as LocationJson[]).find(l => l.id === hoveredCode.value) ?? null
})

const containerHeight = computed(() => {
    if (typeof window === 'undefined') return 600
    return window.innerHeight - 64
})

function onSelect(code: string | null) {
    selectedCode.value = code
    if (code) {
        showDragHint.value = false
    }
}

function goPrev() {
    if (focusedIndex.value > 0) {
        focusedIndex.value--
        selectedCode.value = null
    }
}

function goNext() {
    if (focusedIndex.value < filteredLocations.value.length - 1) {
        focusedIndex.value++
        selectedCode.value = null
    }
}

function resetCamera() {
    focusedIndex.value = 0
    selectedCode.value = null
}

onMounted(() => {
    setTimeout(() => { showDragHint.value = false }, 6000)
})

watch(filterType, () => {
    focusedIndex.value = 0
    selectedCode.value = null
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.4s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
