<template>
    <Teleport to="body">
        <Transition name="overlay">
            <div
                v-if="open"
                class="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
                @click="$emit('close')"
            />
        </Transition>
        <Transition name="drawer">
            <nav
                v-if="open"
                class="fixed top-0 right-0 bottom-0 z-[61] w-72 bg-[#141825] border-l border-white/5 p-6 flex flex-col"
            >
                <div class="flex items-center justify-between mb-8">
                    <img src="~/assets/logo/ck-shield.svg" alt="Canonkeeper" class="w-6 h-6" />
                    <span class="font-display text-lg font-bold tracking-wide text-white">CANONKEEPER</span>
                    <button
                        class="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                        @click="$emit('close')"
                    >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div class="flex flex-col gap-1 flex-1">
                    <NuxtLink
                        v-for="link in navLinks"
                        :key="link.to"
                        :to="link.to"
                        class="flex items-center gap-3 px-4 py-3 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                        active-class="!text-white bg-white/5"
                        @click="$emit('close')"
                    >
                        <span v-html="link.icon" />
                        <span>{{ link.label }}</span>
                    </NuxtLink>
                </div>

                <div class="pt-6 border-t border-white/5">
                    <NuxtLink
                        v-if="isLoggedIn"
                        to="/profile"
                        class="flex items-center gap-3 px-4 py-3 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                        @click="$emit('close')"
                    >
                        Profiel
                    </NuxtLink>
                    <NuxtLink
                        v-else
                        to="/login"
                        class="flex items-center gap-3 px-4 py-3 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                        @click="$emit('close')"
                    >
                        Inloggen
                    </NuxtLink>
                </div>
            </nav>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
defineProps<{
    open: boolean
}>()

defineEmits<{
    close: []
}>()

const { isLoggedIn } = useAuth()

const navLinks = [
    { to: '/', label: 'Home', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>' },
    { to: '/timeline', label: 'Timeline', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>' },
    { to: '/quiz', label: 'Quiz', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>' },
    { to: '/friends', label: 'Vrienden', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>' },
    { to: '/leaderboard', label: 'Leaderboard', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.003 6.003 0 01-5.54 0" /></svg>' },
    { to: '/notifications', label: 'Notificaties', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>' },
]
</script>

<style scoped>
.overlay-enter-active,
.overlay-leave-active {
    transition: opacity 0.3s ease;
}
.overlay-enter-from,
.overlay-leave-to {
    opacity: 0;
}

.drawer-enter-active,
.drawer-leave-active {
    transition: transform 0.3s ease;
}
.drawer-enter-from,
.drawer-leave-to {
    transform: translateX(100%);
}
</style>
