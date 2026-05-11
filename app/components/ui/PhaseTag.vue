<template>
    <span :class="[
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium tracking-wide',
        colorClasses,
    ]">
        <span v-if="showNumber" class="font-display text-sm">{{ phaseNumber }}</span>
        <span>{{ phase }}</span>
    </span>
</template>

<script setup lang="ts">
const props = defineProps<{
    phase: string
    showNumber?: boolean
}>()

const phaseNumber = computed(() => {
    const match = props.phase?.match(/\d+/)
    return match ? match[0] : ''
})

const colorClasses = computed(() => {
    const num = parseInt(phaseNumber.value) || 0
    if (num <= 3) return 'bg-red-500/15 text-red-400 border border-red-500/20'
    if (num <= 5) return 'bg-purple-500/15 text-purple-400 border border-purple-500/20'
    return 'bg-teal-500/15 text-teal-400 border border-teal-500/20'
})
</script>
