<template>
  <div v-if="skippedData.length > 0" class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="font-display text-xl tracking-wider text-white flex items-center gap-2">
        <svg class="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
        {{ $t('beforeYouWatch.title') }}
      </h3>
    </div>

    <p class="text-white/30 text-xs">
      {{ $t('beforeYouWatch.skippedCount', { count: skippedData.length }) }}
    </p>

    <!-- Mode toggle -->
    <div class="flex gap-2">
      <button
        :class="[
          'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
          mode === 'per-title'
            ? 'bg-white/10 text-white border border-white/20'
            : 'text-white/40 hover:text-white/60 border border-transparent'
        ]"
        @click="handleSwitchMode('per-title')"
      >
        {{ $t('beforeYouWatch.perTitle') }}
      </button>
      <button
        :class="[
          'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
          mode === 'flowing-story'
            ? 'bg-white/10 text-white border border-white/20'
            : 'text-white/40 hover:text-white/60 border border-transparent'
        ]"
        @click="handleSwitchMode('flowing-story')"
      >
        {{ $t('beforeYouWatch.flowingStory') }}
      </button>
    </div>

    <!-- Generate button (initial state) -->
    <button
      v-if="!hasGenerated && !loading"
      class="w-full glass-card p-4 flex items-center justify-center gap-2 text-sm text-white/50 hover:text-white/70 hover:bg-white/5 transition-all group"
      @click="handleGenerate"
    >
      <svg class="w-4 h-4 group-hover:text-amber-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
      </svg>
      {{ $t('beforeYouWatch.generateSummary') }}
    </button>

    <!-- Loading state -->
    <div v-if="loading" class="glass-card p-8 flex flex-col items-center justify-center gap-3">
      <div class="w-5 h-5 border-2 border-white/20 border-t-amber-400/60 rounded-full animate-spin" />
      <p class="text-sm text-white/40">{{ $t('beforeYouWatch.generating') }}</p>
    </div>

    <!-- Error state -->
    <div v-if="error" class="glass-card p-4 border-l-3 border-l-red-500/50">
      <p class="text-sm text-red-400/70">{{ error }}</p>
    </div>

    <!-- Per-title results -->
    <template v-if="hasGenerated && !loading && mode === 'per-title'">
      <div
        v-for="item in perTitleSummaries"
        :key="item.title"
        class="glass-card p-5 space-y-2"
      >
        <div class="flex items-center justify-between">
          <span class="font-display text-lg tracking-wider text-white/80">
            {{ item.title }}
          </span>
          <span class="text-[10px] uppercase tracking-wider text-white/20 bg-white/5 px-2 py-0.5 rounded-full">
            {{ $t('beforeYouWatch.skippedLabel') }}
          </span>
        </div>
        <p class="text-sm text-white/50 leading-relaxed">{{ item.summary }}</p>
      </div>
    </template>

    <!-- Flowing story result -->
    <div v-if="hasGenerated && !loading && mode === 'flowing-story' && flowingStory" class="glass-card p-6 space-y-3">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-[10px] uppercase tracking-wider text-amber-400/60">{{ $t('beforeYouWatch.storySoFar') }}</span>
      </div>
      <p class="text-sm text-white/60 leading-relaxed whitespace-pre-line">{{ flowingStory }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  currentSlug: string
  skippedSlugs: Set<string>
}>()

const {
  mode,
  loading,
  error,
  perTitleSummaries,
  flowingStory,
  hasGenerated,
  getSkippedData,
  generate,
  switchMode,
} = useBeforeYouWatch()

const skippedData = computed(() => getSkippedData(props.currentSlug, props.skippedSlugs))

async function handleGenerate() {
  await generate(props.currentSlug, props.skippedSlugs)
}

async function handleSwitchMode(newMode: 'per-title' | 'flowing-story') {
  if (newMode === mode.value) return
  await switchMode(newMode, props.currentSlug, props.skippedSlugs)
}
</script>
