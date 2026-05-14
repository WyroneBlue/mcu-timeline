<template>
    <primitive :object="scene" />
</template>

<script setup lang="ts">
import {
    Group, Mesh, SphereGeometry, PlaneGeometry, BufferGeometry,
    Float32BufferAttribute, Points, ShaderMaterial, MeshBasicMaterial,
    AdditiveBlending, Color, Vector3, Raycaster, Vector2,
    CylinderGeometry, DoubleSide, CanvasTexture, FrontSide
} from 'three'
import { useRenderLoop, useTres } from '@tresjs/core'
import gsap from 'gsap'
import type { LocationJson } from '~/types/multiverse'
import {
    latLngToVector3, createEarthTexture,
    createPinGlowTexture, createPinLabelTexture
} from '~/composables/useEarthGlobe'
import locationsJson from '../../../data/locations.json'

const props = defineProps<{
    hoveredCode: string | null
    selectedCode: string | null
}>()

const emit = defineEmits<{
    hover: [code: string | null]
    select: [code: string | null]
}>()

const GLOBE_RADIUS = 5
const PIN_SPHERE_RADIUS = 0.12
const PIN_STEM_HEIGHT = 0.4

const earthLocations = computed(() =>
    (locationsJson as LocationJson[]).filter(l => l.parent_code === 'earth' && l.lat != null && l.lng != null)
)

const globeVertexShader = `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewDir;
    void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vViewDir = normalize(-mvPos.xyz);
        gl_Position = projectionMatrix * mvPos;
    }
`

const globeFragmentShader = `
    uniform sampler2D uEarthMap;
    uniform float uTime;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewDir;

    void main() {
        vec4 mapColor = texture2D(uEarthMap, vUv);
        float fresnel = pow(1.0 - abs(dot(vNormal, vViewDir)), 3.0);

        vec3 baseColor = mapColor.rgb;
        vec3 rimColor = vec3(0.263, 0.6, 0.882);
        vec3 col = baseColor + rimColor * fresnel * 0.6;

        float scanline = sin(vUv.y * 300.0 + uTime * 0.5) * 0.02 + 1.0;
        col *= scanline;

        float alpha = 0.92 + fresnel * 0.08;
        gl_FragColor = vec4(col, alpha);
    }
`

const atmosphereVertexShader = `
    varying vec3 vNormal;
    varying vec3 vViewDir;
    void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vViewDir = normalize(-mvPos.xyz);
        gl_Position = projectionMatrix * mvPos;
    }
`

const atmosphereFragmentShader = `
    uniform float uTime;
    varying vec3 vNormal;
    varying vec3 vViewDir;

    void main() {
        float fresnel = pow(1.0 - abs(dot(vNormal, vViewDir)), 4.0);
        vec3 color = vec3(0.263, 0.6, 0.882);
        float pulse = sin(uTime * 0.8) * 0.05 + 1.0;
        float alpha = fresnel * 0.45 * pulse;
        gl_FragColor = vec4(color, alpha);
    }
`

const scene = new Group()
const raycaster = new Raycaster()
const pointer = new Vector2()

interface PinEntry {
    sphere: Mesh
    stem: Mesh
    glow: Mesh
    label: Mesh
    code: string
    surfacePos: Vector3
    surfaceNormal: Vector3
    color: string
    titleCount: number
    index: number
}

const disposables: { dispose: () => void }[] = []

const pins: PinEntry[] = []
let globe: Mesh | null = null
let atmosphere: Mesh | null = null
let starField: Points | null = null
let earthTexture: CanvasTexture | null = null
let globeMaterial: ShaderMaterial | null = null
let atmosphereMaterial: ShaderMaterial | null = null

const _tmpVec = new Vector3()
const _tmpVec2 = new Vector3()
const cameraAngle = { x: 0.3, y: 0 }
const cameraGoal = { x: 0.3, y: 0 }
const cameraDistance = ref(14)
const cameraDistanceGoal = ref(14)
let isDragging = false
let dragStart = { x: 0, y: 0 }
let pointerStart = { x: 0, y: 0 }
let idleTime = 0
const { camera, renderer } = useTres()

