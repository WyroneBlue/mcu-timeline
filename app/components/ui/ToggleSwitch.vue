<template>
    <button
        type="button"
        role="switch"
        :aria-checked="modelValue"
        :class="[
            'relative rounded-full transition-colors duration-200 shrink-0',
            size === 'md' ? 'w-11 h-6' : 'w-7 h-4',
            modelValue ? 'bg-white/20' : 'bg-white/[0.06]',
        ]"
        @click="$emit('update:modelValue', !modelValue)"
    >
        <span
            :class="[
                'absolute top-0.5 rounded-full transition-all duration-200',
                size === 'md' ? 'w-5 h-5' : 'w-3 h-3',
                modelValue
                    ? (size === 'md' ? 'left-[1.375rem] bg-white/80' : 'left-3.5 bg-white/80')
                    : 'left-0.5 bg-white/30',
            ]"
        />
    </button>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
    modelValue: boolean
    size?: 'sm' | 'md'
}>(), { size: 'sm' })

defineEmits<{
    'update:modelValue': [value: boolean]
}>()
</script>
