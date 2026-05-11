<template>
    <div class="glass-card overflow-hidden border-l-3" :class="borderColor">
        <div class="flex items-center gap-4 p-4">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" :class="bgColor">
                <svg v-if="status === 'upcoming'" class="w-5 h-5" :class="textColor" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                <svg v-else class="w-5 h-5" :class="textColor" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
            </div>
            <div class="flex-1 min-w-0">
                <span class="text-[10px] uppercase tracking-wider block mb-0.5" :class="textColor">
                    {{ status === 'upcoming' ? 'Binnenkort' : 'Aangekondigd' }}
                </span>
                <span v-if="releaseDate" class="text-sm text-white/60">
                    {{ formattedDate }}
                </span>
                <span v-else class="text-sm text-white/40 italic">Datum nog onbekend</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    status: 'upcoming' | 'announced'
    releaseDate?: string | null
}>()

const borderColor = computed(() =>
    props.status === 'upcoming' ? 'border-l-blue-500/50' : 'border-l-purple-500/50'
)

const bgColor = computed(() =>
    props.status === 'upcoming' ? 'bg-blue-500/10' : 'bg-purple-500/10'
)

const textColor = computed(() =>
    props.status === 'upcoming' ? 'text-blue-400' : 'text-purple-400'
)

const formattedDate = computed(() => {
    if (!props.releaseDate) return ''
    const date = new Date(props.releaseDate)
    return date.toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })
})
</script>
