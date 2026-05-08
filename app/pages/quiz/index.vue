<template>
    <div class="max-w-4xl mx-auto space-y-6">
        <div class="text-center space-y-4">
            <h1 class="text-3xl font-bold text-gray-900">MCU Quiz</h1>
            <p class="text-gray-600">Test je kennis van het Marvel Cinematic Universe</p>
        </div>

        <!-- Quiz Selection -->
        <div v-if="!currentQuiz" class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <UCard v-for="quiz in availableQuizzes" :key="quiz.id" class="card-hover cursor-pointer"
                @click="startQuiz(quiz)">
                <template #header>
                    <div class="flex items-center space-x-3">
                        <div
                            class="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                            <UIcon :name="quiz.icon" class="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 class="text-xl font-semibold">{{ quiz.title }}</h2>
                            <p class="text-sm text-gray-500">{{ quiz.description }}</p>
                        </div>
                    </div>
                </template>
                <div class="space-y-3">
                    <div class="flex items-center justify-between text-sm">
                        <span class="text-gray-600">Vragen</span>
                        <span class="font-semibold">{{ quiz.questionCount }}</span>
                    </div>
                    <div class="flex items-center justify-between text-sm">
                        <span class="text-gray-600">Tijd</span>
                        <span class="font-semibold">{{ quiz.duration }} min</span>
                    </div>
                    <div class="flex items-center justify-between text-sm">
                        <span class="text-gray-600">Moeilijkheid</span>
                        <UBadge
                            :color="quiz.difficulty === 'easy' ? 'success' : quiz.difficulty === 'medium' ? 'warning' : 'error'">
                            {{ quiz.difficulty === 'easy' ? 'Makkelijk' : quiz.difficulty === 'medium' ? 'Gemiddeld' :
                            'Moeilijk' }}
                        </UBadge>
                    </div>
                </div>
            </UCard>
        </div>

        <!-- Active Quiz -->
        <div v-else-if="!quizCompleted" class="space-y-6">
            <!-- Progress -->
            <UCard>
                <div class="space-y-4">
                    <div class="flex items-center justify-between">
                        <h2 class="text-lg font-semibold">{{ currentQuiz.title }}</h2>
                        <span class="text-sm text-gray-600">Vraag {{ currentQuestionIndex + 1 }} van {{
                            currentQuiz.questions.length }}</span>
                    </div>
                    <UProgress :value="progress" size="lg" color="primary" />
                </div>
            </UCard>

            <!-- Question -->
            <UCard class="card-hover">
                <template #header>
                    <h3 class="text-xl font-semibold">{{ currentQuestion.question }}</h3>
                </template>
                <div class="space-y-4">
                    <div v-for="(option, index) in currentQuestion.options" :key="index"
                        class="p-4 border border-gray-200 rounded-lg cursor-pointer transition-colors hover:border-blue-300 hover:bg-blue-50"
                        :class="{ 'border-blue-500 bg-blue-50': selectedAnswer === index }"
                        @click="selectedAnswer = index">
                        <div class="flex items-center space-x-3">
                            <div class="w-6 h-6 rounded-full border-2 flex items-center justify-center"
                                :class="selectedAnswer === index ? 'border-blue-500 bg-blue-500' : 'border-gray-300'">
                                <UIcon v-if="selectedAnswer === index" name="i-heroicons-check"
                                    class="w-4 h-4 text-white" />
                            </div>
                            <span class="font-medium">{{ option }}</span>
                        </div>
                    </div>
                </div>
            </UCard>

            <!-- Navigation -->
            <div class="flex justify-between">
                <UButton v-if="currentQuestionIndex > 0" @click="previousQuestion" variant="outline" color="neutral">
                    <UIcon name="i-heroicons-arrow-left" class="w-4 h-4 mr-2" />
                    Vorige
                </UButton>
                <div v-else></div>

                <UButton @click="nextQuestion" color="primary" :disabled="selectedAnswer === null">
                    <span v-if="currentQuestionIndex < currentQuiz.questions.length - 1">
                        Volgende
                        <UIcon name="i-heroicons-arrow-right" class="w-4 h-4 ml-2" />
                    </span>
                    <span v-else>
                        Afronden
                        <UIcon name="i-heroicons-check" class="w-4 h-4 ml-2" />
                    </span>
                </UButton>
            </div>
        </div>

        <!-- Results -->
        <div v-else class="space-y-6">
            <UCard class="card-hover">
                <template #header>
                    <div class="text-center">
                        <UIcon name="i-heroicons-trophy" class="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                        <h2 class="text-2xl font-bold text-gray-900">Quiz Voltooid!</h2>
                    </div>
                </template>
                <div class="text-center space-y-4">
                    <div class="text-4xl font-bold text-blue-600">{{ score }}/{{ currentQuiz.questions.length }}</div>
                    <p class="text-lg text-gray-600">{{ Math.round((score / currentQuiz.questions.length) * 100) }}%
                        correct</p>
                    <div class="flex justify-center space-x-4">
                        <UButton @click="restartQuiz" color="primary">
                            <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 mr-2" />
                            Opnieuw
                        </UButton>
                        <UButton @click="goToLeaderboard" variant="outline" color="neutral">
                            <UIcon name="i-heroicons-trophy" class="w-4 h-4 mr-2" />
                            Leaderboard
                        </UButton>
                    </div>
                </div>
            </UCard>
        </div>
    </div>
