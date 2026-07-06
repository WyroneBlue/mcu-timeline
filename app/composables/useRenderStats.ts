import { reactive, ref } from 'vue'
import type { WebGLRenderer } from 'three'

// Dev-only render statistics shared between the 3D scenes (producers) and the
// FpsOverlay component (consumer). Module-scoped so there is exactly one set.
const stats = reactive({
    fps: 0,
    ms: 0,
    low1: 0,
    calls: 0,
    triangles: 0,
    textures: 0,
    geometries: 0,
})

const showFps = ref(false)

const frameTimes: number[] = []
let sampleAccumulator = 0

export function useRenderStats() {
    // Ring buffer of the last ~120 frame deltas; reactive writes are throttled
    // to 4×/s so sampling itself never becomes a per-frame cost.
    function sample(renderer: WebGLRenderer, delta: number) {
        if (delta <= 0) return
        frameTimes.push(delta)
        if (frameTimes.length > 120) frameTimes.shift()

        sampleAccumulator += delta
        if (sampleAccumulator < 0.25) return
        sampleAccumulator = 0

        const avg = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length
        const sortedDesc = [...frameTimes].sort((a, b) => b - a)
        const worst = sortedDesc.slice(0, Math.max(1, Math.round(sortedDesc.length * 0.01)))
        const worstAvg = worst.reduce((a, b) => a + b, 0) / worst.length

        stats.fps = Math.round(1 / avg)
        stats.ms = Math.round(avg * 10000) / 10
        stats.low1 = Math.round(1 / worstAvg)
        stats.calls = renderer.info.render.calls
        stats.triangles = renderer.info.render.triangles
        stats.textures = renderer.info.memory.textures
        stats.geometries = renderer.info.memory.geometries
    }

    return { stats, showFps, sample }
}
