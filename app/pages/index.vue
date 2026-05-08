<template>
    <div class="max-w-6xl px-6 mx-auto space-y-8">
        <!-- Hero Section -->
        <div class="space-y-4 text-center">
            <h1
                class="text-4xl font-bold text-transparent md:text-6xl bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text">
                MarvelPath
            </h1>
            <p class="max-w-2xl mx-auto text-xl text-gray-600">
                Jouw persoonlijke gids door het Marvel Cinematic Universe. Volg je voortgang, ontdek nieuwe verhalen en
                word een echte MCU-expert.
            </p>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div class="p-6 transition-shadow bg-white shadow-lg rounded-xl hover:shadow-xl">
                <div class="flex items-center mb-4 space-x-2">
                    <div class="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
                        <!-- <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg> -->
                    </div>
                    <h2 class="text-lg font-semibold">Voortgang</h2>
                </div>
                <div class="space-y-4">
                    <div class="flex items-center justify-between">
                        <span class="text-sm text-gray-600">MCU Compleet</span>
                        <span class="text-2xl font-bold text-blue-600">{{ percent }}%</span>
                    </div>
                    <div class="w-full h-3 bg-gray-200 rounded-full">
                        <div class="h-3 transition-all duration-300 bg-blue-600 rounded-full"
                            :style="{ width: percent + '%' }" />
                    </div>
                    <p class="text-sm text-gray-500">{{ progressText }}</p>
                </div>
            </div>

            <div class="p-6 transition-shadow bg-white shadow-lg rounded-xl hover:shadow-xl">
                <div class="flex items-center mb-4 space-x-2">
                    <div class="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg">
                        <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 class="text-lg font-semibold">Next Up</h2>
                </div>
                <div class="space-y-4">
                    <div v-if="!nextUp" class="py-4 text-center">
                        <div class="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-gray-100 rounded-full">
                            <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <p class="text-gray-500">Geen aanbeveling beschikbaar</p>
                    </div>
                    <div v-else class="space-y-2">
                        <NuxtLink :to="`/title/${nextUp.slug}`" class="block group">
                            <div
                                class="p-4 transition-colors border border-blue-200 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 group-hover:border-blue-300">
                                <h3 class="font-semibold text-gray-900 transition-colors group-hover:text-blue-600">
                                    {{ nextUp.title }}
                                </h3>
                                <p class="text-sm text-gray-600">Positie: {{ nextUp.chronology_index }}</p>
                            </div>
                        </NuxtLink>
                    </div>
                </div>
            </div>
        </div>

        <!-- Quick Actions -->
        <div class="space-y-4 text-center">
            <h2 class="text-2xl font-semibold text-gray-900">Begin je reis</h2>
            <div class="flex flex-col justify-center gap-4 sm:flex-row">
                <NuxtLink to="/onboarding"
                    class="inline-flex items-center px-8 py-3 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Kies je Experience
                </NuxtLink>
                <NuxtLink to="/timeline"
                    class="inline-flex items-center px-8 py-3 text-gray-800 transition-colors bg-gray-200 rounded-lg hover:bg-gray-300">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Bekijk Timeline
                </NuxtLink>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const client = useSupabaseClient()
const { data: titles } = await useAsyncData('count', async () => {
    const { count } = await client.from('titles').select('*', { count: 'exact', head: true })
    return count || 0
})

const percent = computed(() => {
    // Placeholder: no real per-user progress yet
    return Math.min(100, Math.round(((titles.value || 0) > 0 ? 2 / (titles.value || 1) : 0) * 100))
})
const progressText = computed(() => `${percent.value}% afgerond`)

type NextTitle = { slug: string; title: string; chronology_index: number }
const { data: nextData } = await useAsyncData('next-up', async () => {
    const { data } = await client
        .from('titles')
        .select('slug, title, chronology_index')
        .order('chronology_index', { ascending: true })
        .limit(1)
    return (data?.[0] || null) as NextTitle | null
})
const nextUp = computed(() => nextData.value)
</script>