<template>
    <div class="glass-card p-6">
        <h3 class="font-display text-xl tracking-wider text-white mb-4">{{ $t('reviews.title') }}</h3>

        <!-- Write / edit form (authenticated) -->
        <div v-if="user" class="mb-6">
            <!-- My review status chip -->
            <div v-if="myReview && myReview.status !== 'approved'" class="mb-3">
                <span
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border"
                    :class="statusChipClass"
                >
                    <span class="w-1.5 h-1.5 rounded-full bg-current" />
                    {{ statusChipLabel }}
                </span>
            </div>

            <label class="text-xs text-white/30 uppercase tracking-wider block mb-2">
                {{ $t('reviews.writeReview') }}
            </label>
            <textarea
                v-model="draft"
                :placeholder="$t('reviews.placeholder')"
                rows="4"
                maxlength="2000"
                class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 transition-colors resize-y"
            />
            <div class="flex flex-wrap items-center justify-between gap-3 mt-2">
                <span class="text-xs font-mono" :class="draft.length > 0 && draft.trim().length < 10 ? 'text-orange-400/70' : 'text-white/30'">
                    {{ $t('reviews.charCount', { count: draft.length, max: 2000 }) }}
                </span>
                <div class="flex items-center gap-3">
                    <button
                        v-if="myReview"
                        type="button"
                        class="text-xs text-white/30 hover:text-red-400 transition-colors"
                        :disabled="submitting"
                        @click="handleDelete"
                    >
                        {{ $t('reviews.deleteMine') }}
                    </button>
                    <button
                        type="button"
                        class="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-sm text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        :disabled="submitting || draft.trim().length < 10 || draft.trim().length > 2000"
                        @click="handleSubmit"
                    >
                        {{ submitting ? '…' : $t('reviews.submit') }}
                    </button>
                </div>
            </div>

            <!-- Feedback after submit -->
            <p v-if="feedback" class="mt-2 text-sm" :class="feedbackClass">
                {{ feedback }}
            </p>
        </div>

        <!-- Login CTA -->
        <p v-else class="mb-6 text-sm text-white/40">
            <NuxtLink to="/login" class="hover:text-white transition-colors underline underline-offset-2">
                {{ $t('reviews.loginToReview') }}
            </NuxtLink>
        </p>

        <!-- Approved reviews -->
        <div v-if="loading" class="flex justify-center py-6">
            <div class="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
        </div>

        <p v-else-if="reviews.length === 0" class="text-sm text-white/30 italic">
            {{ $t('reviews.empty') }}
        </p>

        <ul v-else class="space-y-4">
            <li v-for="review in reviews" :key="review.id" class="rounded-xl bg-white/5 border border-white/5 p-4">
                <div class="flex items-center justify-between gap-3 mb-2">
                    <div class="flex items-center gap-2 min-w-0">
                        <img
                            v-if="review.profiles?.avatar_url"
                            :src="review.profiles.avatar_url"
                            alt=""
                            class="w-6 h-6 rounded-full object-cover shrink-0"
                        >
                        <span class="text-sm text-white/70 truncate">
                            {{ review.profiles?.username || '—' }}
                        </span>
                        <span class="text-xs text-white/25 shrink-0">{{ relativeDate(review.created_at) }}</span>
                        <span v-if="review.updated_at !== review.created_at" class="text-xs text-white/20 shrink-0">
                            {{ $t('reviews.edited') }}
                        </span>
                    </div>
                    <button
                        v-if="user && review.user_id !== user.id"
                        type="button"
                        class="text-xs shrink-0 transition-colors"
                        :class="reportedIds.has(review.id) ? 'text-white/20 cursor-default' : 'text-white/30 hover:text-orange-400'"
                        :disabled="reportedIds.has(review.id)"
                        @click="handleReport(review.id)"
                    >
                        {{ reportedIds.has(review.id) ? $t('reviews.reported') : $t('reviews.report') }}
                    </button>
                </div>
                <p class="text-sm text-white/50 leading-relaxed whitespace-pre-line">{{ review.body }}</p>
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
import type { ApprovedReview, MyReview } from '~/composables/useReviews'

