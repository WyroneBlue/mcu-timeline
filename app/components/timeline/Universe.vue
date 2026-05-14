<template>
    <div
        ref="containerEl"
        :class="[
            'universe-container w-full',
            focusMode ? 'fixed inset-0 z-[100]' : 'relative'
        ]"
        :style="{ backgroundColor: currentTheme.bgColor, ...(focusMode ? {} : { height: containerHeight }) }"
    >
        <ClientOnly>
            <TresCanvas
                v-if="!prefersReducedMotion"
                :alpha="false"
                :antialias="true"
                :power-preference="'high-performance'"
                :clear-color="currentTheme.bgColor"
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
                    :theme-bg="currentTheme.bgColor"
                    :layout="layout"
                    @hover="hoveredId = $event"
                    @select="handleSelect"
                    @update:focused-index="focusedIndex = $event"
                />
                <component
                    v-if="settings.showEasterEggs && watcherPosition"
                    :is="TheWatcherSprite"
                    :position="watcherPosition"
                />
            </TresCanvas>

            <template #fallback>
                <div class="flex items-center justify-center h-full" :style="{ backgroundColor: currentTheme.bgColor }">
                    <div class="flex flex-col items-center gap-3">
                        <div class="w-8 h-8 border-2 rounded-full animate-spin" :style="{ borderColor: currentTheme.accentColor + '33', borderTopColor: currentTheme.accentColor + '99' }" />
                        <span class="text-white/20 text-xs tracking-widest uppercase">{{ $t('timeline.loadingUniverse') }}</span>
                    </div>
                </div>
            </template>
        </ClientOnly>

        <!-- Controls -->
        <div class="absolute top-4 left-4 z-30 flex flex-col gap-2" @pointerdown.stop @click.stop>
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

            <button
                :class="[
                    'group w-10 h-10 rounded-xl border backdrop-blur-md flex items-center justify-center transition-all duration-300',
                    focusMode
                        ? ''
                        : 'bg-black/40 border-white/[0.06] text-white/40 hover:text-white/80 hover:bg-white/[0.06] hover:border-white/10'
                ]"
                :style="focusMode ? { backgroundColor: currentTheme.accentColor + '33', borderColor: currentTheme.accentColor + '4D', color: currentTheme.accentColor + 'CC' } : {}"
                :title="focusMode ? $t('timeline.exitFocusMode') : $t('timeline.focusMode')"
                @click="toggleFocusMode"
            >
                <svg v-if="!focusMode" class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                </svg>
                <svg v-else class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                </svg>
            </button>

            <!-- Collapsible settings panel -->
            <Transition name="settings-panel">
                <div
                    v-if="controlsOpen"
                    class="universe-settings w-56 rounded-xl bg-black/60 border border-white/[0.06] backdrop-blur-xl overflow-hidden"
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
                                    v-for="l in layoutOptions"
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
                            <div class="mt-1.5 px-1 text-[10px] text-white/25 truncate">{{ layoutOptions.find(l => l.value === layout)?.label }}</div>
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
                            <div>
                                <div class="text-[10px] text-white/30 mb-1.5">Scroll</div>
                                <div class="flex gap-1">
                                    <button
                                        v-for="opt in (['snap', 'free'] as const)"
                                        :key="opt"
                                        :class="[
                                            'flex-1 px-2 py-1.5 rounded-md text-[10px] font-medium transition-all duration-200',
                                            settings.scrollBehavior === opt
                                                ? 'bg-white/10 text-white/80'
                                                : 'text-white/30 hover:text-white/50 hover:bg-white/[0.03]'
                                        ]"
                                        @click="settings.scrollBehavior = opt"
                                    >
                                        {{ opt === 'snap' ? 'Snap' : 'Free' }}
                                    </button>
                                </div>
                            </div>
                            <label class="flex items-center justify-between cursor-pointer group">
                                <span class="text-[10px] text-white/30 group-hover:text-white/50 transition-colors">Prev/Next controls</span>
                                <button
                                    :class="['relative w-7 h-4 rounded-full transition-colors duration-200', settings.scrollToNextEnabled ? 'bg-white/20' : 'bg-white/[0.06]']"
                                    @click="settings.scrollToNextEnabled = !settings.scrollToNextEnabled"
                                >
                                    <span :class="['absolute top-0.5 w-3 h-3 rounded-full transition-all duration-200', settings.scrollToNextEnabled ? 'left-3.5 bg-white/80' : 'left-0.5 bg-white/30']" />
                                </button>
                            </label>
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
                            <div>
                                <div class="text-[10px] text-white/30 mb-1.5">Particles</div>
                                <div class="flex gap-1">
                                    <button
                                        v-for="opt in (['low', 'medium', 'high'] as const)"
                                        :key="opt"
                                        :class="[
                                            'flex-1 px-2 py-1.5 rounded-md text-[10px] font-medium transition-all duration-200',
                                            settings.particleDensity === opt
                                                ? 'bg-white/10 text-white/80'
                                                : 'text-white/30 hover:text-white/50 hover:bg-white/[0.03]'
                                        ]"
                                        @click="settings.particleDensity = opt"
                                    >
                                        {{ opt.charAt(0).toUpperCase() + opt.slice(1) }}
                                    </button>
                                </div>
                            </div>
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
                            <label class="flex items-center justify-between cursor-pointer group">
                                <span class="text-[10px] text-white/30 group-hover:text-white/50 transition-colors">Easter eggs</span>
                                <button
                                    :class="['relative w-7 h-4 rounded-full transition-colors duration-200', settings.showEasterEggs ? 'bg-white/20' : 'bg-white/[0.06]']"
                                    @click="settings.showEasterEggs = !settings.showEasterEggs"
                                >
                                    <span :class="['absolute top-0.5 w-3 h-3 rounded-full transition-all duration-200', settings.showEasterEggs ? 'left-3.5 bg-white/80' : 'left-0.5 bg-white/30']" />
                                </button>
                            </label>
                        </div>
                    </Transition>
                </div>
            </Transition>
        </div>

        <!-- Navigation controls (Prev / Next) — buttons fixed, title centered between them -->
        <div v-if="settings.scrollToNextEnabled" class="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-[300px] sm:w-[340px]" @pointerdown.stop @click.stop>
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
                        <div class="text-white/90 text-xs sm:text-sm font-medium truncate max-w-[160px] sm:max-w-[200px]">{{ focusedTitle?.title ?? '—' }}</div>
                        <div class="text-white/30 text-[10px] sm:text-[11px] mt-0.5">{{ focusedIndex + 1 }} / {{ sortedTitles.length }}</div>
                    </div>
                </div>

                <button
                    :disabled="focusedIndex >= sortedTitles.length - 1"
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

        <!-- Drag hint (shows initially, hides after interaction) -->
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
                <span class="hidden sm:inline">{{ $t('location.scrollToZoom') }}</span>
                <span class="w-px h-3 bg-white/10 hidden sm:block" />
                <span class="hidden sm:inline">{{ $t('location.clickTitle') }}</span>
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
                <button
                    class="absolute top-4 right-4 z-30 w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.08] transition-all duration-200"
                    @click="selectedId = null"
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
                            class="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-medium border transition-all duration-200"
                            :style="{ backgroundColor: currentTheme.accentColor + '1A', color: currentTheme.accentColor + 'CC', borderColor: currentTheme.accentColor + '1A' }"
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
import LayoutIcon from './LayoutIcon.vue'
import TheWatcherSprite from '../easter-eggs/TheWatcherSprite.vue'

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

