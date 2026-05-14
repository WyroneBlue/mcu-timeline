<template>
    <header class="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b border-white/5" style="background-color: color-mix(in srgb, var(--theme-bg), transparent 20%)">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <NuxtLink to="/" class="flex items-center gap-2.5">
                <img src="~/assets/logo/ck-shield.svg" alt="Canonkeeper" class="w-7 h-7" />
                <span class="font-display text-lg font-bold tracking-wide text-white hidden sm:inline">CANONKEEPER</span>
            </NuxtLink>

            <!-- Desktop Nav -->
            <nav class="hidden md:flex items-center gap-1">
                <NuxtLink
                    v-for="link in navLinks"
                    :key="link.to"
                    :to="link.to"
                    class="px-3 py-2 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                    active-class="!text-white bg-white/5"
                >
                    {{ link.label }}
                </NuxtLink>
            </nav>

            <div class="flex items-center gap-3">
                <!-- Notification bell -->
                <NuxtLink
                    v-if="isLoggedIn"
                    to="/notifications"
                    class="relative p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                    </svg>
                    <span
                        v-if="unreadCount > 0"
                        class="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold"
                    >
                        {{ unreadCount > 9 ? '9+' : unreadCount }}
                    </span>
                </NuxtLink>

                <!-- Spoiler toggle -->
                <button
                    v-if="isLoggedIn"
                    class="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                    :title="spoilerMode === 'smart' ? $t('spoiler.modeOn') : $t('spoiler.modeOff')"
                    @click="toggleSpoilerMode"
                >
                    <svg v-if="spoilerMode === 'smart'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                            d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                    <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                            d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </button>

                <!-- Mobile menu toggle -->
                <button
                    class="md:hidden p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                    @click="$emit('toggleMenu')"
                >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.75 9h16.5m-16.5 6.75h16.5" />
                    </svg>
                </button>
            </div>
        </div>
    </header>
</template>

<script setup lang="ts">
defineEmits<{
    toggleMenu: []
}>()

const { t } = useI18n()
const { isLoggedIn } = useAuth()
const { unreadCount } = useNotifications()
const { spoilerMode, toggleSpoilerMode } = useSpoilerGuard()

const navLinks = computed(() => [
    { to: '/timeline', label: t('nav.timeline') },
    { to: '/quiz', label: t('nav.quiz') },
    { to: '/friends', label: t('nav.friends') },
    { to: '/leaderboard', label: t('nav.leaderboard') },
    { to: '/profile', label: t('nav.profile') },
])
</script>
