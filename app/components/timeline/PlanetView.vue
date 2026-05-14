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
            <button
                class="group w-10 h-10 rounded-xl bg-black/40 border border-white/[0.06] backdrop-blur-md flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/[0.06] hover:border-white/10 transition-all duration-300"
                :title="$t('timeline.resetCamera')"
                @click="resetCamera"
            >
                <svg class="w-4.5 h-4.5 transition-transform duration-300 group-hover:rotate-[-45deg]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
            </button>

            <!-- Drift toggle -->
            <button
                :class="[
                    'group w-10 h-10 rounded-xl border backdrop-blur-md flex items-center justify-center transition-all duration-300',
                    settings.layoutDrift
                        ? 'bg-white/[0.08] border-white/[0.12] text-white/80'
                        : 'bg-black/40 border-white/[0.06] text-white/30 hover:text-white/60 hover:bg-white/[0.04] hover:border-white/10'
                ]"
                title="Layout Drift"
                @click="settings.layoutDrift = !settings.layoutDrift"
            >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            </button>

            <!-- Camera auto-reset toggle -->
            <button
                :class="[
                    'group w-10 h-10 rounded-xl border backdrop-blur-md flex items-center justify-center transition-all duration-300',
                    settings.cameraAutoReset
                        ? 'bg-white/[0.08] border-white/[0.12] text-white/80'
                        : 'bg-black/40 border-white/[0.06] text-white/30 hover:text-white/60 hover:bg-white/[0.04] hover:border-white/10'
                ]"
                title="Camera Auto-Reset"
                @click="settings.cameraAutoReset = !settings.cameraAutoReset"
            >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9a3 3 0 100 6 3 3 0 000-6zM12 3v2m0 14v2M3 12h2m14 0h2m-3.5-6.5L16 7m-8 10l-1.5 1.5M19.5 17.5L18 17M6 7L4.5 5.5" />
                </svg>
            </button>

            <!-- Layout selector -->
            <div class="flex flex-col gap-1 p-1.5 rounded-xl bg-black/40 border border-white/[0.06] backdrop-blur-md">
                <button
                    v-for="l in layouts"
                    :key="l.value"
                    :class="[
                        'w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200',
                        layout === l.value
                            ? 'bg-white/10 text-white/90 shadow-sm'
                            : 'text-white/30 hover:text-white/60 hover:bg-white/[0.04]'
                    ]"
                    :title="l.label"
                    @click="layout = l.value"
                >
                    <!-- Orbital -->
                    <svg v-if="l.value === 'orbital'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="2" stroke-width="2" />
                        <circle cx="12" cy="12" r="6" stroke-width="1.2" stroke-dasharray="3 2" />
                        <circle cx="12" cy="12" r="10" stroke-width="1" stroke-dasharray="4 3" />
                        <circle cx="18" cy="12" r="1.2" fill="currentColor" stroke="none" />
                        <circle cx="8" cy="7" r="1" fill="currentColor" stroke="none" />
                    </svg>
                    <!-- Spiral -->
                    <svg v-else-if="l.value === 'spiral'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-width="1.5" stroke-linecap="round" d="M12 12c0-1.1.9-2 2-2s2 .9 2 2-.9 3-3 3-4-.9-4-3 .9-5 4-5 6 .9 6 4" />
                        <circle cx="14" cy="10" r="0.8" fill="currentColor" stroke="none" />
                        <circle cx="9" cy="15" r="0.8" fill="currentColor" stroke="none" />
                        <circle cx="18" cy="12" r="0.8" fill="currentColor" stroke="none" />
                    </svg>
                    <!-- Zigzag -->
                    <svg v-else-if="l.value === 'zigzag'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <polyline stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" points="4,8 8,16 12,8 16,16 20,8" />
                        <circle cx="4" cy="8" r="1.2" fill="currentColor" stroke="none" />
                        <circle cx="8" cy="16" r="1.2" fill="currentColor" stroke="none" />
                        <circle cx="12" cy="8" r="1.2" fill="currentColor" stroke="none" />
                        <circle cx="16" cy="16" r="1.2" fill="currentColor" stroke="none" />
                        <circle cx="20" cy="8" r="1.2" fill="currentColor" stroke="none" />
                    </svg>
                    <!-- Grid -->
                    <svg v-else-if="l.value === 'grid'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none" />
                        <circle cx="12" cy="7" r="1.5" fill="currentColor" stroke="none" />
                        <circle cx="17" cy="7" r="1.5" fill="currentColor" stroke="none" />
                        <circle cx="7" cy="12" r="1.5" fill="currentColor" stroke="none" />
                        <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
                        <circle cx="17" cy="12" r="1.5" fill="currentColor" stroke="none" />
                        <circle cx="7" cy="17" r="1.5" fill="currentColor" stroke="none" />
                        <circle cx="12" cy="17" r="1.5" fill="currentColor" stroke="none" />
                        <circle cx="17" cy="17" r="1.5" fill="currentColor" stroke="none" />
                    </svg>
                    <!-- Helix -->
                    <svg v-else-if="l.value === 'helix'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-width="1.3" stroke-linecap="round" d="M8 3c0 3 8 3 8 6s-8 3-8 6 8 3 8 6" />
                        <circle cx="8" cy="3" r="1" fill="currentColor" stroke="none" />
                        <circle cx="12" cy="9" r="1" fill="currentColor" stroke="none" />
                        <circle cx="12" cy="15" r="1" fill="currentColor" stroke="none" />
                        <circle cx="16" cy="21" r="1" fill="currentColor" stroke="none" />
                    </svg>
                    <!-- Galaxy -->
                    <svg v-else-if="l.value === 'galaxy'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
                        <path stroke-width="1.2" stroke-linecap="round" d="M12 12c2-1 4 0 5 2s0 4-2 5" />
                        <path stroke-width="1.2" stroke-linecap="round" d="M12 12c-2 1-4 0-5-2s0-4 2-5" />
                        <circle cx="17" cy="14" r="0.8" fill="currentColor" stroke="none" />
                        <circle cx="7" cy="10" r="0.8" fill="currentColor" stroke="none" />
                        <circle cx="15" cy="19" r="0.7" fill="currentColor" stroke="none" />
                        <circle cx="9" cy="5" r="0.7" fill="currentColor" stroke="none" />
                    </svg>
                    <!-- Scatter -->
                    <svg v-else-if="l.value === 'scatter'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="5" cy="8" r="1.2" fill="currentColor" stroke="none" />
                        <circle cx="14" cy="5" r="1.4" fill="currentColor" stroke="none" />
                        <circle cx="19" cy="11" r="1" fill="currentColor" stroke="none" />
                        <circle cx="8" cy="14" r="1.3" fill="currentColor" stroke="none" />
                        <circle cx="17" cy="17" r="1.1" fill="currentColor" stroke="none" />
                        <circle cx="11" cy="19" r="1" fill="currentColor" stroke="none" />
                        <circle cx="6" cy="19" r="0.8" fill="currentColor" stroke="none" />
                        <circle cx="20" cy="5" r="0.9" fill="currentColor" stroke="none" />
                    </svg>
                    <!-- Wave -->
                    <svg v-else-if="l.value === 'wave'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-width="1.3" stroke-linecap="round" d="M3 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0" />
                        <circle cx="6" cy="8" r="0.9" fill="currentColor" stroke="none" />
                        <circle cx="12" cy="12" r="0.9" fill="currentColor" stroke="none" />
                        <circle cx="18" cy="8" r="0.9" fill="currentColor" stroke="none" />
                        <path stroke-width="1" stroke-linecap="round" opacity="0.4" d="M3 17c2-3 4-3 6 0s4 3 6 0 4-3 6 0" />
                    </svg>
                    <!-- Ring -->
                    <svg v-else-if="l.value === 'ring'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="8" stroke-width="1.3" />
                        <circle cx="12" cy="4" r="1.2" fill="currentColor" stroke="none" />
                        <circle cx="19" cy="9" r="1" fill="currentColor" stroke="none" />
                        <circle cx="18" cy="17" r="1.1" fill="currentColor" stroke="none" />
                        <circle cx="6" cy="17" r="1" fill="currentColor" stroke="none" />
                        <circle cx="5" cy="9" r="1.1" fill="currentColor" stroke="none" />
                    </svg>
                    <!-- Sphere -->
                    <svg v-else-if="l.value === 'sphere'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="9" stroke-width="1" />
                        <ellipse cx="12" cy="12" rx="9" ry="4" stroke-width="0.8" opacity="0.4" />
                        <ellipse cx="12" cy="12" rx="4" ry="9" stroke-width="0.8" opacity="0.4" />
                        <circle cx="12" cy="4" r="0.9" fill="currentColor" stroke="none" />
                        <circle cx="17" cy="8" r="0.8" fill="currentColor" stroke="none" />
                        <circle cx="7" cy="16" r="0.9" fill="currentColor" stroke="none" />
                        <circle cx="15" cy="18" r="0.8" fill="currentColor" stroke="none" />
                    </svg>
                    <!-- Constellation -->
                    <svg v-else-if="l.value === 'constellation'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="5" cy="6" r="1.2" fill="currentColor" stroke="none" />
                        <circle cx="8" cy="4" r="0.9" fill="currentColor" stroke="none" />
                        <circle cx="7" cy="8" r="0.8" fill="currentColor" stroke="none" />
                        <line x1="5" y1="6" x2="8" y2="4" stroke-width="0.6" opacity="0.4" />
                        <line x1="5" y1="6" x2="7" y2="8" stroke-width="0.6" opacity="0.4" />
                        <circle cx="17" cy="7" r="1.1" fill="currentColor" stroke="none" />
                        <circle cx="20" cy="5" r="0.8" fill="currentColor" stroke="none" />
                        <circle cx="19" cy="10" r="0.7" fill="currentColor" stroke="none" />
                        <line x1="17" y1="7" x2="20" y2="5" stroke-width="0.6" opacity="0.4" />
                        <line x1="17" y1="7" x2="19" y2="10" stroke-width="0.6" opacity="0.4" />
                        <circle cx="10" cy="17" r="1" fill="currentColor" stroke="none" />
                        <circle cx="14" cy="18" r="0.9" fill="currentColor" stroke="none" />
                        <circle cx="12" cy="15" r="0.7" fill="currentColor" stroke="none" />
                        <line x1="10" y1="17" x2="14" y2="18" stroke-width="0.6" opacity="0.4" />
                        <line x1="12" y1="15" x2="10" y2="17" stroke-width="0.6" opacity="0.4" />
                    </svg>
                    <!-- Funnel -->
                    <svg v-else-if="l.value === 'funnel'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-width="1.2" stroke-linecap="round" d="M4 4h16M6 8h12M8 12h8M10 16h4" />
                        <circle cx="12" cy="20" r="1" fill="currentColor" stroke="none" />
                        <circle cx="5" cy="4" r="0.8" fill="currentColor" stroke="none" />
                        <circle cx="19" cy="4" r="0.8" fill="currentColor" stroke="none" />
                        <circle cx="8" cy="12" r="0.7" fill="currentColor" stroke="none" />
                    </svg>
                    <!-- Flower -->
                    <svg v-else-if="l.value === 'flower'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
                        <circle cx="12" cy="6" r="1.3" stroke-width="1" />
                        <circle cx="17" cy="9" r="1.3" stroke-width="1" />
                        <circle cx="17" cy="15" r="1.3" stroke-width="1" />
                        <circle cx="12" cy="18" r="1.3" stroke-width="1" />
                        <circle cx="7" cy="15" r="1.3" stroke-width="1" />
                        <circle cx="7" cy="9" r="1.3" stroke-width="1" />
                    </svg>
                    <!-- Pyramid -->
                    <svg v-else-if="l.value === 'pyramid'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-width="1.2" stroke-linejoin="round" d="M12 4L3 20h18L12 4z" />
                        <circle cx="12" cy="4" r="1" fill="currentColor" stroke="none" />
                        <circle cx="7" cy="14" r="0.8" fill="currentColor" stroke="none" />
                        <circle cx="17" cy="14" r="0.8" fill="currentColor" stroke="none" />
                        <circle cx="5" cy="18" r="0.8" fill="currentColor" stroke="none" />
                        <circle cx="12" cy="18" r="0.8" fill="currentColor" stroke="none" />
                        <circle cx="19" cy="18" r="0.8" fill="currentColor" stroke="none" />
                    </svg>
                    <!-- Infinity -->
                    <svg v-else-if="l.value === 'infinity'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-width="1.4" stroke-linecap="round" d="M8 12c-2-3-5-3-5 0s3 3 5 0 4-3 4 0M16 12c2 3 5 3 5 0s-3-3-5 0-4 3-4 0" />
                        <circle cx="4" cy="12" r="0.8" fill="currentColor" stroke="none" />
                        <circle cx="12" cy="12" r="0.9" fill="currentColor" stroke="none" />
                        <circle cx="20" cy="12" r="0.8" fill="currentColor" stroke="none" />
                    </svg>
                    <!-- Cross -->
                    <svg v-else-if="l.value === 'cross'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <line x1="12" y1="3" x2="12" y2="21" stroke-width="1.2" />
                        <line x1="3" y1="12" x2="21" y2="12" stroke-width="1.2" />
                        <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
                        <circle cx="12" cy="5" r="0.9" fill="currentColor" stroke="none" />
                        <circle cx="12" cy="19" r="0.9" fill="currentColor" stroke="none" />
                        <circle cx="5" cy="12" r="0.9" fill="currentColor" stroke="none" />
                        <circle cx="19" cy="12" r="0.9" fill="currentColor" stroke="none" />
                    </svg>
                    <!-- Hourglass -->
                    <svg v-else-if="l.value === 'hourglass'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-width="1.2" stroke-linejoin="round" d="M6 3h12L12 12 18 21H6L12 12 6 3z" />
                        <circle cx="8" cy="5" r="0.7" fill="currentColor" stroke="none" />
                        <circle cx="16" cy="5" r="0.7" fill="currentColor" stroke="none" />
                        <circle cx="12" cy="12" r="0.9" fill="currentColor" stroke="none" />
                        <circle cx="8" cy="19" r="0.7" fill="currentColor" stroke="none" />
                        <circle cx="16" cy="19" r="0.7" fill="currentColor" stroke="none" />
                    </svg>
                    <!-- Tree -->
                    <svg v-else-if="l.value === 'tree'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <line x1="12" y1="21" x2="12" y2="13" stroke-width="1.5" />
                        <circle cx="12" cy="9" r="5" stroke-width="1.2" />
                        <circle cx="12" cy="6" r="0.8" fill="currentColor" stroke="none" />
                        <circle cx="9" cy="10" r="0.8" fill="currentColor" stroke="none" />
                        <circle cx="15" cy="10" r="0.8" fill="currentColor" stroke="none" />
                        <circle cx="12" cy="12" r="0.7" fill="currentColor" stroke="none" />
                    </svg>
                    <!-- Diamond -->
                    <svg v-else-if="l.value === 'diamond'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-width="1.2" stroke-linejoin="round" d="M12 2L22 12 12 22 2 12z" />
                        <circle cx="12" cy="2" r="0.8" fill="currentColor" stroke="none" />
                        <circle cx="22" cy="12" r="0.8" fill="currentColor" stroke="none" />
                        <circle cx="12" cy="22" r="0.8" fill="currentColor" stroke="none" />
                        <circle cx="2" cy="12" r="0.8" fill="currentColor" stroke="none" />
                        <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
                    </svg>
                    <!-- Coil -->
                    <svg v-else-if="l.value === 'coil'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-width="1.3" stroke-linecap="round" d="M7 4h10M5 8h14M5 12h14M5 16h14M7 20h10" />
                        <circle cx="7" cy="4" r="0.8" fill="currentColor" stroke="none" />
                        <circle cx="19" cy="8" r="0.8" fill="currentColor" stroke="none" />
                        <circle cx="5" cy="12" r="0.8" fill="currentColor" stroke="none" />
                        <circle cx="19" cy="16" r="0.8" fill="currentColor" stroke="none" />
                        <circle cx="17" cy="20" r="0.8" fill="currentColor" stroke="none" />
                    </svg>
                    <!-- Vortex -->
                    <svg v-else-if="l.value === 'vortex'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-width="1.2" stroke-linecap="round" d="M3 4h18M5 8h14M7 12h10M9 16h6M11 20h2" />
                        <circle cx="12" cy="4" r="0.9" fill="currentColor" stroke="none" />
                        <circle cx="8" cy="8" r="0.7" fill="currentColor" stroke="none" />
                        <circle cx="16" cy="12" r="0.8" fill="currentColor" stroke="none" />
                        <circle cx="12" cy="20" r="0.9" fill="currentColor" stroke="none" />
                    </svg>
                    <!-- DNA -->
                    <svg v-else-if="l.value === 'dna'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-width="1.2" stroke-linecap="round" d="M7 3c0 4 10 4 10 8s-10 4-10 8" />
                        <path stroke-width="1.2" stroke-linecap="round" d="M17 3c0 4-10 4-10 8s10 4 10 8" />
                        <line x1="9" y1="7" x2="15" y2="7" stroke-width="0.8" opacity="0.5" />
                        <line x1="9" y1="11" x2="15" y2="11" stroke-width="0.8" opacity="0.5" />
                        <line x1="9" y1="15" x2="15" y2="15" stroke-width="0.8" opacity="0.5" />
                    </svg>
                    <!-- Staircase -->
                    <svg v-else-if="l.value === 'staircase'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" d="M4 20h4v-4h4v-4h4v-4h4" />
                        <circle cx="4" cy="20" r="0.9" fill="currentColor" stroke="none" />
                        <circle cx="8" cy="16" r="0.9" fill="currentColor" stroke="none" />
                        <circle cx="12" cy="12" r="0.9" fill="currentColor" stroke="none" />
                        <circle cx="16" cy="8" r="0.9" fill="currentColor" stroke="none" />
                        <circle cx="20" cy="4" r="0.9" fill="currentColor" stroke="none" />
                    </svg>
                    <!-- Galaxy Ring -->
                    <svg v-else-if="l.value === 'galaxy-ring'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <ellipse cx="12" cy="12" rx="9" ry="4" stroke-width="1" />
                        <ellipse cx="12" cy="12" rx="9" ry="4" stroke-width="1" transform="rotate(60 12 12)" />
                        <ellipse cx="12" cy="12" rx="9" ry="4" stroke-width="1" transform="rotate(120 12 12)" />
                        <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
                        <circle cx="20" cy="11" r="0.7" fill="currentColor" stroke="none" />
                        <circle cx="6" cy="8" r="0.7" fill="currentColor" stroke="none" />
                        <circle cx="16" cy="17" r="0.7" fill="currentColor" stroke="none" />
                    </svg>
                    <!-- Web -->
                    <svg v-else-if="l.value === 'web'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
                        <line x1="12" y1="12" x2="12" y2="3" stroke-width="0.7" opacity="0.4" />
                        <line x1="12" y1="12" x2="20" y2="7" stroke-width="0.7" opacity="0.4" />
                        <line x1="12" y1="12" x2="20" y2="17" stroke-width="0.7" opacity="0.4" />
                        <line x1="12" y1="12" x2="12" y2="21" stroke-width="0.7" opacity="0.4" />
                        <line x1="12" y1="12" x2="4" y2="17" stroke-width="0.7" opacity="0.4" />
                        <line x1="12" y1="12" x2="4" y2="7" stroke-width="0.7" opacity="0.4" />
                        <circle cx="12" cy="7" r="5" stroke-width="0.7" opacity="0.3" />
                        <circle cx="12" cy="5" r="0.7" fill="currentColor" stroke="none" />
                        <circle cx="17" cy="9" r="0.6" fill="currentColor" stroke="none" />
                        <circle cx="7" cy="15" r="0.6" fill="currentColor" stroke="none" />
                        <circle cx="17" cy="15" r="0.6" fill="currentColor" stroke="none" />
                    </svg>
                </button>
            </div>
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
</style>
