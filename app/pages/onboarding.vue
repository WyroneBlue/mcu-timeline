<template>
    <div class="min-h-screen text-white" style="background-color: var(--theme-bg)">
        <!-- Progress dots -->
        <div class="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2">
            <div
                v-for="i in totalSteps"
                :key="i"
                :class="[
                    'w-2 h-2 rounded-full transition-all duration-300',
                    i === step ? 'w-6 bg-white' : i < step ? 'bg-white/60' : 'bg-white/15',
                ]"
            />
        </div>

        <!-- Step 1: Welcome -->
        <div v-if="step === 1" class="min-h-screen flex flex-col items-center justify-center px-6 text-center">
            <img src="~/assets/logo/ck-shield.svg" alt="Canonkeeper" class="w-16 h-16 mx-auto mb-4" />
            <div class="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white mb-4">
                CANONKEEPER
            </div>
            <p class="text-white/40 text-sm sm:text-base max-w-md leading-relaxed mb-2">
                {{ $t('onboarding.welcome') }}
            </p>
            <p class="text-white/25 text-xs max-w-sm leading-relaxed mb-10">
                {{ $t('onboarding.welcomeDesc') }}
            </p>
            <button
                class="px-8 py-3 rounded-xl bg-white/10 border border-white/10 text-white text-sm font-medium hover:bg-white/15 transition-colors"
                @click="step = 2"
            >
                {{ $t('onboarding.startJourney') }}
            </button>
        </div>

        <!-- Step 2: Mode selection -->
        <div v-else-if="step === 2" class="min-h-screen flex flex-col items-center justify-center px-6">
            <h2 class="font-display text-3xl sm:text-4xl tracking-wider text-white mb-2 text-center">{{ $t('onboarding.chooseLevel') }}</h2>
            <p class="text-white/40 text-sm mb-8 text-center">{{ $t('onboarding.chooseLevelDesc') }}</p>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl w-full">
                <button
                    v-for="option in modeOptions"
                    :key="option.value"
                    :class="[
                        'glass-card p-6 text-left transition-all duration-200 cursor-pointer',
                        selectedMode === option.value
                            ? 'border-white/30 bg-white/8'
                            : 'hover:border-white/15',
                    ]"
                    @click="selectedMode = option.value"
                >
                    <div class="font-display text-xl tracking-wider text-white mb-1">{{ option.label }}</div>
                    <p class="text-xs text-white/40 mb-3">{{ option.subtitle }}</p>
                    <p class="text-sm text-white/50 leading-relaxed">{{ option.description }}</p>
                    <div class="mt-3 text-xs text-white/30 font-mono">~{{ option.count }} {{ $t('onboarding.titles') }}</div>
                </button>
            </div>

            <div class="flex gap-4 mt-8">
                <button class="px-6 py-2 text-sm text-white/40 hover:text-white transition-colors" @click="step = 1">{{ $t('common.back') }}</button>
                <button
                    class="px-8 py-3 rounded-xl bg-white/10 border border-white/10 text-white text-sm font-medium hover:bg-white/15 transition-colors"
                    @click="step = 3"
                >
                    {{ $t('common.next') }}
                </button>
            </div>
        </div>

        <!-- Step 3: Bulk import — mark what you've seen -->
        <div v-else-if="step === 3" class="min-h-screen flex flex-col px-6 py-20">
            <div class="text-center mb-8">
                <h2 class="font-display text-3xl tracking-wider text-white mb-2">{{ $t('onboarding.whatSeen') }}</h2>
                <p class="text-white/40 text-sm">{{ $t('onboarding.whatSeenDesc') }}</p>
                <div class="flex items-center justify-center gap-4 mt-4">
                    <button
                        class="text-xs text-white/30 hover:text-white/60 transition-colors"
                        @click="selectAllInCurrentPhase"
                    >
                        {{ $t('onboarding.selectPhase') }}
                    </button>
                    <span class="text-white/10">|</span>
                    <button
                        class="text-xs text-white/30 hover:text-white/60 transition-colors"
                        @click="clearAll"
                    >
                        {{ $t('onboarding.clearSelection') }}
                    </button>
                    <span class="text-white/10">|</span>
                    <span class="text-xs text-white/30 font-mono">{{ watchedSet.size }}/{{ onboardingTitles.length }}</span>
                </div>
            </div>

            <!-- Phase tabs -->
            <div class="flex gap-2 overflow-x-auto pb-3 mb-6 justify-center">
                <button
                    v-for="phase in onboardingPhases"
                    :key="phase"
                    :class="[
                        'px-4 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                        currentPhaseTab === phase
                            ? 'bg-white/10 text-white'
                            : 'text-white/30 hover:text-white/60',
                    ]"
                    @click="currentPhaseTab = phase"
                >
                    {{ $t('common.phase') }} {{ phase }}
                </button>
            </div>

            <!-- Poster grid -->
            <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 max-w-4xl mx-auto w-full flex-1">
                <button
                    v-for="title in filteredTitles"
                    :key="title.slug"
                    class="relative group"
                    @click="toggleWatched(title.slug)"
                >
                    <div :class="[
                        'aspect-[2/3] rounded-lg overflow-hidden border-2 transition-all duration-200',
                        watchedSet.has(title.slug)
                            ? 'border-green-500/60 opacity-100'
                            : 'border-white/5 opacity-60 hover:opacity-80',
                    ]">
                        <div class="w-full h-full bg-white/5 flex items-center justify-center">
                            <span class="text-[9px] text-white/30 text-center px-1 leading-tight">{{ title.title }}</span>
                        </div>
                    </div>
                    <!-- Checkmark overlay -->
                    <div
                        v-if="watchedSet.has(title.slug)"
                        class="absolute inset-0 flex items-center justify-center bg-green-500/20 rounded-lg"
                    >
                        <div class="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    </div>
                </button>
            </div>

            <div class="flex gap-4 mt-8 justify-center">
                <button class="px-6 py-2 text-sm text-white/40 hover:text-white transition-colors" @click="step = 2">{{ $t('common.back') }}</button>
                <button
                    class="px-8 py-3 rounded-xl bg-white/10 border border-white/10 text-white text-sm font-medium hover:bg-white/15 transition-colors"
                    @click="step = 4"
                >
                    {{ $t('common.next') }}
                </button>
            </div>
        </div>

        <!-- Step 4: Spoiler preference -->
        <div v-else-if="step === 4" class="min-h-screen flex flex-col items-center justify-center px-6 text-center">
            <h2 class="font-display text-3xl sm:text-4xl tracking-wider text-white mb-2">{{ $t('onboarding.spoilerTitle') }}</h2>
            <p class="text-white/40 text-sm max-w-md mb-8">
                {{ $t('onboarding.spoilerDesc') }}
            </p>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg w-full">
                <button
                    :class="[
                        'glass-card p-6 text-left transition-all duration-200 cursor-pointer',
                        spoilerPref === 'smart' ? 'border-white/30 bg-white/8' : 'hover:border-white/15',
                    ]"
                    @click="spoilerPref = 'smart'"
                >
                    <div class="flex items-center gap-2 mb-2">
                        <svg class="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                        <span class="font-display text-lg tracking-wider text-white">{{ $t('onboarding.smart') }}</span>
                    </div>
                    <p class="text-xs text-white/40 leading-relaxed">{{ $t('onboarding.smartDesc') }}</p>
                </button>
                <button
                    :class="[
                        'glass-card p-6 text-left transition-all duration-200 cursor-pointer',
                        spoilerPref === 'reveal_all' ? 'border-white/30 bg-white/8' : 'hover:border-white/15',
                    ]"
                    @click="spoilerPref = 'reveal_all'"
                >
                    <div class="flex items-center gap-2 mb-2">
                        <svg class="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span class="font-display text-lg tracking-wider text-white">{{ $t('onboarding.revealAll') }}</span>
                    </div>
                    <p class="text-xs text-white/40 leading-relaxed">{{ $t('onboarding.revealAllDesc') }}</p>
                </button>
            </div>

            <div class="flex gap-4 mt-8">
                <button class="px-6 py-2 text-sm text-white/40 hover:text-white transition-colors" @click="step = 3">{{ $t('common.back') }}</button>
                <button
                    class="px-8 py-3 rounded-xl bg-white/10 border border-white/10 text-white text-sm font-medium hover:bg-white/15 transition-colors"
                    @click="completeOnboarding"
                >
                    {{ $t('onboarding.startJourney') }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false, ssr: false })

