<template>
    <div class="max-w-4xl mx-auto px-4 sm:px-6 space-y-6 pb-24">
        <div class="pt-4">
            <h1 class="font-display text-3xl tracking-wider text-white mb-1">MCU QUIZ</h1>
            <p class="text-white/30 text-sm">Test je kennis van het Marvel Cinematic Universe.</p>
        </div>

        <!-- Quiz selection -->
        <template v-if="!activeQuiz">
            <!-- Stats -->
            <div class="grid grid-cols-3 gap-3">
                <div class="glass-card p-4 text-center">
                    <span class="font-display text-2xl text-white">{{ totalAnswered }}</span>
                    <span class="block text-[10px] text-white/30 uppercase tracking-wider mt-1">Beantwoord</span>
                </div>
                <div class="glass-card p-4 text-center">
                    <span class="font-display text-2xl text-green-400">{{ totalCorrect }}</span>
                    <span class="block text-[10px] text-white/30 uppercase tracking-wider mt-1">Correct</span>
                </div>
                <div class="glass-card p-4 text-center">
                    <span class="font-display text-2xl text-white">{{ correctPercent }}<span class="text-sm text-white/30">%</span></span>
                    <span class="block text-[10px] text-white/30 uppercase tracking-wider mt-1">Score</span>
                </div>
            </div>

            <!-- Phase selection -->
            <div class="space-y-3">
                <h2 class="font-display text-lg tracking-wider text-white/60">KIES EEN QUIZ</h2>

                <button
                    class="glass-card p-5 w-full text-left flex items-center gap-4 hover:border-white/15 transition-colors"
                    @click="startQuiz('all')"
                >
                    <div class="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                        <span class="font-display text-xl text-white/40">∞</span>
                    </div>
                    <div class="flex-1">
                        <span class="text-sm text-white font-medium block">Alle Fases</span>
                        <span class="text-xs text-white/30">{{ allQuestions.length }} vragen uit het hele MCU</span>
                    </div>
                    <svg class="w-4 h-4 text-white/20 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                </button>

                <button
                    v-for="phase in phases"
                    :key="phase"
                    class="glass-card p-5 w-full text-left flex items-center gap-4 hover:border-white/15 transition-colors"
                    @click="startQuiz(phase)"
                >
                    <div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" :style="{ background: phaseColor(phase) + '15' }">
                        <span class="font-display text-xl" :style="{ color: phaseColor(phase) }">{{ phaseNumber(phase) }}</span>
                    </div>
                    <div class="flex-1">
                        <span class="text-sm text-white font-medium block">{{ phase }}</span>
                        <span class="text-xs text-white/30">{{ questionsForPhase(phase).length }} vragen</span>
                    </div>
                    <svg class="w-4 h-4 text-white/20 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                </button>
            </div>
        </template>

        <!-- Active quiz -->
        <template v-else-if="!showResults">
            <!-- Progress -->
            <div class="flex items-center gap-3">
                <button class="text-white/30 hover:text-white/50 transition-colors text-sm" @click="exitQuiz">
                    ← Stoppen
                </button>
                <div class="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div class="h-full bg-white/30 rounded-full transition-all duration-500" :style="{ width: `${quizProgress}%` }" />
                </div>
                <span class="text-xs text-white/30 font-mono">{{ currentIndex + 1 }}/{{ activeQuestions.length }}</span>
            </div>

            <!-- Question -->
            <div class="glass-card p-6 sm:p-8 space-y-6">
                <div>
                    <span class="text-[10px] uppercase tracking-wider text-white/20 block mb-2">{{ currentQuestion.phase }}</span>
                    <h2 class="text-lg sm:text-xl text-white leading-relaxed">{{ currentQuestion.question }}</h2>
                </div>

                <div class="space-y-3">
                    <button
                        v-for="(option, i) in currentQuestion.options"
                        :key="i"
                        :disabled="answered !== null"
                        :class="[
                            'w-full text-left p-4 rounded-xl border transition-all duration-300',
                            answered === null
                                ? 'bg-white/3 border-white/8 hover:border-white/20 hover:bg-white/5 cursor-pointer'
                                : i === currentQuestion.correct_index
                                    ? 'bg-green-500/10 border-green-500/30 text-green-400'
                                    : answered === i
                                        ? 'bg-red-500/10 border-red-500/30 text-red-400'
                                        : 'bg-white/3 border-white/5 opacity-40',
                        ]"
                        @click="answerQuestion(i)"
                    >
                        <div class="flex items-center gap-3">
                            <span class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono shrink-0" :class="[
                                answered === null ? 'bg-white/5 text-white/40' :
                                i === currentQuestion.correct_index ? 'bg-green-500/20 text-green-400' :
                                answered === i ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-white/20'
                            ]">
                                {{ ['A', 'B', 'C', 'D'][i] }}
                            </span>
                            <span class="text-sm" :class="answered === null ? 'text-white/70' : ''">{{ option }}</span>
                        </div>
                    </button>
                </div>

                <!-- Feedback -->
                <div v-if="answered !== null" class="flex items-center justify-between pt-2">
                    <span :class="answered === currentQuestion.correct_index ? 'text-green-400' : 'text-red-400'" class="text-sm font-medium">
                        {{ answered === currentQuestion.correct_index ? 'Correct! +25 XP' : 'Helaas, fout' }}
                    </span>
                    <button
                        class="px-5 py-2 rounded-xl bg-white/10 border border-white/10 text-sm text-white hover:bg-white/15 transition-colors"
                        @click="nextQuestion"
                    >
                        {{ currentIndex < activeQuestions.length - 1 ? 'Volgende' : 'Bekijk resultaat' }}
                    </button>
                </div>
            </div>
        </template>

        <!-- Results -->
        <template v-else>
            <div class="glass-card p-8 sm:p-10 text-center space-y-6">
                <div class="font-display text-5xl sm:text-6xl tracking-wider text-white">
                    {{ score }}/{{ activeQuestions.length }}
                </div>
                <div class="space-y-1">
                    <p class="text-white/60">
                        {{ resultMessage }}
                    </p>
                    <p class="text-sm text-green-400 font-mono">+{{ score * 25 }} XP verdiend</p>
                </div>

                <!-- Per-question review -->
                <div class="space-y-2 text-left max-w-md mx-auto">
                    <div
                        v-for="(q, i) in activeQuestions"
                        :key="i"
                        class="flex items-center gap-3 text-sm"
                    >
                        <span :class="answers[i] === q.correct_index ? 'text-green-400' : 'text-red-400'" class="shrink-0">
                            {{ answers[i] === q.correct_index ? '✓' : '✗' }}
                        </span>
                        <span class="text-white/50 truncate flex-1">{{ q.question }}</span>
                    </div>
                </div>

                <div class="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                    <button
                        class="px-6 py-3 rounded-xl bg-white/10 border border-white/10 text-sm text-white hover:bg-white/15 transition-colors"
                        @click="startQuiz(lastPhase)"
                    >
                        Opnieuw proberen
                    </button>
                    <button
                        class="px-6 py-3 rounded-xl bg-white/5 border border-white/5 text-sm text-white/60 hover:bg-white/10 transition-colors"
                        @click="exitQuiz"
                    >
                        Terug naar overzicht
                    </button>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ ssr: false })

