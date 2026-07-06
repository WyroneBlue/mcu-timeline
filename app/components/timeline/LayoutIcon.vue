<template>
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <!-- Phase -->
        <template v-if="layout === 'phase'">
            <circle cx="7" cy="8" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="12" cy="6" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="17" cy="8" r="1.5" fill="currentColor" stroke="none" />
            <path stroke-width="1.2" stroke-linecap="round" d="M4 14h6M14 14h6" />
            <circle cx="7" cy="18" r="1.2" fill="currentColor" stroke="none" />
            <circle cx="17" cy="18" r="1.2" fill="currentColor" stroke="none" />
        </template>
        <!-- Galaxy -->
        <template v-else-if="layout === 'galaxy'">
            <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
            <path stroke-width="1.2" stroke-linecap="round" d="M12 12c2-1 4 0 5 2s0 4-2 5" />
            <path stroke-width="1.2" stroke-linecap="round" d="M12 12c-2 1-4 0-5-2s0-4 2-5" />
            <circle cx="17" cy="14" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="7" cy="10" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="15" cy="19" r="0.7" fill="currentColor" stroke="none" />
            <circle cx="9" cy="5" r="0.7" fill="currentColor" stroke="none" />
        </template>
        <!-- Spiral -->
        <template v-else-if="layout === 'spiral'">
            <path stroke-width="1.5" stroke-linecap="round" d="M12 12c0-1.1.9-2 2-2s2 .9 2 2-.9 3-3 3-4-.9-4-3 .9-5 4-5 6 .9 6 4" />
            <circle cx="14" cy="10" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="9" cy="15" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="18" cy="12" r="0.8" fill="currentColor" stroke="none" />
        </template>
        <!-- Helix -->
        <template v-else-if="layout === 'helix'">
            <path stroke-width="1.3" stroke-linecap="round" d="M8 3c0 3 8 3 8 6s-8 3-8 6 8 3 8 6" />
            <circle cx="8" cy="3" r="1" fill="currentColor" stroke="none" />
            <circle cx="12" cy="9" r="1" fill="currentColor" stroke="none" />
            <circle cx="12" cy="15" r="1" fill="currentColor" stroke="none" />
            <circle cx="16" cy="21" r="1" fill="currentColor" stroke="none" />
        </template>
        <!-- Grid -->
        <template v-else-if="layout === 'grid'">
            <circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="12" cy="7" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="17" cy="7" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="7" cy="12" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="17" cy="12" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="7" cy="17" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="12" cy="17" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="17" cy="17" r="1.5" fill="currentColor" stroke="none" />
        </template>
        <!-- Sphere -->
        <template v-else-if="layout === 'sphere'">
            <circle cx="12" cy="12" r="9" stroke-width="1" />
            <ellipse cx="12" cy="12" rx="9" ry="4" stroke-width="0.8" opacity="0.4" />
            <ellipse cx="12" cy="12" rx="4" ry="9" stroke-width="0.8" opacity="0.4" />
            <circle cx="12" cy="4" r="0.9" fill="currentColor" stroke="none" />
            <circle cx="17" cy="8" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="7" cy="16" r="0.9" fill="currentColor" stroke="none" />
            <circle cx="15" cy="18" r="0.8" fill="currentColor" stroke="none" />
        </template>
        <!-- Ring -->
        <template v-else-if="layout === 'ring'">
            <circle cx="12" cy="12" r="8" stroke-width="1.3" />
            <circle cx="12" cy="4" r="1.2" fill="currentColor" stroke="none" />
            <circle cx="19" cy="9" r="1" fill="currentColor" stroke="none" />
            <circle cx="18" cy="17" r="1.1" fill="currentColor" stroke="none" />
            <circle cx="6" cy="17" r="1" fill="currentColor" stroke="none" />
            <circle cx="5" cy="9" r="1.1" fill="currentColor" stroke="none" />
        </template>
        <!-- Zigzag -->
        <template v-else-if="layout === 'zigzag'">
            <polyline stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" points="4,8 8,16 12,8 16,16 20,8" />
            <circle cx="4" cy="8" r="1.2" fill="currentColor" stroke="none" />
            <circle cx="8" cy="16" r="1.2" fill="currentColor" stroke="none" />
            <circle cx="12" cy="8" r="1.2" fill="currentColor" stroke="none" />
            <circle cx="16" cy="16" r="1.2" fill="currentColor" stroke="none" />
            <circle cx="20" cy="8" r="1.2" fill="currentColor" stroke="none" />
        </template>
        <!-- Vortex -->
        <template v-else-if="layout === 'vortex'">
            <path stroke-width="1.2" stroke-linecap="round" d="M3 4h18M5 8h14M7 12h10M9 16h6M11 20h2" />
            <circle cx="12" cy="4" r="0.9" fill="currentColor" stroke="none" />
            <circle cx="8" cy="8" r="0.7" fill="currentColor" stroke="none" />
            <circle cx="16" cy="12" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="12" cy="20" r="0.9" fill="currentColor" stroke="none" />
        </template>
        <!-- Orbital (planet view) -->
        <template v-else-if="layout === 'orbital'">
            <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
            <circle cx="12" cy="12" r="6" stroke-width="0.8" opacity="0.4" />
            <circle cx="12" cy="12" r="10" stroke-width="0.8" opacity="0.3" />
            <circle cx="18" cy="12" r="1" fill="currentColor" stroke="none" />
            <circle cx="6" cy="6" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="3" cy="14" r="0.7" fill="currentColor" stroke="none" />
        </template>
        <!-- Fallback -->
        <template v-else>
            <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" opacity="0.4" />
            <circle cx="12" cy="12" r="7" stroke-width="1" opacity="0.3" />
        </template>
    </svg>
</template>

<script setup lang="ts">
defineProps<{
    layout: string
}>()
</script>
