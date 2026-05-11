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
import type { LocationJson } from '~/types/multiverse'
import locationsJson from '../../../data/locations.json'

const props = defineProps<{
    hoveredCode: string | null
    selectedCode: string | null
    focusedIndex: number
    filterType: string | null
}>()

const emit = defineEmits<{
    hover: [code: string | null]
    select: [code: string | null]
    'update:focusedIndex': [index: number]
}>()

const locations = computed(() => {
    let locs = locationsJson as LocationJson[]
    if (props.filterType) {
        locs = locs.filter(l => l.type === props.filterType)
    }
    return locs
})

const typeColors: Record<string, string> = {
    planet: '#4299E1',
    realm: '#D69E2E',
    dimension: '#9F7AEA',
    construct: '#ED8936',
    region: '#48BB78',
}

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
    grad.addColorStop(0.15, `rgba(${r},${g},${b},0.3)`)
    grad.addColorStop(0.4, `rgba(${r},${g},${b},0.08)`)
    grad.addColorStop(0.7, `rgba(${r},${g},${b},0.02)`)
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, size, size)
    const tex = new CanvasTexture(canvas)
    tex.minFilter = LinearFilter
    return tex
}

function createLabelTexture(name: string, color: string, titleCount: number): CanvasTexture {
    const w = 256
    const h = 64
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, w, h)

    ctx.font = 'bold 20px system-ui'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillText(name.toUpperCase(), w / 2 + 1, h / 2 - 6 + 1)
    ctx.fillStyle = color
    ctx.globalAlpha = 0.95
    ctx.fillText(name.toUpperCase(), w / 2, h / 2 - 6)

    ctx.globalAlpha = 0.5
    ctx.font = '14px system-ui'
    ctx.fillStyle = '#ffffff'
    ctx.fillText(`${titleCount} titles`, w / 2, h / 2 + 16)
    ctx.globalAlpha = 1.0

    const tex = new CanvasTexture(canvas)
    tex.minFilter = LinearFilter
    return tex
}

const scene = new Group()
const raycaster = new Raycaster()
const pointer = new Vector2()

interface LocationEntry {
    sphere: Mesh
    glow: Mesh
    label: Mesh
    code: string
    basePos: Vector3
    color: string
    radius: number
    titleCount: number
    index: number
}

const locationMeshes: LocationEntry[] = []
const disposables: { dispose: () => void }[] = []

