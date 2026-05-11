import type { TransitionType } from '~/types/multiverse'

const activeTransition = ref<TransitionType | null>(null)
const transitionProgress = ref(0)
const preferredTransition = ref<TransitionType | 'random'>(
    (typeof localStorage !== 'undefined' && localStorage.getItem('lorely:transition') as TransitionType) || 'portal'
)

const allTransitions: TransitionType[] = ['portal', 'incursion', 'space-stone', 'strange-trip', 'time-jump', 'bifrost', 'darkhold']

let animationFrame: number | null = null

function getTransitionType(): TransitionType {
    if (preferredTransition.value === 'random') {
        return allTransitions[Math.floor(Math.random() * allTransitions.length)]
    }
    return preferredTransition.value as TransitionType
}

async function playTransition(type?: TransitionType): Promise<void> {
    const t = type ?? getTransitionType()
    activeTransition.value = t
    transitionProgress.value = 0

    const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) {
        transitionProgress.value = 1
        await new Promise(r => setTimeout(r, 50))
        activeTransition.value = null
        return
    }

    const duration = 2000
    const start = performance.now()

    return new Promise<void>(resolve => {
        function tick() {
            const elapsed = performance.now() - start
            const rawProgress = Math.min(1, elapsed / duration)
            const eased = rawProgress < 0.5
                ? 2 * rawProgress * rawProgress
                : 1 - Math.pow(-2 * rawProgress + 2, 2) / 2
            transitionProgress.value = eased

            if (rawProgress < 1) {
                animationFrame = requestAnimationFrame(tick)
            } else {
                activeTransition.value = null
                transitionProgress.value = 0
                resolve()
            }
        }
        animationFrame = requestAnimationFrame(tick)
    })
}

function cancelTransition() {
    if (animationFrame) {
        cancelAnimationFrame(animationFrame)
        animationFrame = null
    }
    activeTransition.value = null
    transitionProgress.value = 0
}

function setPreferredTransition(type: TransitionType | 'random') {
    preferredTransition.value = type
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('lorely:transition', type)
    }
}

export function useMultiverseTransitions() {
    return {
        activeTransition: readonly(activeTransition),
        transitionProgress: readonly(transitionProgress),
        preferredTransition: readonly(preferredTransition),
        allTransitions,
        playTransition,
        cancelTransition,
        setPreferredTransition,
        getTransitionType,
    }
}
