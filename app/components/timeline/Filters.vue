<template>
    <div>
        <!-- Filter toggle button -->
        <button
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
            :class="hasActiveFilters ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-white/5 border border-white/5 text-white/40 hover:text-white/60'"
            @click="isOpen = !isOpen"
        >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
            <span v-if="activeCount > 0" class="ml-1 w-4 h-4 rounded-full bg-purple-500 text-white text-[10px] flex items-center justify-center">
                {{ activeCount }}
            </span>
        </button>

        <!-- Filter panel -->
        <Transition name="filter-panel">
            <div v-if="isOpen" class="absolute left-0 right-0 mt-2 z-40">
                <div class="max-w-4xl mx-auto px-4 sm:px-6">
                    <div class="glass-card p-4 sm:p-5 max-h-[60vh] overflow-y-auto">
                        <div class="flex items-center justify-between mb-4">
                            <span class="text-sm font-medium text-white/60">Filters</span>
                            <button
                                v-if="hasActiveFilters"
                                class="text-xs text-white/30 hover:text-white/60 transition-colors"
                                @click="clearAll"
                            >
                                Clear all
                            </button>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <!-- Franchise filter -->
                            <TimelineFilterGroup
                                label="Franchise"
                                :options="franchiseOptions"
                                :selected="filters.franchises"
                                @toggle="toggleFilter('franchises', $event)"
                            />

                            <!-- Team filter -->
                            <TimelineFilterGroup
                                label="Team"
                                :options="teamOptions"
                                :selected="filters.teams"
                                @toggle="toggleFilter('teams', $event)"
                            />

                            <!-- Character filter -->
                            <TimelineFilterGroup
                                label="Character"
                                :options="characterOptions"
                                :selected="filters.characters"
                                @toggle="toggleFilter('characters', $event)"
                                searchable
                            />

                            <!-- Year filter -->
                            <TimelineFilterGroup
                                label="Year"
                                :options="yearOptions"
                                :selected="filters.years"
                                @toggle="toggleFilter('years', $event)"
                            />

                            <!-- Type filter -->
                            <TimelineFilterGroup
                                label="Type"
                                :options="typeOptions"
                                :selected="filters.types"
                                @toggle="toggleFilter('types', $event)"
                            />

                            <!-- Status filter -->
                            <TimelineFilterGroup
                                label="Status"
                                :options="statusOptions"
                                :selected="filters.statuses"
                                @toggle="toggleFilter('statuses', $event)"
                            />

                            <!-- Canon level filter -->
                            <TimelineFilterGroup
                                label="Canon Level"
                                :options="canonOptions"
                                :selected="filters.canonLevels"
                                @toggle="toggleFilter('canonLevels', $event)"
                            />

                            <!-- Saga filter -->
                            <TimelineFilterGroup
                                label="Saga"
                                :options="sagaOptions"
                                :selected="filters.sagas"
                                @toggle="toggleFilter('sagas', $event)"
                            />

                            <!-- Release status filter -->
                            <TimelineFilterGroup
                                label="Release"
                                :options="releaseStatusOptions"
                                :selected="filters.releaseStatuses"
                                @toggle="toggleFilter('releaseStatuses', $event)"
                            />
                        </div>

                        <div v-if="hasActiveFilters" class="mt-4 pt-3 border-t border-white/5 text-xs text-white/30">
                            {{ filteredCount }} of {{ totalCount }} titles shown
                        </div>
                    </div>
                </div>
            </div>
        </Transition>
    </div>
</template>

<script setup lang="ts">
import type { Database } from '~/types/supabase'
type Title = Database['public']['Tables']['titles']['Row']

interface Filters {
    franchises: Set<string>
    teams: Set<string>
    characters: Set<string>
    years: Set<string>
    types: Set<string>
    statuses: Set<string>
    canonLevels: Set<string>
    sagas: Set<string>
    releaseStatuses: Set<string>
}

const props = defineProps<{
    titles: Title[]
    filteredCount: number
    totalCount: number
}>()

const filters = defineModel<Filters>('filters', { required: true })

const isOpen = ref(false)

const hasActiveFilters = computed(() => {
    const f = filters.value
    return f.franchises.size > 0 || f.teams.size > 0 || f.characters.size > 0 ||
        f.years.size > 0 || f.types.size > 0 || f.statuses.size > 0 ||
        f.canonLevels.size > 0 || f.sagas.size > 0 || f.releaseStatuses.size > 0
})

const activeCount = computed(() => {
    const f = filters.value
    return f.franchises.size + f.teams.size + f.characters.size +
        f.years.size + f.types.size + f.statuses.size +
        f.canonLevels.size + f.sagas.size + f.releaseStatuses.size
})

function collectFromTitles<T>(getter: (t: any) => T | T[] | null | undefined): string[] {
    const values = new Set<string>()
    for (const t of props.titles) {
        const val = getter(t as any)
        if (Array.isArray(val)) {
            val.forEach(v => values.add(String(v)))
        } else if (val != null) {
            values.add(String(val))
        }
    }
    return Array.from(values).sort()
}

const franchiseOptions = computed(() => collectFromTitles(t => t.franchise))
const teamOptions = computed(() => collectFromTitles(t => t.teams).filter(t => t.length > 0))
const characterOptions = computed(() => collectFromTitles(t => t.characters))
const yearOptions = computed(() => collectFromTitles(t => t.release_date?.slice(0, 4)).sort((a, b) => b.localeCompare(a)))
const typeOptions = computed(() => [
    { value: 'movie', label: 'Film' },
    { value: 'series', label: 'Serie' },
])
const statusOptions = computed(() => [
    { value: 'watched', label: 'Watched' },
    { value: 'watching', label: 'Watching' },
    { value: 'queued', label: 'Queued' },
    { value: 'skipped', label: 'Skipped' },
    { value: 'none', label: 'Not started' },
])
const canonOptions = computed(() => [
    { value: 'core', label: 'Core' },
    { value: 'extended', label: 'Extended' },
    { value: 'adjacent', label: 'Adjacent' },
    { value: 'standalone', label: 'Standalone' },
])
const sagaOptions = computed(() => collectFromTitles(t => t.saga))
const releaseStatusOptions = computed(() => [
    { value: 'released', label: 'Released' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'announced', label: 'Announced' },
])

function toggleFilter(key: keyof Filters, value: string) {
    const set = new Set(filters.value[key])
    if (set.has(value)) {
        set.delete(value)
    } else {
        set.add(value)
    }
    filters.value = { ...filters.value, [key]: set }
}

function clearAll() {
    filters.value = {
        franchises: new Set(),
        teams: new Set(),
        characters: new Set(),
        years: new Set(),
        types: new Set(),
        statuses: new Set(),
        canonLevels: new Set(),
        sagas: new Set(),
        releaseStatuses: new Set(),
    }
}
</script>

<style scoped>
.filter-panel-enter-active,
.filter-panel-leave-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
}
.filter-panel-enter-from,
.filter-panel-leave-to {
    opacity: 0;
    transform: translateY(-8px);
}
</style>
