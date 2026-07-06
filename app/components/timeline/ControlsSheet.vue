<template>
    <!-- Mobile-only: FAB + bottom sheet. Desktop uses the inline bar in timeline.vue. -->
    <div class="sm:hidden">
        <!-- Floating action button -->
        <button
            :class="[
                'fixed bottom-24 right-4 z-40 w-12 h-12 rounded-full flex items-center justify-center',
                'bg-black/60 border border-white/10 backdrop-blur-xl shadow-lg shadow-black/40',
                'transition-all duration-300 active:scale-95',
                focusMode ? 'opacity-40 hover:opacity-100' : 'opacity-100',
            ]"
            :title="$t('controls.open')"
            :aria-label="$t('controls.open')"
            @click="isOpen = true"
        >
            <svg class="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M12 6.75h8.25M12 6.75a1.75 1.75 0 11-3.5 0 1.75 1.75 0 013.5 0zM3.75 6.75H5.5m-1.75 10.5h8.25m-8.25 0H3.75m9.75 0a1.75 1.75 0 103.5 0 1.75 1.75 0 00-3.5 0zm6.5 0h.75M3.75 12h12.5m0 0a1.75 1.75 0 103.5 0 1.75 1.75 0 00-3.5 0z" />
            </svg>
            <!-- Active-filters dot -->
            <span
                v-if="activeFilterCount > 0"
                class="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white text-[10px] font-medium flex items-center justify-center"
                :style="{ backgroundColor: currentTheme.accentColor }"
            >
                {{ activeFilterCount }}
            </span>
        </button>

        <!-- Bottom sheet -->
        <UiBottomSheet :open="isOpen" :title="$t('controls.title')" @update:open="isOpen = $event">
                        <!-- Mode -->
                        <div class="mb-5">
                            <span class="block text-[11px] uppercase tracking-wider text-white/30 mb-2">{{ $t('controls.mode') }}</span>
                            <div class="grid grid-cols-3 gap-1.5">
                                <button
                                    v-for="option in modes"
                                    :key="option.value"
                                    :class="segClass(modelValue === option.value)"
                                    @click="$emit('update:modelValue', option.value)"
                                >
                                    {{ option.label }}
                                </button>
                            </div>
                        </div>

                        <!-- Sort -->
                        <div class="mb-5">
                            <span class="block text-[11px] uppercase tracking-wider text-white/30 mb-2">{{ $t('controls.sort') }}</span>
                            <div class="grid grid-cols-3 gap-1.5">
                                <button
                                    v-for="option in sortOptions"
                                    :key="option.value"
                                    :class="segClass(sortBy === option.value)"
                                    @click="$emit('update:sortBy', option.value)"
                                >
                                    {{ option.label }}
                                </button>
                            </div>
                        </div>

                        <!-- View -->
                        <div class="mb-5">
                            <span class="block text-[11px] uppercase tracking-wider text-white/30 mb-2">{{ $t('controls.view') }}</span>
                            <div class="grid grid-cols-3 gap-1.5">
                                <button
                                    v-for="option in viewOptions"
                                    :key="option.value"
                                    :class="segClass(viewMode === option.value)"
                                    @click="$emit('update:viewMode', option.value)"
                                >
                                    {{ option.label }}
                                </button>
                            </div>
                        </div>

                        <!-- Filters -->
                        <div class="pt-1 border-t border-white/[0.06] mt-1">
                            <button
                                class="w-full flex items-center justify-between py-3 text-left"
                                @click="filtersExpanded = !filtersExpanded"
                            >
                                <span class="flex items-center gap-2 text-sm text-white/70">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                    </svg>
                                    {{ $t('filters.title') }}
                                    <span
                                        v-if="activeFilterCount > 0"
                                        class="w-4 h-4 rounded-full text-white text-[10px] flex items-center justify-center"
                                        :style="{ backgroundColor: currentTheme.accentColor }"
                                    >
                                        {{ activeFilterCount }}
                                    </span>
                                </span>
                                <svg
                                    class="w-4 h-4 text-white/40 transition-transform duration-200"
                                    :class="filtersExpanded ? 'rotate-180' : ''"
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                >
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            <Transition name="filters-expand">
                                <div v-if="filtersExpanded" class="pb-2">
                                    <div class="flex items-center justify-end mb-3">
                                        <button
                                            v-if="activeFilterCount > 0"
                                            class="text-xs text-white/30 hover:text-white/60 transition-colors"
                                            @click="clearAll"
                                        >
                                            {{ $t('filters.clearAll') }}
                                        </button>
                                    </div>
                                    <div class="grid grid-cols-1 gap-4">
                                        <TimelineFilterGroup :label="$t('filters.franchise')" :options="franchiseOptions" :selected="filters.franchises" @toggle="toggleFilter('franchises', $event)" />
                                        <TimelineFilterGroup :label="$t('filters.team')" :options="teamOptions" :selected="filters.teams" @toggle="toggleFilter('teams', $event)" />
                                        <TimelineFilterGroup :label="$t('filters.character')" :options="characterOptions" :selected="filters.characters" searchable @toggle="toggleFilter('characters', $event)" />
                                        <TimelineFilterGroup :label="$t('filters.year')" :options="yearOptions" :selected="filters.years" @toggle="toggleFilter('years', $event)" />
                                        <TimelineFilterGroup :label="$t('filters.type')" :options="typeOptions" :selected="filters.types" @toggle="toggleFilter('types', $event)" />
                                        <TimelineFilterGroup :label="$t('filters.status')" :options="statusOptions" :selected="filters.statuses" @toggle="toggleFilter('statuses', $event)" />
                                        <TimelineFilterGroup :label="$t('filters.canonLevel')" :options="canonOptions" :selected="filters.canonLevels" @toggle="toggleFilter('canonLevels', $event)" />
                                        <TimelineFilterGroup :label="$t('filters.saga')" :options="sagaOptions" :selected="filters.sagas" @toggle="toggleFilter('sagas', $event)" />
                                        <TimelineFilterGroup :label="$t('filters.release')" :options="releaseStatusOptions" :selected="filters.releaseStatuses" @toggle="toggleFilter('releaseStatuses', $event)" />
                                    </div>
                                    <div v-if="activeFilterCount > 0" class="mt-4 pt-3 border-t border-white/5 text-xs text-white/30">
                                        {{ $t('filters.titlesShown', { filtered: filteredCount, total: totalCount }) }}
                                    </div>
                                </div>
                            </Transition>
                        </div>
        </UiBottomSheet>
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
    modelValue: 'simple' | 'in_depth' | 'extreme'
    sortBy: 'phase' | 'chronological' | 'story'
    viewMode: 'list' | 'universe' | 'planet'
    titles: Title[]
    filteredCount: number
    totalCount: number
}>()

