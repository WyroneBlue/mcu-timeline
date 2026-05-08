<template>
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-950 dark:to-slate-900">
        <div class="max-w-7xl mx-auto">
            <header
                class="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200/50 dark:bg-gray-900/70 dark:border-gray-800">
                <div class="flex items-center justify-between py-4 px-6">
                    <NuxtLink to="/" class="flex items-center space-x-2">
                        <div
                            class="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 rounded-lg flex items-center justify-center">
                            <span class="text-white font-bold text-sm">M</span>
                        </div>
                        <span
                            class="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:text-white dark:bg-none">
                            MarvelPath
                        </span>
                    </NuxtLink>

                    <nav class="hidden md:flex items-center space-x-6">
                        <NuxtLink to="/onboarding"
                            class="text-gray-600 hover:text-blue-600 transition-colors dark:text-gray-300 dark:hover:text-blue-400">
                            Onboarding
                        </NuxtLink>
                        <NuxtLink to="/timeline"
                            class="text-gray-600 hover:text-blue-600 transition-colors dark:text-gray-300 dark:hover:text-blue-400">
                            Timeline
                        </NuxtLink>
                        <NuxtLink to="/friends"
                            class="text-gray-600 hover:text-blue-600 transition-colors dark:text-gray-300 dark:hover:text-blue-400">
                            Vrienden
                        </NuxtLink>
                        <NuxtLink to="/profile"
                            class="text-gray-600 hover:text-blue-600 transition-colors dark:text-gray-300 dark:hover:text-blue-400">
                            Profiel
                        </NuxtLink>
                        <NuxtLink to="/leaderboard"
                            class="text-gray-600 hover:text-blue-600 transition-colors dark:text-gray-300 dark:hover:text-blue-400">
                            Leaderboard
                        </NuxtLink>
                        <NuxtLink to="/quiz"
                            class="text-gray-600 hover:text-blue-600 transition-colors dark:text-gray-300 dark:hover:text-blue-400">
                            Quiz
                        </NuxtLink>
                        <NuxtLink to="/planet"
                            class="text-gray-600 hover:text-blue-600 transition-colors dark:text-gray-300 dark:hover:text-blue-400">
                            3D View
                        </NuxtLink>
                        <NuxtLink to="/login"
                            class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors dark:bg-blue-500 dark:hover:bg-blue-600">
                            Login
                        </NuxtLink>
                    </nav>

                    <!-- Mobile menu -->
                    <button class="md:hidden text-gray-600 hover:text-blue-600">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M4 6h16M4 12h16M4 18h16"></path>
                        </svg>
                    </button>
                </div>
            </header>

            <main class="py-8">
                <slot />
            </main>
        </div>
    </div>
</template>