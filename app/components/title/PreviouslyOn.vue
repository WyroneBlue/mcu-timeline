<template>
    <div v-if="prerequisites.length > 0" class="space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
            <h3 class="font-display text-xl tracking-wider text-white flex items-center gap-2">
                <svg class="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
                {{ $t('previouslyOn.heading') }}
            </h3>
            <span class="text-xs text-white/30">
                {{ missedCount > 0 ? $t('previouslyOn.missedOf', { missed: missedCount, total: prerequisites.length }) : $t('previouslyOn.caughtUp') }}
            </span>
        </div>

        <!-- Scope tabs -->
        <div class="flex gap-1 p-0.5 rounded-lg bg-white/5 border border-white/5 w-fit">
            <button
                v-for="s in scopes"
                :key="s.value"
                :disabled="s.disabled"
                :class="[
                    'px-3 py-1.5 rounded-md text-xs transition-all',
                    activeScope === s.value ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60',
                    s.disabled && 'opacity-30 pointer-events-none',
                ]"
                @click="selectScope(s.value)"
            >
                {{ s.label }}
            </button>
        </div>

        <!-- Recap content -->
        <div class="glass-card p-5">
            <div v-if="!user" class="text-sm text-white/40">
                <NuxtLink to="/login" class="underline underline-offset-2 hover:text-white transition-colors">
                    {{ $t('previouslyOn.loginToRecap') }}
                </NuxtLink>
            </div>

            <div v-else-if="state.loading" class="flex items-center gap-3 text-sm text-white/40">
                <div class="w-4 h-4 border-2 border-white/10 border-t-white/50 rounded-full animate-spin" />
                {{ $t('previouslyOn.generating') }}
            </div>

            <div v-else-if="state.error" class="text-sm text-white/40">
                {{ state.error }}
                <button class="ml-2 underline underline-offset-2 hover:text-white transition-colors" @click="load(activeScope, true)">
                    {{ $t('previouslyOn.retry') }}
                </button>
            </div>

            <div v-else-if="state.caughtUp" class="text-sm text-white/50">
                {{ $t('previouslyOn.caughtUpLong') }}
            </div>

            <template v-else-if="state.story">
                <div :class="[spoilerHidden && 'spoiler-blur']">
                    <p class="text-sm text-white/60 leading-relaxed whitespace-pre-line">{{ state.story }}</p>
                </div>
                <button
                    v-if="spoilerHidden"
                    class="mt-3 text-xs text-white/30 hover:text-white/50 transition-colors"
                    @click="revealed = true"
                >
                    {{ $t('previouslyOn.spoilerHidden') }} — {{ $t('previouslyOn.reveal') }}
                </button>
                <p v-if="state.fallback" class="mt-3 text-[10px] uppercase tracking-wider text-white/20">
                    {{ $t('previouslyOn.curatedNote') }}
                </p>
            </template>
        </div>

        <!-- Missed titles as compact chips -->
        <div v-if="missedEntries.length > 0" class="flex flex-wrap gap-1.5">
            <NuxtLink
                v-for="item in missedEntries"
                :key="item.titleId"
                :to="`/title/${item.slug}`"
                class="text-xs text-white/40 hover:text-white/70 bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-full transition-colors"
            >
                {{ item.title }}
            </NuxtLink>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { SkippedPrerequisite } from '~/composables/useContextSummaries'

type Scope = 'detailed' | 'for-me' | 'missed-only'

interface ScopeState {
    loading: boolean
    error: string | null
    story: string
    caughtUp: boolean
    fallback: boolean
    loaded: boolean
}

const props = defineProps<{
    currentTitleId: number
    watchedIds: Set<number>
}>()

const { t, locale } = useI18n()
const user = useSupabaseUser()
const client = useSupabaseClient()
const { getPrerequisites } = useContextSummaries()
const { spoilerMode } = useSpoilerGuard()

const prerequisites = ref<SkippedPrerequisite[]>([])
const activeScope = ref<Scope>('for-me')
const revealed = ref(false)

const emptyState = (): ScopeState => ({ loading: false, error: null, story: '', caughtUp: false, fallback: false, loaded: false })
const scopeStates = reactive<Record<Scope, ScopeState>>({
    'detailed': emptyState(),
    'for-me': emptyState(),
    'missed-only': emptyState(),
})

const state = computed(() => scopeStates[activeScope.value])

const missedEntries = computed(() => prerequisites.value.filter(p => !props.watchedIds.has(p.titleId)))
const missedCount = computed(() => missedEntries.value.length)

const scopes = computed(() => [
    { value: 'detailed' as Scope, label: t('previouslyOn.levelDetailed'), disabled: false },
    { value: 'for-me' as Scope, label: t('previouslyOn.levelForMe'), disabled: false },
    { value: 'missed-only' as Scope, label: t('previouslyOn.levelMissed'), disabled: missedCount.value === 0 },
])

// Hide heavier-than-safe content behind a blur in smart spoiler mode
const spoilerHidden = computed(() => {
    if (revealed.value || spoilerMode.value === 'reveal_all') return false
    return missedEntries.value.some(p => p.summary.spoiler_level !== 'safe')
})

function selectScope(scope: Scope) {
    activeScope.value = scope
    if (!scopeStates[scope].loaded && !scopeStates[scope].loading) load(scope)
}

async function load(scope: Scope, force = false) {
    if (!user.value) return
    const s = scopeStates[scope]
    if (s.loading || (s.loaded && !force)) return
    s.loading = true
    s.error = null

    try {
        const { data: { session } } = await client.auth.getSession()
        if (!session) throw new Error('Not authenticated')

        const result = await $fetch<{ story?: string, caughtUp?: boolean, fallback?: boolean }>('/api/summary/generate', {
            method: 'POST',
            headers: { Authorization: `Bearer ${session.access_token}` },
            body: {
                title_id: props.currentTitleId,
                mode: 'flowing-story',
                scope,
                locale: locale.value,
            },
        })

        s.story = result.story ?? ''
        s.caughtUp = !!result.caughtUp || (!result.story && !result.fallback)
        s.fallback = !!result.fallback
        s.loaded = true
    }
    catch {
        s.error = t('previouslyOn.generationFailed')
    }
    finally {
        s.loading = false
    }
}

async function init() {
    if (!props.currentTitleId) {
        prerequisites.value = []
        return
    }
    try {
        prerequisites.value = await getPrerequisites(props.currentTitleId)
    } catch {
        prerequisites.value = []
    }
    if (prerequisites.value.length === 0) return

    for (const key of Object.keys(scopeStates) as Scope[]) scopeStates[key] = emptyState()
    revealed.value = false
    activeScope.value = missedCount.value > 0 ? 'for-me' : 'detailed'
    if (user.value) load(activeScope.value)
}

watch(() => props.currentTitleId, () => init())
watch(user, (u) => {
    if (u && prerequisites.value.length > 0 && !state.value.loaded) load(activeScope.value)
})

onMounted(() => init())
</script>
