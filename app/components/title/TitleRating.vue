<template>
    <div class="glass-card p-5">
        <div class="flex flex-wrap items-center justify-between gap-4">
            <!-- My rating (interactive when logged in) -->
            <div v-if="user" class="flex items-center gap-3">
                <span class="text-xs text-white/30 uppercase tracking-wider">{{ $t('ratings.yourRating') }}</span>
                <UiStarRating
                    :model-value="myRating"
                    @update:model-value="handleSet"
                    @clear="handleClear"
                />
                <button
                    v-if="myRating !== null"
                    type="button"
                    class="text-xs text-white/30 hover:text-white/50 transition-colors"
                    @click="handleClear"
                >
                    {{ $t('ratings.removeRating') }}
                </button>
            </div>

            <!-- Login hint when logged out -->
            <p v-else class="text-sm text-white/40">
                <NuxtLink to="/login" class="hover:text-white transition-colors underline underline-offset-2">
                    {{ $t('ratings.loginToRate') }}
                </NuxtLink>
            </p>

            <!-- Community stats -->
            <div class="flex items-center gap-3">
                <span class="text-xs text-white/30 uppercase tracking-wider">{{ $t('ratings.averageRating') }}</span>
                <UiStarRating
                    v-if="stats"
                    :model-value="null"
                    :avg="stats.avg"
                    :count="stats.count"
                    readonly
                    size="sm"
                />
                <span v-else class="text-xs text-white/30 font-mono">—</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    titleId: number
}>()

const emit = defineEmits<{
    xp: [amount: number]
}>()

const user = useSupabaseUser()
const { getMyRating, setRating, clearRating, getStats } = useRatings()
const { XP_VALUES } = useXP()

const myRating = ref<number | null>(null)
const stats = ref<{ avg: number; count: number } | null>(null)

async function load() {
    try {
        stats.value = await getStats(props.titleId)
    } catch { /* stats unavailable */ }

    if (user.value) {
        try {
            myRating.value = await getMyRating(props.titleId)
        } catch { /* rating unavailable */ }
    }
}

onMounted(load)
watch(() => props.titleId, load)

async function handleSet(rating: number) {
    if (!user.value) return
    const prev = myRating.value
    myRating.value = rating
    try {
        const { isFirst } = await setRating(props.titleId, rating)
        if (isFirst) emit('xp', XP_VALUES.rating)
        stats.value = await getStats(props.titleId)
    } catch {
        myRating.value = prev
    }
}

async function handleClear() {
    if (!user.value || myRating.value === null) return
    const prev = myRating.value
    myRating.value = null
    try {
        await clearRating(props.titleId)
        stats.value = await getStats(props.titleId)
    } catch {
        myRating.value = prev
    }
}
</script>
