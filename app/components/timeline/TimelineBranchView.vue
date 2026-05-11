<template>
    <div class="relative w-full" :style="{ height: containerHeight + 'px' }">
        <!-- Controls -->
        <div class="absolute top-4 left-4 z-10 flex flex-col gap-2">
            <button
                class="group w-10 h-10 rounded-xl bg-black/40 border border-white/[0.06] backdrop-blur-md flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/[0.06] hover:border-white/10 transition-all duration-300"
                title="Reset camera"
                @click="resetCamera"
            >
                <svg class="w-4.5 h-4.5 transition-transform duration-300 group-hover:rotate-[-45deg]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
            </button>
        </div>

        <!-- Legend -->
        <div class="absolute top-4 right-4 z-10 flex flex-col gap-1.5 p-3 rounded-xl bg-black/40 border border-white/[0.06] backdrop-blur-xl">
            <div class="text-[10px] text-white/30 uppercase tracking-wider mb-1">Legend</div>
            <div class="flex items-center gap-2">
                <div class="w-3 h-0.5 rounded-full bg-[#D69E2E]" />
                <span class="text-[11px] text-white/50">Sacred Timeline</span>
            </div>
            <div v-for="branch in nexusBranches" :key="branch.id" class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full" :style="{ backgroundColor: branch.color }" />
                <span class="text-[11px] text-white/50 truncate max-w-[120px]">{{ branch.event_name }}</span>
            </div>
        </div>

        <!-- 3D Canvas -->
        <ClientOnly>
            <TresCanvas
                :style="{ height: containerHeight + 'px' }"
                class="w-full !z-0"
                :clear-color="0x050508"
                antialias
                power-preference="high-performance"
                @wheel.prevent="() => {}"
            >
                <TresPerspectiveCamera :position="[0, 5, 25]" :fov="50" :near="0.1" :far="500" />
                <component
                    :is="BranchScene"
                    :titles="titles"
                    :progress-map="progressMap"
                    :hovered-id="hoveredId"
                    :selected-id="selectedId"
                    :focused-index="focusedIndex"
                    @hover="hoveredId = $event"
                    @select="onSelect"
                    @update:focused-index="focusedIndex = $event"
                />
            </TresCanvas>

            <template #fallback>
                <div class="flex items-center justify-center h-full bg-[#050508]">
                    <div class="flex flex-col items-center gap-3">
                        <div class="w-8 h-8 border-2 border-yellow-500/20 border-t-yellow-500/60 rounded-full animate-spin" />
                        <span class="text-white/20 text-xs tracking-widest uppercase">Loading Timeline</span>
                    </div>
                </div>
            </template>
        </ClientOnly>

        <!-- Navigation -->
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
                        <div class="text-white/90 text-xs sm:text-sm font-medium truncate max-w-[160px] sm:max-w-[200px]">
                            {{ focusedBranch?.event_name ?? 'Sacred Timeline' }}
                        </div>
                        <div class="text-white/30 text-[10px] sm:text-[11px] mt-0.5">{{ focusedIndex + 1 }} / {{ nexusBranches.length }}</div>
                    </div>
                </div>

                <button
                    :disabled="focusedIndex >= nexusBranches.length - 1"
                    class="shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/60 border border-white/10 backdrop-blur-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200 disabled:opacity-20 disabled:pointer-events-none"
                    @click="goNext"
                >
                    <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>

        <!-- Info Panel -->
        <Transition :name="isMobile ? 'panel-bottom' : 'panel'">
            <div
                v-if="selectedBranch"
                :class="[
                    'absolute z-20 flex flex-col',
                    isMobile
                        ? 'left-0 right-0 bottom-0 max-h-[60vh]'
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

                    <div
                        class="w-3 h-3 rounded-full mb-3"
                        :style="{ backgroundColor: selectedBranch.color }"
                    />

                    <div class="text-white/[0.06] font-display text-4xl tracking-tighter mb-1 uppercase">NEXUS</div>

                    <h3 class="font-display text-xl tracking-wide text-white/95 mb-2 pr-8 leading-tight">{{ selectedBranch.event_name }}</h3>

                    <div class="flex items-center gap-2 text-xs text-white/30 mb-4">
                        <span v-if="selectedBranch.is_nexus_event" class="px-2 py-0.5 rounded-full border border-yellow-500/20 bg-yellow-500/5 text-yellow-400/60">Nexus Event</span>
                        <span v-if="selectedBranch.is_pruned" class="px-2 py-0.5 rounded-full border border-red-500/20 bg-red-500/5 text-red-400/60">Pruned</span>
                    </div>

                    <p class="text-sm text-white/30 leading-relaxed mb-4">{{ selectedBranch.description }}</p>

                    <div class="w-full h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent mb-4" />

                    <div class="text-xs text-white/20">
                        <span>Source: </span>
                        <NuxtLink
                            :to="`/title/${selectedBranch.source_title_slug}`"
                            class="text-white/40 hover:text-white/60 underline underline-offset-2"
                        >
                            {{ selectedBranch.source_title_slug }}
                        </NuxtLink>
                    </div>
                </div>
            </div>
        </Transition>

        <!-- Drag hint -->
        <Transition name="fade">
            <div
                v-if="showDragHint"
                class="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 px-5 py-2.5 rounded-full bg-black/50 border border-white/[0.06] backdrop-blur-md text-white/30 text-xs flex items-center gap-3 tracking-wide"
            >
                <span>Drag to explore the Sacred Timeline</span>
                <span class="w-px h-3 bg-white/10" />
                <span>Click nexus events</span>
            </div>
        </Transition>
    </div>
