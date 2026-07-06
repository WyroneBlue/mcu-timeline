<template>
    <div
        v-if="isDev"
        class="fixed top-16 right-3 z-[200] pointer-events-none rounded-lg bg-black/70 border border-white/10 backdrop-blur-md px-3 py-2 font-mono text-[10px] leading-relaxed text-white/70"
    >
        <div class="flex items-baseline gap-1">
            <span class="text-base font-bold" :class="stats.fps >= 55 ? 'text-green-400' : stats.fps >= 30 ? 'text-yellow-400' : 'text-red-400'">{{ stats.fps }}</span>
            <span class="text-white/40">fps</span>
            <span class="text-white/40 ml-1">{{ stats.ms }}ms</span>
        </div>
        <div class="text-white/40">1% low: {{ stats.low1 }} fps</div>
        <div class="mt-1 text-white/40">
            <div>calls: <span class="text-white/70">{{ stats.calls }}</span> · tris: <span class="text-white/70">{{ formatCount(stats.triangles) }}</span></div>
            <div>tex: <span class="text-white/70">{{ stats.textures }}</span> · geo: <span class="text-white/70">{{ stats.geometries }}</span></div>
        </div>
    </div>
</template>

<script setup lang="ts">
const { stats } = useRenderStats()
const isDev = import.meta.dev

function formatCount(n: number) {
    return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}
</script>
