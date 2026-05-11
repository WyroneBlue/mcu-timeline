<template>
    <div v-if="cast.length > 0" ref="containerEl" class="space-y-3">
        <h3 class="font-display text-xl tracking-wider text-white">Cast</h3>
        <div class="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <div
                v-for="member in cast"
                :key="member.name"
                class="shrink-0 w-24"
            >
                <div class="w-24 h-24 rounded-xl overflow-hidden bg-white/5 mb-2">
                    <img
                        v-if="member.profile_path"
                        :src="`https://image.tmdb.org/t/p/w185${member.profile_path}`"
                        :alt="member.name"
                        class="w-full h-full object-cover"
                        loading="lazy"
                    />
                    <div v-else class="w-full h-full flex items-center justify-center text-white/10">
                        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
                        </svg>
                    </div>
                </div>
                <p class="text-xs text-white/70 truncate">{{ member.name }}</p>
                <p class="text-[10px] text-white/30 truncate">{{ member.character }}</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    tmdbId?: number | null
    type?: string
}>()

interface CastMember {
    name: string
    character: string
    profile_path: string | null
}

const cast = ref<CastMember[]>([])
const containerEl = ref<HTMLElement | null>(null)

onMounted(async () => {
    if (!props.tmdbId) return
    try {
        const mediaType = props.type === 'series' ? 'series' : 'movie'
        const data = await $fetch<{ cast: CastMember[] }>(`/api/tmdb/${props.tmdbId}`, {
            query: { type: mediaType },
        })
        cast.value = data.cast || []
    } catch {
        // TMDB unavailable — component stays hidden
    }
})

const { useStagger } = useScrollAnimation()
useStagger(containerEl, '.shrink-0', { stagger: 0.05 })
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>