</template>

<script setup lang="ts">
type Quiz = {
    id: string
    title: string
    description: string
    icon: string
    questionCount: number
    duration: number
    difficulty: 'easy' | 'medium' | 'hard'
    questions: Array<{
        question: string
        options: string[]
        correct: number
    }>
}

const availableQuizzes: Quiz[] = [
    {
        id: 'phase1',
        title: 'Phase 1 Quiz',
        description: 'Test je kennis van de eerste fase van de MCU',
        icon: 'i-heroicons-film',
        questionCount: 5,
        duration: 5,
        difficulty: 'easy',
        questions: [
            {
                question: 'Welke film begon de MCU?',
                options: ['Iron Man', 'The Incredible Hulk', 'Thor', 'Captain America'],
                correct: 0
            },
            {
                question: 'Wie speelde de rol van Iron Man?',
                options: ['Chris Evans', 'Robert Downey Jr.', 'Chris Hemsworth', 'Mark Ruffalo'],
                correct: 1
            },
            {
                question: 'In welke film verscheen Nick Fury voor het eerst?',
                options: ['Iron Man', 'The Incredible Hulk', 'Thor', 'Captain America'],
                correct: 0
            },
            {
                question: 'Wat is de naam van Thors hamer?',
                options: ['Mjolnir', 'Stormbreaker', 'Gungnir', 'Hofund'],
                correct: 0
            },
            {
                question: 'Welke Infinity Stone verscheen in Captain America: The First Avenger?',
                options: ['Space Stone', 'Mind Stone', 'Reality Stone', 'Power Stone'],
                correct: 0
            }
        ]
    },
    {
        id: 'avengers',
        title: 'Avengers Quiz',
        description: 'Alles over de Avengers films',
        icon: 'i-heroicons-users',
        questionCount: 5,
        duration: 7,
        difficulty: 'medium',
        questions: [
            {
                question: 'Welke Avengers stierven in Avengers: Infinity War?',
                options: ['Iron Man en Captain America', 'Spider-Man en Doctor Strange', 'Spider-Man en Black Panther', 'Niemand stierf permanent'],
                correct: 2
            },
            {
                question: 'Wie is de leider van de Avengers?',
                options: ['Iron Man', 'Captain America', 'Thor', 'Hulk'],
                correct: 1
            },
            {
                question: 'Welke film introduceerde Vision?',
                options: ['Avengers', 'Avengers: Age of Ultron', 'Captain America: Civil War', 'Avengers: Infinity War'],
                correct: 1
            },
            {
                question: 'Wat is de naam van Ultron\'s schepper?',
                options: ['Tony Stark', 'Bruce Banner', 'Hank Pym', 'Reed Richards'],
                correct: 0
            },
            {
                question: 'Welke Infinity Stone zit in Vision\'s hoofd?',
                options: ['Mind Stone', 'Soul Stone', 'Time Stone', 'Reality Stone'],
                correct: 0
            }
        ]
    }
]

const currentQuiz = ref<Quiz | null>(null)
const currentQuestionIndex = ref(0)
const selectedAnswer = ref<number | null>(null)
const answers = ref<number[]>([])
const quizCompleted = ref(false)
const score = ref(0)

const currentQuestion = computed(() => {
    if (!currentQuiz.value) return null
    return currentQuiz.value.questions[currentQuestionIndex.value]
})

const progress = computed(() => {
    if (!currentQuiz.value) return 0
    return ((currentQuestionIndex.value + 1) / currentQuiz.value.questions.length) * 100
})

function startQuiz(quiz: Quiz) {
    currentQuiz.value = quiz
    currentQuestionIndex.value = 0
    selectedAnswer.value = null
    answers.value = []
    quizCompleted.value = false
    score.value = 0
}

function nextQuestion() {
    if (selectedAnswer.value === null) return

    answers.value[currentQuestionIndex.value] = selectedAnswer.value

    if (currentQuestionIndex.value < currentQuiz.value!.questions.length - 1) {
        currentQuestionIndex.value++
        selectedAnswer.value = answers.value[currentQuestionIndex.value] ?? null
    } else {
        finishQuiz()
    }
}

function previousQuestion() {
    if (currentQuestionIndex.value > 0) {
        currentQuestionIndex.value--
        selectedAnswer.value = answers.value[currentQuestionIndex.value] ?? null
    }
}

function finishQuiz() {
    // Calculate score
    score.value = 0
    currentQuiz.value!.questions.forEach((question, index) => {
        if (answers.value[index] === question.correct) {
            score.value++
        }
    })

    quizCompleted.value = true
}

function restartQuiz() {
    if (currentQuiz.value) {
        startQuiz(currentQuiz.value)
    }
}

function goToLeaderboard() {
    navigateTo('/leaderboard')
}
</script>
