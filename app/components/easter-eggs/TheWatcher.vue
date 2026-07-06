<template>
    <component :is="settings.watcherStyle === '3d' ? TheWatcher3D : TheWatcherSprite" :position="position" />
</template>

<script setup lang="ts">
import { Raycaster, Vector2, Vector3 } from 'three'
import { useTres } from '@tresjs/core'
import TheWatcherSprite from './TheWatcherSprite.vue'
import TheWatcher3D from './TheWatcher3D.vue'

const props = withDefaults(defineProps<{
    position: [number, number, number]
    scale?: number
}>(), { scale: 8.0 })

const emit = defineEmits<{
    found: []
}>()

const { settings } = useSettings()
const { camera, renderer } = useTres()

// Click detection: instead of raycasting the actual meshes, test the ray
// against a generous sphere around the figure's visual centre — forgiving
// for something deliberately hidden in the far background.
const raycaster = new Raycaster()
const pointer = new Vector2()
const centre = new Vector3(props.position[0], props.position[1] + props.scale * 2, props.position[2])
let downAt = { x: 0, y: 0 }

function onPointerDown(e: PointerEvent) {
    downAt = { x: e.clientX, y: e.clientY }
}

function onPointerUp(e: PointerEvent) {
    if (Math.abs(e.clientX - downAt.x) > 5 || Math.abs(e.clientY - downAt.y) > 5) return
    const canvas = renderer.value?.domElement
    if (!canvas || !camera.value) return
    const rect = canvas.getBoundingClientRect()
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    raycaster.setFromCamera(pointer, camera.value)
    if (raycaster.ray.distanceToPoint(centre) < props.scale * 1.4) {
        emit('found')
    }
}

onMounted(() => {
    const canvas = renderer.value?.domElement
    if (!canvas) return
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointerup', onPointerUp)
    onUnmounted(() => {
        canvas.removeEventListener('pointerdown', onPointerDown)
        canvas.removeEventListener('pointerup', onPointerUp)
    })
})
</script>
