<template>
    <primitive :object="group" />
</template>

<script setup lang="ts">
import {
    Group, Mesh, SphereGeometry, ConeGeometry, MeshBasicMaterial,
    AdditiveBlending, Color as ThreeColor,
} from 'three'
import { useRenderLoop } from '@tresjs/core'

const props = defineProps<{
    position: [number, number, number]
}>()

const group = new Group()
group.position.set(...props.position)

const bodyColor = new ThreeColor(0.05, 0.05, 0.15)
const eyeColor = new ThreeColor(0.4, 0.7, 1.0)

const headGeo = new SphereGeometry(0.35, 16, 16)
const headMat = new MeshBasicMaterial({ color: bodyColor, transparent: true, opacity: 0.7 })
const head = new Mesh(headGeo, headMat)
head.position.y = 1.6
group.add(head)

const bodyGeo = new ConeGeometry(0.6, 1.8, 8)
const bodyMat = new MeshBasicMaterial({ color: bodyColor, transparent: true, opacity: 0.6 })
const body = new Mesh(bodyGeo, bodyMat)
body.position.y = 0.5
group.add(body)

const eyeGeo = new SphereGeometry(0.06, 8, 8)

const leftEyeMat = new MeshBasicMaterial({ color: eyeColor, transparent: true, opacity: 0.9, blending: AdditiveBlending, depthWrite: false })
const leftEye = new Mesh(eyeGeo, leftEyeMat)
leftEye.position.set(-0.12, 1.65, 0.3)
group.add(leftEye)

const rightEyeMat = new MeshBasicMaterial({ color: eyeColor, transparent: true, opacity: 0.9, blending: AdditiveBlending, depthWrite: false })
const rightEye = new Mesh(eyeGeo, rightEyeMat)
rightEye.position.set(0.12, 1.65, 0.3)
group.add(rightEye)

const eyeGlowGeo = new SphereGeometry(0.12, 8, 8)
const leftGlowMat = new MeshBasicMaterial({ color: eyeColor, transparent: true, opacity: 0.3, blending: AdditiveBlending, depthWrite: false })
const leftGlow = new Mesh(eyeGlowGeo, leftGlowMat)
leftGlow.position.copy(leftEye.position)
group.add(leftGlow)

const rightGlowMat = new MeshBasicMaterial({ color: eyeColor, transparent: true, opacity: 0.3, blending: AdditiveBlending, depthWrite: false })
const rightGlow = new Mesh(eyeGlowGeo, rightGlowMat)
rightGlow.position.copy(rightEye.position)
group.add(rightGlow)

const { onLoop } = useRenderLoop()
let elapsed = 0

onLoop(({ delta }) => {
    elapsed += delta
    const breathe = 1 + Math.sin(elapsed * 0.3 * Math.PI * 2) * 0.02
    group.scale.setScalar(breathe)

    const eyePulse = 0.7 + Math.sin(elapsed * 1.5) * 0.3
    leftEyeMat.opacity = eyePulse
    rightEyeMat.opacity = eyePulse
    leftGlowMat.opacity = eyePulse * 0.4
    rightGlowMat.opacity = eyePulse * 0.4
})

onUnmounted(() => {
    headGeo.dispose(); headMat.dispose()
    bodyGeo.dispose(); bodyMat.dispose()
    eyeGeo.dispose(); leftEyeMat.dispose(); rightEyeMat.dispose()
    eyeGlowGeo.dispose(); leftGlowMat.dispose(); rightGlowMat.dispose()
})
</script>
