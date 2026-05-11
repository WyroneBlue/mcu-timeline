<template>
    <div :class="[
        'flex flex-col items-center gap-2 p-4 rounded-xl text-center transition-all duration-300',
        earned
            ? 'glass-card animate-pulse-glow'
            : 'bg-white/[0.02] border border-white/5 opacity-40 grayscale',
    ]">
        <span class="text-3xl" :class="!earned && 'blur-[2px]'">{{ icon }}</span>
        <span class="text-sm font-medium text-white/90">{{ name }}</span>
        <span class="text-xs text-white/40">{{ description }}</span>
        <span v-if="earned && awardedAt" class="text-[10px] text-white/20 font-mono">
            {{ formatDate(awardedAt) }}
        </span>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    icon: string
    name: string
    description: string
    earned: boolean
    awardedAt?: string
}>()

function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>
