import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (import.meta.client) {
    gsap.registerPlugin(ScrollTrigger)
}

export function useScrollAnimation() {
    const prefersReducedMotion = ref(false)

    onMounted(() => {
        prefersReducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    })

    function useParallax(el: Ref<HTMLElement | null>, speed = 0.3) {
        onMounted(() => {
            if (prefersReducedMotion.value || !el.value) return
            gsap.to(el.value, {
                yPercent: speed * 100,
                ease: 'none',
                scrollTrigger: {
                    trigger: el.value,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: true,
                },
            })
        })
    }

    function useFadeIn(el: Ref<HTMLElement | null>, options?: { y?: number; delay?: number; duration?: number }) {
        onMounted(() => {
            if (!el.value) return
            if (prefersReducedMotion.value) {
                gsap.set(el.value, { opacity: 1, y: 0 })
                return
            }

            gsap.set(el.value, { opacity: 0, y: options?.y ?? 40 })

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    if (!el.value) return
                    const rect = el.value.getBoundingClientRect()
                    const inViewport = rect.top < window.innerHeight + 100 && rect.bottom > -100

                    if (inViewport) {
                        gsap.to(el.value, {
                            opacity: 1, y: 0,
                            duration: options?.duration ?? 0.5,
                            delay: options?.delay ?? 0,
                            ease: 'power2.out',
                        })
                    } else {
                        gsap.fromTo(el.value,
                            { opacity: 0, y: options?.y ?? 40 },
                            {
                                opacity: 1,
                                y: 0,
                                duration: options?.duration ?? 0.8,
                                delay: options?.delay ?? 0,
                                ease: 'power2.out',
                                scrollTrigger: {
                                    trigger: el.value,
                                    start: 'top 90%',
                                    toggleActions: 'play none none none',
                                },
                            }
                        )
                    }
                })
            })
        })
    }

    function useStagger(container: Ref<HTMLElement | null>, childSelector: string, options?: { y?: number; stagger?: number }) {
        onMounted(() => {
            if (!container.value) return
            const children = container.value.querySelectorAll(childSelector)
            if (!children.length) return
            if (prefersReducedMotion.value) {
                gsap.set(children, { opacity: 1, y: 0 })
                return
            }
            gsap.fromTo(children,
                { opacity: 0, y: options?.y ?? 30 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.6,
                    stagger: options?.stagger ?? 0.1,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: container.value,
                        start: 'top 80%',
                        toggleActions: 'play none none none',
                    },
                }
            )
        })
    }

    function usePhaseTransition(el: Ref<HTMLElement | null>, phase: number) {
        onMounted(() => {
            if (!el.value) return
            const root = document.documentElement
            const phaseKey = phase <= 3 ? phase : phase <= 5 ? phase : 6
            ScrollTrigger.create({
                trigger: el.value,
                start: 'top 60%',
                end: 'bottom 40%',
                onEnter: () => {
                    root.style.setProperty('--phase-current-primary', `var(--phase-${phaseKey}-primary)`)
                    root.style.setProperty('--phase-current-accent', `var(--phase-${phaseKey}-accent)`)
                },
                onEnterBack: () => {
                    root.style.setProperty('--phase-current-primary', `var(--phase-${phaseKey}-primary)`)
                    root.style.setProperty('--phase-current-accent', `var(--phase-${phaseKey}-accent)`)
                },
            })
        })
    }

    function useScrollProgress(container: Ref<HTMLElement | null>) {
        const progress = ref(0)
        onMounted(() => {
            if (!container.value) return
            ScrollTrigger.create({
                trigger: container.value,
                start: 'top top',
                end: 'bottom bottom',
                onUpdate: (self) => {
                    progress.value = self.progress
                },
            })
        })
        return progress
    }

    function killAll() {
        ScrollTrigger.getAll().forEach(t => t.kill())
    }

    onUnmounted(() => {
        killAll()
    })

    return {
        gsap,
        ScrollTrigger,
        prefersReducedMotion,
        useParallax,
        useFadeIn,
        useStagger,
        usePhaseTransition,
        useScrollProgress,
        killAll,
    }
}