import mcuTitlesJson from '../../data/mcu-titles.json'

const { t } = useI18n()

const totalSteps = 4
const step = ref(1)
const selectedMode = ref<'simple' | 'in_depth' | 'extreme'>('in_depth')
const spoilerPref = ref<'smart' | 'reveal_all'>('smart')
const watchedSet = ref(new Set<string>())
const currentPhaseTab = ref(1)

const modeOptions = computed(() => [
    {
        value: 'simple' as const,
        label: t('modes.simple').toUpperCase(),
        subtitle: t('onboarding.simpleSubtitle'),
        description: t('onboarding.simpleDesc'),
        count: '25',
    },
    {
        value: 'in_depth' as const,
        label: t('modes.inDepth').toUpperCase(),
        subtitle: t('onboarding.inDepthSubtitle'),
        description: t('onboarding.inDepthDesc'),
        count: '45',
    },
    {
        value: 'extreme' as const,
        label: t('modes.extreme').toUpperCase(),
        subtitle: t('onboarding.extremeSubtitle'),
        description: t('onboarding.extremeDesc'),
        count: '65+',
    },
])

const allTitles = mcuTitlesJson as any[]

const onboardingTitles = computed(() => {
    let filtered = allTitles
    if (selectedMode.value === 'simple') {
        filtered = filtered.filter(t => t.canon_level === 'core' && t.type === 'movie')
    } else if (selectedMode.value === 'in_depth') {
        filtered = filtered.filter(t => ['core', 'extended'].includes(t.canon_level))
    }
    return filtered.sort((a, b) => (a.chronology_index || 0) - (b.chronology_index || 0))
})

