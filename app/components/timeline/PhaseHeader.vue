<template>
    <div ref="headerEl" class="phase-header-section relative py-20 flex items-center justify-center overflow-hidden" :data-phase="phase">
        <div class="absolute inset-0 opacity-10" :style="{ background: `radial-gradient(ellipse at center, ${phaseColor}, transparent 70%)` }" />

        <div class="relative text-center">
            <div ref="numberEl" class="font-display text-[120px] sm:text-[160px] md:text-[200px] leading-none opacity-10 select-none" :style="{ color: phaseColor }">
                {{ phase }}
            </div>
            <div ref="labelEl" class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-xs uppercase tracking-[0.3em] text-white/30 mb-2">Fase</span>
                <span class="font-display text-4xl sm:text-5xl md:text-6xl tracking-wider text-white">
                    PHASE {{ phase }}
                </span>
                <span class="mt-3 text-sm text-white/40">{{ sagaLabel }}</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    phase: number
    saga?: string
}>()

const headerEl = ref<HTMLElement | null>(null)
const numberEl = ref<HTMLElement | null>(null)
const labelEl = ref<HTMLElement | null>(null)

const phaseColor = computed(() => {
    if (props.phase <= 3) return '#E53E3E'
    if (props.phase <= 5) return '#805AD5'
    return '#38B2AC'
})

const sagaLabel = computed(() => {
    if (props.saga) return props.saga
    if (props.phase <= 3) return 'The Infinity Saga'
    if (props.phase <= 5) return 'The Multiverse Saga'
    return 'The Secret Wars Saga'
})

const { gsap, ScrollTrigger, prefersReducedMotion, usePhaseTransition } = useScrollAnimation()

usePhaseTransition(headerEl, props.phase)

onMounted(() => {
    if (!numberEl.value || !labelEl.value) return
    if (prefersReducedMotion.value) {
        gsap.set(numberEl.value, { opacity: 0.1, scale: 1 })
        gsap.set(labelEl.value, { opacity: 1, y: 0 })
        return
    }

    // Big number zooms in from 2x and settles
    gsap.fromTo(numberEl.value,
        { scale: 2.5, opacity: 0 },
        {
            scale: 1,
            opacity: 0.1,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: headerEl.value,
                start: 'top 85%',
                end: 'top 40%',
                scrub: 1,
            },
        }
    )

    // Label fades up
    gsap.fromTo(labelEl.value,
        { opacity: 0, y: 30 },
        {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: headerEl.value,
                start: 'top 70%',
                toggleActions: 'play none none none',
            },
        }
    )

    // Parallax: number drifts up slower than the label
    gsap.to(numberEl.value, {
        yPercent: -15,
        ease: 'none',
        scrollTrigger: {
            trigger: headerEl.value,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
        },
    })
})
</script>
