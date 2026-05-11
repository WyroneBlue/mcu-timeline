<template>
    <primitive :object="mesh" />
</template>

<script setup lang="ts">
import {
    Mesh, PlaneGeometry, ShaderMaterial, DoubleSide, AdditiveBlending,
    Color as ThreeColor,
} from 'three'
import { useRenderLoop } from '@tresjs/core'
import type { TransitionType } from '~/types/multiverse'

const props = defineProps<{
    type: TransitionType
    progress: number
}>()

const shaders: Record<TransitionType, { vertex: string; fragment: string; color: ThreeColor }> = {
    portal: {
        color: new ThreeColor(0.95, 0.65, 0.1),
        vertex: `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy * 2.0, 0.0, 1.0); }`,
        fragment: `
            uniform float uProgress;
            uniform float uTime;
            uniform vec3 uColor;
            varying vec2 vUv;
            void main() {
                vec2 center = vUv - 0.5;
                float dist = length(center);
                float angle = atan(center.y, center.x);
                float ring = smoothstep(0.02, 0.0, abs(dist - uProgress * 0.5));
                float sparks = sin(angle * 20.0 + uTime * 8.0) * 0.5 + 0.5;
                sparks *= smoothstep(0.05, 0.0, abs(dist - uProgress * 0.48));
                float glow = exp(-dist * 3.0 / max(uProgress, 0.01)) * uProgress;
                float inner = smoothstep(uProgress * 0.45, uProgress * 0.35, dist) * uProgress;
                float alpha = ring * 0.8 + sparks * 0.4 + glow * 0.3 + inner * 0.6;
                vec3 col = uColor * (1.0 + sparks * 0.5);
                gl_FragColor = vec4(col, alpha * smoothstep(0.0, 0.1, uProgress) * smoothstep(1.0, 0.8, uProgress));
            }`,
    },
    incursion: {
        color: new ThreeColor(0.8, 0.1, 0.3),
        vertex: `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy * 2.0, 0.0, 1.0); }`,
        fragment: `
            uniform float uProgress;
            uniform float uTime;
            uniform vec3 uColor;
            varying vec2 vUv;
            float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
            float voronoi(vec2 p) {
                vec2 i = floor(p); vec2 f = fract(p);
                float d = 1.0;
                for (int y = -1; y <= 1; y++)
                for (int x = -1; x <= 1; x++) {
                    vec2 n = vec2(float(x), float(y));
                    vec2 r = n + hash(i + n) - f;
                    d = min(d, dot(r, r));
                }
                return sqrt(d);
            }
            void main() {
                vec2 center = vUv - 0.5;
                float dist = length(center);
                float v = voronoi(vUv * 8.0 + uTime * 0.5);
                float cracks = smoothstep(0.08, 0.0, v) * uProgress;
                float spread = smoothstep(0.6, 0.0, dist - uProgress * 0.8);
                float energy = sin(v * 30.0 + uTime * 4.0) * 0.5 + 0.5;
                float alpha = cracks * spread * 0.9 + energy * cracks * 0.3;
                vec3 col = mix(uColor, vec3(0.5, 0.1, 0.8), energy * 0.5);
                gl_FragColor = vec4(col, alpha * smoothstep(0.0, 0.15, uProgress) * smoothstep(1.0, 0.75, uProgress));
            }`,
    },
    'space-stone': {
        color: new ThreeColor(0.1, 0.4, 1.0),
        vertex: `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy * 2.0, 0.0, 1.0); }`,
        fragment: `
            uniform float uProgress;
            uniform float uTime;
            uniform vec3 uColor;
            varying vec2 vUv;
            float noise(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
            void main() {
                vec2 center = vUv - 0.5;
                float dist = length(center);
                float flash = exp(-dist * 6.0 / max(uProgress, 0.01)) * uProgress;
                float cube = max(abs(center.x), abs(center.y));
                float cubeEdge = smoothstep(0.02, 0.0, abs(cube - uProgress * 0.3)) * uProgress;
                float tendrils = noise(vUv * 10.0 + uTime) * exp(-dist * 4.0) * uProgress;
                float alpha = flash * 0.7 + cubeEdge * 0.6 + tendrils * 0.3;
                vec3 col = uColor * (1.0 + flash * 0.8);
                gl_FragColor = vec4(col, alpha * smoothstep(0.0, 0.1, uProgress) * smoothstep(1.0, 0.8, uProgress));
            }`,
    },
    'strange-trip': {
        color: new ThreeColor(0.6, 0.2, 0.9),
        vertex: `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy * 2.0, 0.0, 1.0); }`,
        fragment: `
            uniform float uProgress;
            uniform float uTime;
            uniform vec3 uColor;
            varying vec2 vUv;
            void main() {
                vec2 center = vUv - 0.5;
                float angle = atan(center.y, center.x);
                float dist = length(center);
                float kaleidoscope = abs(sin(angle * 6.0 + uTime * 2.0));
                float fractal = abs(sin(dist * 20.0 - uTime * 3.0 + kaleidoscope * 5.0));
                float mirror = abs(sin((vUv.x + vUv.y) * 15.0 + uTime * 1.5));
                float warp = sin(dist * 30.0 - uTime * 4.0) * 0.5 + 0.5;
                float alpha = (fractal * 0.4 + mirror * 0.3 + warp * 0.3) * uProgress;
                alpha *= smoothstep(0.8, 0.3, dist);
                vec3 col = mix(uColor, vec3(0.2, 0.8, 0.6), fractal * 0.5);
                col = mix(col, vec3(0.9, 0.3, 0.1), mirror * 0.3);
                gl_FragColor = vec4(col, alpha * smoothstep(0.0, 0.15, uProgress) * smoothstep(1.0, 0.7, uProgress));
            }`,
    },
    'time-jump': {
        color: new ThreeColor(0.1, 0.9, 0.3),
        vertex: `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy * 2.0, 0.0, 1.0); }`,
        fragment: `
            uniform float uProgress;
            uniform float uTime;
            uniform vec3 uColor;
            varying vec2 vUv;
            void main() {
                vec2 center = vUv - 0.5;
                float dist = length(center);
                float ripple1 = smoothstep(0.03, 0.0, abs(dist - uProgress * 0.8));
                float ripple2 = smoothstep(0.02, 0.0, abs(dist - uProgress * 0.6));
                float ripple3 = smoothstep(0.015, 0.0, abs(dist - uProgress * 0.4));
                float glow = exp(-dist * 4.0 / max(uProgress, 0.01)) * uProgress * 0.5;
                float tint = exp(-dist * 2.0) * uProgress * 0.2;
                float alpha = (ripple1 + ripple2 * 0.7 + ripple3 * 0.5) * 0.8 + glow + tint;
                vec3 col = uColor;
                gl_FragColor = vec4(col, alpha * smoothstep(0.0, 0.1, uProgress) * smoothstep(1.0, 0.8, uProgress));
            }`,
    },
    bifrost: {
        color: new ThreeColor(0.3, 0.6, 1.0),
        vertex: `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy * 2.0, 0.0, 1.0); }`,
        fragment: `
            uniform float uProgress;
            uniform float uTime;
            uniform vec3 uColor;
            varying vec2 vUv;
            void main() {
                vec2 center = vUv - vec2(0.5);
                float beam = smoothstep(0.15, 0.0, abs(center.x)) * uProgress;
                float sweep = smoothstep(0.0, 1.0, (1.0 - vUv.y) - (1.0 - uProgress) * 1.2);
                float rainbow = sin(vUv.y * 30.0 + uTime * 5.0) * 0.5 + 0.5;
                float alpha = beam * sweep;
                vec3 col;
                float h = fract(vUv.y * 2.0 + uTime * 0.3);
                col.r = abs(h * 6.0 - 3.0) - 1.0;
                col.g = 2.0 - abs(h * 6.0 - 2.0);
                col.b = 2.0 - abs(h * 6.0 - 4.0);
                col = clamp(col, 0.0, 1.0);
                col = mix(col, vec3(1.0), 0.3);
                float runes = step(0.95, sin(vUv.y * 60.0 + uTime * 2.0)) * beam * 0.3;
                alpha += runes;
                gl_FragColor = vec4(col, alpha * smoothstep(0.0, 0.1, uProgress) * smoothstep(1.0, 0.85, uProgress));
            }`,
    },
    darkhold: {
        color: new ThreeColor(0.9, 0.1, 0.15),
        vertex: `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy * 2.0, 0.0, 1.0); }`,
        fragment: `
            uniform float uProgress;
            uniform float uTime;
            uniform vec3 uColor;
            varying vec2 vUv;
            float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
            void main() {
                vec2 center = vUv - 0.5;
                float dist = length(center);
                float angle = atan(center.y, center.x);
                float chaos = sin(angle * 8.0 + uTime * 3.0) * sin(dist * 15.0 - uTime * 2.0);
                float runes = step(0.85, hash(floor(vUv * 20.0) + floor(uTime * 2.0))) * uProgress;
                float vignette = smoothstep(0.7, 0.2, dist) * uProgress;
                float darkEdge = smoothstep(0.3, 0.7, dist) * uProgress * 0.8;
                float alpha = abs(chaos) * 0.4 * uProgress + runes * 0.5 + darkEdge;
                alpha *= vignette + 0.2;
                vec3 col = mix(uColor, vec3(0.3, 0.0, 0.0), darkEdge);
                col += runes * vec3(0.8, 0.2, 0.3);
                gl_FragColor = vec4(col, alpha * smoothstep(0.0, 0.15, uProgress) * smoothstep(1.0, 0.75, uProgress));
            }`,
    },
}

const geo = new PlaneGeometry(2, 2)
const mat = new ShaderMaterial({
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
    uniforms: {
        uProgress: { value: 0 },
        uTime: { value: 0 },
        uColor: { value: new ThreeColor() },
    },
    vertexShader: shaders.portal.vertex,
    fragmentShader: shaders.portal.fragment,
})

const mesh = new Mesh(geo, mat)
mesh.frustumCulled = false

let currentType: TransitionType | null = null

watch(() => props.type, (type) => {
    if (type && type !== currentType) {
        const s = shaders[type]
        mat.vertexShader = s.vertex
        mat.fragmentShader = s.fragment
        mat.uniforms.uColor.value.copy(s.color)
        mat.needsUpdate = true
        currentType = type
    }
}, { immediate: true })

const { onLoop } = useRenderLoop()
let elapsed = 0

onLoop(({ delta }) => {
    elapsed += delta
    mat.uniforms.uProgress.value = props.progress
    mat.uniforms.uTime.value = elapsed
})

onUnmounted(() => {
    geo.dispose()
    mat.dispose()
})
</script>
