<template>
    <div class="flex gap-1">
        <button
            v-for="opt in options"
            :key="opt.value"
            type="button"
            :class="[
                'flex-1 px-2 py-1.5 rounded-md text-[10px] font-medium transition-all duration-200 whitespace-nowrap',
                modelValue === opt.value
                    ? 'bg-white/10 text-white/80'
                    : 'text-white/30 hover:text-white/50 hover:bg-white/[0.03]',
            ]"
            @click="$emit('update:modelValue', opt.value)"
        >
            {{ opt.label }}
        </button>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    modelValue: string
    options: { value: string; label: string }[]
}>()

defineEmits<{
    'update:modelValue': [value: string]
}>()
</script>
