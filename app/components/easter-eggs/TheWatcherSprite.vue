<template>
    <primitive :object="group" />
</template>

<script setup lang="ts">
import {
    Group, Mesh, PlaneGeometry, MeshBasicMaterial, CanvasTexture,
    AdditiveBlending, Color as ThreeColor, SRGBColorSpace,
    BufferGeometry, Float32BufferAttribute, Points, ShaderMaterial,
} from 'three'
import { useRenderLoop, useTres } from '@tresjs/core'

const props = withDefaults(defineProps<{
    position: [number, number, number]
    opacity?: number
    scale?: number
}>(), { opacity: 0.7, scale: 8.0 })

const group = new Group()
group.position.set(...props.position)
const s = props.scale
const o = props.opacity
group.scale.setScalar(s)

function createWatcherTexture(): CanvasTexture {
    const w = 256
    const h = 512
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!

    ctx.clearRect(0, 0, w, h)

    // -- BODY / CAPE --
    const capeGrad = ctx.createLinearGradient(w / 2, h * 0.35, w / 2, h)
    capeGrad.addColorStop(0, 'rgba(8, 10, 35, 0.95)')
    capeGrad.addColorStop(0.5, 'rgba(6, 8, 28, 0.85)')
    capeGrad.addColorStop(1, 'rgba(3, 4, 15, 0.0)')

    ctx.beginPath()
    ctx.moveTo(w * 0.5, h * 0.32)
    ctx.bezierCurveTo(w * 0.35, h * 0.4, w * 0.1, h * 0.75, w * 0.08, h)
    ctx.lineTo(w * 0.92, h)
    ctx.bezierCurveTo(w * 0.9, h * 0.75, w * 0.65, h * 0.4, w * 0.5, h * 0.32)
    ctx.fillStyle = capeGrad
    ctx.fill()

    // -- SHOULDERS --
    const shoulderGrad = ctx.createLinearGradient(w / 2, h * 0.3, w / 2, h * 0.42)
    shoulderGrad.addColorStop(0, 'rgba(12, 15, 45, 0.9)')
    shoulderGrad.addColorStop(1, 'rgba(8, 10, 35, 0.8)')

    ctx.beginPath()
    ctx.moveTo(w * 0.28, h * 0.38)
    ctx.quadraticCurveTo(w * 0.5, h * 0.32, w * 0.72, h * 0.38)
    ctx.quadraticCurveTo(w * 0.65, h * 0.42, w * 0.5, h * 0.4)
    ctx.quadraticCurveTo(w * 0.35, h * 0.42, w * 0.28, h * 0.38)
    ctx.fillStyle = shoulderGrad
    ctx.fill()

    // -- HIGH COLLAR --
    ctx.beginPath()
    ctx.moveTo(w * 0.3, h * 0.36)
    ctx.quadraticCurveTo(w * 0.32, h * 0.2, w * 0.38, h * 0.14)
    ctx.lineTo(w * 0.42, h * 0.13)
    ctx.quadraticCurveTo(w * 0.4, h * 0.25, w * 0.42, h * 0.33)
    ctx.fillStyle = 'rgba(10, 12, 40, 0.85)'
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(w * 0.7, h * 0.36)
    ctx.quadraticCurveTo(w * 0.68, h * 0.2, w * 0.62, h * 0.14)
    ctx.lineTo(w * 0.58, h * 0.13)
    ctx.quadraticCurveTo(w * 0.6, h * 0.25, w * 0.58, h * 0.33)
    ctx.fillStyle = 'rgba(10, 12, 40, 0.85)'
    ctx.fill()

    // -- HEAD --
    const headCx = w * 0.5
    const headCy = h * 0.2
    const headRx = w * 0.14
    const headRy = h * 0.1

    const headGrad = ctx.createRadialGradient(headCx, headCy, 0, headCx, headCy, headRy)
    headGrad.addColorStop(0, 'rgba(25, 20, 40, 0.95)')
    headGrad.addColorStop(0.7, 'rgba(15, 12, 30, 0.9)')
    headGrad.addColorStop(1, 'rgba(8, 6, 20, 0.85)')

    ctx.beginPath()
    ctx.ellipse(headCx, headCy, headRx, headRy, 0, 0, Math.PI * 2)
    ctx.fillStyle = headGrad
    ctx.fill()

    // Rim light
    const rimGrad = ctx.createLinearGradient(headCx, headCy - headRy, headCx, headCy)
    rimGrad.addColorStop(0, 'rgba(60, 70, 140, 0.15)')
    rimGrad.addColorStop(1, 'rgba(60, 70, 140, 0.0)')
    ctx.beginPath()
    ctx.ellipse(headCx, headCy - headRy * 0.15, headRx * 0.9, headRy * 0.6, 0, Math.PI, Math.PI * 2)
    ctx.fillStyle = rimGrad
    ctx.fill()

    // -- BROW RIDGE --
    ctx.beginPath()
    ctx.moveTo(headCx - headRx * 0.75, headCy + headRy * 0.1)
    ctx.quadraticCurveTo(headCx, headCy - headRy * 0.1, headCx + headRx * 0.75, headCy + headRy * 0.1)
    ctx.strokeStyle = 'rgba(20, 18, 35, 0.6)'
    ctx.lineWidth = 3
    ctx.stroke()

    // -- EYES --
    const eyeY = headCy + headRy * 0.15
    const eyeSpacing = headRx * 0.42

    for (const side of [-1, 1]) {
        const eyeX = headCx + side * eyeSpacing

        const glowGrad = ctx.createRadialGradient(eyeX, eyeY, 0, eyeX, eyeY, 18)
        glowGrad.addColorStop(0, 'rgba(160, 210, 255, 0.7)')
        glowGrad.addColorStop(0.4, 'rgba(100, 170, 255, 0.3)')
        glowGrad.addColorStop(1, 'rgba(60, 120, 255, 0.0)')
        ctx.beginPath()
        ctx.arc(eyeX, eyeY, 18, 0, Math.PI * 2)
        ctx.fillStyle = glowGrad
        ctx.fill()

        const midGrad = ctx.createRadialGradient(eyeX, eyeY, 0, eyeX, eyeY, 10)
        midGrad.addColorStop(0, 'rgba(200, 230, 255, 0.9)')
        midGrad.addColorStop(0.5, 'rgba(140, 190, 255, 0.5)')
        midGrad.addColorStop(1, 'rgba(80, 150, 255, 0.0)')
        ctx.beginPath()
        ctx.arc(eyeX, eyeY, 10, 0, Math.PI * 2)
        ctx.fillStyle = midGrad
        ctx.fill()

        ctx.beginPath()
        ctx.ellipse(eyeX, eyeY, 6, 3.5, side * 0.15, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(230, 245, 255, 0.95)'
        ctx.fill()
    }

    // -- CHEST ACCENT --
    ctx.beginPath()
    ctx.moveTo(w * 0.4, h * 0.38)
    ctx.quadraticCurveTo(w * 0.5, h * 0.36, w * 0.6, h * 0.38)
    ctx.strokeStyle = 'rgba(200, 160, 50, 0.2)'
    ctx.lineWidth = 1.5
    ctx.stroke()

    // Premultiply alpha to prevent white fringing
    const imageData = ctx.getImageData(0, 0, w, h)
    const d = imageData.data
    for (let i = 0; i < d.length; i += 4) {
        const a = d[i + 3] / 255
        d[i] = d[i] * a
        d[i + 1] = d[i + 1] * a
        d[i + 2] = d[i + 2] * a
    }
    ctx.putImageData(imageData, 0, 0)

    const tex = new CanvasTexture(canvas)
    tex.colorSpace = SRGBColorSpace
    tex.premultiplyAlpha = true
    return tex
}

const texture = createWatcherTexture()
const planeGeo = new PlaneGeometry(2, 4)
const planeMat = new ShaderMaterial({
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D uMap;
        uniform float uOpacity;
        varying vec2 vUv;
        void main() {
            vec4 tex = texture2D(uMap, vUv);
            if (tex.a < 0.005) discard;
            gl_FragColor = vec4(tex.rgb, tex.a * uOpacity);
        }
    `,
    uniforms: {
        uMap: { value: texture },
        uOpacity: { value: o },
    },
    transparent: true,
    depthWrite: false,
})
const billboard = new Mesh(planeGeo, planeMat)
billboard.position.y = 2.0
group.add(billboard)

// Subtle particles
const particleCount = 10
const pGeo = new BufferGeometry()
const pPositions = new Float32Array(particleCount * 3)
for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2
    const radius = 0.6 + Math.random() * 1.0
    const height = 0.5 + Math.random() * 3.5
    pPositions[i * 3] = Math.cos(angle) * radius
    pPositions[i * 3 + 1] = height
    pPositions[i * 3 + 2] = Math.sin(angle) * radius
}
pGeo.setAttribute('position', new Float32BufferAttribute(pPositions, 3))
const pMat = new MeshBasicMaterial({
    color: new ThreeColor(0.3, 0.4, 0.8),
    transparent: true,
    opacity: o * 0.06,
    blending: AdditiveBlending,
    depthWrite: false,
})
const particles = new Points(pGeo, pMat)
group.add(particles)

const { camera } = useTres()
const { onLoop } = useRenderLoop()
let elapsed = 0

onLoop(({ delta }) => {
    elapsed += delta

    const breathe = s * (1 + Math.sin(elapsed * 0.2 * Math.PI * 2) * 0.01)
    group.scale.setScalar(breathe)

    if (camera.value) {
        const dx = camera.value.position.x - group.position.x
        const dz = camera.value.position.z - group.position.z
        group.rotation.y = Math.atan2(dx, dz)
    }

    particles.rotation.y = elapsed * 0.06
})

onUnmounted(() => {
    texture.dispose(); planeGeo.dispose(); planeMat.dispose()
    pGeo.dispose(); pMat.dispose()
})
</script>
