<template>
    <div class="relative">
        <div :class="[!revealed && 'spoiler-blur']">
            <slot />
        </div>
        <div
            v-if="!revealed"
            class="absolute inset-0 flex items-center justify-center cursor-pointer rounded-lg"
            @click="onReveal"
        >
            <span class="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-sm text-white/70 border border-white/10 hover:bg-white/15 transition-colors">
                {{ revealLabel }}
            </span>
        </div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    titleId: number
    watchedIds: Set<number>
    revealLabel?: string
}>()

const emit = defineEmits<{
    reveal: []
}>()

const { canReveal } = useSpoilerGuard()

const manuallyRevealed = ref(false)

const revealed = computed(() =>
    manuallyRevealed.value || canReveal(props.titleId, props.watchedIds)
)

function onReveal() {
    manuallyRevealed.value = true
    emit('reveal')
}
</script>
