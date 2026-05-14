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
        <!-- Spiral -->
        <template v-else-if="layout === 'spiral'">
            <path stroke-width="1.5" stroke-linecap="round" d="M12 12c0-1.1.9-2 2-2s2 .9 2 2-.9 3-3 3-4-.9-4-3 .9-5 4-5 6 .9 6 4" />
            <circle cx="14" cy="10" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="9" cy="15" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="18" cy="12" r="0.8" fill="currentColor" stroke="none" />
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
        <!-- Helix -->
        <template v-else-if="layout === 'helix'">
            <path stroke-width="1.3" stroke-linecap="round" d="M8 3c0 3 8 3 8 6s-8 3-8 6 8 3 8 6" />
            <circle cx="8" cy="3" r="1" fill="currentColor" stroke="none" />
            <circle cx="12" cy="9" r="1" fill="currentColor" stroke="none" />
            <circle cx="12" cy="15" r="1" fill="currentColor" stroke="none" />
            <circle cx="16" cy="21" r="1" fill="currentColor" stroke="none" />
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
        <!-- Scatter -->
        <template v-else-if="layout === 'scatter'">
            <circle cx="5" cy="8" r="1.2" fill="currentColor" stroke="none" />
            <circle cx="14" cy="5" r="1.4" fill="currentColor" stroke="none" />
            <circle cx="19" cy="11" r="1" fill="currentColor" stroke="none" />
            <circle cx="8" cy="14" r="1.3" fill="currentColor" stroke="none" />
            <circle cx="17" cy="17" r="1.1" fill="currentColor" stroke="none" />
            <circle cx="11" cy="19" r="1" fill="currentColor" stroke="none" />
            <circle cx="6" cy="19" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="20" cy="5" r="0.9" fill="currentColor" stroke="none" />
        </template>
        <!-- Wave -->
        <template v-else-if="layout === 'wave'">
            <path stroke-width="1.3" stroke-linecap="round" d="M3 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0" />
            <circle cx="6" cy="8" r="0.9" fill="currentColor" stroke="none" />
            <circle cx="12" cy="12" r="0.9" fill="currentColor" stroke="none" />
            <circle cx="18" cy="8" r="0.9" fill="currentColor" stroke="none" />
            <path stroke-width="1" stroke-linecap="round" opacity="0.4" d="M3 17c2-3 4-3 6 0s4 3 6 0 4-3 6 0" />
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
        <!-- Constellation -->
        <template v-else-if="layout === 'constellation'">
            <circle cx="5" cy="6" r="1.2" fill="currentColor" stroke="none" />
            <circle cx="8" cy="4" r="0.9" fill="currentColor" stroke="none" />
            <circle cx="7" cy="8" r="0.8" fill="currentColor" stroke="none" />
            <line x1="5" y1="6" x2="8" y2="4" stroke-width="0.6" opacity="0.4" />
            <line x1="5" y1="6" x2="7" y2="8" stroke-width="0.6" opacity="0.4" />
            <circle cx="17" cy="7" r="1.1" fill="currentColor" stroke="none" />
            <circle cx="20" cy="5" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="19" cy="10" r="0.7" fill="currentColor" stroke="none" />
            <line x1="17" y1="7" x2="20" y2="5" stroke-width="0.6" opacity="0.4" />
            <line x1="17" y1="7" x2="19" y2="10" stroke-width="0.6" opacity="0.4" />
            <circle cx="10" cy="17" r="1" fill="currentColor" stroke="none" />
            <circle cx="14" cy="18" r="0.9" fill="currentColor" stroke="none" />
            <circle cx="12" cy="15" r="0.7" fill="currentColor" stroke="none" />
            <line x1="10" y1="17" x2="14" y2="18" stroke-width="0.6" opacity="0.4" />
            <line x1="12" y1="15" x2="10" y2="17" stroke-width="0.6" opacity="0.4" />
        </template>
        <!-- Funnel -->
        <template v-else-if="layout === 'funnel'">
            <path stroke-width="1.2" stroke-linecap="round" d="M4 4h16M6 8h12M8 12h8M10 16h4" />
            <circle cx="12" cy="20" r="1" fill="currentColor" stroke="none" />
            <circle cx="5" cy="4" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="19" cy="4" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="8" cy="12" r="0.7" fill="currentColor" stroke="none" />
        </template>
        <!-- Flower -->
        <template v-else-if="layout === 'flower'">
            <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
            <circle cx="12" cy="6" r="1.3" stroke-width="1" />
            <circle cx="17" cy="9" r="1.3" stroke-width="1" />
            <circle cx="17" cy="15" r="1.3" stroke-width="1" />
            <circle cx="12" cy="18" r="1.3" stroke-width="1" />
            <circle cx="7" cy="15" r="1.3" stroke-width="1" />
            <circle cx="7" cy="9" r="1.3" stroke-width="1" />
        </template>
        <!-- Pyramid -->
        <template v-else-if="layout === 'pyramid'">
            <path stroke-width="1.2" stroke-linejoin="round" d="M12 4L3 20h18L12 4z" />
            <circle cx="12" cy="4" r="1" fill="currentColor" stroke="none" />
            <circle cx="7" cy="14" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="17" cy="14" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="5" cy="18" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="12" cy="18" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="19" cy="18" r="0.8" fill="currentColor" stroke="none" />
        </template>
        <!-- Infinity -->
        <template v-else-if="layout === 'infinity'">
            <path stroke-width="1.4" stroke-linecap="round" d="M8 12c-2-3-5-3-5 0s3 3 5 0 4-3 4 0M16 12c2 3 5 3 5 0s-3-3-5 0-4 3-4 0" />
            <circle cx="4" cy="12" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="12" cy="12" r="0.9" fill="currentColor" stroke="none" />
            <circle cx="20" cy="12" r="0.8" fill="currentColor" stroke="none" />
        </template>
        <!-- Cross -->
        <template v-else-if="layout === 'cross'">
            <line x1="12" y1="3" x2="12" y2="21" stroke-width="1.2" />
            <line x1="3" y1="12" x2="21" y2="12" stroke-width="1.2" />
            <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
            <circle cx="12" cy="5" r="0.9" fill="currentColor" stroke="none" />
            <circle cx="12" cy="19" r="0.9" fill="currentColor" stroke="none" />
            <circle cx="5" cy="12" r="0.9" fill="currentColor" stroke="none" />
            <circle cx="19" cy="12" r="0.9" fill="currentColor" stroke="none" />
        </template>
        <!-- Hourglass -->
        <template v-else-if="layout === 'hourglass'">
            <path stroke-width="1.2" stroke-linejoin="round" d="M6 3h12L12 12 18 21H6L12 12 6 3z" />
            <circle cx="8" cy="5" r="0.7" fill="currentColor" stroke="none" />
            <circle cx="16" cy="5" r="0.7" fill="currentColor" stroke="none" />
            <circle cx="12" cy="12" r="0.9" fill="currentColor" stroke="none" />
            <circle cx="8" cy="19" r="0.7" fill="currentColor" stroke="none" />
            <circle cx="16" cy="19" r="0.7" fill="currentColor" stroke="none" />
        </template>
        <!-- Tree -->
        <template v-else-if="layout === 'tree'">
            <line x1="12" y1="21" x2="12" y2="13" stroke-width="1.5" />
            <circle cx="12" cy="9" r="5" stroke-width="1.2" />
            <circle cx="12" cy="6" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="9" cy="10" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="15" cy="10" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="12" cy="12" r="0.7" fill="currentColor" stroke="none" />
        </template>
        <!-- Diamond -->
        <template v-else-if="layout === 'diamond'">
            <path stroke-width="1.2" stroke-linejoin="round" d="M12 2L22 12 12 22 2 12z" />
            <circle cx="12" cy="2" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="22" cy="12" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="12" cy="22" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="2" cy="12" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
        </template>
        <!-- Coil -->
        <template v-else-if="layout === 'coil'">
            <path stroke-width="1.3" stroke-linecap="round" d="M7 4h10M5 8h14M5 12h14M5 16h14M7 20h10" />
            <circle cx="7" cy="4" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="19" cy="8" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="5" cy="12" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="19" cy="16" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="17" cy="20" r="0.8" fill="currentColor" stroke="none" />
        </template>
        <!-- Vortex -->
        <template v-else-if="layout === 'vortex'">
            <path stroke-width="1.2" stroke-linecap="round" d="M3 4h18M5 8h14M7 12h10M9 16h6M11 20h2" />
            <circle cx="12" cy="4" r="0.9" fill="currentColor" stroke="none" />
            <circle cx="8" cy="8" r="0.7" fill="currentColor" stroke="none" />
            <circle cx="16" cy="12" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="12" cy="20" r="0.9" fill="currentColor" stroke="none" />
        </template>
        <!-- DNA -->
        <template v-else-if="layout === 'dna'">
            <path stroke-width="1.2" stroke-linecap="round" d="M7 3c0 4 10 4 10 8s-10 4-10 8" />
            <path stroke-width="1.2" stroke-linecap="round" d="M17 3c0 4-10 4-10 8s10 4 10 8" />
            <line x1="9" y1="7" x2="15" y2="7" stroke-width="0.8" opacity="0.5" />
            <line x1="9" y1="11" x2="15" y2="11" stroke-width="0.8" opacity="0.5" />
            <line x1="9" y1="15" x2="15" y2="15" stroke-width="0.8" opacity="0.5" />
        </template>
        <!-- Staircase -->
        <template v-else-if="layout === 'staircase'">
            <path stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" d="M4 20h4v-4h4v-4h4v-4h4" />
            <circle cx="4" cy="20" r="0.9" fill="currentColor" stroke="none" />
            <circle cx="8" cy="16" r="0.9" fill="currentColor" stroke="none" />
            <circle cx="12" cy="12" r="0.9" fill="currentColor" stroke="none" />
            <circle cx="16" cy="8" r="0.9" fill="currentColor" stroke="none" />
            <circle cx="20" cy="4" r="0.9" fill="currentColor" stroke="none" />
        </template>
        <!-- Galaxy Ring -->
        <template v-else-if="layout === 'galaxy-ring'">
            <ellipse cx="12" cy="12" rx="9" ry="4" stroke-width="1" />
            <ellipse cx="12" cy="12" rx="9" ry="4" stroke-width="1" transform="rotate(60 12 12)" />
            <ellipse cx="12" cy="12" rx="9" ry="4" stroke-width="1" transform="rotate(120 12 12)" />
            <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
            <circle cx="20" cy="11" r="0.7" fill="currentColor" stroke="none" />
            <circle cx="6" cy="8" r="0.7" fill="currentColor" stroke="none" />
            <circle cx="16" cy="17" r="0.7" fill="currentColor" stroke="none" />
        </template>
        <!-- Web -->
        <template v-else-if="layout === 'web'">
            <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
            <line x1="12" y1="12" x2="12" y2="3" stroke-width="0.7" opacity="0.4" />
            <line x1="12" y1="12" x2="20" y2="7" stroke-width="0.7" opacity="0.4" />
            <line x1="12" y1="12" x2="20" y2="17" stroke-width="0.7" opacity="0.4" />
            <line x1="12" y1="12" x2="12" y2="21" stroke-width="0.7" opacity="0.4" />
            <line x1="12" y1="12" x2="4" y2="17" stroke-width="0.7" opacity="0.4" />
            <line x1="12" y1="12" x2="4" y2="7" stroke-width="0.7" opacity="0.4" />
            <circle cx="12" cy="7" r="5" stroke-width="0.7" opacity="0.3" />
            <circle cx="12" cy="5" r="0.7" fill="currentColor" stroke="none" />
            <circle cx="17" cy="9" r="0.6" fill="currentColor" stroke="none" />
            <circle cx="7" cy="15" r="0.6" fill="currentColor" stroke="none" />
        </template>
        <!-- Orbital -->
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
