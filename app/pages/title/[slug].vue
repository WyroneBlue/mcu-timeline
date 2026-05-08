<template>
    <div class="max-w-4xl mx-auto space-y-6">
        <UButton to="/timeline" variant="ghost" color="gray" class="mb-4">
            <UIcon name="i-heroicons-arrow-left" class="w-4 h-4 mr-2" />
            Terug naar Timeline
        </UButton>

        <div v-if="!title" class="flex items-center justify-center py-12">
            <div class="text-center space-y-4">
                <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-gray-400 animate-spin mx-auto" />
                <p class="text-gray-600">Laden...</p>
            </div>
        </div>

        <div v-else class="space-y-6">
            <!-- Hero Section -->
            <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
                <div class="flex items-start justify-between">
                    <div class="space-y-4">
                        <h1 class="text-3xl md:text-4xl font-bold">{{ title.title }}</h1>
                        <div class="flex items-center space-x-4">
                            <span
                                class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20">
                                <UIcon name="i-heroicons-calendar" class="w-4 h-4 mr-2" />
                                {{ title.release_date || 'Onbekend' }}
                            </span>
                            <span
                                class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20">
                                <UIcon name="i-heroicons-hashtag" class="w-4 h-4 mr-2" />
                                Positie {{ title.chronology_index }}
                            </span>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-6xl font-bold opacity-20">{{ title.chronology_index }}</div>
                    </div>
                </div>
            </div>

            <!-- Content Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Main Info -->
                <div class="lg:col-span-2 space-y-6">
                    <UCard>
                        <template #header>
                            <h2 class="text-xl font-semibold">Informatie</h2>
                        </template>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="text-sm font-medium text-gray-500">Type</label>
                                <p class="text-lg font-semibold capitalize">{{ title.type }}</p>
                            </div>
                            <div>
                                <label class="text-sm font-medium text-gray-500">Phase</label>
                                <p class="text-lg font-semibold">{{ title.phase || '—' }}</p>
                            </div>
                            <div>
                                <label class="text-sm font-medium text-gray-500">Chronologie</label>
                                <p class="text-lg font-semibold">{{ title.chronology_index }}</p>
                            </div>
                            <div>
                                <label class="text-sm font-medium text-gray-500">Release</label>
                                <p class="text-lg font-semibold">{{ title.release_date || '—' }}</p>
                            </div>
                        </div>
                    </UCard>

                    <UCard>
                        <template #header>
                            <h2 class="text-xl font-semibold">Beschrijving</h2>
                        </template>
                        <p class="text-gray-600">
                            {{ title.overview || 'Geen beschrijving beschikbaar voor deze titel.' }}
                        </p>
                    </UCard>
                </div>

                <!-- Sidebar -->
                <div class="space-y-6">
                    <UCard>
                        <template #header>
                            <h2 class="text-xl font-semibold">Acties</h2>
                        </template>
                        <div class="space-y-4">
                            <UButton @click="markWatched" color="primary" size="lg" class="w-full" :loading="isMarking">
                                <UIcon name="i-heroicons-check" class="w-5 h-5 mr-2" />
                                Markeer als bekeken
                            </UButton>

                            <UButton variant="outline" color="gray" size="lg" class="w-full">
                                <UIcon name="i-heroicons-heart" class="w-5 h-5 mr-2" />
                                Toevoegen aan favorieten
                            </UButton>
                        </div>
                    </UCard>

                    <UCard>
                        <template #header>
                            <h2 class="text-xl font-semibold">Verwante titels</h2>
                        </template>
                        <div class="space-y-2">
                            <p class="text-sm text-gray-500">Geen verwante titels gevonden.</p>
                        </div>
                    </UCard>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
type Title = {
    id: number
    slug: string
    title: string
    release_date: string | null
    chronology_index: number
    phase: string | null
    type: 'movie' | 'series'
    overview?: string | null
}

const route = useRoute()
const client = useSupabaseClient()
const user = useSupabaseUser()
const isMarking = ref(false)

const { data } = await useAsyncData(`title-${route.params.slug}`, async () => {
    const { data, error } = await client
        .from('titles')
        .select('id, slug, title, release_date, chronology_index, phase, type, overview')
        .eq('slug', route.params.slug as string)
        .single()
    if (error) throw error
    return data as Title
})

const title = computed(() => data.value)

async function markWatched() {
    if (!user.value || !title.value) return
    isMarking.value = true
    try {
        await client.from('progress').upsert({
            user_id: user.value.id,
            title_id: title.value.id,
            status: 'watched'
        })
        // Award XP and first badge
        await client.from('xp_events').insert({
            user_id: user.value.id,
            title_id: title.value.id,
            event_type: 'watch',
            xp_delta: 120
        })
        const { data: hasBadge } = await client
            .from('user_badges')
            .select('badge_id')
            .limit(1)
        if (!hasBadge || hasBadge.length === 0) {
            const { data: badge } = await client.from('badges').select('id').eq('code', 'first_watch').single()
            if (badge) await client.from('user_badges').insert({ user_id: user.value.id, badge_id: badge.id })
        }
    } catch (error) {
        console.error(error)
    } finally {
        isMarking.value = false
    }
}
</script>