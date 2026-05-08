import { defineStore } from 'pinia'

type ExperienceMode = 'simple' | 'in_depth' | 'extreme'

export const useOnboardingStore = defineStore('onboarding', {
    state: () => ({
        mode: (process.env.NUXT_PUBLIC_DEFAULT_MODE as ExperienceMode) || 'simple' as ExperienceMode
    }),
    actions: {
        setMode(newMode: ExperienceMode) {
            this.mode = newMode
            if (import.meta.client) {
                localStorage.setItem('experience_mode', newMode)
            }
        },
        restore() {
            if (import.meta.client) {
                const saved = localStorage.getItem('experience_mode') as ExperienceMode | null
                if (saved) this.mode = saved
            }
        }
    }
})