function disposeScene() {
    disposables.forEach(d => d.dispose())
    disposables.length = 0
    while (scene.children.length) scene.remove(scene.children[0])
    pins.length = 0
}

function buildScene() {
    disposeScene()

    // Stars
    const starCount = 1500
    const starGeo = new BufferGeometry()
    const starPos = new Float32Array(starCount * 3)
    for (let i = 0; i < starCount * 3; i += 3) {
        const r = 80 + Math.random() * 120
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)
        starPos[i] = r * Math.sin(phi) * Math.cos(theta)
        starPos[i + 1] = r * Math.sin(phi) * Math.sin(theta)
        starPos[i + 2] = r * Math.cos(phi)
    }
    starGeo.setAttribute('position', new Float32BufferAttribute(starPos, 3))
    const starMat = new ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: `
            varying float vBrightness;
            uniform float uTime;
            void main() {
                vBrightness = 0.3 + 0.7 * fract(sin(dot(position.xy, vec2(12.9898, 78.233))) * 43758.5453);
                vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = (1.5 + vBrightness) * (200.0 / -mvPos.z);
                gl_Position = projectionMatrix * mvPos;
            }
        `,
        fragmentShader: `
            varying float vBrightness;
            uniform float uTime;
            void main() {
                float d = length(gl_PointCoord - 0.5) * 2.0;
                if (d > 1.0) discard;
                float alpha = (1.0 - d * d) * vBrightness * (0.8 + sin(uTime * 2.0 + vBrightness * 20.0) * 0.2);
                gl_FragColor = vec4(1.0, 1.0, 1.0, alpha * 0.5);
            }
        `,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
    })
    starField = new Points(starGeo, starMat)
    scene.add(starField)
    disposables.push(starGeo, starMat)

    // Globe
    earthTexture = createEarthTexture(1024, 512)
    disposables.push(earthTexture)
    const globeGeo = new SphereGeometry(GLOBE_RADIUS, 64, 64)
    globeMaterial = new ShaderMaterial({
        uniforms: {
            uEarthMap: { value: earthTexture },
            uTime: { value: 0 },
        },
        vertexShader: globeVertexShader,
        fragmentShader: globeFragmentShader,
        transparent: true,
    })
    globe = new Mesh(globeGeo, globeMaterial)
    globe.renderOrder = 1
    scene.add(globe)
    disposables.push(globeGeo, globeMaterial)

    // Atmosphere
    const atmosGeo = new SphereGeometry(GLOBE_RADIUS * 1.04, 64, 64)
    atmosphereMaterial = new ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: atmosphereVertexShader,
        fragmentShader: atmosphereFragmentShader,
        transparent: true,
        side: FrontSide,
        depthWrite: false,
    })
    atmosphere = new Mesh(atmosGeo, atmosphereMaterial)
    atmosphere.renderOrder = 2
    scene.add(atmosphere)
    disposables.push(atmosGeo, atmosphereMaterial)

    // Pins
    const locs = earthLocations.value
    for (let i = 0; i < locs.length; i++) {
        const loc = locs[i]
        const surfacePos = latLngToVector3(loc.lat!, loc.lng!, GLOBE_RADIUS)
        const surfaceNormal = surfacePos.clone().normalize()
        const color = loc.color || '#4299E1'

        // Pin sphere
        const sphereGeo = new SphereGeometry(PIN_SPHERE_RADIUS, 16, 16)
        const sphereMat = new MeshBasicMaterial({
            color: new Color(color),
            transparent: true,
            opacity: 0.95,
        })
        const sphere = new Mesh(sphereGeo, sphereMat)
        const pinTop = surfacePos.clone().add(surfaceNormal.clone().multiplyScalar(PIN_STEM_HEIGHT))
        sphere.position.copy(pinTop)
        sphere.renderOrder = 4
        scene.add(sphere)
        disposables.push(sphereGeo, sphereMat)

        // Pin stem
        const stemGeo = new CylinderGeometry(0.02, 0.02, PIN_STEM_HEIGHT, 4)
        const stemMat = new MeshBasicMaterial({
            color: new Color(color),
            transparent: true,
            opacity: 0.4,
        })
        const stem = new Mesh(stemGeo, stemMat)
        const stemMid = surfacePos.clone().add(surfaceNormal.clone().multiplyScalar(PIN_STEM_HEIGHT / 2))
        stem.position.copy(stemMid)
        stem.lookAt(surfacePos.clone().add(surfaceNormal))
        stem.rotateX(Math.PI / 2)
        stem.renderOrder = 3
        scene.add(stem)
        disposables.push(stemGeo, stemMat)

        // Pin glow
        const glowTex = createPinGlowTexture(color)
        const glowGeo = new PlaneGeometry(0.6, 0.6)
        const glowMat = new MeshBasicMaterial({
            map: glowTex,
            transparent: true,
            depthWrite: false,
            blending: AdditiveBlending,
            side: DoubleSide,
            opacity: 0.6,
        })
        const glowMesh = new Mesh(glowGeo, glowMat)
        glowMesh.position.copy(pinTop)
        glowMesh.renderOrder = 5
        scene.add(glowMesh)
        disposables.push(glowTex, glowGeo, glowMat)

        // Pin label
        const labelTex = createPinLabelTexture(loc.name, color, loc.title_slugs.length)
        const labelGeo = new PlaneGeometry(2.0, 0.5)
        const labelMat = new MeshBasicMaterial({
            map: labelTex,
            transparent: true,
            depthWrite: false,
            side: DoubleSide,
            opacity: 0,
        })
        const labelMesh = new Mesh(labelGeo, labelMat)
        labelMesh.position.copy(pinTop.clone().add(surfaceNormal.clone().multiplyScalar(0.4)))
        labelMesh.renderOrder = 6
        scene.add(labelMesh)
        disposables.push(labelTex, labelGeo, labelMat)

        pins.push({
            sphere,
            stem,
            glow: glowMesh,
            label: labelMesh,
            code: loc.id,
            surfacePos,
            surfaceNormal,
            color,
            titleCount: loc.title_slugs.length,
            index: i,
        })
    }
}

