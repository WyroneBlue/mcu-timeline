<template>
    <div ref="triggerEl" class="phase-transition-wrapper relative h-[30vh] flex items-center justify-center overflow-hidden my-4">
        <ClientOnly>
            <div class="absolute inset-0 transition-opacity duration-700" :class="isVisible ? 'opacity-100' : 'opacity-0'">
                <TresCanvas
                    v-if="!prefersReducedMotion && isVisible"
                    :alpha="true"
                    :antialias="false"
                    :power-preference="'low-power'"
                    :clear-color="'#00000000'"
                    class="!absolute inset-0"
                >
                    <TresPerspectiveCamera :position="[0, 0, 5]" :fov="75" :near="0.1" :far="100" />
                    <TimelinePortalRing
                        :progress="portalProgress"
                        :color="portalColor"
                    />
                </TresCanvas>
            </div>
        </ClientOnly>
        <div ref="labelEl" class="relative z-10 text-center pointer-events-none">
            <span class="font-display text-xs uppercase tracking-[0.4em] block mb-1" :style="{ color: portalColor + '80' }">
                Entering
            </span>
            <span class="font-display text-2xl sm:text-3xl tracking-wider text-white/80">
                Phase {{ toPhase }}
            </span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (import.meta.client) {
    gsap.registerPlugin(ScrollTrigger)
}

const props = defineProps<{
    fromPhase: number
    toPhase: number
}>()

const triggerEl = ref<HTMLElement | null>(null)
const labelEl = ref<HTMLElement | null>(null)
const portalProgress = ref(0)
const isVisible = ref(false)
const prefersReducedMotion = ref(false)

onMounted(() => {
    prefersReducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
})

const phaseColors: Record<number, string> = {
    1: '#E53E3E',
    2: '#E53E3E',
    3: '#D69E2E',
    4: '#805AD5',
    5: '#B794F4',
    6: '#38B2AC',
}

const portalColor = computed(() => phaseColors[props.toPhase] ?? '#805AD5')

onMounted(() => {
    if (!triggerEl.value) return

    const observer = new IntersectionObserver(
        ([entry]) => { isVisible.value = entry.isIntersecting },
        { rootMargin: '200px 0px' }
    )
    observer.observe(triggerEl.value)
    onUnmounted(() => observer.disconnect())

    if (prefersReducedMotion.value) {
        portalProgress.value = 1
        return
    }

    ScrollTrigger.create({
        trigger: triggerEl.value,
        start: 'top 80%',
        end: 'bottom 20%',
        scrub: 1,
        onUpdate: (self) => {
            portalProgress.value = self.progress
        },
    })

    if (labelEl.value) {
        gsap.fromTo(labelEl.value,
            { opacity: 0, scale: 0.8 },
            {
                opacity: 1,
                scale: 1,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: triggerEl.value,
                    start: 'top 70%',
                    end: 'top 40%',
                    scrub: 1,
                },
            }
        )
        gsap.to(labelEl.value, {
            opacity: 0,
            scale: 1.1,
            ease: 'power1.in',
            scrollTrigger: {
                trigger: triggerEl.value,
                start: 'bottom 60%',
                end: 'bottom 30%',
                scrub: 1,
            },
        })
    }
})
</script>

<style scoped>
.phase-transition-wrapper :deep(canvas),
.phase-transition-wrapper :deep(div) {
    pointer-events: none !important;
}
</style>
