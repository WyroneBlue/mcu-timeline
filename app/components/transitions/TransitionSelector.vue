<template>
    <div class="relative" ref="containerRef">
        <button
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 bg-white/5 border border-white/5 text-white/40 hover:text-white/60 hover:bg-white/[0.08]"
            @click="open = !open"
        >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span class="hidden sm:inline">{{ currentLabel }}</span>
        </button>

        <Transition name="dropdown">
            <div
                v-if="open"
                class="absolute top-full right-0 mt-2 w-48 p-1.5 rounded-xl bg-black/80 border border-white/[0.08] backdrop-blur-xl z-50 shadow-2xl"
            >
                <button
                    v-for="option in options"
                    :key="option.value"
                    :class="[
                        'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all duration-150',
                        preferredTransition === option.value
                            ? 'bg-white/10 text-white'
                            : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04]',
                    ]"
                    @click="selectTransition(option.value)"
                >
                    <div class="w-2 h-2 rounded-full" :style="{ backgroundColor: option.color }" />
                    {{ option.label }}
                </button>
            </div>
        </Transition>
    </div>
</template>

<script setup lang="ts">
import type { TransitionType } from '~/types/multiverse'
import { useMultiverseTransitions } from '~/composables/useMultiverseTransitions'

const { preferredTransition, setPreferredTransition, playTransition } = useMultiverseTransitions()

const open = ref(false)
const containerRef = ref<HTMLElement>()

const options: { value: TransitionType | 'random'; label: string; color: string }[] = [
    { value: 'portal', label: 'Portal', color: '#F6AD55' },
    { value: 'incursion', label: 'Incursion', color: '#E53E3E' },
    { value: 'space-stone', label: 'Space Stone', color: '#4299E1' },
    { value: 'strange-trip', label: 'Strange Trip', color: '#9F7AEA' },
    { value: 'time-jump', label: 'Time Jump', color: '#48BB78' },
    { value: 'bifrost', label: 'Bifrost', color: '#63B3ED' },
    { value: 'darkhold', label: 'Darkhold', color: '#FC8181' },
    { value: 'random', label: 'Random', color: '#A0AEC0' },
]

const currentLabel = computed(() => {
    return options.find(o => o.value === preferredTransition.value)?.label ?? 'Portal'
})

function selectTransition(value: TransitionType | 'random') {
    setPreferredTransition(value)
    open.value = false
    const type = value === 'random' ? undefined : value
    playTransition(type)
}

function onClickOutside(e: MouseEvent) {
    if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
        open.value = false
    }
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))
</script>

<style scoped>
.dropdown-enter-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.dropdown-leave-active { transition: opacity 0.1s ease, transform 0.1s ease; }
.dropdown-enter-from { opacity: 0; transform: translateY(-4px) scale(0.95); }
.dropdown-leave-to { opacity: 0; transform: translateY(-4px) scale(0.95); }
</style>