onMounted(() => {
    buildScene()

    const el = renderer.value?.domElement
    if (!el) return

    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerup', onPointerUp)
    el.addEventListener('wheel', onWheel, { passive: false })

    onUnmounted(() => {
        el.removeEventListener('pointerdown', onPointerDown)
        el.removeEventListener('pointermove', onPointerMove)
        el.removeEventListener('pointerup', onPointerUp)
        el.removeEventListener('wheel', onWheel)
        disposeScene()
    })
})

watch(earthLocations, buildScene, { deep: true })

function onPointerDown(e: PointerEvent) {
    isDragging = true
    dragStart = { x: cameraAngle.x, y: cameraAngle.y }
    pointerStart = { x: e.clientX, y: e.clientY }
    idleTime = 0
}

function onPointerMove(e: PointerEvent) {
    const el = renderer.value?.domElement
    if (!el) return

    const rect = el.getBoundingClientRect()
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

    if (isDragging) {
        const dx = e.clientX - pointerStart.x
        const dy = e.clientY - pointerStart.y
        cameraGoal.y = dragStart.y + dx * 0.005
        cameraGoal.x = Math.max(-0.8, Math.min(0.8, dragStart.x + dy * 0.005))
        idleTime = 0
    }
}

function onPointerUp(e: PointerEvent) {
    const dx = Math.abs(e.clientX - pointerStart.x)
    const dy = Math.abs(e.clientY - pointerStart.y)
    const wasClick = dx < 5 && dy < 5

    isDragging = false

    if (wasClick && camera.value) {
        raycaster.setFromCamera(pointer, camera.value)

        const pinSpheres = pins.map(p => p.sphere)
        const hits = raycaster.intersectObjects(pinSpheres)
        if (hits.length > 0) {
            const pin = pins.find(p => p.sphere === hits[0].object)
            if (pin) {
                emit('select', pin.code)
                flyToPin(pin)
                return
            }
        }

        const globeHits = globe ? raycaster.intersectObject(globe) : []
        if (globeHits.length === 0 && hits.length === 0) {
            emit('select', null)
        }
    }
}

function onWheel(e: WheelEvent) {
    e.preventDefault()
    const speed = e.ctrlKey || e.metaKey ? 0.003 : 0.015
    cameraDistanceGoal.value = Math.max(8, Math.min(30, cameraDistanceGoal.value + e.deltaY * speed))
    idleTime = 0
}

