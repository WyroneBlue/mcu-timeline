import { computed, readonly, ref } from 'vue'

// Single shared viewport state: one resize listener for the whole app.
// Replaces the scattered `computed(() => window.innerWidth < 640)` checks,
// which never re-evaluated on resize because innerWidth isn't reactive.
const width = ref(1024)
const height = ref(768)
let initialized = false

function init() {
    if (initialized || typeof window === 'undefined') return
    initialized = true
    const update = () => {
        width.value = window.innerWidth
        height.value = window.innerHeight
    }
    update()
    window.addEventListener('resize', update, { passive: true })
    window.addEventListener('orientationchange', update, { passive: true })
}

export function useViewport() {
    init()
    return {
        width: readonly(width),
        height: readonly(height),
        // Breakpoints follow Tailwind: sm 640, md 768, lg 1024
        isMobile: computed(() => width.value < 640),
        isTablet: computed(() => width.value >= 640 && width.value < 1024),
        isDesktop: computed(() => width.value >= 1024),
        smAndUp: computed(() => width.value >= 640),
        mdAndUp: computed(() => width.value >= 768),
        lgAndUp: computed(() => width.value >= 1024),
    }
}
