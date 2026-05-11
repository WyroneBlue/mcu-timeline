<template>
    <div class="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
        <div class="absolute inset-0 bg-black/60" @click="$emit('close')" />
        <div class="relative w-full max-w-lg rounded-xl bg-gray-900 border border-gray-700 shadow-2xl max-h-[80vh] flex flex-col">
            <div class="flex items-center justify-between p-5 border-b border-gray-800">
                <h2 class="text-lg font-bold">{{ title }}</h2>
                <button @click="$emit('close')" class="text-gray-400 hover:text-white text-xl leading-none">&times;</button>
            </div>
            <div class="p-5 overflow-y-auto">
                <slot />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{ title: string }>()
defineEmits<{ close: [] }>()

onMounted(() => document.body.style.overflow = 'hidden')
onUnmounted(() => document.body.style.overflow = '')
</script>