</template>

<script setup lang="ts">
import type { Database } from '~/types/supabase'
import type { TimelineBranchJson } from '~/types/multiverse'
import BranchScene from './BranchScene.vue'
import branchesJson from '../../../data/timeline-branches.json'

type Title = Database['public']['Tables']['titles']['Row']
type ProgressStatus = 'queued' | 'watching' | 'watched' | 'skipped'

const props = defineProps<{
    titles: Title[]
    progressMap: Map<number, ProgressStatus>
}>()

const nexusBranches = (branchesJson as TimelineBranchJson[]).filter(b => b.is_nexus_event)

const hoveredId = ref<string | null>(null)
const selectedId = ref<string | null>(null)
const focusedIndex = ref(0)
const showDragHint = ref(true)

const isMobile = ref(false)
onMounted(() => {
    isMobile.value = window.innerWidth < 640
    setTimeout(() => { showDragHint.value = false }, 6000)
})

const containerHeight = computed(() => {
    if (typeof window === 'undefined') return 600
    return window.innerHeight - (isMobile.value ? 144 : 64)
})

const focusedBranch = computed(() => nexusBranches[focusedIndex.value] ?? null)
const selectedBranch = computed(() => {
    if (!selectedId.value) return null
    return (branchesJson as TimelineBranchJson[]).find(b => b.id === selectedId.value) ?? null
})

function onSelect(id: string | null) {
    selectedId.value = id
    if (id) showDragHint.value = false
}

function goPrev() {
    if (focusedIndex.value > 0) {
        focusedIndex.value--
        selectedId.value = null
    }
}

function goNext() {
    if (focusedIndex.value < nexusBranches.length - 1) {
        focusedIndex.value++
        selectedId.value = null
    }
}

function resetCamera() {
    focusedIndex.value = 0
    selectedId.value = null
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.4s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.panel-enter-active { transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease; }
.panel-leave-active { transition: transform 0.3s ease-in, opacity 0.25s ease-in; }
.panel-enter-from { transform: translateX(100%); opacity: 0; }
.panel-leave-to { transform: translateX(100%); opacity: 0; }

.panel-bottom-enter-active { transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s ease-out; }
.panel-bottom-leave-active { transition: transform 0.3s ease-in, opacity 0.2s ease-in; }
.panel-bottom-enter-from { transform: translateY(100%); opacity: 0; }
.panel-bottom-leave-to { transform: translateY(100%); opacity: 0; }
</style>
