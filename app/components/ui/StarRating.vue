<template>
    <!-- Readonly: filled stars by average + "avg (count)" -->
    <div v-if="props.readonly" class="flex items-center gap-2">
        <div class="flex items-center gap-0.5">
            <svg
                v-for="star in 5"
                :key="star"
                :class="[starSize, star <= Math.round(avg || 0) ? 'text-amber-400' : 'text-white/15']"
                :fill="star <= Math.round(avg || 0) ? 'currentColor' : 'none'"
                stroke="currentColor"
                stroke-width="1.5"
                viewBox="0 0 24 24"
            >
                <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.5c.16-.4.88-.4 1.04 0l2.13 5.11 5.52.44c.44.04.62.58.29.86l-4.2 3.6 1.28 5.38c.1.43-.36.76-.74.53L12 16.55l-4.8 2.87c-.38.23-.84-.1-.74-.53l1.28-5.38-4.2-3.6c-.33-.28-.15-.82.29-.86l5.52-.44 2.13-5.1z" />
            </svg>
        </div>
        <span v-if="avg != null" class="text-xs text-white/40 font-mono">
            {{ avg.toFixed(1) }}<template v-if="count != null"> ({{ count }})</template>
        </span>
    </div>

    <!-- Interactive: 5-star radiogroup with hover preview -->
    <div
        v-else
        role="radiogroup"
        :aria-label="$t('ratings.rateThis')"
        class="flex items-center gap-0.5"
        @keydown.left.prevent="nudge(-1)"
        @keydown.down.prevent="nudge(-1)"
        @keydown.right.prevent="nudge(1)"
        @keydown.up.prevent="nudge(1)"
        @mouseleave="hovered = null"
    >
        <button
            v-for="star in 5"
            :key="star"
            type="button"
            role="radio"
            :aria-checked="modelValue === star"
            :aria-label="`${star}/5`"
            :tabindex="star === (modelValue || 1) ? 0 : -1"
            class="rounded-lg p-0.5 transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-1 focus-visible:outline-amber-400/60"
            @mouseenter="hovered = star"
            @focus="hovered = star"
            @blur="hovered = null"
            @click="select(star)"
        >
            <svg
                :class="[starSize, 'transition-colors', star <= displayValue ? 'text-amber-400' : 'text-white/20 hover:text-white/40']"
                :fill="star <= displayValue ? 'currentColor' : 'none'"
                stroke="currentColor"
                stroke-width="1.5"
                viewBox="0 0 24 24"
            >
                <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.5c.16-.4.88-.4 1.04 0l2.13 5.11 5.52.44c.44.04.62.58.29.86l-4.2 3.6 1.28 5.38c.1.43-.36.76-.74.53L12 16.55l-4.8 2.87c-.38.23-.84-.1-.74-.53l1.28-5.38-4.2-3.6c-.33-.28-.15-.82.29-.86l5.52-.44 2.13-5.1z" />
            </svg>
        </button>
    </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
    modelValue: number | null
    avg?: number | null
    count?: number | null
    readonly?: boolean
    size?: 'sm' | 'md'
}>(), {
    avg: null,
    count: null,
    readonly: false,
    size: 'md',
})

const emit = defineEmits<{
    'update:modelValue': [value: number]
    clear: []
}>()

const hovered = ref<number | null>(null)

const starSize = computed(() => props.size === 'sm' ? 'w-4 h-4' : 'w-6 h-6')

const displayValue = computed(() => hovered.value ?? props.modelValue ?? 0)

function select(star: number) {
    if (props.modelValue === star) {
        emit('clear')
    } else {
        emit('update:modelValue', star)
    }
}

function nudge(delta: number) {
    const next = Math.min(5, Math.max(1, (props.modelValue || 0) + delta))
    if (next !== props.modelValue) emit('update:modelValue', next)
}
</script>
