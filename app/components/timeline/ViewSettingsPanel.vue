<template>
    <div>
        <!-- Layout section -->
        <template v-if="layoutOptions?.length">
            <button
                class="w-full flex items-center justify-between px-3 py-2.5 text-[11px] font-medium tracking-wider uppercase text-white/40 hover:text-white/60 transition-colors"
                @click="sectionOpen.layout = !sectionOpen.layout"
            >
                <span>{{ $t('viewSettings.layout') }}</span>
                <svg class="w-3 h-3 transition-transform duration-200" :class="sectionOpen.layout ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            <Transition name="vs-section">
                <div v-if="sectionOpen.layout" class="px-2 pb-2">
                    <div class="grid grid-cols-5 gap-1">
                        <button
                            v-for="l in layoutOptions"
                            :key="l.value"
                            :class="[
                                'w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200',
                                layout === l.value
                                    ? 'bg-white/10 text-white/90 shadow-sm ring-1 ring-white/10'
                                    : 'text-white/30 hover:text-white/60 hover:bg-white/[0.04]'
                            ]"
                            :title="l.label"
                            @click="$emit('update:layout', l.value)"
                        >
                            <TimelineLayoutIcon :layout="l.value" />
                        </button>
                    </div>
                    <div class="mt-1.5 px-1 text-[10px] text-white/25 truncate">{{ layoutOptions.find(l => l.value === layout)?.label }}</div>
                </div>
            </Transition>

            <div class="h-px bg-white/[0.04] mx-2" />
        </template>

        <!-- Navigation section -->
        <button
            class="w-full flex items-center justify-between px-3 py-2.5 text-[11px] font-medium tracking-wider uppercase text-white/40 hover:text-white/60 transition-colors"
            @click="sectionOpen.navigation = !sectionOpen.navigation"
        >
            <span>{{ $t('viewSettings.navigation') }}</span>
            <svg class="w-3 h-3 transition-transform duration-200" :class="sectionOpen.navigation ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
        </button>
        <Transition name="vs-section">
            <div v-if="sectionOpen.navigation" class="px-3 pb-3 flex flex-col gap-2.5">
                <div v-if="showScroll">
                    <div class="text-[10px] text-white/30 mb-1.5">{{ $t('viewSettings.scroll') }}</div>
                    <UiSegmentedControl
                        :model-value="settings.scrollBehavior"
                        :options="[
                            { value: 'snap', label: $t('settings.snap') },
                            { value: 'free', label: $t('settings.free') },
                        ]"
                        @update:model-value="settings.scrollBehavior = $event as 'snap' | 'free'"
                    />
                </div>
                <label v-if="showPrevNext" class="flex items-center justify-between cursor-pointer group">
                    <span class="text-[10px] text-white/30 group-hover:text-white/50 transition-colors">{{ $t('viewSettings.prevNext') }}</span>
                    <UiToggleSwitch v-model="settings.scrollToNextEnabled" />
                </label>
                <label class="flex items-center justify-between cursor-pointer group">
                    <span class="text-[10px] text-white/30 group-hover:text-white/50 transition-colors">{{ $t('viewSettings.cameraAutoReset') }}</span>
                    <UiToggleSwitch v-model="settings.cameraAutoReset" />
                </label>
                <label class="flex items-center justify-between cursor-pointer group">
                    <span class="text-[10px] text-white/30 group-hover:text-white/50 transition-colors">{{ $t('viewSettings.invertGlobeDrag') }}</span>
                    <UiToggleSwitch v-model="settings.invertGlobeDrag" />
                </label>
            </div>
        </Transition>

        <div class="h-px bg-white/[0.04] mx-2" />

        <!-- Visuals section -->
        <button
            class="w-full flex items-center justify-between px-3 py-2.5 text-[11px] font-medium tracking-wider uppercase text-white/40 hover:text-white/60 transition-colors"
            @click="sectionOpen.visuals = !sectionOpen.visuals"
        >
            <span>{{ $t('viewSettings.visuals') }}</span>
            <svg class="w-3 h-3 transition-transform duration-200" :class="sectionOpen.visuals ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
        </button>
        <Transition name="vs-section">
            <div v-if="sectionOpen.visuals" class="px-3 pb-3 flex flex-col gap-2.5">
                <div>
                    <div class="text-[10px] text-white/30 mb-1.5">{{ $t('viewSettings.particles') }}</div>
                    <UiSegmentedControl
                        :model-value="settings.particleDensity"
                        :options="[
                            { value: 'low', label: $t('settings.low') },
                            { value: 'medium', label: $t('settings.medium') },
                            { value: 'high', label: $t('settings.high') },
                        ]"
                        @update:model-value="settings.particleDensity = $event as 'low' | 'medium' | 'high'"
                    />
                </div>
                <label class="flex items-center justify-between cursor-pointer group">
                    <span class="text-[10px] text-white/30 group-hover:text-white/50 transition-colors">{{ $t('viewSettings.layoutDrift') }}</span>
                    <UiToggleSwitch v-model="settings.layoutDrift" />
                </label>
                <label class="flex items-center justify-between cursor-pointer group">
                    <span class="text-[10px] text-white/30 group-hover:text-white/50 transition-colors">{{ $t('settings.reducedMotion') }}</span>
                    <UiToggleSwitch v-model="settings.reducedMotion" />
                </label>
                <label class="flex items-center justify-between cursor-pointer group">
                    <span class="text-[10px] text-white/30 group-hover:text-white/50 transition-colors">{{ $t('settings.easterEggs') }}</span>
                    <UiToggleSwitch v-model="settings.showEasterEggs" />
                </label>
            </div>
        </Transition>
    </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
    layout?: string
    layoutOptions?: { value: string; label: string }[]
    showScroll?: boolean
    showPrevNext?: boolean
}>(), { layout: undefined, layoutOptions: undefined, showScroll: false, showPrevNext: false })

defineEmits<{
    'update:layout': [value: string]
}>()

const { settings } = useSettings()

const sectionOpen = reactive({ layout: true, navigation: false, visuals: false })
</script>

<style scoped>
.vs-section-enter-active {
    transition: max-height 0.25s ease, opacity 0.2s ease;
    max-height: 300px;
    overflow: hidden;
}
.vs-section-leave-active {
    transition: max-height 0.2s ease, opacity 0.15s ease;
    max-height: 300px;
    overflow: hidden;
}
.vs-section-enter-from,
.vs-section-leave-to {
    max-height: 0;
    opacity: 0;
}
</style>
