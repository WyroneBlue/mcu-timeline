<template>
    <div ref="bgEl" class="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div
            ref="orb1"
            class="absolute w-[600px] h-[600px] rounded-full opacity-[0.07] blur-[120px] -top-[200px] -left-[200px] transition-colors duration-[2000ms]"
            :style="{ background: currentPrimary }"
        />
        <div
            ref="orb2"
            class="absolute w-[500px] h-[500px] rounded-full opacity-[0.05] blur-[100px] top-[40%] -right-[150px] transition-colors duration-[2000ms]"
            :style="{ background: currentAccent }"
        />
        <div
            ref="orb3"
            class="absolute w-[400px] h-[400px] rounded-full opacity-[0.04] blur-[80px] bottom-[10%] left-[20%] transition-colors duration-[2000ms]"
            :style="{ background: currentPrimary }"
        />
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    activePhase: number | null
}>()

const bgEl = ref<HTMLElement | null>(null)
const orb1 = ref<HTMLElement | null>(null)
const orb2 = ref<HTMLElement | null>(null)
const orb3 = ref<HTMLElement | null>(null)

const phaseColors: Record<number, { primary: string; accent: string }> = {
    1: { primary: '#E53E3E', accent: '#D69E2E' },
    2: { primary: '#E53E3E', accent: '#D69E2E' },
    3: { primary: '#E53E3E', accent: '#D69E2E' },
    4: { primary: '#805AD5', accent: '#B794F4' },
    5: { primary: '#805AD5', accent: '#B794F4' },
    6: { primary: '#38B2AC', accent: '#4299E1' },
}

const currentPrimary = computed(() => {
    const p = props.activePhase ?? 1
    return phaseColors[p]?.primary ?? phaseColors[1].primary
})

const currentAccent = computed(() => {
    const p = props.activePhase ?? 1
    return phaseColors[p]?.accent ?? phaseColors[1].accent
})

const { prefersReducedMotion } = useScrollAnimation()

onMounted(() => {
    if (prefersReducedMotion.value) return
    if (!orb1.value || !orb2.value || !orb3.value) return

    const { gsap } = useScrollAnimation()

    gsap.to(orb1.value, {
        y: 100,
        x: 50,
        duration: 20,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
    })

    gsap.to(orb2.value, {
        y: -80,
        x: -60,
        duration: 25,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
    })

    gsap.to(orb3.value, {
        y: 60,
        x: 80,
        duration: 18,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
    })
})
</script>
