<template>
    <div ref="introEl" class="relative min-h-[70vh] flex flex-col items-center justify-center overflow-hidden">
        <!-- Background poster collage (starts blurred, sharpens on scroll) -->
        <div ref="collageEl" class="intro-collage absolute inset-0 grid grid-cols-4 sm:grid-cols-6 gap-1 opacity-15">
            <div
                v-for="(poster, i) in posters"
                :key="i"
                class="aspect-[2/3] overflow-hidden rounded-sm"
            >
                <img
                    v-if="poster"
                    :src="poster"
                    class="w-full h-full object-cover"
                    loading="lazy"
                    alt=""
                />
                <div v-else class="w-full h-full bg-white/5" />
            </div>
        </div>

        <!-- Gradient overlay -->
        <div class="absolute inset-0 bg-gradient-to-b from-[#0A0E1A] via-transparent to-[#0A0E1A]" />
        <div ref="overlayEl" class="absolute inset-0 bg-[#0A0E1A]/40" />

        <!-- Content -->
        <div ref="contentEl" class="relative text-center px-6 max-w-2xl mx-auto">
            <div ref="tagEl" class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6">
                <div class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span class="text-xs text-white/50 uppercase tracking-wider">MCU Timeline</span>
            </div>
            <h1 ref="titleEl" class="font-display text-5xl sm:text-6xl md:text-7xl tracking-wider text-white mb-4">
                YOUR<br />JOURNEY
            </h1>
            <p ref="subtitleEl" class="text-white/40 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
                {{ titleCount }} titels · {{ phaseCount }} fases · Eén verhaal
            </p>

            <div v-if="percent > 0" ref="progressEl" class="mt-8">
                <div class="w-48 h-1 bg-white/5 rounded-full mx-auto overflow-hidden">
                    <div
                        class="h-full rounded-full transition-all duration-1000"
                        :style="{
                            width: `${percent}%`,
                            background: 'linear-gradient(90deg, var(--phase-current-primary), var(--phase-current-accent))',
                        }"
                    />
                </div>
                <span class="text-xs text-white/30 mt-2 block font-mono">{{ percent }}% voltooid</span>
            </div>

            <!-- Scroll indicator -->
            <div ref="scrollHintEl" class="mt-12 animate-bounce">
                <svg class="w-5 h-5 text-white/20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    posters: (string | null)[]
    titleCount: number
    phaseCount: number
    percent: number
}>()

const introEl = ref<HTMLElement | null>(null)
const collageEl = ref<HTMLElement | null>(null)
const overlayEl = ref<HTMLElement | null>(null)
const contentEl = ref<HTMLElement | null>(null)
const tagEl = ref<HTMLElement | null>(null)
const titleEl = ref<HTMLElement | null>(null)
const subtitleEl = ref<HTMLElement | null>(null)
const progressEl = ref<HTMLElement | null>(null)
const scrollHintEl = ref<HTMLElement | null>(null)

const { gsap, ScrollTrigger, prefersReducedMotion, useParallax } = useScrollAnimation()
useParallax(collageEl, 0.2)

onMounted(() => {
    if (prefersReducedMotion.value || !introEl.value) return

    // Collage: starts blurred, sharpens as you scroll past
    gsap.fromTo(collageEl.value,
        { filter: 'blur(12px)', scale: 1.1, opacity: 0.08 },
        {
            filter: 'blur(0px)',
            scale: 1,
            opacity: 0.2,
            ease: 'none',
            scrollTrigger: {
                trigger: introEl.value,
                start: 'top top',
                end: 'bottom 60%',
                scrub: 1,
            },
        }
    )

    // Content fade-out on scroll (parallax exit)
    gsap.to(contentEl.value, {
        y: -80,
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
            trigger: introEl.value,
            start: '40% top',
            end: 'bottom top',
            scrub: 1,
        },
    })

    // Staggered entrance for content elements
    const elements = [tagEl.value, titleEl.value, subtitleEl.value, progressEl.value, scrollHintEl.value].filter(Boolean)
    gsap.fromTo(elements,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: 'power2.out', delay: 0.2 }
    )

    // Scroll hint fades out quickly
    if (scrollHintEl.value) {
        gsap.to(scrollHintEl.value, {
            opacity: 0,
            scrollTrigger: {
                trigger: introEl.value,
                start: '10% top',
                end: '20% top',
                scrub: true,
            },
        })
    }
})
</script>
