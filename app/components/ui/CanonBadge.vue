<template>
    <span :class="[
        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider',
        canonClasses[canonLevel],
    ]">
        {{ canonLabels[canonLevel] }}
        <span v-if="showRelevance" class="font-mono opacity-60">{{ relevanceScore }}/10</span>
    </span>
</template>

<script setup lang="ts">
defineProps<{
    canonLevel: 'core' | 'extended' | 'adjacent' | 'standalone'
    relevanceScore?: number
    showRelevance?: boolean
}>()

const canonLabels: Record<string, string> = {
    core: 'Core MCU',
    extended: 'Extended',
    adjacent: 'Adjacent',
    standalone: 'Standalone',
}

const canonClasses: Record<string, string> = {
    core: 'bg-green-500/15 text-green-400 border border-green-500/20',
    extended: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
    adjacent: 'bg-orange-500/15 text-orange-400 border border-orange-500/20',
    standalone: 'bg-gray-500/15 text-gray-400 border border-gray-500/20',
}
</script>
