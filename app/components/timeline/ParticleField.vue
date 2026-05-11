<template>
    <primitive :object="points" />
</template>

<script setup lang="ts">
import { Points, Color, BufferGeometry, Float32BufferAttribute, AdditiveBlending, ShaderMaterial } from 'three'
import { useRenderLoop, useTres } from '@tresjs/core'

const props = defineProps<{
    scrollProgress: number
    phaseColor: string
    particleCount: number
}>()

const vertexShader = `
    attribute float aSize;
    attribute float aAlpha;
    uniform float uTime;
    uniform float uScrollProgress;
    varying float vAlpha;

    void main() {
        vAlpha = aAlpha;
        vec3 pos = position;
        float drift = sin(pos.x * 0.5 + uTime * 0.3) * 0.5 + cos(pos.z * 0.3 + uTime * 0.2) * 0.5;
        pos.y += drift;
        pos.y -= uScrollProgress * 20.0;
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = aSize * (50.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
    }
`

const fragmentShader = `
    uniform vec3 uColor;
    uniform float uOpacity;
    varying float vAlpha;

    void main() {
        float dist = length(gl_PointCoord - vec2(0.5));
        if (dist > 0.5) discard;
        float glow = 1.0 - smoothstep(0.0, 0.5, dist);
        gl_FragColor = vec4(uColor, glow * vAlpha * uOpacity);
    }
`

const targetColor = new Color(props.phaseColor)
const currentColor = new Color(props.phaseColor)

const geometry = new BufferGeometry()
const positions = new Float32Array(props.particleCount * 3)
const sizes = new Float32Array(props.particleCount)
const alphas = new Float32Array(props.particleCount)

for (let i = 0; i < props.particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 100
    positions[i * 3 + 1] = (Math.random() - 0.5) * 100
    positions[i * 3 + 2] = (Math.random() - 0.5) * 80
    sizes[i] = Math.random() * 2 + 0.5
    alphas[i] = Math.random() * 0.6 + 0.2
}

geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
geometry.setAttribute('aSize', new Float32BufferAttribute(sizes, 1))
geometry.setAttribute('aAlpha', new Float32BufferAttribute(alphas, 1))

const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
        uTime: { value: 0 },
        uScrollProgress: { value: 0 },
        uColor: { value: currentColor },
        uOpacity: { value: 0.35 },
    },
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
})

const points = new Points(geometry, material)

const { renderer } = useTres()
if (renderer.value) {
    renderer.value.setClearColor(0x000000, 0)
}
watch(renderer, (r) => {
    if (r) r.setClearColor(0x000000, 0)
})

const { onLoop } = useRenderLoop()
let elapsed = 0

onLoop(({ delta }) => {
    elapsed += delta
    material.uniforms.uTime.value = elapsed
    material.uniforms.uScrollProgress.value = props.scrollProgress

    targetColor.set(props.phaseColor)
    currentColor.lerp(targetColor, 0.02)
})

onUnmounted(() => {
    geometry.dispose()
    material.dispose()
})
</script>
