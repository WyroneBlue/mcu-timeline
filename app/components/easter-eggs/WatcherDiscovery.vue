<template>
    <Teleport to="body">
        <Transition name="watcher-reveal">
            <div v-if="show" class="fixed inset-0 z-[9998] pointer-events-none flex items-center justify-center">
                <div class="watcher-vignette absolute inset-0" />
                <div class="relative text-center px-8 max-w-md">
                    <div class="watcher-eye text-5xl mb-5">👁️</div>
                    <p class="font-display text-xl sm:text-2xl text-blue-100/90 tracking-wide leading-relaxed mb-3">
                        “{{ $t('easterEggs.watcherQuote') }}”
                    </p>
                    <p class="text-xs uppercase tracking-[0.25em] text-white/40">
                        {{ $t('easterEggs.discovered') }} · {{ $t('easterEggs.watcherName') }}
                    </p>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
defineProps<{
    show: boolean
}>()
</script>

<style scoped>
.watcher-vignette {
    background: radial-gradient(ellipse at center, rgba(30, 50, 120, 0.35) 0%, rgba(5, 8, 25, 0.75) 70%, rgba(0, 0, 0, 0.85) 100%);
}

.watcher-eye {
    animation: watcher-blink 3.2s ease-in-out infinite;
}

@keyframes watcher-blink {
    0%, 42%, 50%, 100% { transform: scaleY(1); }
    46% { transform: scaleY(0.08); }
}

@media (prefers-reduced-motion: reduce) {
    .watcher-eye {
        animation: none;
    }
}

.watcher-reveal-enter-active {
    transition: opacity 0.6s ease;
}
.watcher-reveal-leave-active {
    transition: opacity 0.8s ease;
}
.watcher-reveal-enter-from,
.watcher-reveal-leave-to {
    opacity: 0;
}
</style>
