<template>
    <primitive :object="group" />
</template>

<script setup lang="ts">
import { Group, Mesh, TorusGeometry, RingGeometry, MeshBasicMaterial, Color as ThreeColor, DoubleSide } from 'three'
import { useRenderLoop, useTres } from '@tresjs/core'

const props = defineProps<{
    progress: number
    color: string
}>()

const targetColor = new ThreeColor(props.color)
const currentColor = new ThreeColor(props.color)

const ringCount = 4
const group = new Group()

interface RingData {
    mesh: Mesh
    baseRadius: number
    speed: number
    tube: number
}

const rings: RingData[] = []

for (let i = 0; i < ringCount; i++) {
    const radius = 1.2 + i * 0.5
    const tube = 0.02 + (ringCount - i) * 0.008
    const geo = new TorusGeometry(radius, tube, 16, 64)
    const mat = new MeshBasicMaterial({
        color: currentColor.clone(),
        transparent: true,
        opacity: 0,
        side: DoubleSide,
    })
    const mesh = new Mesh(geo, mat)
    group.add(mesh)
    rings.push({ mesh, baseRadius: radius, speed: 0.5 + i * 0.3, tube })
}

const innerGeo = new RingGeometry(0, 0.8, 32)
const innerMat = new MeshBasicMaterial({
    color: currentColor.clone(),
    transparent: true,
    opacity: 0,
    side: DoubleSide,
})
const innerMesh = new Mesh(innerGeo, innerMat)
group.add(innerMesh)

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
    targetColor.set(props.color)
    currentColor.lerp(targetColor, 0.05)

    const p = props.progress
    const openAmount = Math.min(1, p * 2)
    const glowAmount = Math.max(0, (p - 0.3) / 0.7)

    for (let i = 0; i < rings.length; i++) {
        const ring = rings[i]
        const mat = ring.mesh.material as MeshBasicMaterial
        mat.color.copy(currentColor)
        mat.opacity = (0.3 - i * 0.05) * openAmount

        ring.mesh.rotation.x = elapsed * ring.speed * 0.5
        ring.mesh.rotation.y = elapsed * ring.speed * 0.3 + i * Math.PI / ringCount

        const scale = 1 + Math.sin(elapsed * 0.5 + i) * 0.05 * openAmount
        ring.mesh.scale.setScalar(scale)
    }

    innerMat.color.copy(currentColor)
    innerMat.opacity = glowAmount * 0.15
})

onUnmounted(() => {
    rings.forEach(r => {
        r.mesh.geometry.dispose()
        ;(r.mesh.material as MeshBasicMaterial).dispose()
    })
    innerGeo.dispose()
    innerMat.dispose()
})
</script>
