<template>
    <Teleport to="body">
        <Transition name="snap">
            <div v-if="snapTriggered" class="fixed inset-0 z-[9998] pointer-events-none">
                <div class="absolute inset-0 snap-flash" />
                <div class="absolute inset-0 flex items-center justify-center">
                    <div class="snap-text text-4xl sm:text-6xl font-display tracking-[0.3em] uppercase text-white/80">
                        SNAP
                    </div>
                </div>
                <div class="absolute inset-0 snap-particles" />
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import { useEasterEggs } from '~/composables/useEasterEggs'

const { snapTriggered, resetSnap } = useEasterEggs()

watch(snapTriggered, (v) => {
    if (v) {
        setTimeout(() => resetSnap(), 3000)
    }
})
</script>

<style scoped>
.snap-flash {
    animation: snapFlash 3s ease-out forwards;
    background: radial-gradient(circle at center, rgba(237, 137, 54, 0.6), transparent 70%);
}

@keyframes snapFlash {
    0% { opacity: 0; }
    10% { opacity: 1; }
    30% { opacity: 0.8; background: radial-gradient(circle at center, rgba(237, 137, 54, 0.8), transparent 60%); }
    100% { opacity: 0; }
}

.snap-text {
    animation: snapTextAnim 3s ease-out forwards;
}

@keyframes snapTextAnim {
    0% { opacity: 0; transform: scale(0.5); }
    15% { opacity: 1; transform: scale(1.1); }
    30% { opacity: 0.9; transform: scale(1); }
    100% { opacity: 0; transform: scale(1.5); }
}

.snap-enter-active { transition: opacity 0.3s ease; }
.snap-leave-active { transition: opacity 0.5s ease; }
.snap-enter-from, .snap-leave-to { opacity: 0; }
</style>