const props = defineProps<{
    titleId: number
}>()

const { t, locale } = useI18n()
const user = useSupabaseUser()
const { getApprovedReviews, getMyReview, submitReview, reportReview, deleteMyReview } = useReviews()

const loading = ref(true)
const submitting = ref(false)
const reviews = ref<ApprovedReview[]>([])
const myReview = ref<MyReview | null>(null)
const draft = ref('')
const feedback = ref('')
const feedbackClass = ref('text-white/40')
const reportedIds = ref<Set<number>>(new Set())

const statusChipLabel = computed(() => {
    if (!myReview.value) return ''
    if (myReview.value.status === 'rejected') return t('reviews.rejected')
    return t('reviews.pendingBadge')
})

const statusChipClass = computed(() => {
    if (myReview.value?.status === 'rejected') return 'border-red-500/30 bg-red-500/10 text-red-400'
    return 'border-amber-500/30 bg-amber-500/10 text-amber-400'
})

function relativeDate(iso: string): string {
    const diffMs = new Date(iso).getTime() - Date.now()
    const rtf = new Intl.RelativeTimeFormat(locale.value, { numeric: 'auto' })
    const units: [Intl.RelativeTimeFormatUnit, number][] = [
        ['year', 1000 * 60 * 60 * 24 * 365],
        ['month', 1000 * 60 * 60 * 24 * 30],
        ['week', 1000 * 60 * 60 * 24 * 7],
        ['day', 1000 * 60 * 60 * 24],
        ['hour', 1000 * 60 * 60],
        ['minute', 1000 * 60],
    ]
    for (const [unit, ms] of units) {
        if (Math.abs(diffMs) >= ms) {
            return rtf.format(Math.round(diffMs / ms), unit)
        }
    }
    return rtf.format(0, 'minute')
}

async function load() {
    loading.value = true
    try {
        reviews.value = await getApprovedReviews(props.titleId)
    } catch { /* reviews unavailable */ }

    if (user.value) {
        try {
            myReview.value = await getMyReview(props.titleId)
            if (myReview.value) draft.value = myReview.value.body
        } catch { /* my review unavailable */ }
    }
    loading.value = false
}

onMounted(load)
watch(() => props.titleId, load)

async function handleSubmit() {
    if (submitting.value) return
    feedback.value = ''
    submitting.value = true
    try {
        const { review, status } = await submitReview(props.titleId, draft.value.trim(), locale.value)
        myReview.value = review

        if (status === 'approved') {
            feedback.value = t('reviews.submitted')
            feedbackClass.value = 'text-green-400/80'
        } else if (status === 'rejected') {
            feedback.value = t('reviews.rejected')
            feedbackClass.value = 'text-red-400/80'
        } else {
            feedback.value = t('reviews.heldForModeration')
            feedbackClass.value = 'text-amber-400/80'
        }

        try {
            reviews.value = await getApprovedReviews(props.titleId)
        } catch { /* list refresh failed */ }
    } catch (e) {
        const err = e as { statusCode?: number, status?: number, data?: { message?: string }, message?: string }
        if (err?.statusCode === 429 || err?.status === 429) {
            feedback.value = t('reviews.rateLimited')
        } else {
            feedback.value = err?.data?.message || err?.message || t('reviews.rateLimited')
        }
        feedbackClass.value = 'text-red-400/80'
    } finally {
        submitting.value = false
    }
}

async function handleDelete() {
    if (!myReview.value) return
    submitting.value = true
    try {
        await deleteMyReview(myReview.value.id)
        myReview.value = null
        draft.value = ''
        feedback.value = ''
        reviews.value = await getApprovedReviews(props.titleId)
    } catch { /* delete failed */ } finally {
        submitting.value = false
    }
}

async function handleReport(id: number) {
    if (reportedIds.value.has(id)) return
    if (!confirm(t('reviews.reportConfirm'))) return
    try {
        await reportReview(id)
        reportedIds.value = new Set([...reportedIds.value, id])
    } catch { /* report failed */ }
}
</script>