import quizData from '../../../data/quiz-questions.json'

interface QuizQuestion {
    id: number
    phase: string
    title_slug: string
    question: string
    options: string[]
    correct_index: number
    difficulty: string
}

const allQuestions = quizData as QuizQuestion[]
const user = useSupabaseUser()
const { awardXP } = useXP()

const phases = computed(() => {
    const set = new Set(allQuestions.map(q => q.phase))
    return Array.from(set).sort()
})

function questionsForPhase(phase: string) {
    return allQuestions.filter(q => q.phase === phase)
}

function phaseNumber(phase: string) {
    const match = phase.match(/\d+/)
    return match ? match[0] : '?'
}

function phaseColor(phase: string) {
    const num = parseInt(phaseNumber(phase))
    if (num <= 3) return '#E53E3E'
    if (num <= 5) return '#805AD5'
    return '#38B2AC'
}

// Quiz state
const activeQuiz = ref(false)
const showResults = ref(false)
const activeQuestions = ref<QuizQuestion[]>([])
const currentIndex = ref(0)
const answered = ref<number | null>(null)
const answers = ref<number[]>([])
const lastPhase = ref<string>('all')

// Persistent stats
const totalAnswered = ref(0)
const totalCorrect = ref(0)

onMounted(() => {
    if (import.meta.client) {
        totalAnswered.value = parseInt(localStorage.getItem('quiz_answered') || '0')
        totalCorrect.value = parseInt(localStorage.getItem('quiz_correct') || '0')
    }
})

const correctPercent = computed(() => {
    if (totalAnswered.value === 0) return 0
    return Math.round((totalCorrect.value / totalAnswered.value) * 100)
})

const currentQuestion = computed(() => activeQuestions.value[currentIndex.value])

const quizProgress = computed(() => {
    if (activeQuestions.value.length === 0) return 0
    return Math.round(((currentIndex.value + (answered.value !== null ? 1 : 0)) / activeQuestions.value.length) * 100)
})

const score = computed(() => {
    return answers.value.filter((a, i) => a === activeQuestions.value[i]?.correct_index).length
})

const resultMessage = computed(() => {
    const pct = activeQuestions.value.length > 0 ? score.value / activeQuestions.value.length : 0
    if (pct === 1) return 'Perfect! Je kent het MCU door en door.'
    if (pct >= 0.8) return 'Uitstekend! Je bent een ware MCU-fan.'
    if (pct >= 0.6) return 'Goed gedaan! Je weet behoorlijk wat.'
    if (pct >= 0.4) return 'Niet slecht, maar er valt nog wat te leren.'
    return 'Tijd om wat films te kijken!'
})

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

function startQuiz(phase: string) {
    lastPhase.value = phase
    const pool = phase === 'all' ? allQuestions : questionsForPhase(phase)
    activeQuestions.value = shuffle(pool).slice(0, 10)
    currentIndex.value = 0
    answered.value = null
    answers.value = []
    showResults.value = false
    activeQuiz.value = true
}

async function answerQuestion(index: number) {
    if (answered.value !== null) return
    answered.value = index
    answers.value.push(index)

    const isCorrect = index === currentQuestion.value.correct_index
    totalAnswered.value++
    if (isCorrect) totalCorrect.value++

    if (import.meta.client) {
        localStorage.setItem('quiz_answered', totalAnswered.value.toString())
        localStorage.setItem('quiz_correct', totalCorrect.value.toString())
    }

    if (isCorrect && user.value) {
        try {
            await awardXP('quiz', 25, undefined, { question_id: currentQuestion.value.id })
        } catch { /* silent */ }
    }
}

function nextQuestion() {
    if (currentIndex.value < activeQuestions.value.length - 1) {
        currentIndex.value++
        answered.value = null
    } else {
        showResults.value = true
    }
}

function exitQuiz() {
    activeQuiz.value = false
    showResults.value = false
}
</script>
