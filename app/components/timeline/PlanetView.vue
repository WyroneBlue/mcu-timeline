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
                    :titles="titles"
                    :progress-map="progressMap"
                    :hovered-code="hoveredCode"
                    :selected-code="planetMode.selectedLocationCode.value"
                    :focused-index="focusedIndex"
                    :layout="layout"
                    @hover="hoveredCode = $event"
                    @select="onSelect"
                    @update:focused-index="focusedIndex = $event"
                />
                <component
                    v-else
                    :is="EarthGlobeScene"
                    :hovered-code="earthHoveredCode"
                    :selected-code="planetMode.selectedLocationCode.value"
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

            <!-- Collapsible settings panel -->
            <Transition name="settings-panel">
                <div
                    v-if="controlsOpen"
                    class="planet-settings w-56 rounded-xl bg-black/60 border border-white/[0.06] backdrop-blur-xl overflow-hidden"
                >
                    <!-- Layout section -->
                    <button
                        class="w-full flex items-center justify-between px-3 py-2.5 text-[11px] font-medium tracking-wider uppercase text-white/40 hover:text-white/60 transition-colors"
                        @click="sectionOpen.layout = !sectionOpen.layout"
                    >
                        <span>Layout</span>
                        <svg class="w-3 h-3 transition-transform duration-200" :class="sectionOpen.layout ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    <Transition name="section">
                        <div v-if="sectionOpen.layout" class="px-2 pb-2">
                            <div class="grid grid-cols-5 gap-1 max-h-[200px] overflow-y-auto scrollbar-thin pr-0.5">
                                <button
                                    v-for="l in layouts"
                                    :key="l.value"
                                    :class="[
                                        'w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200',
                                        layout === l.value
                                            ? 'bg-white/10 text-white/90 shadow-sm ring-1 ring-white/10'
                                            : 'text-white/30 hover:text-white/60 hover:bg-white/[0.04]'
                                    ]"
                                    :title="l.label"
                                    @click="layout = l.value"
                                >
                                    <LayoutIcon :layout="l.value" />
                                </button>
                            </div>
                            <div class="mt-1.5 px-1 text-[10px] text-white/25 truncate">{{ layouts.find(l => l.value === layout)?.label }}</div>
                        </div>
                    </Transition>

                    <div class="h-px bg-white/[0.04] mx-2" />

                    <!-- Navigation section -->
                    <button
                        class="w-full flex items-center justify-between px-3 py-2.5 text-[11px] font-medium tracking-wider uppercase text-white/40 hover:text-white/60 transition-colors"
                        @click="sectionOpen.navigation = !sectionOpen.navigation"
                    >
                        <span>Navigation</span>
                        <svg class="w-3 h-3 transition-transform duration-200" :class="sectionOpen.navigation ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    <Transition name="section">
                        <div v-if="sectionOpen.navigation" class="px-3 pb-3 flex flex-col gap-2.5">
                            <label class="flex items-center justify-between cursor-pointer group">
                                <span class="text-[10px] text-white/30 group-hover:text-white/50 transition-colors">Camera auto-reset</span>
                                <button
                                    :class="['relative w-7 h-4 rounded-full transition-colors duration-200', settings.cameraAutoReset ? 'bg-white/20' : 'bg-white/[0.06]']"
                                    @click="settings.cameraAutoReset = !settings.cameraAutoReset"
                                >
                                    <span :class="['absolute top-0.5 w-3 h-3 rounded-full transition-all duration-200', settings.cameraAutoReset ? 'left-3.5 bg-white/80' : 'left-0.5 bg-white/30']" />
                                </button>
                            </label>
                        </div>
                    </Transition>

                    <div class="h-px bg-white/[0.04] mx-2" />

                    <!-- Visuals section -->
                    <button
                        class="w-full flex items-center justify-between px-3 py-2.5 text-[11px] font-medium tracking-wider uppercase text-white/40 hover:text-white/60 transition-colors"
                        @click="sectionOpen.visuals = !sectionOpen.visuals"
                    >
                        <span>Visuals</span>
                        <svg class="w-3 h-3 transition-transform duration-200" :class="sectionOpen.visuals ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    <Transition name="section">
                        <div v-if="sectionOpen.visuals" class="px-3 pb-3 flex flex-col gap-2.5">
                            <label class="flex items-center justify-between cursor-pointer group">
                                <span class="text-[10px] text-white/30 group-hover:text-white/50 transition-colors">Layout drift</span>
                                <button
                                    :class="['relative w-7 h-4 rounded-full transition-colors duration-200', settings.layoutDrift ? 'bg-white/20' : 'bg-white/[0.06]']"
                                    @click="settings.layoutDrift = !settings.layoutDrift"
                                >
                                    <span :class="['absolute top-0.5 w-3 h-3 rounded-full transition-all duration-200', settings.layoutDrift ? 'left-3.5 bg-white/80' : 'left-0.5 bg-white/30']" />
                                </button>
                            </label>
                            <label class="flex items-center justify-between cursor-pointer group">
                                <span class="text-[10px] text-white/30 group-hover:text-white/50 transition-colors">Reduced motion</span>
                                <button
                                    :class="['relative w-7 h-4 rounded-full transition-colors duration-200', settings.reducedMotion ? 'bg-white/20' : 'bg-white/[0.06]']"
                                    @click="settings.reducedMotion = !settings.reducedMotion"
                                >
                                    <span :class="['absolute top-0.5 w-3 h-3 rounded-full transition-all duration-200', settings.reducedMotion ? 'left-3.5 bg-white/80' : 'left-0.5 bg-white/30']" />
                                </button>
                            </label>
                        </div>
                    </Transition>
                </div>
            </Transition>
        </div>

        <!-- Type legend -->
        <div v-if="planetMode.viewState.value !== 'earth-detail'" class="absolute top-4 right-4 z-10 flex flex-col gap-1.5 p-3 rounded-xl bg-black/40 border border-white/[0.06] backdrop-blur-xl">
            <div class="text-[10px] text-white/30 uppercase tracking-wider mb-1">{{ $t('location.types') }}</div>
            <div v-for="t in typeEntries" :key="t.type" class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full" :style="{ backgroundColor: t.color }" />
                <span class="text-[11px] text-white/50 capitalize">{{ t.label }}</span>
            </div>
        </div>

        <!-- Navigation controls (Prev / Next) -->
        <div v-if="planetMode.viewState.value !== 'earth-detail'" class="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-[300px] sm:w-[340px]">
            <div class="relative flex items-center justify-between">
                <button
                    :disabled="focusedIndex <= 0"
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
                        <div class="text-white/90 text-xs sm:text-sm font-medium truncate max-w-[160px] sm:max-w-[200px]">{{ focusedLocation?.name ?? '—' }}</div>
                        <div class="text-white/30 text-[10px] sm:text-[11px] mt-0.5">{{ focusedIndex + 1 }} / {{ sortedLocations.length }}</div>
                    </div>
                </div>

                <button
                    :disabled="focusedIndex >= sortedLocations.length - 1"
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
import type { LocationJson } from '~/types/multiverse'
import SolarSystemScene from '../planet/SolarSystemScene.vue'
import EarthGlobeScene from '../planet/EarthGlobeScene.vue'
import LayoutIcon from './LayoutIcon.vue'
import { usePlanetLayout } from '~/composables/usePlanetLayout'

