<template>
    <div class="min-h-screen text-white" style="background-color: var(--theme-bg)">
        <Transition name="focus-slide-up">
            <LayoutAppHeader v-show="!focusMode" @toggle-menu="mobileMenuOpen = true" />
        </Transition>
        <LayoutMobileNav :open="mobileMenuOpen" @close="mobileMenuOpen = false" />

        <main :class="focusMode ? '' : 'pt-16 pb-20 md:pb-8'">
            <slot />
        </main>

        <Transition name="focus-slide-down">
            <LayoutBottomNav v-show="!focusMode" />
        </Transition>

        <EasterEggsSnapEffect v-if="settings.showEasterEggs" />
        <EasterEggsStanLeeCameo v-if="settings.showEasterEggs" />
    </div>
</template>

<script setup lang="ts">
const mobileMenuOpen = ref(false)
const { focusMode } = useFocusMode()
const { settings } = useSettings()

const route = useRoute()
watch(() => route.path, () => {
    mobileMenuOpen.value = false
})
</script>

<style scoped>
.focus-slide-up-enter-active,
.focus-slide-up-leave-active {
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
}
.focus-slide-up-enter-from,
.focus-slide-up-leave-to {
    transform: translateY(-100%);
    opacity: 0;
}

.focus-slide-down-enter-active,
.focus-slide-down-leave-active {
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
}
.focus-slide-down-enter-from,
.focus-slide-down-leave-to {
    transform: translateY(100%);
    opacity: 0;
}
</style>