const onboardingPhases = computed(() => {
    const phases = new Set<number>()
    for (const t of onboardingTitles.value) {
        const match = t.phase?.match(/\d+/)
        if (match) phases.add(parseInt(match[0]))
    }
    return Array.from(phases).sort((a, b) => a - b)
})

const filteredTitles = computed(() => {
    return onboardingTitles.value.filter(t => {
        const match = t.phase?.match(/\d+/)
        return match && parseInt(match[0]) === currentPhaseTab.value
    })
})

function toggleWatched(slug: string) {
    const s = new Set(watchedSet.value)
    if (s.has(slug)) {
        s.delete(slug)
    } else {
        s.add(slug)
    }
    watchedSet.value = s
}

function selectAllInCurrentPhase() {
    const s = new Set(watchedSet.value)
    for (const t of filteredTitles.value) {
        s.add(t.slug)
    }
    watchedSet.value = s
}

function clearAll() {
    watchedSet.value = new Set()
}

async function completeOnboarding() {
    const user = useSupabaseUser()
    const client = useSupabaseClient()

    if (user.value) {
        try {
            await client.from('profiles').upsert({
                id: user.value.id,
                spoiler_mode: spoilerPref.value,
                onboarding_completed: true,
            }, { onConflict: 'id' })

            if (watchedSet.value.size > 0) {
                const slugToTitle = new Map(allTitles.map((t: any) => [t.slug, t]))
                const { data: dbTitles } = await client
                    .from('titles')
                    .select('id, slug')

                if (dbTitles && dbTitles.length > 0) {
                    const slugToId = new Map(dbTitles.map(t => [t.slug, t.id]))
                    const progressRows = Array.from(watchedSet.value)
                        .filter(slug => slugToId.has(slug))
                        .map(slug => ({
                            user_id: user.value!.id,
                            title_id: slugToId.get(slug)!,
                            status: 'watched' as const,
                            watched_at: new Date().toISOString(),
                        }))

                    if (progressRows.length > 0) {
                        await client.from('progress').upsert(progressRows, { onConflict: 'user_id,title_id' })
                    }
                }
            }
        } catch {
            // Supabase unavailable — continue to timeline anyway
        }
    }

    localStorage.setItem('ck:mode', selectedMode.value)
    navigateTo('/timeline')
}
</script>