type Title = Database['public']['Tables']['titles']['Row']
type ProgressStatus = 'queued' | 'watching' | 'watched' | 'skipped'

const props = defineProps<{
    titles: Title[]
    progressMap: Map<number, ProgressStatus>
}>()

const emit = defineEmits<{
    markWatched: [id: number]
    markSkipped: [id: number]
}>()

const { t } = useI18n()
const { settings, currentTheme } = useSettings()
const titlesRef = computed(() => props.titles)
const planetMode = usePlanetMode(titlesRef)
const { layout, layouts } = usePlanetLayout()

const controlsOpen = ref(false)
const sectionOpen = reactive({ layout: true, navigation: false, visuals: false })

const containerEl = ref<HTMLElement | null>(null)
const cameraRef = ref<any>(null)
const hoveredCode = ref<string | null>(null)
const earthHoveredCode = ref<string | null>(null)
const focusedIndex = ref(0)
const showDragHint = ref(true)
const tooltipPos = ref({ x: 0, y: 0 })
const prefersReducedMotion = ref(false)

const sortedLocations = computed(() => planetMode.solarSystemLocations.value)

const focusedLocation = computed(() => sortedLocations.value[focusedIndex.value] ?? null)

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

const windowHeight = ref(typeof window !== 'undefined' ? window.innerHeight : 800)
const isMobile = computed(() => typeof window !== 'undefined' && window.innerWidth < 640)

const containerHeight = computed(() => {
    const bottomNavOffset = isMobile.value ? 80 : 0
    return `${Math.max(500, windowHeight.value - 140 - bottomNavOffset)}px`
})

onMounted(() => {
    prefersReducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setTimeout(() => { showDragHint.value = false }, 5000)

    const onResize = () => { windowHeight.value = window.innerHeight }
    window.addEventListener('resize', onResize)
    onUnmounted(() => window.removeEventListener('resize', onResize))
})

onMounted(() => {
    const el = containerEl.value
    if (!el) return
    el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect()
        tooltipPos.value = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    })
})

function onSelect(code: string | null) {
    if (code === 'earth') {
        planetMode.enterEarth()
        showDragHint.value = false
        return
    }
    planetMode.selectLocation(code)
    if (code) {
        showDragHint.value = false
        const idx = sortedLocations.value.findIndex(l => l.id === code)
        if (idx >= 0) focusedIndex.value = idx
    }
}

function onEarthPinSelect(code: string | null) {
    planetMode.selectLocation(code)
}

function onExitEarth() {
    planetMode.exitEarth()
}

function onTitleClick(title: Title) {
    planetMode.selectTitle(title.slug === planetMode.selectedTitleSlug.value ? null : title.slug)
}

function goNext() {
    if (focusedIndex.value < sortedLocations.value.length - 1) {
        focusedIndex.value++
        const nextLoc = sortedLocations.value[focusedIndex.value]
        if (nextLoc) planetMode.selectLocation(nextLoc.id)
    }
}

function goPrev() {
    if (focusedIndex.value > 0) {
        focusedIndex.value--
        const prevLoc = sortedLocations.value[focusedIndex.value]
        if (prevLoc) planetMode.selectLocation(prevLoc.id)
    }
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

.section-enter-active {
    transition: max-height 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;
    max-height: 300px;
    overflow: hidden;
}
.section-leave-active {
    transition: max-height 0.15s ease, opacity 0.1s ease;
    max-height: 300px;
    overflow: hidden;
}
.section-enter-from {
    max-height: 0;
    opacity: 0;
}
.section-leave-to {
    max-height: 0;
    opacity: 0;
}

.planet-settings .scrollbar-thin::-webkit-scrollbar {
    width: 3px;
}
.planet-settings .scrollbar-thin::-webkit-scrollbar-track {
    background: transparent;
}
.planet-settings .scrollbar-thin::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.08);
    border-radius: 3px;
}
</style>
