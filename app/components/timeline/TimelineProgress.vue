<template>
    <div class="fixed top-16 left-0 right-0 z-40 bg-[#0A0E1A]/80 backdrop-blur-xl border-b border-white/5">
        <div class="max-w-7xl mx-auto px-4 py-2 flex items-center gap-4">
            <div class="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                    class="h-full rounded-full transition-all duration-500 ease-out"
                    :style="{
                        width: `${percent}%`,
                        background: `linear-gradient(90deg, var(--phase-current-primary), var(--phase-current-accent))`,
                    }"
                />
            </div>
            <span class="font-mono text-xs text-white/50 whitespace-nowrap">{{ percent }}%</span>
            <span v-if="currentPhase" class="text-[10px] font-medium text-white/30 uppercase tracking-wider whitespace-nowrap">
                Fase {{ currentPhase }}
            </span>
            <NuxtLink
                v-if="nextUp"
                :to="`/title/${nextUp.slug}`"
                class="hidden sm:flex items-center gap-2 text-xs text-white/40 hover:text-white transition-colors whitespace-nowrap"
            >
                <span>Next:</span>
                <span class="text-white/60 truncate max-w-[150px]">{{ nextUp.title }}</span>
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
            </NuxtLink>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    percent: number
    currentPhase?: number | null
    nextUp?: { slug: string; title: string } | null
}>()
</script>
