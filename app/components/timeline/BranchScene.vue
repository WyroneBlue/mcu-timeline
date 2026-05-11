<template>
    <primitive :object="scene" />
</template>

<script setup lang="ts">
import {
    Group, Mesh, SphereGeometry, PlaneGeometry, BufferGeometry,
    Float32BufferAttribute, Points, ShaderMaterial, MeshBasicMaterial,
    AdditiveBlending, Color, Vector3, Raycaster, Vector2,
    CatmullRomCurve3, TubeGeometry, DoubleSide, CanvasTexture,
    LinearFilter, FrontSide
} from 'three'
import { useRenderLoop, useTres } from '@tresjs/core'
import type { Database } from '~/types/supabase'
import type { TimelineBranchJson } from '~/types/multiverse'
import branchesJson from '../../../data/timeline-branches.json'

type Title = Database['public']['Tables']['titles']['Row']
type ProgressStatus = 'queued' | 'watching' | 'watched' | 'skipped'

const props = defineProps<{
    titles: Title[]
    progressMap: Map<number, ProgressStatus>
    hoveredId: string | null
    selectedId: string | null
    focusedIndex: number
}>()

const emit = defineEmits<{
    hover: [id: string | null]
    select: [id: string | null]
    'update:focusedIndex': [index: number]
}>()

const branches = branchesJson as TimelineBranchJson[]

function hexToRgb(hex: string) {
    const c = new Color(hex)
    return { r: Math.round(c.r * 255), g: Math.round(c.g * 255), b: Math.round(c.b * 255) }
}

function createGlowTexture(color: string): CanvasTexture {
    const size = 256
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!
    const { r, g, b } = hexToRgb(color)
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    grad.addColorStop(0, `rgba(${r},${g},${b},0.7)`)
    grad.addColorStop(0.2, `rgba(${r},${g},${b},0.25)`)
    grad.addColorStop(0.5, `rgba(${r},${g},${b},0.06)`)
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, size, size)
    const tex = new CanvasTexture(canvas)
    tex.minFilter = LinearFilter
    return tex
}

function createLabelTexture(text: string, color: string): CanvasTexture {
    const w = 512
    const h = 64
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, w, h)
    ctx.font = 'bold 18px system-ui'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = 'rgba(0,0,0,0.4)'
    ctx.fillText(text, w / 2 + 1, h / 2 + 1)
    ctx.fillStyle = color
    ctx.fillText(text, w / 2, h / 2)
    const tex = new CanvasTexture(canvas)
    tex.minFilter = LinearFilter
    return tex
}

const scene = new Group()
const raycaster = new Raycaster()
const pointer = new Vector2()
const disposables: { dispose: () => void }[] = []

// Stars
const starCount = 1500
const starGeo = new BufferGeometry()
const starPos = new Float32Array(starCount * 3)
const starSizes = new Float32Array(starCount)
const starColors = new Float32Array(starCount * 3)
for (let i = 0; i < starCount; i++) {
    const r = 40 + Math.random() * 150
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.3
    starPos[i * 3 + 2] = r * Math.cos(phi)
    starSizes[i] = Math.random() * 1.5 + 0.3
    starColors[i * 3] = 0.8 + Math.random() * 0.2
    starColors[i * 3 + 1] = 0.85 + Math.random() * 0.15
    starColors[i * 3 + 2] = 0.9 + Math.random() * 0.1
}
starGeo.setAttribute('position', new Float32BufferAttribute(starPos, 3))
starGeo.setAttribute('aSize', new Float32BufferAttribute(starSizes, 1))
starGeo.setAttribute('aColor', new Float32BufferAttribute(starColors, 3))

const starMat = new ShaderMaterial({
    vertexShader: `
        attribute float aSize;
        attribute vec3 aColor;
        varying float vAlpha;
        varying vec3 vColor;
        uniform float uTime;
        void main() {
            vColor = aColor;
            float twinkle = sin(uTime * 1.0 + position.x * 0.04) * 0.35 + 0.65;
            vAlpha = (0.25 + aSize * 0.2) * twinkle;
            vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = aSize * (50.0 / -mvPos.z);
            gl_Position = projectionMatrix * mvPos;
        }
    `,
    fragmentShader: `
        varying float vAlpha;
        varying vec3 vColor;
        void main() {
            float d = length(gl_PointCoord - vec2(0.5));
            if (d > 0.5) discard;
            float glow = 1.0 - smoothstep(0.0, 0.5, d);
            gl_FragColor = vec4(vColor, glow * vAlpha);
        }
    `,
    uniforms: { uTime: { value: 0 } },
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
})
scene.add(new Points(starGeo, starMat))

