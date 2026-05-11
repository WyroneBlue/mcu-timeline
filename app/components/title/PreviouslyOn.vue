<template>
    <div v-if="summaries.length > 0" class="space-y-4">
        <h3 class="font-display text-xl tracking-wider text-white flex items-center gap-2">
            <svg class="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            PREVIOUSLY ON...
        </h3>
        <p class="text-white/30 text-xs">Je hebt deze titels geskipt. Hier is wat je moet weten.</p>

        <div v-for="item in summaries" :key="item.slug" ref="cardRefs" class="glass-card p-5 space-y-3">
            <div class="flex items-center justify-between">
                <NuxtLink
                    :to="`/title/${item.slug}`"
                    class="font-display text-lg tracking-wider text-white/80 hover:text-white transition-colors"
                >
                    {{ item.title }}
                </NuxtLink>
                <span class="text-[10px] uppercase tracking-wider text-white/20 bg-white/5 px-2 py-0.5 rounded-full">Geskipt</span>
            </div>

            <p class="text-sm text-white/50 leading-relaxed">{{ item.summary.summary }}</p>

            <div v-if="item.summary.key_characters.length > 0">
                <span class="text-[10px] uppercase tracking-wider text-white/25 block mb-1.5">Personages</span>
                <div class="flex flex-wrap gap-1.5">
                    <span
                        v-for="char in item.summary.key_characters"
                        :key="char"
                        class="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded-full"
                    >
                        {{ char }}
                    </span>
                </div>
            </div>

            <div v-if="item.summary.key_events.length > 0">
                <span class="text-[10px] uppercase tracking-wider text-white/25 block mb-1.5">Belangrijke events</span>
                <ul class="space-y-1">
                    <li
                        v-for="event in item.summary.key_events"
                        :key="event"
                        class="text-xs text-white/40 flex items-start gap-2"
                    >
                        <span class="text-white/15 mt-0.5">›</span>
                        <span>{{ event }}</span>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    currentSlug: string
    skippedSlugs: Set<string>
}>()

const { getSkippedPrerequisites } = useContextSummaries()

const summaries = computed(() => getSkippedPrerequisites(props.currentSlug, props.skippedSlugs))

const cardRefs = ref<HTMLElement[]>([])
const { useStagger } = useScrollAnimation()
const containerRef = ref<HTMLElement | null>(null)

onMounted(() => {
    if (cardRefs.value.length > 0) {
        containerRef.value = cardRefs.value[0]?.parentElement ?? null
        if (containerRef.value) {
            useStagger(containerRef as any, '.glass-card', { y: 20, stagger: 0.15 })
        }
    }
})
</script>
