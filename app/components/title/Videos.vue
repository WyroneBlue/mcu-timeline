<template>
    <div v-if="groupedVideos.length > 0" ref="containerEl" class="space-y-4">
        <h3 class="font-display text-xl tracking-wider text-white">Video's</h3>

        <!-- Type tabs -->
        <div class="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
                v-for="group in groupedVideos"
                :key="group.type"
                :class="[
                    'shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200',
                    activeTab === group.type
                        ? 'bg-white/10 text-white border-white/15'
                        : 'bg-white/[0.03] text-white/40 border-white/[0.06] hover:bg-white/[0.06] hover:text-white/60',
                ]"
                @click="selectTab(group.type)"
            >
                {{ group.label }}
                <span class="ml-1 text-white/20">{{ group.videos.length }}</span>
            </button>
        </div>

        <!-- Active video player -->
        <div v-if="activeVideo" class="glass-card overflow-hidden">
            <div class="relative w-full aspect-video bg-black">
                <iframe
                    :src="embedUrl"
                    :title="activeVideo.name"
                    class="absolute inset-0 w-full h-full"
                    frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen
                />
            </div>
            <div class="p-3">
                <p class="text-sm text-white/70">{{ activeVideo.name }}</p>
                <p class="text-xs text-white/30 mt-0.5">{{ typeLabel(activeVideo.type) }}{{ activeVideo.official ? ' — Officieel' : '' }}</p>
            </div>
        </div>

        <!-- Video list (when more than 1 in active tab) -->
        <div v-if="activeGroupVideos.length > 1" class="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <button
                v-for="video in activeGroupVideos"
                :key="video.key"
                :class="[
                    'shrink-0 w-48 rounded-lg overflow-hidden border transition-all duration-200 text-left',
                    activeVideo?.key === video.key
                        ? 'border-white/20 ring-1 ring-white/10'
                        : 'border-white/[0.06] hover:border-white/10',
                ]"
                @click="activeVideo = video"
            >
                <div class="relative aspect-video bg-black/50">
                    <img
                        :src="`https://img.youtube.com/vi/${video.key}/mqdefault.jpg`"
                        :alt="video.name"
                        class="w-full h-full object-cover"
                        loading="lazy"
                    />
                    <div class="absolute inset-0 flex items-center justify-center">
                        <div class="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center">
                            <svg class="w-3.5 h-3.5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        </div>
                    </div>
                </div>
                <div class="p-2">
                    <p class="text-xs text-white/50 line-clamp-1">{{ video.name }}</p>
                </div>
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
const { settings } = useSettings()

const props = defineProps<{
    tmdbId?: number | null
    type?: string
}>()

interface Video {
    key: string
    name: string
    type: string
    official: boolean
}

interface VideoGroup {
    type: string
    label: string
    videos: Video[]
}

const TYPE_ORDER = ['Trailer', 'Teaser', 'Clip', 'Behind the Scenes', 'Featurette', 'Bloopers']
const TYPE_LABELS: Record<string, string> = {
    'Trailer': 'Trailers',
    'Teaser': 'Teasers',
    'Clip': 'Clips',
    'Behind the Scenes': 'Behind the Scenes',
    'Featurette': 'Featurettes',
    'Bloopers': 'Bloopers',
}

const allVideos = ref<Video[]>([])
const activeTab = ref('')
const activeVideo = ref<Video | null>(null)
const containerEl = ref<HTMLElement | null>(null)

const shouldAutoplay = computed(() => {
    if (settings.autoplayTrailers === 'always') return true
    if (settings.autoplayTrailers === 'wifi') {
        const conn = (navigator as any).connection
        return conn ? conn.type === 'wifi' || conn.effectiveType === '4g' : false
    }
    return false
})

const embedUrl = computed(() => {
    if (!activeVideo.value) return ''
    const base = `https://www.youtube-nocookie.com/embed/${activeVideo.value.key}?rel=0&modestbranding=1`
    return shouldAutoplay.value ? `${base}&autoplay=1` : base
})

const groupedVideos = computed<VideoGroup[]>(() => {
    const groups = new Map<string, Video[]>()
    for (const v of allVideos.value) {
        const list = groups.get(v.type) || []
        list.push(v)
        groups.set(v.type, list)
    }
    return TYPE_ORDER
        .filter(t => groups.has(t))
        .map(t => ({
            type: t,
            label: TYPE_LABELS[t] || t,
            videos: groups.get(t)!,
        }))
})

const activeGroupVideos = computed(() =>
    groupedVideos.value.find(g => g.type === activeTab.value)?.videos || []
)

function selectTab(type: string) {
    activeTab.value = type
    const group = groupedVideos.value.find(g => g.type === type)
    if (group && group.videos.length > 0) {
        activeVideo.value = group.videos[0]
    }
}

function typeLabel(type: string) {
    return TYPE_LABELS[type] || type
}

onMounted(async () => {
    if (!props.tmdbId) return
    try {
        const mediaType = props.type === 'series' ? 'series' : 'movie'
        const data = await $fetch<{ videos: Video[] }>(`/api/tmdb/${props.tmdbId}/videos`, {
            query: { type: mediaType },
        })
        allVideos.value = data.videos || []

        if (groupedVideos.value.length > 0) {
            selectTab(groupedVideos.value[0].type)
        }
    } catch {
        // TMDB unavailable
    }
})

const { useFadeIn } = useScrollAnimation()
useFadeIn(containerEl, { y: 20 })
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>
