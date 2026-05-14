<template>
    <div class="space-y-6">
        <!-- Scroll & Navigation -->
        <section class="glass-card p-5">
            <h3 class="text-sm font-display tracking-wider text-white/70 uppercase mb-4">{{ $t('settings.navigation') }}</h3>
            <div class="space-y-4">
                <!-- Scroll behavior -->
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-white/80">{{ $t('settings.scrollBehavior') }}</p>
                        <p class="text-xs text-white/30">{{ settings.scrollBehavior === 'snap' ? $t('settings.scrollSnap') : $t('settings.scrollFree') }}</p>
                    </div>
                    <div class="flex items-center gap-1 p-0.5 rounded-lg bg-white/5 border border-white/5">
                        <button
                            :class="['px-3 py-1 rounded-md text-xs transition-all', settings.scrollBehavior === 'snap' ? 'bg-white/10 text-white' : 'text-white/40']"
                            @click="setSetting('scrollBehavior', 'snap')"
                        >{{ $t('settings.snap') }}</button>
                        <button
                            :class="['px-3 py-1 rounded-md text-xs transition-all', settings.scrollBehavior === 'free' ? 'bg-white/10 text-white' : 'text-white/40']"
                            @click="setSetting('scrollBehavior', 'free')"
                        >{{ $t('settings.free') }}</button>
                    </div>
                </div>

                <!-- Scroll to next toggle -->
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-white/80">{{ $t('settings.navButtons') }}</p>
                        <p class="text-xs text-white/30">{{ $t('settings.navButtonsDesc') }}</p>
                    </div>
                    <button
                        :class="['w-11 h-6 rounded-full transition-all duration-200 relative', settings.scrollToNextEnabled ? '' : 'bg-white/10']"
                        :style="toggleBg(settings.scrollToNextEnabled)"
                        @click="setSetting('scrollToNextEnabled', !settings.scrollToNextEnabled)"
                    >
                        <span :class="['absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-200', settings.scrollToNextEnabled ? 'left-5.5' : 'left-0.5']" />
                    </button>
                </div>

                <!-- Card size -->
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-white/80">{{ $t('settings.cardSize') }}</p>
                        <p class="text-xs text-white/30">{{ $t('settings.cardSizeDesc') }}</p>
                    </div>
                    <div class="flex items-center gap-1 p-0.5 rounded-lg bg-white/5 border border-white/5">
                        <button
                            v-for="size in ['small', 'medium', 'large'] as const"
                            :key="size"
                            :class="['px-2.5 py-1 rounded-md text-xs transition-all capitalize', settings.cardSize === size ? 'bg-white/10 text-white' : 'text-white/40']"
                            @click="setSetting('cardSize', size)"
                        >{{ size === 'small' ? $t('settings.small') : size === 'medium' ? $t('settings.medium') : $t('settings.large') }}</button>
                    </div>
                </div>

                <!-- Phase labels -->
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-white/80">{{ $t('settings.phaseLabels') }}</p>
                        <p class="text-xs text-white/30">{{ $t('settings.phaseLabelsDesc') }}</p>
                    </div>
                    <button
                        :class="['w-11 h-6 rounded-full transition-all duration-200 relative', settings.showPhaseLabels ? '' : 'bg-white/10']"
                        :style="toggleBg(settings.showPhaseLabels)"
                        @click="setSetting('showPhaseLabels', !settings.showPhaseLabels)"
                    >
                        <span :class="['absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-200', settings.showPhaseLabels ? 'left-5.5' : 'left-0.5']" />
                    </button>
                </div>
            </div>
        </section>

        <!-- Theme -->
        <section class="glass-card p-5">
            <h3 class="text-sm font-display tracking-wider text-white/70 uppercase mb-4">{{ $t('settings.theme') }}</h3>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                    v-for="(config, key) in themes"
                    :key="key"
                    :class="[
                        'relative p-3 rounded-xl border text-left transition-all duration-200',
                        settings.theme === key
                            ? 'border-white/20 bg-white/[0.06]'
                            : 'border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.08]'
                    ]"
                    @click="setSetting('theme', key as AppTheme)"
                >
                    <div class="flex items-center gap-2 mb-1.5">
                        <div
                            class="w-3 h-3 rounded-full"
                            :style="{ backgroundColor: config.accentColor, boxShadow: settings.theme === key ? `0 0 8px ${config.accentColor}` : 'none' }"
                        />
                        <span class="text-xs font-medium text-white/80">{{ config.label }}</span>
                    </div>
                    <p class="text-[10px] text-white/30 leading-tight">{{ $t(config.descriptionKey) }}</p>
                    <div
                        v-if="settings.theme === key"
                        class="absolute top-2 right-2 w-4 h-4 rounded-full bg-white/10 flex items-center justify-center"
                    >
                        <svg class="w-2.5 h-2.5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </button>
            </div>
        </section>

        <!-- Favorite Character -->
        <section class="glass-card p-5">
            <h3 class="text-sm font-display tracking-wider text-white/70 uppercase mb-2">{{ $t('settings.favoriteCharacter') }}</h3>
            <p class="text-xs text-white/25 mb-4">{{ $t('settings.favoriteCharacterDesc') }}</p>

            <div v-if="favoriteChar" class="flex items-center justify-between p-3 rounded-xl bg-white/[0.04] border border-white/[0.06] mb-3">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center" :style="{ background: `linear-gradient(135deg, ${currentTheme.accentColor}33, ${currentTheme.accentColor}0D)`, borderColor: currentTheme.accentColor + '33', borderWidth: '1px', borderStyle: 'solid' }">
                        <span class="text-xs font-display" :style="{ color: currentTheme.accentColor + 'CC' }">{{ favoriteChar.name.charAt(0) }}</span>
                    </div>
                    <span class="text-sm text-white/80">{{ favoriteChar.name }}</span>
                </div>
                <button
                    class="text-xs text-white/30 hover:text-red-400/80 transition-colors"
                    @click="setSetting('favoriteCharacter', null)"
                >{{ $t('common.remove') }}</button>
            </div>

            <div class="flex flex-wrap gap-1.5">
                <button
                    v-for="char in characters"
                    :key="char.slug"
                    :class="[
                        'px-3 py-1.5 rounded-full text-xs transition-all duration-200 border',
                        settings.favoriteCharacter === char.slug
                            ? 'border-transparent'
                            : 'bg-white/[0.03] text-white/40 border-white/[0.04] hover:text-white/60 hover:bg-white/[0.06]'
                    ]"
                    :style="settings.favoriteCharacter === char.slug ? { backgroundColor: currentTheme.accentColor + '26', color: currentTheme.accentColor + 'E6', borderColor: currentTheme.accentColor + '33' } : {}"
                    @click="setSetting('favoriteCharacter', settings.favoriteCharacter === char.slug ? null : char.slug)"
                >
                    {{ char.name }}
                </button>
            </div>
        </section>

        <!-- Visual Effects -->
        <section class="glass-card p-5">
            <h3 class="text-sm font-display tracking-wider text-white/70 uppercase mb-4">{{ $t('settings.visualEffects') }}</h3>
            <div class="space-y-4">
                <!-- Particle density -->
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-white/80">{{ $t('settings.particleDensity') }}</p>
                        <p class="text-xs text-white/30">{{ $t('settings.particleDensityDesc') }}</p>
                    </div>
                    <div class="flex items-center gap-1 p-0.5 rounded-lg bg-white/5 border border-white/5">
                        <button
                            v-for="density in ['low', 'medium', 'high'] as const"
                            :key="density"
                            :class="['px-2.5 py-1 rounded-md text-xs transition-all', settings.particleDensity === density ? 'bg-white/10 text-white' : 'text-white/40']"
                            @click="setSetting('particleDensity', density)"
                        >{{ density === 'low' ? $t('settings.low') : density === 'medium' ? $t('settings.medium') : $t('settings.high') }}</button>
                    </div>
                </div>

                <!-- Reduced motion -->
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-white/80">{{ $t('settings.reducedMotion') }}</p>
                        <p class="text-xs text-white/30">{{ $t('settings.reducedMotionDesc') }}</p>
                    </div>
                    <button
                        :class="['w-11 h-6 rounded-full transition-all duration-200 relative', settings.reducedMotion ? '' : 'bg-white/10']"
                        :style="toggleBg(settings.reducedMotion)"
                        @click="setSetting('reducedMotion', !settings.reducedMotion)"
                    >
                        <span :class="['absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-200', settings.reducedMotion ? 'left-5.5' : 'left-0.5']" />
                    </button>
                </div>

                <!-- Autoplay trailers -->
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-white/80">{{ $t('settings.autoplayTrailers') }}</p>
                        <p class="text-xs text-white/30">{{ $t('settings.autoplayTrailersDesc') }}</p>
                    </div>
                    <div class="flex items-center gap-1 p-0.5 rounded-lg bg-white/5 border border-white/5">
                        <button
                            v-for="opt in [{ v: 'off', l: $t('settings.off') }, { v: 'wifi', l: $t('settings.wifi') }, { v: 'always', l: $t('settings.always') }]"
                            :key="opt.v"
                            :class="['px-2.5 py-1 rounded-md text-xs transition-all', settings.autoplayTrailers === opt.v ? 'bg-white/10 text-white' : 'text-white/40']"
                            @click="setSetting('autoplayTrailers', opt.v as AutoplayTrailers)"
                        >{{ opt.l }}</button>
                    </div>
                </div>

                <!-- Easter eggs -->
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-white/80">{{ $t('settings.easterEggs') }}</p>
                        <p class="text-xs text-white/30">{{ $t('settings.easterEggsDesc') }}</p>
                    </div>
                    <button
                        :class="['w-11 h-6 rounded-full transition-all duration-200 relative', settings.showEasterEggs ? '' : 'bg-white/10']"
                        :style="toggleBg(settings.showEasterEggs)"
                        @click="setSetting('showEasterEggs', !settings.showEasterEggs)"
                    >
                        <span :class="['absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-200', settings.showEasterEggs ? 'left-5.5' : 'left-0.5']" />
                    </button>
                </div>

            </div>
        </section>

        <!-- Language -->
        <section class="glass-card p-5">
            <h3 class="text-sm font-display tracking-wider text-white/70 uppercase mb-4">{{ $t('settings.language') }}</h3>
            <div class="flex flex-wrap items-center gap-1 p-0.5 rounded-lg bg-white/5 border border-white/5">
                <button
                    v-for="loc in availableLocales"
                    :key="loc.code"
                    :class="['px-3 py-1.5 rounded-md text-xs transition-all', settings.language === loc.code ? 'bg-white/10 text-white' : 'text-white/40']"
                    @click="switchLanguage(loc.code)"
                >{{ loc.name }}</button>
            </div>
        </section>

        <!-- Reset -->
        <div class="flex justify-center pt-2 pb-4">
            <button
                class="text-xs text-white/20 hover:text-red-400/60 transition-colors"
                @click="resetSettings"
            >
                {{ $t('settings.resetAll') }}
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { AppLocale, AppTheme, AutoplayTrailers } from '~/composables/useSettings'

const { locale, locales } = useI18n()
const { settings, themes, characters, currentTheme, setSetting, resetSettings, getFavoriteCharacter } = useSettings()

function toggleBg(active: boolean) {
    return active ? { backgroundColor: currentTheme.value.accentColor + '80' } : {}
}

const favoriteChar = computed(() => getFavoriteCharacter())

const availableLocales = computed(() => {
    return (locales.value as { code: string; name: string }[])
})

function switchLanguage(code: string) {
    setSetting('language', code as AppLocale)
    locale.value = code
}
</script>
