<template>
    <div class="space-y-2">
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
                <span class="font-mono text-sm text-white/60">Lvl</span>
                <span class="font-display text-2xl text-white">{{ level }}</span>
                <span class="text-sm font-medium text-white/40">{{ levelName }}</span>
            </div>
            <span class="font-mono text-sm text-white/40">{{ xp }} XP</span>
        </div>
        <div class="relative h-2 rounded-full bg-white/5 overflow-hidden">
            <div
                class="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
                :style="{
                    width: progressPercent + '%',
                    background: `linear-gradient(90deg, var(--phase-current-primary), var(--phase-current-accent))`,
                }"
            />
        </div>
        <div class="flex justify-between text-xs text-white/30 font-mono">
            <span>{{ progressXP.current }} / {{ progressXP.needed }}</span>
            <span>{{ progressPercent }}%</span>
        </div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    xp: number
    level: number
    levelName: string
}>()

const { getXPForNextLevel } = useXP()

const progressXP = computed(() => getXPForNextLevel(props.xp))
const progressPercent = computed(() => progressXP.value.progress)
</script>
