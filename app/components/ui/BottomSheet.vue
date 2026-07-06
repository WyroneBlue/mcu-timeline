<template>
    <Teleport to="body">
        <Transition name="sheet-fade">
            <div v-if="open" class="fixed inset-0 z-[90]" @click="close">
                <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            </div>
        </Transition>
        <Transition name="sheet-slide">
            <div
                v-if="open"
                class="fixed inset-x-0 bottom-0 z-[91] rounded-t-2xl bg-[#0c0c0f]/95 border-t border-white/10 backdrop-blur-2xl pb-[max(1.25rem,env(safe-area-inset-bottom))]"
            >
                <div class="flex justify-center pt-3 pb-1">
                    <div class="w-9 h-1 rounded-full bg-white/15" />
                </div>

                <div class="px-5 pt-2 max-h-[75vh] overflow-y-auto">
                    <div class="flex items-center justify-between mb-4">
                        <span class="text-sm font-medium text-white/80">{{ title }}</span>
                        <button
                            class="w-7 h-7 -mr-1.5 rounded-full flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors"
                            :aria-label="$t('common.close')"
                            @click="close"
                        >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <slot />
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{
    open: boolean
    title?: string
}>()

const emit = defineEmits<{
    'update:open': [value: boolean]
}>()

function close() {
    emit('update:open', false)
}

// Lock body scroll while the sheet is open
watch(() => props.open, (open) => {
    if (typeof document === 'undefined') return
    document.body.style.overflow = open ? 'hidden' : ''
})
onUnmounted(() => {
    if (typeof document !== 'undefined') document.body.style.overflow = ''
})
</script>

<style scoped>
.sheet-fade-enter-active,
.sheet-fade-leave-active {
    transition: opacity 0.25s ease;
}
.sheet-fade-enter-from,
.sheet-fade-leave-to {
    opacity: 0;
}

.sheet-slide-enter-active {
    transition: transform 0.32s cubic-bezier(0.16, 1, 0.3, 1);
}
.sheet-slide-leave-active {
    transition: transform 0.28s cubic-bezier(0.4, 0, 1, 1);
}
.sheet-slide-enter-from,
.sheet-slide-leave-to {
    transform: translateY(100%);
}
</style>
