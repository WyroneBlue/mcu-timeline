<template>
    <div ref="heroEl" class="relative -mt-16 overflow-hidden">
        <!-- Backdrop -->
        <div ref="backdropEl" class="absolute inset-0">
            <img
                v-if="backdropUrl"
                :src="backdropUrl"
                :alt="title"
                class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full bg-gradient-to-br from-[color-mix(in_srgb,var(--theme-bg),white_8%)] to-[var(--theme-bg)]" />
        </div>

        <!-- Gradient overlays -->
        <div class="absolute inset-0 bg-gradient-to-t from-[var(--theme-bg)] via-[var(--theme-bg)]/60 to-transparent" />
        <div class="absolute inset-0 bg-gradient-to-r from-[var(--theme-bg)]/80 to-transparent" />

        <!-- Content -->
        <div class="relative pt-28 pb-8 px-4 sm:px-6 max-w-5xl mx-auto">
            <div class="flex flex-col sm:flex-row gap-6 items-end sm:items-end">
                <!-- Poster -->
                <div ref="posterEl" class="shrink-0 -mb-16 z-10">
                    <div class="w-36 sm:w-44 rounded-xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10">
                        <div class="aspect-[2/3]">
                            <img
                                v-if="posterUrl"
                                :src="posterUrl"
                                :alt="title"
                                class="w-full h-full object-cover"
                            />
                            <div v-else class="w-full h-full bg-white/5 flex items-center justify-center">
                                <svg class="w-10 h-10 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Title info -->
                <div ref="infoEl" class="flex-1 pb-2">
                    <h1 class="font-display text-3xl sm:text-4xl md:text-5xl tracking-wider text-white leading-tight">
                        {{ title }}
                    </h1>
                    <div class="flex flex-wrap items-center gap-3 mt-3 text-sm text-white/40">
                        <span v-if="year">{{ year }}</span>
                        <span v-if="runtime" class="flex items-center gap-1">
                            <span class="w-1 h-1 rounded-full bg-white/20" />
                            {{ runtime }}
                        </span>
                        <span class="flex items-center gap-1">
                            <span class="w-1 h-1 rounded-full bg-white/20" />
                            {{ type === 'series' ? 'Serie' : 'Film' }}
                        </span>
                    </div>
                    <div class="flex flex-wrap items-center gap-2 mt-3">
                        <slot name="tags" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    title: string
    posterUrl?: string | null
    backdropUrl?: string | null
    year?: string
    runtime?: string
    type?: string
}>()

const heroEl = ref<HTMLElement | null>(null)
const backdropEl = ref<HTMLElement | null>(null)
const posterEl = ref<HTMLElement | null>(null)
const infoEl = ref<HTMLElement | null>(null)

const { useParallax, useFadeIn } = useScrollAnimation()
useParallax(backdropEl, 0.2)
useFadeIn(posterEl, { y: 20, duration: 0.8 })
useFadeIn(infoEl, { y: 20, delay: 0.1 })
</script>
