<template>
    <primitive :object="group" />
</template>

<script setup lang="ts">
import {
    Group, Mesh, IcosahedronGeometry, ShaderMaterial,
    AdditiveBlending, SphereGeometry, MeshBasicMaterial,
    Color as ThreeColor,
} from 'three'
import { useRenderLoop } from '@tresjs/core'

type StoneId = 'space' | 'mind' | 'reality' | 'power' | 'time' | 'soul'

const props = defineProps<{
    stone: StoneId
    position: [number, number, number]
    collected: boolean
}>()

const emit = defineEmits<{
    collect: [stone: StoneId]
}>()

const stoneColors: Record<StoneId, string> = {
    space: '#4299E1',
    mind: '#ECC94B',
    reality: '#E53E3E',
    power: '#9F7AEA',
    time: '#48BB78',
    soul: '#ED8936',
}

const color = new ThreeColor(stoneColors[props.stone])
const group = new Group()
group.position.set(...props.position)
group.userData = { stoneId: props.stone, isStone: true }

const gemGeo = new IcosahedronGeometry(0.15, 1)
const gemMat = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: {
        uColor: { value: color },
        uTime: { value: 0 },
        uCollected: { value: props.collected ? 1.0 : 0.0 },
    },
    vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform vec3 uColor;
        uniform float uTime;
        uniform float uCollected;
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
            float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
            float pulse = 0.7 + sin(uTime * 3.0) * 0.3;
            float alpha = (0.4 + fresnel * 0.6) * pulse;
            alpha *= mix(1.0, 0.3, uCollected);
            vec3 col = uColor * (1.0 + fresnel * 0.5);
            gl_FragColor = vec4(col, alpha);
        }
    `,
})
const gem = new Mesh(gemGeo, gemMat)
group.add(gem)

const glowGeo = new SphereGeometry(0.3, 8, 8)
const glowMat = new MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.15,
    blending: AdditiveBlending,
    depthWrite: false,
})
const glow = new Mesh(glowGeo, glowMat)
group.add(glow)

const { onLoop } = useRenderLoop()
let elapsed = 0

onLoop(({ delta }) => {
    elapsed += delta
    gemMat.uniforms.uTime.value = elapsed
    gemMat.uniforms.uCollected.value = props.collected ? 1.0 : 0.0

    gem.rotation.y = elapsed * 0.8
    gem.rotation.x = Math.sin(elapsed * 0.5) * 0.3
    gem.position.y = Math.sin(elapsed * 1.2) * 0.05

    const glowPulse = 0.1 + Math.sin(elapsed * 2.0) * 0.05
    glowMat.opacity = props.collected ? glowPulse * 0.3 : glowPulse
})

onUnmounted(() => {
    gemGeo.dispose(); gemMat.dispose()
    glowGeo.dispose(); glowMat.dispose()
})
</script>
