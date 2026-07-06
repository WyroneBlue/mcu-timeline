<template>
    <Teleport to="body">
        <canvas
            v-show="activeTransition"
            ref="canvasEl"
            class="fixed inset-0 z-[9997] pointer-events-none"
        />
    </Teleport>
</template>

<script setup lang="ts">
import type { TransitionRequest } from '~/composables/useTransitionEffects'

const { activeTransition, fireMidpoint, finishTransition } = useTransitionEffects()

const canvasEl = ref<HTMLCanvasElement | null>(null)
let rafId = 0
let skipRequested = false

interface Particle {
    x: number
    y: number
    vx: number
    vy: number
    size: number
    hue: number
    alpha: number
}

function sizeCanvas(): CanvasRenderingContext2D | null {
    const canvas = canvasEl.value
    if (!canvas) return null
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    canvas.width = window.innerWidth * dpr
    canvas.height = window.innerHeight * dpr
    const ctx = canvas.getContext('2d')
    ctx?.scale(dpr, dpr)
    return ctx
}

function onSkip(e: Event) {
    if (e instanceof KeyboardEvent && e.key !== 'Escape') return
    skipRequested = true
}

// --- Bifrost: rainbow light column rushing through the viewport ---
function runBifrost(ctx: CanvasRenderingContext2D, done: () => void) {
    const w = window.innerWidth
    const h = window.innerHeight
    const DURATION = 800
    const MIDPOINT = 0.45
    const streaks = Array.from({ length: 130 }, (_, i) => ({
        x: w / 2 + (Math.random() - 0.5) * w * 0.9,
        hue: (i * 51) % 360,
        width: 1 + Math.random() * 2.5,
        speed: 0.7 + Math.random() * 0.6,
        offset: Math.random(),
    }))
    const start = performance.now()

    function frame(now: number) {
        const t = Math.min(1, (now - start) / DURATION)
        if (t >= MIDPOINT) fireMidpoint()
        ctx.clearRect(0, 0, w, h)

        // Envelope: rush in, blinding peak, fade out
        const envelope = t < 0.35 ? t / 0.35 : t > 0.65 ? (1 - t) / 0.35 : 1

        ctx.globalCompositeOperation = 'lighter'
        for (const s of streaks) {
            // Streaks converge toward the centre as the bridge forms
            const converge = 1 - envelope * 0.55
            const x = w / 2 + (s.x - w / 2) * converge
            const len = h * (0.4 + s.speed * envelope)
            const y = ((t * s.speed * 2.2 + s.offset) % 1.4 - 0.2) * h
            const grad = ctx.createLinearGradient(x, y - len / 2, x, y + len / 2)
            grad.addColorStop(0, `hsla(${s.hue}, 90%, 65%, 0)`)
            grad.addColorStop(0.5, `hsla(${s.hue}, 90%, 65%, ${0.5 * envelope})`)
            grad.addColorStop(1, `hsla(${s.hue}, 90%, 65%, 0)`)
            ctx.strokeStyle = grad
            ctx.lineWidth = s.width
            ctx.beginPath()
            ctx.moveTo(x, y - len / 2)
            ctx.lineTo(x, y + len / 2)
            ctx.stroke()
        }

        // White-hot central column at the peak
        const core = Math.max(0, envelope - 0.4) / 0.6
        if (core > 0) {
            const coreGrad = ctx.createLinearGradient(w / 2 - w * 0.2, 0, w / 2 + w * 0.2, 0)
            coreGrad.addColorStop(0, 'rgba(255,255,255,0)')
            coreGrad.addColorStop(0.5, `rgba(255,255,255,${0.55 * core})`)
            coreGrad.addColorStop(1, 'rgba(255,255,255,0)')
            ctx.fillStyle = coreGrad
            ctx.fillRect(w / 2 - w * 0.2, 0, w * 0.4, h)
        }
        ctx.globalCompositeOperation = 'source-over'

        if (t >= 1 || skipRequested) done()
        else rafId = requestAnimationFrame(frame)
    }
    rafId = requestAnimationFrame(frame)
}

// --- Snap: cards crumble to drifting dust ---
function runSnapDissolve(ctx: CanvasRenderingContext2D, elements: HTMLElement[], done: () => void) {
    const w = window.innerWidth
    const h = window.innerHeight
    const DURATION = 800
    const MIDPOINT = 0.55
    const particles: Particle[] = []

    const visible = elements.filter((el) => {
        const r = el.getBoundingClientRect()
        return r.bottom > 0 && r.top < h && r.width > 0
    }).slice(0, 40)

    visible.forEach((el, idx) => {
        el.style.transition = 'opacity 0.5s ease, filter 0.5s ease, transform 0.5s ease'
        el.style.transitionDelay = `${Math.min(0.3, idx * 0.02)}s`
        el.style.opacity = '0'
        el.style.filter = 'blur(5px)'
        el.style.transform = 'translate(14px, -10px)'

        const r = el.getBoundingClientRect()
        const count = Math.min(20, Math.max(8, Math.round(r.height / 12)))
        for (let i = 0; i < count && particles.length < 800; i++) {
            particles.push({
                x: r.right - Math.random() * r.width * 0.4,
                y: r.top + Math.random() * r.height,
                vx: 30 + Math.random() * 80,
                vy: -20 - Math.random() * 60,
                size: 1 + Math.random() * 2.5,
                hue: 24 + Math.random() * 14,
                alpha: 0.7 + Math.random() * 0.3,
            })
        }
    })

    const start = performance.now()
    let last = start

    function frame(now: number) {
        const t = Math.min(1, (now - start) / DURATION)
        const dt = Math.min(0.05, (now - last) / 1000)
        last = now
        if (t >= MIDPOINT) fireMidpoint()
        ctx.clearRect(0, 0, w, h)

        const fade = t > 0.7 ? (1 - t) / 0.3 : 1
        for (const p of particles) {
            p.x += p.vx * dt
            p.y += p.vy * dt + Math.sin(p.x * 0.02) * 12 * dt
            const grey = Math.min(60, t * 80)
            ctx.fillStyle = `hsla(${p.hue}, ${Math.max(15, 75 - grey)}%, ${55 + grey * 0.3}%, ${p.alpha * fade})`
            ctx.fillRect(p.x, p.y, p.size, p.size)
        }

        if (t >= 1 || skipRequested) done()
        else rafId = requestAnimationFrame(frame)
    }
    rafId = requestAnimationFrame(frame)
}