const starCount = 2000
const starGeo = new BufferGeometry()
const starPositions = new Float32Array(starCount * 3)
const starSizes = new Float32Array(starCount)
const starColors = new Float32Array(starCount * 3)
for (let i = 0; i < starCount; i++) {
    const r = 50 + Math.random() * 200
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.5
    starPositions[i * 3 + 2] = r * Math.cos(phi)
    starSizes[i] = Math.random() * 2 + 0.3
    const temp = Math.random()
    starColors[i * 3] = temp < 0.3 ? 0.7 : temp < 0.6 ? 1.0 : 0.9
    starColors[i * 3 + 1] = temp < 0.3 ? 0.85 : temp < 0.6 ? 0.95 : 0.92
    starColors[i * 3 + 2] = temp < 0.3 ? 1.0 : temp < 0.6 ? 0.85 : 0.95
}
starGeo.setAttribute('position', new Float32BufferAttribute(starPositions, 3))
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
            float twinkle = sin(uTime * 1.2 + position.x * 0.05 + position.z * 0.08) * 0.4 + 0.6;
            vAlpha = (0.3 + aSize * 0.25) * twinkle;
            vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = aSize * (60.0 / -mvPos.z);
            gl_Position = projectionMatrix * mvPos;
        }
    `,
    fragmentShader: `
        varying float vAlpha;
        varying vec3 vColor;
        void main() {
            float d = length(gl_PointCoord - vec2(0.5));
            if (d > 0.5) discard;
            float core = 1.0 - smoothstep(0.0, 0.1, d);
            float glow = 1.0 - smoothstep(0.0, 0.5, d);
            vec3 col = mix(vColor, vec3(1.0), core * 0.6);
            gl_FragColor = vec4(col, (glow * 0.5 + core * 0.5) * vAlpha);
        }
    `,
    uniforms: { uTime: { value: 0 } },
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
})
const stars = new Points(starGeo, starMat)
scene.add(stars)

const nebulaGroup = new Group()
scene.add(nebulaGroup)

function addNebula(x: number, y: number, z: number, color: string, size: number) {
    const tex = createGlowTexture(color)
    disposables.push(tex)
    const geo = new PlaneGeometry(size, size)
    disposables.push(geo)
    const mat = new MeshBasicMaterial({
        map: tex, transparent: true, opacity: 0.08,
        blending: AdditiveBlending, depthWrite: false, side: DoubleSide,
    })
    disposables.push(mat)
    const m = new Mesh(geo, mat)
    m.position.set(x, y, z)
    m.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0)
    nebulaGroup.add(m)
}

addNebula(0, 8, -15, '#D69E2E', 35)
addNebula(-12, -8, 5, '#9F7AEA', 30)
addNebula(15, -5, -18, '#4299E1', 40)
addNebula(-18, -3, -10, '#ED8936', 25)
addNebula(8, -10, 5, '#48BB78', 28)

const connectionGroup = new Group()
scene.add(connectionGroup)

const locationGroup = new Group()
scene.add(locationGroup)

function buildLocations() {
    while (locationGroup.children.length > 0) locationGroup.remove(locationGroup.children[0])
    while (connectionGroup.children.length > 0) connectionGroup.remove(connectionGroup.children[0])
    locationMeshes.length = 0
    disposables.forEach(d => d.dispose())
    disposables.length = 0

    const locs = locations.value

    locs.forEach((loc, index) => {
        const color = loc.color || typeColors[loc.type] || '#ffffff'
        const titleCount = loc.title_slugs.length
        const baseRadius = Math.max(0.3, loc.radius * (0.6 + titleCount * 0.04))
        const pos = new Vector3(loc.position_3d[0], loc.position_3d[1], loc.position_3d[2])

        const sphereGeo = new SphereGeometry(baseRadius, 24, 24)
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
                uniform float uHover;
                uniform float uSelected;
                varying vec3 vNormal;
                varying vec3 vViewDir;
                void main() {
                    float fresnel = pow(1.0 - abs(dot(vNormal, vViewDir)), 2.5);
                    float pulse = sin(uTime * 1.5) * 0.1 + 0.9;
                    float rim = fresnel * (0.6 + uHover * 0.3 + uSelected * 0.4) * pulse;
                    float core = 0.15 + uHover * 0.1 + uSelected * 0.15;
                    vec3 col = uColor * (core + rim);
                    float alpha = core + rim * 0.8;
                    gl_FragColor = vec4(col, alpha);
                }
            `,
            uniforms: {
                uColor: { value: new Color(color) },
                uTime: { value: 0 },
                uHover: { value: 0 },
                uSelected: { value: 0 },
            },
            transparent: true,
            depthWrite: false,
            side: FrontSide,
        })
        disposables.push(sphereMat)

        const sphere = new Mesh(sphereGeo, sphereMat)
        sphere.position.copy(pos)
        locationGroup.add(sphere)

        const glowTex = createGlowTexture(color)
        disposables.push(glowTex)
        const glowGeo = new PlaneGeometry(baseRadius * 5, baseRadius * 5)
        disposables.push(glowGeo)
        const glowMat = new MeshBasicMaterial({
            map: glowTex, transparent: true, opacity: 0.3,
            blending: AdditiveBlending, depthWrite: false, side: DoubleSide,
        })
        disposables.push(glowMat)
        const glow = new Mesh(glowGeo, glowMat)
        glow.position.copy(pos)
        locationGroup.add(glow)

        const labelTex = createLabelTexture(loc.name, color, titleCount)
        disposables.push(labelTex)
        const labelGeo = new PlaneGeometry(3.5, 0.9)
        disposables.push(labelGeo)
        const labelMat = new MeshBasicMaterial({
            map: labelTex, transparent: true, opacity: 0.8,
            depthWrite: false, side: DoubleSide,
        })
        disposables.push(labelMat)
        const label = new Mesh(labelGeo, labelMat)
        label.position.set(pos.x, pos.y + baseRadius + 0.8, pos.z)
        locationGroup.add(label)

        locationMeshes.push({
            sphere, glow, label,
            code: loc.id,
            basePos: pos.clone(),
            color, radius: baseRadius,
            titleCount, index,
        })
    })

    buildConnections(locs)
}