// Sacred Timeline
const sacredColor = '#D69E2E'
const timelineGroup = new Group()
scene.add(timelineGroup)

interface NexusEntry {
    sphere: Mesh
    glow: Mesh
    label: Mesh
    id: string
    position: Vector3
    color: string
    index: number
}

const nexusMeshes: NexusEntry[] = []

const sortedTitles = computed(() =>
    [...props.titles].sort((a, b) => (a.chronology_index ?? 0) - (b.chronology_index ?? 0))
)

function buildTimeline() {
    while (timelineGroup.children.length > 0) timelineGroup.remove(timelineGroup.children[0])
    nexusMeshes.length = 0
    disposables.forEach(d => d.dispose())
    disposables.length = 0

    const titleCount = sortedTitles.value.length
    if (titleCount === 0) return

    const timelineLength = titleCount * 2.5
    const startX = -timelineLength / 2
    const endX = timelineLength / 2

    // Sacred Timeline tube
    const mainPoints: Vector3[] = []
    const segments = 100
    for (let i = 0; i <= segments; i++) {
        const t = i / segments
        const x = startX + t * (endX - startX)
        const y = Math.sin(t * Math.PI * 3) * 0.3
        const z = Math.cos(t * Math.PI * 2) * 0.2
        mainPoints.push(new Vector3(x, y, z))
    }

    const mainCurve = new CatmullRomCurve3(mainPoints)
    const tubeGeo = new TubeGeometry(mainCurve, 200, 0.08, 8, false)
    disposables.push(tubeGeo)

    const tubeMat = new ShaderMaterial({
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float uTime;
            varying vec2 vUv;
            void main() {
                float energy = sin(vUv.x * 80.0 - uTime * 2.0) * 0.5 + 0.5;
                vec3 gold = vec3(0.85, 0.65, 0.13);
                vec3 bright = vec3(1.0, 0.85, 0.3);
                vec3 col = mix(gold, bright, energy * 0.5);
                float alpha = 0.3 + energy * 0.4;
                gl_FragColor = vec4(col, alpha);
            }
        `,
        uniforms: { uTime: { value: 0 } },
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
    })
    disposables.push(tubeMat)
    timelineGroup.add(new Mesh(tubeGeo, tubeMat))

    // Sacred Timeline glow
    const glowTex = createGlowTexture(sacredColor)
    disposables.push(glowTex)
    for (let i = 0; i < 8; i++) {
        const t = (i + 0.5) / 8
        const pos = mainCurve.getPointAt(t)
        const glowGeo = new PlaneGeometry(15, 3)
        disposables.push(glowGeo)
        const glowMat = new MeshBasicMaterial({
            map: glowTex, transparent: true, opacity: 0.06,
            blending: AdditiveBlending, depthWrite: false, side: DoubleSide,
        })
        disposables.push(glowMat)
        const glow = new Mesh(glowGeo, glowMat)
        glow.position.copy(pos)
        timelineGroup.add(glow)
    }

    // Title markers along the sacred timeline
    sortedTitles.value.forEach((title, idx) => {
        const t = (idx + 0.5) / titleCount
        const pos = mainCurve.getPointAt(Math.min(t, 0.999))
        const markerGeo = new SphereGeometry(0.12, 12, 12)
        disposables.push(markerGeo)
        const status = props.progressMap.get(title.id)
        const markerColor = status === 'watched' ? '#48BB78' : status === 'skipped' ? '#718096' : '#ffffff'
        const markerMat = new MeshBasicMaterial({
            color: new Color(markerColor), transparent: true, opacity: 0.6,
        })
        disposables.push(markerMat)
        const marker = new Mesh(markerGeo, markerMat)
        marker.position.copy(pos)
        marker.position.y += 0.15
        timelineGroup.add(marker)
    })

    // Branch curves at nexus events
    branches.forEach((branch, branchIdx) => {
        const chronoPoint = branch.chronology_point
        const t = Math.min(0.999, Math.max(0.001, chronoPoint / titleCount))
        const branchStart = mainCurve.getPointAt(t)
        const branchColor = branch.color || '#805AD5'

        const angle = (branchIdx % 2 === 0 ? 1 : -1) * (0.3 + branchIdx * 0.15)
        const branchLength = 8 + (branch.is_nexus_event ? 4 : 0)

        const branchPoints: Vector3[] = []
        for (let i = 0; i <= 20; i++) {
            const bt = i / 20
            const bx = branchStart.x + bt * branchLength
            const by = branchStart.y + Math.sin(bt * Math.PI * 0.5) * angle * branchLength * 0.4
            const bz = branchStart.z + bt * (branchIdx % 3 - 1) * 2
            branchPoints.push(new Vector3(bx, by, bz))
        }

        const branchCurve = new CatmullRomCurve3(branchPoints)
        const branchTubeGeo = new TubeGeometry(branchCurve, 40, branch.is_pruned ? 0.03 : 0.05, 6, false)
        disposables.push(branchTubeGeo)

        const branchTubeMat = new ShaderMaterial({
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uTime;
                uniform vec3 uColor;
                uniform float uPruned;
                varying vec2 vUv;
                void main() {
                    float energy = sin(vUv.x * 40.0 - uTime * 1.5) * 0.5 + 0.5;
                    float fadeOut = 1.0 - vUv.x * 0.6;
                    float pruneEffect = uPruned > 0.5 ? step(0.5, fract(vUv.x * 15.0)) : 1.0;
                    float alpha = (0.15 + energy * 0.25) * fadeOut * pruneEffect;
                    gl_FragColor = vec4(uColor, alpha);
                }
            `,
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new Color(branchColor) },
                uPruned: { value: branch.is_pruned ? 1.0 : 0.0 },
            },
            transparent: true,
            blending: AdditiveBlending,
            depthWrite: false,
        })
        disposables.push(branchTubeMat)
        timelineGroup.add(new Mesh(branchTubeGeo, branchTubeMat))

        // Nexus event sphere at branch point
        if (branch.is_nexus_event) {
            const sphereGeo = new SphereGeometry(0.3, 16, 16)
            disposables.push(sphereGeo)
            const sphereMat = new ShaderMaterial({
                vertexShader: `
                    varying vec3 vNormal;
                    varying vec3 vViewDir;
                    void main() {
                        vNormal = normalize(normalMatrix * normal);
                        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
                        vViewDir = normalize(-mvPos.xyz);
                        gl_Position = projectionMatrix * mvPos;
                    }
                `,
                fragmentShader: `
                    uniform vec3 uColor;
                    uniform float uTime;
                    uniform float uSelected;
                    varying vec3 vNormal;
                    varying vec3 vViewDir;
                    void main() {
                        float fresnel = pow(1.0 - abs(dot(vNormal, vViewDir)), 2.0);
                        float pulse = sin(uTime * 2.5) * 0.15 + 0.85;
                        float rim = fresnel * 0.8 * pulse;
                        float core = 0.25 + uSelected * 0.2;
                        gl_FragColor = vec4(uColor * (core + rim), core + rim * 0.7);
                    }
                `,
                uniforms: {
                    uColor: { value: new Color(branchColor) },
                    uTime: { value: 0 },
                    uSelected: { value: 0 },
                },
                transparent: true,
                depthWrite: false,
            })
            disposables.push(sphereMat)
            const sphere = new Mesh(sphereGeo, sphereMat)
            sphere.position.copy(branchStart)
            timelineGroup.add(sphere)

            const nexusGlowTex = createGlowTexture(branchColor)
            disposables.push(nexusGlowTex)
            const nexusGlowGeo = new PlaneGeometry(3, 3)
            disposables.push(nexusGlowGeo)
            const nexusGlowMat = new MeshBasicMaterial({
                map: nexusGlowTex, transparent: true, opacity: 0.35,
                blending: AdditiveBlending, depthWrite: false, side: DoubleSide,
            })
            disposables.push(nexusGlowMat)
            const glowMesh = new Mesh(nexusGlowGeo, nexusGlowMat)
            glowMesh.position.copy(branchStart)
            timelineGroup.add(glowMesh)

            const labelTex = createLabelTexture(branch.event_name, branchColor)
            disposables.push(labelTex)
            const labelGeo = new PlaneGeometry(5, 0.6)
            disposables.push(labelGeo)
            const labelMat = new MeshBasicMaterial({
                map: labelTex, transparent: true, opacity: 0.7,
                depthWrite: false, side: DoubleSide,
            })
            disposables.push(labelMat)
            const labelMesh = new Mesh(labelGeo, labelMat)
            labelMesh.position.set(branchStart.x, branchStart.y + 0.8, branchStart.z)
            timelineGroup.add(labelMesh)

            nexusMeshes.push({
                sphere, glow: glowMesh, label: labelMesh,
                id: branch.id, position: branchStart.clone(),
                color: branchColor, index: branchIdx,
            })
        }
    })

    // TVA label at the start
    const tvaLabelTex = createLabelTexture('SACRED TIMELINE', sacredColor)
    disposables.push(tvaLabelTex)
    const tvaGeo = new PlaneGeometry(6, 0.8)
    disposables.push(tvaGeo)
    const tvaMat = new MeshBasicMaterial({
        map: tvaLabelTex, transparent: true, opacity: 0.5,
        depthWrite: false, side: DoubleSide,
    })
    disposables.push(tvaMat)
    const tvaLabel = new Mesh(tvaGeo, tvaMat)
    tvaLabel.position.set(startX + 3, 1.5, 0)
    timelineGroup.add(tvaLabel)
}

