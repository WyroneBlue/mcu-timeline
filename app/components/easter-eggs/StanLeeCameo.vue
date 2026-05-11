<template>
    <Transition name="cameo">
        <div
            v-if="visible"
            class="fixed bottom-24 right-4 z-50 flex items-end gap-2 pointer-events-none"
        >
            <div class="cameo-figure">
                <svg width="40" height="60" viewBox="0 0 40 60" class="text-white/20">
                    <circle cx="20" cy="10" r="8" fill="currentColor" />
                    <rect x="10" y="18" width="20" height="28" rx="4" fill="currentColor" />
                    <rect x="6" y="20" width="6" height="18" rx="3" fill="currentColor" transform="rotate(-10, 9, 20)" />
                    <rect x="28" y="20" width="6" height="18" rx="3" fill="currentColor" transform="rotate(10, 31, 20)" />
                    <rect x="12" y="46" width="6" height="14" rx="3" fill="currentColor" />
                    <rect x="22" y="46" width="6" height="14" rx="3" fill="currentColor" />
                    <!-- sunglasses -->
                    <rect x="13" y="7" width="6" height="4" rx="2" fill="currentColor" opacity="0.6" />
                    <rect x="21" y="7" width="6" height="4" rx="2" fill="currentColor" opacity="0.6" />
                    <line x1="19" y1="9" x2="21" y2="9" stroke="currentColor" stroke-width="1" opacity="0.4" />
                </svg>
            </div>
            <div class="px-3 py-1.5 rounded-lg bg-black/60 border border-white/[0.08] backdrop-blur-md">
                <span class="text-white/50 text-xs italic">Excelsior!</span>
            </div>
        </div>
    </Transition>
</template>

<script setup lang="ts">
import { useEasterEggs } from '~/composables/useEasterEggs'

const { discoverEasterEgg, isDiscovered } = useEasterEggs()
const visible = ref(false)

onMounted(() => {
    if (Math.random() < 0.05) {
        setTimeout(() => {
            visible.value = true
            discoverEasterEgg('stan-lee-cameo')
            setTimeout(() => { visible.value = false }, 10000)
        }, 3000)
    }
})
</script>

<style scoped>
.cameo-enter-active { transition: opacity 0.6s ease, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
.cameo-leave-active { transition: opacity 1.5s ease, transform 1.5s ease; }
.cameo-enter-from { opacity: 0; transform: translateY(20px); }
.cameo-leave-to { opacity: 0; transform: translateY(-10px); }

.cameo-figure {
    animation: bob 3s ease-in-out infinite;
}

@keyframes bob {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
}
</style>