function buildConnections(locs: LocationJson[]) {
    const locMap = new Map<string, LocationJson>()
    locs.forEach(l => locMap.set(l.id, l))

    const connections = new Set<string>()
    for (const loc of locs) {
        if (loc.parent_code && locMap.has(loc.parent_code)) {
            const key = [loc.id, loc.parent_code].sort().join('|')
            if (!connections.has(key)) {
                connections.add(key)
                const parent = locMap.get(loc.parent_code)!
                const start = new Vector3(...loc.position_3d)
                const end = new Vector3(...parent.position_3d)
                const mid = new Vector3().addVectors(start, end).multiplyScalar(0.5)
                mid.y += 2

                const curve = new CatmullRomCurve3([start, mid, end])
                const tubeGeo = new TubeGeometry(curve, 32, 0.03, 8, false)
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
                        uniform vec3 uColor;
                        varying vec2 vUv;
                        void main() {
                            float energy = sin(vUv.x * 30.0 - uTime * 2.0) * 0.5 + 0.5;
                            float alpha = 0.05 + energy * 0.15;
                            gl_FragColor = vec4(uColor, alpha);
                        }
                    `,
                    uniforms: {
                        uTime: { value: 0 },
                        uColor: { value: new Color(loc.color || '#ffffff') },
                    },
                    transparent: true,
                    blending: AdditiveBlending,
                    depthWrite: false,
                })
                disposables.push(tubeMat)
                const tube = new Mesh(tubeGeo, tubeMat)
                connectionGroup.add(tube)
            }
        }
    }
}

buildLocations()

watch(() => [props.filterType], () => {
    buildLocations()
})

const { camera } = useTres()
const cameraAngle = { x: 0.15, y: 0 }
const cameraDistance = ref(30)
const targetAngle = { x: 0.15, y: 0 }
const targetDistance = ref(30)
const cameraTarget = new Vector3(0, 0, 0)
const targetCameraTarget = new Vector3(0, 0, 0)
let isDragging = false
let dragStart = { x: 0, y: 0 }
let hasFocus = false

function flyToLocation(index: number) {
    const entry = locationMeshes[index]
    if (!entry) return
    targetCameraTarget.copy(entry.basePos)
    targetDistance.value = Math.max(8, entry.radius * 12)
    targetAngle.y = 0.05
    hasFocus = true
}

watch(() => props.focusedIndex, (idx) => {
    if (idx >= 0 && idx < locationMeshes.length) {
        flyToLocation(idx)
    }
})

watch(() => props.selectedCode, (code) => {
    if (code) {
        const idx = locationMeshes.findIndex(e => e.code === code)
        if (idx >= 0) {
            emit('update:focusedIndex', idx)
            flyToLocation(idx)
            targetDistance.value = Math.max(6, locationMeshes[idx].radius * 8)
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
        targetAngle.y -= dx * 0.005
        targetAngle.x = Math.max(-0.5, Math.min(0.8, targetAngle.x + dy * 0.005))
        dragStart = { x: e.clientX, y: e.clientY }
    }

    if (!camera.value) return
    raycaster.setFromCamera(pointer, camera.value)
    const spheres = locationMeshes.map(e => e.sphere)
    const intersects = raycaster.intersectObjects(spheres, false)
    if (intersects.length > 0) {
        const hit = locationMeshes.find(e => e.sphere === intersects[0].object)
        emit('hover', hit?.code ?? null)
    } else {
        emit('hover', null)
    }
}

function onPointerUp(e: PointerEvent) {
    const dx = Math.abs(e.clientX - dragStart.x)
    const dy = Math.abs(e.clientY - dragStart.y)
    isDragging = false

    if (dx < 5 && dy < 5 && camera.value) {
        raycaster.setFromCamera(pointer, camera.value)
        const spheres = locationMeshes.map(e => e.sphere)
        const intersects = raycaster.intersectObjects(spheres, false)
        if (intersects.length > 0) {
            const hit = locationMeshes.find(e => e.sphere === intersects[0].object)
            if (hit) {
                emit('select', hit.code)
            }
        } else {
            emit('select', null)
            hasFocus = false
            targetDistance.value = 30
            targetCameraTarget.set(0, 0, 0)
        }
    }
}

function onWheel(e: WheelEvent) {
    e.preventDefault()
    const speed = e.ctrlKey || e.metaKey ? 0.003 : 0.015
    targetDistance.value = Math.max(5, Math.min(80, targetDistance.value + e.deltaY * speed))
}

if (typeof window !== 'undefined') {
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
}

let flyProgress = 1.0

const { onLoop } = useRenderLoop()
let elapsed = 0

onLoop(({ delta }) => {
    elapsed += delta
    starMat.uniforms.uTime.value = elapsed

    connectionGroup.children.forEach(child => {
        const mat = (child as Mesh).material as ShaderMaterial
        if (mat.uniforms?.uTime) mat.uniforms.uTime.value = elapsed
    })

    nebulaGroup.children.forEach(child => {
        child.rotation.z += delta * 0.008
        const mat = (child as Mesh).material as MeshBasicMaterial
        mat.opacity = 0.08 + Math.sin(elapsed * 0.3 + child.position.x) * 0.03
    })

    if (camera.value) {
        cameraAngle.x += (targetAngle.x - cameraAngle.x) * 0.06
        cameraAngle.y += (targetAngle.y - cameraAngle.y) * 0.06
        cameraDistance.value += (targetDistance.value - cameraDistance.value) * 0.06
        cameraTarget.lerp(targetCameraTarget, 0.06)

        const d = cameraDistance.value
        camera.value.position.set(
            cameraTarget.x + Math.sin(cameraAngle.y) * Math.cos(cameraAngle.x) * d,
            cameraTarget.y + Math.sin(cameraAngle.x) * d,
            cameraTarget.z + Math.cos(cameraAngle.y) * Math.cos(cameraAngle.x) * d,
        )
        camera.value.lookAt(cameraTarget)
    }

    for (const entry of locationMeshes) {
        const isHovered = entry.code === props.hoveredCode
        const isSelected = entry.code === props.selectedCode
        const isFocused = entry.index === props.focusedIndex

        const sphereMat = entry.sphere.material as ShaderMaterial
        sphereMat.uniforms.uTime.value = elapsed
        const targetHover = isHovered ? 1.0 : 0.0
        const targetSelected = (isSelected || isFocused) ? 1.0 : 0.0
        sphereMat.uniforms.uHover.value += (targetHover - sphereMat.uniforms.uHover.value) * 0.1
        sphereMat.uniforms.uSelected.value += (targetSelected - sphereMat.uniforms.uSelected.value) * 0.1

        const bobSpeed = 0.3 + (entry.index % 5) * 0.06
        const bobAmp = 0.06 + (entry.index % 3) * 0.02
        const bob = Math.sin(elapsed * bobSpeed + entry.basePos.x * 0.2 + entry.index * 0.9) * bobAmp
        entry.sphere.position.y = entry.basePos.y + bob
        entry.glow.position.y = entry.basePos.y + bob
        entry.label.position.y = entry.basePos.y + entry.radius + 0.8 + bob

        const targetScale = isSelected ? 1.4 : isHovered ? 1.2 : isFocused ? 1.15 : 1.0
        const currentScale = entry.sphere.scale.x
        const newScale = currentScale + (targetScale - currentScale) * 0.08
        entry.sphere.scale.setScalar(newScale)

        const glowMat = entry.glow.material as MeshBasicMaterial
        const glowPulse = isSelected || isFocused ? Math.sin(elapsed * 2.0) * 0.08 : 0
        glowMat.opacity = (isSelected ? 0.5 : isHovered ? 0.4 : isFocused ? 0.35 : 0.2) + glowPulse

        if (camera.value) {
            entry.glow.quaternion.copy(camera.value.quaternion)
            entry.label.quaternion.copy(camera.value.quaternion)
        }

        const labelMat = entry.label.material as MeshBasicMaterial
        labelMat.opacity = isSelected || isHovered || isFocused ? 0.95 : 0.6
    }
})

onUnmounted(() => {
    if (typeof window !== 'undefined') {
        window.removeEventListener('pointerdown', onPointerDown)
        window.removeEventListener('pointermove', onPointerMove)
        window.removeEventListener('pointerup', onPointerUp)
    }
    disposables.forEach(d => d.dispose())
    starGeo.dispose()
    starMat.dispose()
})
</script>