watch(() => props.titles, buildTimeline, { deep: true })
buildTimeline()

const { camera, renderer } = useTres()
const cameraAngle = { x: 0.1, y: 0 }
const cameraDistance = ref(25)
const targetAngle = { x: 0.1, y: 0 }
const targetDistance = ref(25)
const cameraTarget = new Vector3(0, 0, 0)
const targetCameraTarget = new Vector3(0, 0, 0)
let isDragging = false
let dragStart = { x: 0, y: 0 }

function flyToNexus(index: number) {
    const entry = nexusMeshes[index]
    if (!entry) return
    targetCameraTarget.copy(entry.position)
    targetDistance.value = 10
    targetAngle.x = 0.15
}

watch(() => props.focusedIndex, (idx) => {
    if (idx >= 0 && idx < nexusMeshes.length) flyToNexus(idx)
})

watch(() => props.selectedId, (id) => {
    if (id) {
        const idx = nexusMeshes.findIndex(e => e.id === id)
        if (idx >= 0) {
            emit('update:focusedIndex', idx)
            flyToNexus(idx)
            targetDistance.value = 8
        }
    }
})

function onPointerDown(e: PointerEvent) {
    isDragging = true
    dragStart = { x: e.clientX, y: e.clientY }
}

function onPointerMove(e: PointerEvent) {
    const rect = (e.target as HTMLElement)?.closest('canvas')?.getBoundingClientRect()
    if (!rect) return
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

    if (isDragging) {
        const dx = e.clientX - dragStart.x
        const dy = e.clientY - dragStart.y
        targetAngle.y -= dx * 0.004
        targetAngle.x = Math.max(-0.3, Math.min(0.6, targetAngle.x + dy * 0.004))
        targetCameraTarget.x -= dx * 0.05
        dragStart = { x: e.clientX, y: e.clientY }
    }

    if (!camera.value) return
    raycaster.setFromCamera(pointer, camera.value)
    const spheres = nexusMeshes.map(e => e.sphere)
    const intersects = raycaster.intersectObjects(spheres, false)
    emit('hover', intersects.length > 0 ? nexusMeshes.find(e => e.sphere === intersects[0].object)?.id ?? null : null)
}

