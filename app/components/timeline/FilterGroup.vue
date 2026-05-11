<template>
    <div>
        <div class="text-xs text-white/30 mb-2 uppercase tracking-wider">{{ label }}</div>

        <!-- Search input for long lists -->
        <input
            v-if="searchable && normalizedOptions.length > 10"
            v-model="search"
            type="text"
            :placeholder="`Search ${label.toLowerCase()}...`"
            class="w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/5 text-xs text-white/60 placeholder-white/20 outline-none focus:border-white/15 mb-2"
        />

        <div class="flex flex-wrap gap-1 max-h-40 overflow-y-auto pr-1">
            <button
                v-for="option in visibleOptions"
                :key="option.value"
                :class="[
                    'px-2 py-1 rounded-md text-[11px] transition-all duration-150 border',
                    selected.has(option.value)
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                        : 'bg-white/5 text-white/40 border-transparent hover:text-white/60 hover:bg-white/8',
                ]"
                @click="$emit('toggle', option.value)"
            >
                {{ option.label }}
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    label: string
    options: (string | { value: string; label: string })[]
    selected: Set<string>
    searchable?: boolean
}>()

defineEmits<{
    toggle: [value: string]
}>()

const search = ref('')

const normalizedOptions = computed(() => {
    return props.options.map(opt =>
        typeof opt === 'string' ? { value: opt, label: opt } : opt
    )
})

const visibleOptions = computed(() => {
    if (!search.value) return normalizedOptions.value
    const q = search.value.toLowerCase()
    return normalizedOptions.value.filter(opt => opt.label.toLowerCase().includes(q))
})
</script>