export type UniverseLayout = 'phase' | 'spiral' | 'zigzag' | 'grid' | 'helix' | 'galaxy' | 'scatter' | 'wave' | 'ring' | 'sphere' | 'constellation' | 'funnel' | 'flower' | 'pyramid' | 'infinity' | 'cross' | 'hourglass' | 'tree' | 'diamond' | 'coil' | 'vortex' | 'dna' | 'staircase' | 'galaxy-ring' | 'web'

const { focusMode, toggleFocusMode } = useFocusMode()
const { discoverEasterEgg } = useEasterEggs()
const { settings, currentTheme, getFavoriteCharacter } = useSettings()

const layout = ref<UniverseLayout>('phase')
const controlsOpen = ref(false)
const sectionOpen = reactive({ layout: true, navigation: false, visuals: false })
const layoutOptions: { value: UniverseLayout; label: string }[] = [
    { value: 'phase', label: 'Phase Clusters' },
    { value: 'spiral', label: 'Spiral' },
    { value: 'zigzag', label: 'Zigzag' },
    { value: 'grid', label: 'Grid' },
    { value: 'helix', label: 'Helix' },
    { value: 'galaxy', label: 'Galaxy' },
    { value: 'scatter', label: 'Scatter' },
    { value: 'wave', label: 'Wave' },
    { value: 'ring', label: 'Ring' },
    { value: 'sphere', label: 'Sphere' },
    { value: 'constellation', label: 'Constellation' },
    { value: 'funnel', label: 'Funnel' },
    { value: 'flower', label: 'Flower' },
    { value: 'pyramid', label: 'Pyramid' },
    { value: 'infinity', label: 'Infinity' },
    { value: 'cross', label: 'Cross' },
    { value: 'hourglass', label: 'Hourglass' },
    { value: 'tree', label: 'Tree' },
    { value: 'diamond', label: 'Diamond' },
    { value: 'coil', label: 'Coil' },
    { value: 'vortex', label: 'Vortex' },
    { value: 'dna', label: 'DNA' },
    { value: 'staircase', label: 'Staircase' },
    { value: 'galaxy-ring', label: 'Galaxy Ring' },
    { value: 'web', label: 'Web' },
]