function onPointerUp(e: PointerEvent) {
    const dx = Math.abs(e.clientX - dragStart.x)
    const dy = Math.abs(e.clientY - dragStart.y)
    isDragging = false

    if (dx < 5 && dy < 5 && camera.value) {
        raycaster.setFromCamera(pointer, camera.value)
        const spheres = nexusMeshes.map(e => e.sphere)
        const intersects = raycaster.intersectObjects(spheres, false)
        if (intersects.length > 0) {
            const hit = nexusMeshes.find(e => e.sphere === intersects[0].object)
            if (hit) emit('select', hit.id)
        } else {
            emit('select', null)
            targetDistance.value = 25
            targetCameraTarget.set(0, 0, 0)
        }
    }
}

function onWheel(e: WheelEvent) {
    e.preventDefault()
    const speed = e.ctrlKey || e.metaKey ? 0.003 : 0.015
    targetDistance.value = Math.max(5, Math.min(60, targetDistance.value + e.deltaY * speed))
}

onMounted(() => {
    const canvas = renderer.value?.domElement
    if (!canvas) return
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('wheel', onWheel, { passive: false })
})

const { onLoop } = useRenderLoop()
let elapsed = 0

onLoop(({ delta }) => {
    elapsed += delta
    starMat.uniforms.uTime.value = elapsed

    timelineGroup.children.forEach(child => {
        const mat = (child as Mesh).material as ShaderMaterial
        if (mat.uniforms?.uTime) mat.uniforms.uTime.value = elapsed
    })

    if (camera.value) {
        cameraAngle.x += (targetAngle.x - cameraAngle.x) * 0.05
        cameraAngle.y += (targetAngle.y - cameraAngle.y) * 0.05
        cameraDistance.value += (targetDistance.value - cameraDistance.value) * 0.05
        cameraTarget.lerp(targetCameraTarget, 0.05)

        const d = cameraDistance.value
        camera.value.position.set(
            cameraTarget.x + Math.sin(cameraAngle.y) * Math.cos(cameraAngle.x) * d,
            cameraTarget.y + Math.sin(cameraAngle.x) * d,
            cameraTarget.z + Math.cos(cameraAngle.y) * Math.cos(cameraAngle.x) * d,
        )
        camera.value.lookAt(cameraTarget)
    }

    for (const entry of nexusMeshes) {
        const isSelected = entry.id === props.selectedId
        const isHovered = entry.id === props.hoveredId
        const isFocused = entry.index === props.focusedIndex

        const sphereMat = entry.sphere.material as ShaderMaterial
        sphereMat.uniforms.uTime.value = elapsed
        const targetSel = (isSelected || isFocused) ? 1.0 : 0.0
        sphereMat.uniforms.uSelected.value += (targetSel - sphereMat.uniforms.uSelected.value) * 0.1

        const targetScale = isSelected ? 1.5 : isHovered ? 1.3 : isFocused ? 1.2 : 1.0
        const s = entry.sphere.scale.x + (targetScale - entry.sphere.scale.x) * 0.08
        entry.sphere.scale.setScalar(s)

        const glowMat = entry.glow.material as MeshBasicMaterial
        glowMat.opacity = (isSelected ? 0.5 : isHovered ? 0.4 : 0.3) + Math.sin(elapsed * 2) * 0.05

        if (camera.value) {
            entry.glow.quaternion.copy(camera.value.quaternion)
            entry.label.quaternion.copy(camera.value.quaternion)
        }

        const labelMat = entry.label.material as MeshBasicMaterial
        labelMat.opacity = isSelected || isHovered || isFocused ? 0.95 : 0.6
    }

    // Billboard TVA label
    timelineGroup.children.forEach(child => {
        if (child instanceof Mesh && camera.value) {
            const mat = child.material as MeshBasicMaterial
            if (mat.map && !mat.blending && mat.opacity <= 0.6) {
                child.quaternion.copy(camera.value.quaternion)
            }
        }
    })
})

onUnmounted(() => {
    const canvas = renderer.value?.domElement
    if (canvas) {
        canvas.removeEventListener('pointerdown', onPointerDown)
        canvas.removeEventListener('pointermove', onPointerMove)
        canvas.removeEventListener('pointerup', onPointerUp)
        canvas.removeEventListener('wheel', onWheel)
    }
    disposables.forEach(d => d.dispose())
    starGeo.dispose()
    starMat.dispose()
})
</script>
