<template>
    <span :class="[
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium',
        statusClasses[status],
    ]">
        <span class="w-1.5 h-1.5 rounded-full" :class="dotClasses[status]" />
        {{ label }}
    </span>
</template>

<script setup lang="ts">
const props = defineProps<{
    status: 'queued' | 'watching' | 'watched' | 'skipped'
}>()

const labels: Record<string, string> = {
    queued: 'In wachtlijst',
    watching: 'Aan het kijken',
    watched: 'Bekeken',
    skipped: 'Overgeslagen',
}

const statusClasses: Record<string, string> = {
    queued: 'bg-gray-500/15 text-gray-400',
    watching: 'bg-blue-500/15 text-blue-400',
    watched: 'bg-green-500/15 text-green-400',
    skipped: 'bg-orange-500/15 text-orange-400',
}

const dotClasses: Record<string, string> = {
    queued: 'bg-gray-400',
    watching: 'bg-blue-400',
    watched: 'bg-green-400',
    skipped: 'bg-orange-400',
}

const label = computed(() => labels[props.status] || props.status)
</script>
