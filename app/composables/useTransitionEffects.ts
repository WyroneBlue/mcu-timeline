// MCU-themed transition effects, played by transitions/TransitionOverlay.vue
// (mounted once in the default layout). Each effect is < 1.2s, skippable via
// tap/Escape and collapses to an instant swap under reduced motion.

export type TransitionType = 'bifrost' | 'snap-dissolve' | 'portal'

export interface TransitionRequest {
    id: number
    type: TransitionType
    origin?: { x: number; y: number }
    elements?: HTMLElement[]
}

const activeTransition = ref<TransitionRequest | null>(null)

let requestCounter = 0
let midpointFn: (() => void) | null = null
let midpointFired = false
let resolveFn: (() => void) | null = null

function prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') return true
    const { settings } = useSettings()
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches || settings.reducedMotion
}

export function useTransitionEffects() {
    // Resolves when the effect finishes; opts.midpoint fires at the visual
    // peak — that's where the caller swaps views or navigates.
    function playTransition(
        type: TransitionType,
        opts: { origin?: { x: number; y: number }; elements?: HTMLElement[]; midpoint?: () => void } = {},
    ): Promise<void> {
        if (prefersReducedMotion() || activeTransition.value) {
            opts.midpoint?.()
            return Promise.resolve()
        }
        return new Promise((resolve) => {
            midpointFn = opts.midpoint ?? null
            midpointFired = false
            resolveFn = resolve
            activeTransition.value = {
                id: ++requestCounter,
                type,
                origin: opts.origin,
                elements: opts.elements,
            }
        })
    }

    // Called by the overlay component
    function fireMidpoint() {
        if (midpointFired) return
        midpointFired = true
        midpointFn?.()
        midpointFn = null
    }

    function finishTransition() {
        fireMidpoint()
        activeTransition.value = null
        resolveFn?.()
        resolveFn = null
    }

    return {
        activeTransition: readonly(activeTransition),
        playTransition,
        fireMidpoint,
        finishTransition,
    }
}
