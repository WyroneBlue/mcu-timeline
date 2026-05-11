<template>
    <div>
        <NuxtLayout name="admin">
            <div v-if="!isAuthenticated" class="max-w-sm mx-auto mt-20">
                <h1 class="text-2xl font-bold mb-6">Admin Login</h1>
                <form @submit.prevent="login">
                    <input v-model="keyInput" type="password" placeholder="Service key"
                        class="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors" />
                    <button type="submit"
                        class="w-full mt-4 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors">
                        Inloggen
                    </button>
                    <p v-if="error" class="mt-3 text-red-400 text-sm">{{ error }}</p>
                </form>
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

const { isAuthenticated, setKey, adminFetch, restoreKey } = useAdmin()
const keyInput = ref('')
const error = ref('')

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
    try {
        await $fetch('/api/admin/titles', {
            headers: { Authorization: `Bearer ${keyInput.value}` },
        })
        setKey(keyInput.value)
        loadStats()
    } catch (e: any) {
        const status = e?.response?.status || e?.statusCode
        if (status === 403) {
            error.value = 'Ongeldige key'
        } else {
            error.value = 'Server error — controleer je Supabase configuratie'
        }
    }
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

onMounted(() => {
    restoreKey()
    if (isAuthenticated.value) loadStats()
})
</script>
