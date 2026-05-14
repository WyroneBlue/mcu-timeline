<template>
    <div class="particle-bg-wrapper fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
        <ClientOnly>
            <TresCanvas
                v-if="!prefersReducedMotion"
                :alpha="true"
                :antialias="false"
                :power-preference="'low-power'"
                :clear-color="'#000000'"
                window-size
                class="!absolute inset-0"
            >
                <TresPerspectiveCamera :position="[0, 0, 50]" :fov="60" :near="0.1" :far="200" />
                <TimelineParticleField
                    :scroll-progress="scrollProgress"
                    :phase-color="phaseColor"
                    :particle-count="particleCount"
                />
            </TresCanvas>
        </ClientOnly>
    </div>
</template>

<script setup lang="ts">
import { useWindowScroll, useWindowSize } from '@vueuse/core'

const props = defineProps<{
    activePhase: number | null
}>()

const { settings } = useSettings()

const prefersReducedMotion = ref(false)

onMounted(() => {
    prefersReducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches || settings.reducedMotion
})

const phaseColors: Record<number, string> = {
    1: '#E53E3E',
    2: '#E53E3E',
    3: '#D69E2E',
    4: '#805AD5',
    5: '#B794F4',
    6: '#38B2AC',
}

const phaseColor = computed(() => {
    const p = props.activePhase ?? 1
    return phaseColors[p] ?? phaseColors[1]
})

const { y: scrollY } = useWindowScroll()
const { height: windowHeight } = useWindowSize()

const scrollProgress = computed(() => {
    if (!import.meta.client) return 0
    const docHeight = document.documentElement.scrollHeight - windowHeight.value
    if (docHeight <= 0) return 0
    return Math.min(1, Math.max(0, scrollY.value / docHeight))
})

const densityMultiplier: Record<string, number> = { low: 0.5, medium: 1, high: 1.5 }

const particleCount = computed(() => {
    if (!import.meta.client) return 800
    const w = window.innerWidth
    let base = 800
    if (w < 640) base = 400
    else if (w < 1024) base = 600
    return Math.round(base * (densityMultiplier[settings.particleDensity] ?? 1))
})
</script>

<style scoped>
.particle-bg-wrapper :deep(canvas),
.particle-bg-wrapper :deep(div) {
    pointer-events: none !important;
    touch-action: auto !important;
}
</style>
