<template>
    <div class="max-w-6xl mx-auto px-6 space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 class="text-3xl font-bold text-gray-900">MCU Timeline</h1>
                <p class="text-gray-600 mt-1">Volg je voortgang door het Marvel Cinematic Universe</p>
            </div>

            <div class="flex flex-wrap gap-2">
                <button :class="[
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    mode === 'simple' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                ]" @click="setMode('simple')">
                    Simple
                </button>
                <button :class="[
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    mode === 'in_depth' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                ]" @click="setMode('in_depth')">
                    In Depth
                </button>
                <button :class="[
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    mode === 'extreme' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                ]" @click="setMode('extreme')">
                    Extreme
                </button>
            </div>
        </div>

        <div v-if="pending" class="flex items-center justify-center py-12">
            <div class="text-center space-y-4">
                <div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p class="text-gray-600">Laden...</p>
            </div>
        </div>

        <div v-else-if="titles.length === 0" class="text-center py-12">
            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2M9 9h6m-6 4h6m-6 4h6" />
                </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Geen titels gevonden</h3>
            <p class="text-gray-600">Er zijn geen titels beschikbaar voor de geselecteerde mode.</p>
        </div>

        <div v-else class="space-y-3">
            <div v-for="t in titles" :key="t.slug"
                class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4 flex-1">
                        <div class="flex-shrink-0">
                            <div
                                class="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                                <span class="text-white font-bold text-sm">{{ t.chronology_index }}</span>
                            </div>
                        </div>

                        <div class="flex-1 min-w-0">
                            <NuxtLink :to="`/title/${t.slug}`" class="block group">
                                <h3
                                    class="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                    {{ t.title }}
                                </h3>
                                <div class="flex items-center space-x-4 mt-1">
                                    <span
                                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {{ t.phase || '—' }}
                                    </span>
                                    <span
                                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                        {{ t.type.toUpperCase() }}
                                    </span>
                                </div>
                            </NuxtLink>
                        </div>
                    </div>

                    <div class="flex-shrink-0">
                        <button v-if="watched.has(t.id)" disabled
                            class="bg-green-100 text-green-800 px-4 py-2 rounded-lg text-sm font-medium flex items-center">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M5 13l4 4L19 7" />
                            </svg>
                            Bekeken
                        </button>
                        <button v-else
                            class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center"
                            @click="markWatched(t.id)">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Markeer bekeken
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useOnboardingStore } from '../../stores/onboarding'
import type { Database } from '../../types/supabase'

type Title = {
    id: number
    slug: string
    title: string
    chronology_index: number
    phase: string | null
    is_canon_mcu: boolean
    type: 'movie' | 'series'
}

const client = useSupabaseClient<Database>()
const store = useOnboardingStore()
const user = useSupabaseUser()
const mode = computed(() => store.mode)

const { data, pending, error } = await useAsyncData(() => `titles-${mode.value}`, async () => {
    const currentMode = mode.value
    let query = client.from('titles').select('id, slug, title, chronology_index, phase, is_canon_mcu, type')

    if (currentMode === 'simple') {
        query = query.eq('is_canon_mcu', true).eq('type', 'movie')
    } else if (currentMode === 'in_depth') {
        query = query.eq('is_canon_mcu', true)
    } else if (currentMode === 'extreme') {
        // no extra filter for now
    }

    const { data, error } = await query.order('chronology_index', { ascending: true })
    if (error) throw error
    return data as Title[]
}, { watch: [mode] })

const titles = computed(() => data.value || [])

if (error.value) console.error(error.value)

function setMode(newMode: 'simple' | 'in_depth' | 'extreme') {
    store.setMode(newMode)
}

// progress indicator
type Prog = { title_id: number; status: string }
const { data: progData, refresh: refreshProg } = await useAsyncData(
    () => `progress-${user.value?.id || 'anon'}`,
    async () => {
        if (!user.value) return [] as Prog[]
        const { data } = await client.from('progress').select('title_id, status')
        return (data as Prog[]) || []
    },
    { watch: [user] }
)
const watched = computed(() => new Set((progData.value || []).filter(p => p.status === 'watched').map(p => p.title_id)))

async function markWatched(titleId: number) {
    if (!user.value) return
    await client
        .from('progress')
        .upsert({ user_id: user.value.id, title_id: titleId, status: 'watched' } as Database['public']['Tables']['progress']['Insert'])
    await refreshProg()
}
</script>