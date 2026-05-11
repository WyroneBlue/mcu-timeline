<template>
    <div ref="markerEl" class="relative py-6">
        <div class="flex items-center gap-3">
            <div class="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <div class="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl">
                <div class="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span class="text-xs font-medium text-white/60">Je bent hier</span>
            </div>
            <div class="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>
    </div>
</template>

<script setup lang="ts">
const markerEl = ref<HTMLElement | null>(null)

const { useFadeIn } = useScrollAnimation()
useFadeIn(markerEl, { y: 0, duration: 0.6 })
</script>