const watcherPosition = ref<[number, number, number] | null>(null)

function pickWatcherPosition(): [number, number, number] {
    const spots: [number, number, number][] = [
        [-18, 14, -10],
        [35, 16, -20],
        [-10, 12, -30],
        [55, 10, -8],
        [20, 18, -38],
        [-40, 11, 5],
    ]
    return spots[Math.floor(Math.random() * spots.length)]
}

watch(() => settings.showEasterEggs, (enabled) => {
    if (enabled && !watcherPosition.value) {
        watcherPosition.value = pickWatcherPosition()
        discoverEasterEgg('the-watcher')
    }
}, { immediate: true })

const containerEl = ref<HTMLElement | null>(null)
const cameraRef = ref<any>(null)
const hoveredId = ref<number | null>(null)
const selectedId = ref<number | null>(null)
const focusedIndex = ref(0)
const showDragHint = ref(true)
const tooltipPos = ref({ x: 0, y: 0 })
const prefersReducedMotion = ref(false)

const sortedTitles = computed(() => props.titles)

const focusedTitle = computed(() => sortedTitles.value[focusedIndex.value] ?? null)

watch(() => props.titles, (newTitles) => {
    const currentId = selectedId.value
    if (currentId != null) {
        const newIdx = newTitles.findIndex(t => t.id === currentId)
        focusedIndex.value = newIdx >= 0 ? newIdx : 0
    } else {
        focusedIndex.value = 0
    }
})

onMounted(() => {
    prefersReducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches || settings.reducedMotion
    setTimeout(() => { showDragHint.value = false }, 5000)

    // Start at favorite character's first title
    const favChar = getFavoriteCharacter()
    if (favChar?.startFromSlug) {
        const idx = sortedTitles.value.findIndex(t => t.slug === favChar.startFromSlug)
        if (idx >= 0) {
            focusedIndex.value = idx
            selectedId.value = sortedTitles.value[idx].id
        }
    }

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
    transition: max-height 0.25s ease, opacity 0.2s ease;
    max-height: 300px;
    overflow: hidden;
}
.section-leave-active {
    transition: max-height 0.2s ease, opacity 0.15s ease;
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

.universe-settings .scrollbar-thin::-webkit-scrollbar {
    width: 3px;
}
.universe-settings .scrollbar-thin::-webkit-scrollbar-track {
    background: transparent;
}
.universe-settings .scrollbar-thin::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
}
</style>
