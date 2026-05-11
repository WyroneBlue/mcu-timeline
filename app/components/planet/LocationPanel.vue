<template>
    <Transition :name="isMobile ? 'panel-bottom' : 'panel'">
        <div
            v-if="location"
            :class="[
                'absolute z-20 flex flex-col',
                isMobile
                    ? 'left-0 right-0 bottom-0 max-h-[70vh]'
                    : 'right-0 top-0 bottom-0 w-[360px] max-w-[85vw]'
            ]"
        >
            <div :class="[
                'h-full bg-black/70 backdrop-blur-xl p-5 sm:p-6 flex flex-col overflow-y-auto',
                isMobile
                    ? 'border-t border-white/[0.06] rounded-t-2xl'
                    : 'border-l border-white/[0.06]'
            ]">
                <button
                    class="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.08] transition-all duration-200"
                    @click="$emit('close')"
                >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div
                    class="w-3 h-3 rounded-full mb-3"
                    :style="{ backgroundColor: location.color }"
                />

                <div class="text-white/[0.06] font-display text-4xl tracking-tighter mb-1 uppercase">{{ typeLabel }}</div>

                <h3 class="font-display text-2xl tracking-wide text-white/95 mb-2 pr-8 leading-tight">{{ location.name }}</h3>

                <div class="flex items-center gap-2 text-xs text-white/30 mb-4">
                    <span class="px-2 py-0.5 rounded-full border border-white/[0.08] bg-white/[0.03]">{{ typeLabel }}</span>
                    <span v-if="location.realm" class="px-2 py-0.5 rounded-full border border-white/[0.08] bg-white/[0.03]">{{ location.realm }}</span>
                    <span class="text-white/20">{{ titleSlugs.length }} titles</span>
                </div>

                <p v-if="location.description" class="text-sm text-white/30 leading-relaxed mb-5">
                    {{ location.description }}
                </p>

                <div class="w-full h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent mb-5" />

                <div v-if="titles.length > 0">
                    <h4 class="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">Films & Series</h4>
                    <div class="grid grid-cols-3 gap-2">
                        <NuxtLink
                            v-for="title in titles"
                            :key="title.slug"
                            :to="`/title/${title.slug}`"
                            class="group relative rounded-lg overflow-hidden border border-white/[0.06] hover:border-white/15 transition-all duration-200"
                        >
                            <div class="aspect-[2/3] bg-white/[0.03]">
                                <img
                                    v-if="title.poster_url"
                                    :src="posterProxy(title.poster_url)"
                                    :alt="title.title"
                                    class="w-full h-full object-cover"
                                    loading="lazy"
                                />
                                <div v-else class="w-full h-full flex items-center justify-center text-white/10 text-xs text-center px-1">
                                    {{ title.title }}
                                </div>
                            </div>
                            <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-1.5 pt-4">
                                <div class="text-[10px] text-white/80 font-medium leading-tight truncate">{{ title.title }}</div>
                            </div>
                        </NuxtLink>
                    </div>
                </div>

                <div v-else class="text-center py-8">
                    <p class="text-white/20 text-sm">Geen titels op deze locatie</p>
                </div>
            </div>
        </div>
    </Transition>
</template>

<script setup lang="ts">
import type { LocationJson } from '~/types/multiverse'
import mcuTitlesJson from '../../../data/mcu-titles.json'

const props = defineProps<{
    location: LocationJson | null
}>()

defineEmits<{
    close: []
}>()

const isMobile = ref(false)

function checkMobile() {
    isMobile.value = typeof window !== 'undefined' && window.innerWidth < 640
}

onMounted(() => {
    checkMobile()
    window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
    window.removeEventListener('resize', checkMobile)
})

const typeLabels: Record<string, string> = {
    planet: 'Planet',
    realm: 'Realm',
    dimension: 'Dimension',
    construct: 'Construct',
    region: 'Region',
}

const typeLabel = computed(() => {
    if (!props.location) return ''
    return typeLabels[props.location.type] || props.location.type
})

const titleSlugs = computed(() => props.location?.title_slugs ?? [])

const titles = computed(() => {
    if (!props.location) return []
    return (mcuTitlesJson as any[])
        .filter(t => props.location!.title_slugs.includes(t.slug))
        .sort((a, b) => (a.chronology_index ?? 0) - (b.chronology_index ?? 0))
})

function posterProxy(url: string): string {
    const match = url.match(/\/t\/p\/(w\d+\/.+\.jpg)/)
    if (match) return `/api/poster/${match[1]}`
    return url
}
</script>

<style scoped>
.panel-enter-active { transition: transform 0.45s ease-out, opacity 0.35s ease-out; }
.panel-leave-active { transition: transform 0.3s ease-in, opacity 0.25s ease-in; }
.panel-enter-from { transform: translateX(100%); opacity: 0; }
.panel-leave-to { transform: translateX(100%); opacity: 0; }

.panel-bottom-enter-active { transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s ease-out; }
.panel-bottom-leave-active { transition: transform 0.3s ease-in, opacity 0.2s ease-in; }
.panel-bottom-enter-from { transform: translateY(100%); opacity: 0; }
.panel-bottom-leave-to { transform: translateY(100%); opacity: 0; }
</style>
