<template>
    <div class="flex flex-wrap gap-3">
        <button
            v-if="status !== 'watched'"
            class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors"
            @click="$emit('markWatched')"
        >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Markeer als Watched
        </button>

        <button
            v-if="status === 'watched'"
            disabled
            class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-green-500/15 text-green-400 border border-green-500/20 cursor-default"
        >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
            </svg>
            Watched
        </button>

        <button
            v-if="status !== 'skipped' && status !== 'watched'"
            class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-white/5 text-white/50 border border-white/10 hover:bg-orange-500/10 hover:text-orange-400 hover:border-orange-500/20 transition-colors"
            @click="$emit('markSkipped')"
        >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8" />
            </svg>
            Skip
        </button>

        <button
            v-if="status !== 'queued' && status !== 'watched'"
            class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-white/5 text-white/50 border border-white/10 hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-500/20 transition-colors"
            @click="$emit('markQueued')"
        >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            In Queue
        </button>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    status?: 'queued' | 'watching' | 'watched' | 'skipped' | null
}>()

defineEmits<{
    markWatched: []
    markSkipped: []
    markQueued: []
}>()
</script>
