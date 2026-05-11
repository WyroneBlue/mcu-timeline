<template>
    <div :class="['group relative overflow-hidden rounded-xl', sizeClasses[size]]">
        <div v-if="!loaded" class="absolute inset-0 skeleton" />
        <img
            v-if="src"
            :src="src"
            :alt="alt"
            :class="[
                'w-full h-full object-cover transition-all duration-500',
                loaded ? 'opacity-100' : 'opacity-0',
                'group-hover:scale-105',
            ]"
            loading="lazy"
            @load="loaded = true"
        />
        <div v-else class="flex items-center justify-center w-full h-full bg-white/5 text-white/20">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
            </svg>
        </div>
        <slot />
    </div>
</template>

<script setup lang="ts">
defineProps<{
    src: string | null
    alt: string
    size?: 'sm' | 'md' | 'lg'
}>()

const loaded = ref(false)

const sizeClasses: Record<string, string> = {
    sm: 'w-20 h-30 min-h-[7.5rem]',
    md: 'w-32 h-48 min-h-[12rem]',
    lg: 'w-48 h-72 min-h-[18rem]',
}
</script>
