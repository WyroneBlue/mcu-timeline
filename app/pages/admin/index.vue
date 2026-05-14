<template>
    <div>
        <NuxtLayout name="admin">
            <div v-if="isLoading" class="text-center py-20">
                <p class="text-gray-400">Laden...</p>
            </div>

            <div v-else-if="!user" class="max-w-sm mx-auto mt-20">
                <h1 class="text-2xl font-bold mb-6">Admin Login</h1>
                <form @submit.prevent="login">
                    <input v-model="email" type="email" placeholder="E-mail"
                        class="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors" />
                    <input v-model="password" type="password" placeholder="Wachtwoord"
                        class="w-full mt-3 px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors" />
                    <button type="submit" :disabled="loggingIn"
                        class="w-full mt-4 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg font-medium transition-colors">
                        {{ loggingIn ? 'Bezig...' : 'Inloggen' }}
                    </button>
                    <p v-if="error" class="mt-3 text-red-400 text-sm">{{ error }}</p>
                </form>
            </div>

            <div v-else-if="isAdmin === false" class="text-center py-20">
                <p class="text-gray-400 text-lg">Je hebt geen admin-rechten.</p>
                <button @click="logout"
                    class="mt-4 px-4 py-2 text-sm text-red-400 hover:text-red-300 transition-colors">
                    Uitloggen
                </button>
            </div>

            <div v-else>
                <h1 class="text-2xl font-bold mb-8">Dashboard</h1>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <NuxtLink v-for="card in cards" :key="card.to" :to="card.to"
                        class="p-6 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-600 transition-colors">
                        <div class="text-3xl mb-2">{{ card.icon }}</div>
                        <h2 class="font-semibold text-lg">{{ card.label }}</h2>
                        <p class="text-sm text-gray-400 mt-1">{{ card.desc }}</p>
                        <div v-if="stats[card.key] !== undefined" class="mt-3 text-2xl font-bold text-red-400">
                            {{ stats[card.key] }}
                        </div>
                    </NuxtLink>
                </div>
            </div>
        </NuxtLayout>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const client = useSupabaseClient()
const user = useSupabaseUser()
const { isAuthenticated, isLoading, isAdmin, checkAdmin, adminFetch } = useAdmin()

const email = ref('')
const password = ref('')
const error = ref('')
const loggingIn = ref(false)

const stats = reactive<Record<string, number>>({})

const cards = [
    { to: '/admin/titles', icon: '🎬', label: 'Titles', desc: 'Beheer films en series', key: 'titles' },
    { to: '/admin/quizzes', icon: '❓', label: 'Quizzes', desc: 'Beheer quizvragen', key: 'quizzes' },
    { to: '/admin/badges', icon: '🏅', label: 'Badges', desc: 'Beheer achievements', key: 'badges' },
    { to: '/admin/providers', icon: '🎟️', label: 'Providers', desc: 'Ticketproviders', key: 'providers' },
    { to: '/admin/summaries', icon: '📖', label: 'Summaries', desc: 'Context samenvattingen', key: 'summaries' },
    { to: '/admin/config', icon: '⚙️', label: 'Config', desc: 'Themes, icons en flags', key: 'config' },
]

async function login() {
    error.value = ''
    loggingIn.value = true
    try {
        const { error: authError } = await client.auth.signInWithPassword({
            email: email.value,
            password: password.value,
        })
        if (authError) {
            error.value = authError.message
            return
        }
        await checkAdmin()
    } catch {
        error.value = 'Er ging iets mis. Probeer opnieuw.'
    } finally {
        loggingIn.value = false
    }
}

async function logout() {
    await client.auth.signOut()
}

async function loadStats() {
    try {
        const [titles, quizzes, badges, providers, summaries, config] = await Promise.all([
            adminFetch<any[]>('/api/admin/titles'),
            adminFetch<any[]>('/api/admin/quizzes'),
            adminFetch<any[]>('/api/admin/badges'),
            adminFetch<any[]>('/api/admin/providers'),
            adminFetch<any[]>('/api/admin/summaries'),
            adminFetch<any[]>('/api/admin/config'),
        ])
        stats.titles = titles.length
        stats.quizzes = quizzes.length
        stats.badges = badges.length
        stats.providers = providers.length
        stats.summaries = summaries.length
        stats.config = config.length
    } catch {
        // stats are optional
    }
}

watch(isAuthenticated, (val) => {
    if (val) loadStats()
})

onMounted(async () => {
    await checkAdmin()
    if (isAuthenticated.value) loadStats()
})
</script>