defineEmits<{
    'update:modelValue': [value: 'simple' | 'in_depth' | 'extreme']
    'update:sortBy': [value: 'phase' | 'chronological' | 'story']
    'update:viewMode': [value: 'list' | 'universe' | 'planet']
}>()

const filters = defineModel<Filters>('filters', { required: true })

const { t } = useI18n()
const { currentTheme } = useSettings()
const { focusMode } = useFocusMode()

const isOpen = ref(false)
const filtersExpanded = ref(false)

const modes = computed(() => [
    { value: 'simple' as const, label: t('modes.simple') },
    { value: 'in_depth' as const, label: t('modes.inDepth') },
    { value: 'extreme' as const, label: t('modes.extreme') },
])
const sortOptions = computed(() => [
    { value: 'phase' as const, label: t('modes.phase') },
    { value: 'chronological' as const, label: t('modes.releaseOrder') },
    { value: 'story' as const, label: t('modes.story') },
])
const viewOptions = computed(() => [
    { value: 'list' as const, label: t('modes.list') },
    { value: 'universe' as const, label: t('modes.universe') },
    { value: 'planet' as const, label: t('modes.planets') },
])

function segClass(active: boolean) {
    return [
        'px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap',
        active
            ? 'bg-white/10 text-white shadow-sm border border-white/10'
            : 'bg-white/[0.03] text-white/40 border border-transparent hover:text-white/60',
    ]
}

// --- Filters (mirrors TimelineFilters.vue) ---
const activeFilterCount = computed(() => {
    const f = filters.value
    return f.franchises.size + f.teams.size + f.characters.size +
        f.years.size + f.types.size + f.statuses.size +
        f.canonLevels.size + f.sagas.size + f.releaseStatuses.size
})

function collectFromTitles<T>(getter: (t: any) => T | T[] | null | undefined): string[] {
    const values = new Set<string>()
    for (const item of props.titles) {
        const val = getter(item as any)
        if (Array.isArray(val)) {
            val.forEach(v => values.add(String(v)))
        } else if (val != null) {
            values.add(String(val))
        }
    }
    return Array.from(values).sort()
}

const franchiseOptions = computed(() => collectFromTitles(item => item.franchise))
const teamOptions = computed(() => collectFromTitles(item => item.teams).filter(v => v.length > 0))
const characterOptions = computed(() => collectFromTitles(item => item.characters))
const yearOptions = computed(() => collectFromTitles(item => item.release_date?.slice(0, 4)).sort((a, b) => b.localeCompare(a)))
const typeOptions = computed(() => [
    { value: 'movie', label: t('filters.movie') },
    { value: 'series', label: t('filters.series') },
])
const statusOptions = computed(() => [
    { value: 'watched', label: t('filters.watched') },
    { value: 'watching', label: t('filters.watching') },
    { value: 'queued', label: t('filters.queued') },
    { value: 'skipped', label: t('filters.skipped') },
    { value: 'none', label: t('filters.notStarted') },
])
const canonOptions = computed(() => [
    { value: 'core', label: t('filters.core') },
    { value: 'extended', label: t('filters.extended') },
    { value: 'adjacent', label: t('filters.adjacent') },
    { value: 'standalone', label: t('filters.standalone') },
])
const sagaOptions = computed(() => collectFromTitles(item => item.saga))
const releaseStatusOptions = computed(() => [
    { value: 'released', label: t('filters.released') },
    { value: 'upcoming', label: t('filters.upcoming') },
    { value: 'announced', label: t('filters.announced') },
])

function toggleFilter(key: keyof Filters, value: string) {
    const set = new Set(filters.value[key])
    if (set.has(value)) set.delete(value)
    else set.add(value)
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
.filters-expand-enter-active,
.filters-expand-leave-active {
    transition: opacity 0.2s ease;
}
.filters-expand-enter-from,
.filters-expand-leave-to {
    opacity: 0;
}
</style>
