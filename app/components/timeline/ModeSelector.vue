<template>
    <div class="flex flex-wrap items-center justify-center gap-2">
        <!-- Content mode -->
        <div class="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/5">
            <button
                v-for="option in modes"
                :key="option.value"
                :class="[
                    'px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
                    modelValue === option.value
                        ? 'bg-white/10 text-white shadow-sm'
                        : 'text-white/40 hover:text-white/60',
                ]"
                @click="$emit('update:modelValue', option.value)"
            >
                {{ option.label }}
            </button>
        </div>

        <!-- Sort / View toggles -->
        <div class="flex items-center gap-2">
            <!-- Sort toggle -->
            <div class="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/5">
                <button
                    v-for="option in sortOptions"
                    :key="option.value"
                    :class="[
                        'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
                        sortBy === option.value
                            ? 'bg-white/10 text-white shadow-sm'
                            : 'text-white/40 hover:text-white/60',
                    ]"
                    @click="$emit('update:sortBy', option.value)"
                >
                    <svg v-if="option.value === 'phase'" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <svg v-else-if="option.value === 'chronological'" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    {{ option.label }}
                </button>
            </div>

            <!-- View toggle -->
            <div class="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/5">
                <button
                    v-for="option in viewOptions"
                    :key="option.value"
                    :class="[
                        'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
                        viewMode === option.value
                            ? 'bg-white/10 text-white shadow-sm'
                            : 'text-white/40 hover:text-white/60',
                    ]"
                    @click="$emit('update:viewMode', option.value)"
                    :title="option.label"
                >
                    <svg v-if="option.value === 'list'" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    <svg v-else-if="option.value === 'planet'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="5" stroke-width="1.5" />
                        <ellipse cx="12" cy="12" rx="10" ry="3" stroke-width="1.5" transform="rotate(-20 12 12)" />
                    </svg>
                    <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="3" stroke-width="2" />
                        <circle cx="12" cy="12" r="8" stroke-width="1.5" stroke-dasharray="4 3" />
                        <circle cx="5" cy="8" r="1.5" fill="currentColor" stroke="none" />
                        <circle cx="19" cy="15" r="1.5" fill="currentColor" stroke="none" />
                    </svg>
                    <span class="hidden sm:inline">{{ option.label }}</span>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    modelValue: 'simple' | 'in_depth' | 'extreme'
    sortBy: 'phase' | 'chronological' | 'story'
    viewMode: 'list' | 'universe' | 'planet'
}>()

defineEmits<{
    'update:modelValue': [value: 'simple' | 'in_depth' | 'extreme']
    'update:sortBy': [value: 'phase' | 'chronological' | 'story']
    'update:viewMode': [value: 'list' | 'universe' | 'planet']
}>()

const { t } = useI18n()

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
</script>
