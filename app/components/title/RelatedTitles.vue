<template>
    <div v-if="titles.length > 0">
        <h3 class="font-display text-xl tracking-wider text-white mb-4">Gerelateerde Titels</h3>
        <div class="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
            <NuxtLink
                v-for="t in titles"
                :key="t.slug"
                :to="`/title/${t.slug}`"
                class="shrink-0 group"
            >
                <div class="w-28 rounded-lg overflow-hidden border border-white/5 transition-all group-hover:border-white/15 group-hover:scale-105">
                    <div class="aspect-[2/3] bg-white/5">
                        <img
                            v-if="t.poster_url"
                            :src="t.poster_url"
                            :alt="t.title"
                            class="w-full h-full object-cover"
                            loading="lazy"
                        />
                        <div v-else class="w-full h-full flex items-center justify-center">
                            <svg class="w-6 h-6 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                            </svg>
                        </div>
                    </div>
                </div>
                <p class="mt-2 text-[11px] text-white/40 text-center truncate w-28 group-hover:text-white/60 transition-colors">
                    {{ t.title }}
                </p>
            </NuxtLink>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    titles: Array<{
        slug: string
        title: string
        poster_url?: string | null
        chronology_index?: number | null
    }>
}>()
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
</style>