// --- Doctor Strange portal: sparking orange ring opening at the click point ---
function runPortal(ctx: CanvasRenderingContext2D, origin: { x: number; y: number }, done: () => void) {
    const w = window.innerWidth
    const h = window.innerHeight
    const DURATION = 1050
    const MIDPOINT = 0.55
    const maxRadius = 190
    const sparks: Particle[] = []
    const start = performance.now()
    let last = start

    function frame(now: number) {
        const t = Math.min(1, (now - start) / DURATION)
        const dt = Math.min(0.05, (now - last) / 1000)
        last = now
        if (t >= MIDPOINT) fireMidpoint()
        ctx.clearRect(0, 0, w, h)

        // Ring grows to the peak, then collapses while the route swaps under it
        const grow = t < MIDPOINT ? t / MIDPOINT : 1 - (t - MIDPOINT) / (1 - MIDPOINT)
        const radius = 12 + maxRadius * Math.pow(grow, 0.8)
        const spin = now * 0.02

        ctx.globalCompositeOperation = 'lighter'

        // Fiery main ring
        ctx.save()
        ctx.shadowBlur = 26
        ctx.shadowColor = 'rgba(237, 137, 54, 0.9)'
        ctx.strokeStyle = `rgba(255, 176, 66, ${0.85 * Math.min(1, grow * 2)})`
        ctx.lineWidth = 5 + grow * 3
        ctx.beginPath()
        ctx.arc(origin.x, origin.y, radius, 0, Math.PI * 2)
        ctx.stroke()
        ctx.restore()

        // Rotating spark knots on the ring, shedding particles
        for (let k = 0; k < 14; k++) {
            const a = spin + (k / 14) * Math.PI * 2
            const sx = origin.x + Math.cos(a) * radius
            const sy = origin.y + Math.sin(a) * radius
            ctx.fillStyle = `rgba(255, 220, 150, ${0.9 * Math.min(1, grow * 2)})`
            ctx.beginPath()
            ctx.arc(sx, sy, 2.2, 0, Math.PI * 2)
            ctx.fill()
            if (sparks.length < 500 && Math.random() < 0.5) {
                sparks.push({
                    x: sx, y: sy,
                    vx: Math.cos(a + Math.PI / 2) * (120 + Math.random() * 120) + (Math.random() - 0.5) * 60,
                    vy: Math.sin(a + Math.PI / 2) * (120 + Math.random() * 120) + 60,
                    size: 0.8 + Math.random() * 1.6,
                    hue: 28 + Math.random() * 14,
                    alpha: 1,
                })
            }
        }

        for (let i = sparks.length - 1; i >= 0; i--) {
            const p = sparks[i]
            p.x += p.vx * dt
            p.y += p.vy * dt
            p.vy += 220 * dt
            p.alpha -= dt * 2.2
            if (p.alpha <= 0) {
                sparks.splice(i, 1)
                continue
            }
            ctx.fillStyle = `hsla(${p.hue}, 95%, 62%, ${p.alpha})`
            ctx.fillRect(p.x, p.y, p.size, p.size)
        }
        ctx.globalCompositeOperation = 'source-over'

        if (t >= 1 || skipRequested) done()
        else rafId = requestAnimationFrame(frame)
    }
    rafId = requestAnimationFrame(frame)
}

function run(request: TransitionRequest) {
    const ctx = sizeCanvas()
    if (!ctx) {
        finishTransition()
        return
    }
    skipRequested = false
    window.addEventListener('pointerdown', onSkip, { once: false })
    window.addEventListener('keydown', onSkip)

    const done = () => {
        cancelAnimationFrame(rafId)
        window.removeEventListener('pointerdown', onSkip)
        window.removeEventListener('keydown', onSkip)
        const canvas = canvasEl.value
        if (canvas) ctx.clearRect(0, 0, canvas.width, canvas.height)
        finishTransition()
    }

    if (request.type === 'bifrost') runBifrost(ctx, done)
    else if (request.type === 'snap-dissolve') runSnapDissolve(ctx, request.elements ?? [], done)
    else runPortal(ctx, request.origin ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 }, done)
}

watch(activeTransition, (request) => {
    if (request) run(request)
})

onUnmounted(() => {
    cancelAnimationFrame(rafId)
    window.removeEventListener('pointerdown', onSkip)
    window.removeEventListener('keydown', onSkip)
})
</script>
