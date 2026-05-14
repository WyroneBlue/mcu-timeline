<template>
    <div class="min-h-screen bg-gray-950 text-white">
        <header class="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex items-center justify-between h-14">
                    <div class="flex items-center gap-4">
                        <NuxtLink to="/admin" class="text-lg font-bold tracking-tight">
                            Canonkeeper <span class="text-red-500">Admin</span>
                        </NuxtLink>
                        <nav class="hidden md:flex items-center gap-1">
                            <NuxtLink v-for="item in nav" :key="item.to" :to="item.to"
                                class="px-3 py-1.5 rounded-md text-sm transition-colors"
                                :class="isActive(item.to) ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'">
                                {{ item.label }}
                            </NuxtLink>
                        </nav>
                    </div>
                    <div class="flex items-center gap-4">
                        <span v-if="user" class="text-sm text-gray-400">{{ user.email }}</span>
                        <button v-if="user" @click="logout"
                            class="text-sm text-gray-500 hover:text-gray-300 transition-colors">
                            Uitloggen
                        </button>
                        <NuxtLink to="/" class="text-sm text-gray-500 hover:text-gray-300 transition-colors">
                            Terug naar app
                        </NuxtLink>
                    </div>
                </div>
            </div>
        </header>

        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <slot />
        </main>
    </div>
</template>

<script setup lang="ts">
const route = useRoute()
const user = useSupabaseUser()
const client = useSupabaseClient()

async function logout() {
    await client.auth.signOut()
    navigateTo('/admin')
}

function isActive(to: string) {
    if (to === '/admin') return route.path === '/admin'
    return route.path.startsWith(to)
}

const nav = [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/titles', label: 'Titles' },
    { to: '/admin/quizzes', label: 'Quizzes' },
    { to: '/admin/badges', label: 'Badges' },
    { to: '/admin/providers', label: 'Providers' },
    { to: '/admin/summaries', label: 'Summaries' },
    { to: '/admin/config', label: 'Config' },
]
</script>
