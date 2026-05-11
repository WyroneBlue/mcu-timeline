<template>
    <div :class="[
        'glass-card p-6',
        accent && 'border-l-3 border-l-[var(--phase-current-primary)]',
        compact && '!p-4',
    ]">
        <slot />
    </div>
</template>

<script setup lang="ts">
defineProps<{
    accent?: boolean
    compact?: boolean
}>()
</script>