function flyToPin(pin: PinEntry) {
    const targetAngleY = Math.atan2(pin.surfacePos.x, pin.surfacePos.z)
    const targetAngleX = Math.asin(Math.max(-1, Math.min(1, pin.surfacePos.y / GLOBE_RADIUS)))

    gsap.to(cameraGoal, {
        x: targetAngleX * 0.5,
        y: targetAngleY,
        duration: 1.2,
        ease: 'power3.inOut',
    })
    gsap.to(cameraDistanceGoal, {
        value: 10,
        duration: 1.2,
        ease: 'power3.inOut',
    })
}

const { onLoop } = useRenderLoop()

onLoop(({ delta }) => {
    if (!camera.value) return
    const t = performance.now() * 0.001

    // Update shader time uniforms
    if (globeMaterial) globeMaterial.uniforms.uTime.value = t
    if (atmosphereMaterial) atmosphereMaterial.uniforms.uTime.value = t
    if (starField) (starField.material as ShaderMaterial).uniforms.uTime.value = t

    // Idle auto-rotation
    idleTime += delta
    if (!isDragging && idleTime > 3) {
        cameraGoal.y += delta * 0.08
    }

    // Smooth camera interpolation
    cameraAngle.x += (cameraGoal.x - cameraAngle.x) * 0.08
    cameraAngle.y += (cameraGoal.y - cameraAngle.y) * 0.08
    cameraDistance.value += (cameraDistanceGoal.value - cameraDistance.value) * 0.08

    const dist = cameraDistance.value
    const cx = Math.sin(cameraAngle.y) * Math.cos(cameraAngle.x) * dist
    const cy = Math.sin(cameraAngle.x) * dist
    const cz = Math.cos(cameraAngle.y) * Math.cos(cameraAngle.x) * dist

    camera.value.position.set(cx, cy, cz)
    camera.value.lookAt(0, 0, 0)

    // Raycasting for hover
    if (camera.value && !isDragging) {
        raycaster.setFromCamera(pointer, camera.value)
        const pinSpheres = pins.map(p => p.sphere)
        const hits = raycaster.intersectObjects(pinSpheres)
        const hoveredPin = hits.length > 0 ? pins.find(p => p.sphere === hits[0].object) : null
        const newCode = hoveredPin?.code ?? null
        if (newCode !== props.hoveredCode) {
            emit('hover', newCode)
        }
    }

    // Update pins
    for (const pin of pins) {
        const isHovered = pin.code === props.hoveredCode
        const isSelected = pin.code === props.selectedCode
        const targetScale = isSelected ? 1.6 : isHovered ? 1.3 : 1.0
        const currentScale = pin.sphere.scale.x
        const newScale = currentScale + (targetScale - currentScale) * 0.12
        pin.sphere.scale.setScalar(newScale)

        // Bob animation
        const bob = Math.sin(t * 1.5 + pin.index * 1.7) * 0.03
        _tmpVec.copy(pin.surfaceNormal).multiplyScalar(PIN_STEM_HEIGHT + bob)
        _tmpVec.add(pin.surfacePos)
        pin.sphere.position.copy(_tmpVec)
        pin.glow.position.copy(_tmpVec)
        _tmpVec2.copy(pin.surfaceNormal).multiplyScalar(0.35).add(_tmpVec)
        pin.label.position.copy(_tmpVec2)

        // Glow pulse
        const glowPulse = 0.4 + Math.sin(t * 2 + pin.index * 2.3) * 0.2
        ;(pin.glow.material as MeshBasicMaterial).opacity = isHovered || isSelected ? 0.9 : glowPulse

        // Billboard glow + label
        if (camera.value) {
            pin.glow.lookAt(camera.value.position)
            pin.label.lookAt(camera.value.position)
        }

        // Label visibility
        const labelTargetOpacity = isHovered || isSelected ? 0.95 : 0
        const labelMat = pin.label.material as MeshBasicMaterial
        labelMat.opacity += (labelTargetOpacity - labelMat.opacity) * 0.15
    }
})
</script>
