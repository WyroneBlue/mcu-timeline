<template>
    <primitive :object="scene" />
</template>

<script setup lang="ts">
import type { CanvasTexture} from 'three';
import {
    Group, Mesh, SphereGeometry, PlaneGeometry, BufferGeometry,
    Float32BufferAttribute, Points, ShaderMaterial, MeshBasicMaterial,
    AdditiveBlending, Color, Vector3, Raycaster, Vector2,
    CylinderGeometry, DoubleSide, FrontSide, BackSide,
    RingGeometry
} from 'three'
import { useRenderLoop, useTres } from '@tresjs/core'
import gsap from 'gsap'
import type { LocationJson } from '~/types/multiverse'
import {
    latLngToVector3, createEarthTexture, loadEarthTextures,
    createPinGlowTexture, createPinLabelTexture
} from '~/composables/useEarthGlobe'
import locationsJson from '../../../data/locations.json'

const props = withDefaults(defineProps<{
    hoveredCode: string | null
    selectedCode: string | null
    entryDive?: boolean
}>(), { entryDive: false })

const emit = defineEmits<{
    hover: [code: string | null]
    select: [code: string | null]
}>()

const GLOBE_RADIUS = 5
const PIN_SPHERE_RADIUS = 0.12
const PIN_HIT_RADIUS = 0.34
const PIN_STEM_HEIGHT = 0.4

const earthLocations = computed(() =>
    (locationsJson as LocationJson[]).filter(l => l.parent_code === 'earth' && l.lat != null && l.lng != null)
)

const globeVertexShader = `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewDir;
    varying vec3 vWorldNormal;
    void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vViewDir = normalize(-mvPos.xyz);
        gl_Position = projectionMatrix * mvPos;
    }
`

// Day/night terminator with fresnel rim. uTexMix crossfades from the flat
// procedural placeholder (0) to the day/night composite (1) once the real
// textures have loaded.
const globeFragmentShader = `
    uniform sampler2D uDayMap;
    uniform sampler2D uNightMap;
    uniform vec3 uSunDir;
    uniform float uTexMix;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewDir;
    varying vec3 vWorldNormal;

    void main() {
        vec3 day = texture2D(uDayMap, vUv).rgb;
        vec3 night = texture2D(uNightMap, vUv).rgb;

        float sun = dot(normalize(vWorldNormal), normalize(uSunDir));
        float dayAmt = smoothstep(-0.15, 0.25, sun);
        vec3 composite = mix(night * vec3(1.4, 1.25, 1.0) + day * 0.03, day, dayAmt);
        vec3 baseColor = mix(day, composite, uTexMix);

        float fresnel = pow(1.0 - abs(dot(vNormal, vViewDir)), 3.0);
        vec3 rimColor = vec3(0.263, 0.6, 0.882);
        vec3 col = baseColor + rimColor * fresnel * (0.35 + 0.25 * dayAmt);

        gl_FragColor = vec4(col, 1.0);
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

// Classic limb halo: back-facing shell so the glow only shows past the edge.
const haloFragmentShader = `
    varying vec3 vNormal;
    varying vec3 vViewDir;
    void main() {
        float intensity = pow(max(0.0, 0.72 - dot(vNormal, vViewDir)), 2.2);
        gl_FragColor = vec4(0.263, 0.6, 0.882, 1.0) * intensity;
    }
`

const scene = new Group()
const raycaster = new Raycaster()

interface PinEntry {
    sphere: Mesh
    hit: Mesh
    stem: Mesh
    glow: Mesh
    ring: Mesh
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
let clouds: Mesh | null = null
let starField: Points | null = null
let earthTexture: CanvasTexture | null = null
let globeMaterial: ShaderMaterial | null = null
let atmosphereMaterial: ShaderMaterial | null = null
const sunDir = new Vector3(1, 0.25, 0.4).normalize()
let sunAngle = Math.atan2(sunDir.z, sunDir.x)

const _tmpVec = new Vector3()
const _tmpVec2 = new Vector3()
const cameraAngle = { x: 0.3, y: 0 }
const cameraGoal = { x: 0.3, y: 0 }
const START_DISTANCE = 14
const cameraDistance = ref(props.entryDive ? 26 : START_DISTANCE)
const cameraDistanceGoal = ref(props.entryDive ? 26 : START_DISTANCE)
let idleTime = 0
const { camera, renderer } = useTres()
const { settings } = useSettings()

const canvasEl = computed(() => renderer.value?.domElement ?? null)
const gesture = usePointerGesture(canvasEl)
const momentum = { x: 0, y: 0 }
let wasDragging = false

function damp(factor: number, dt: number) {
    return 1 - Math.pow(1 - factor, dt * 60)
}

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

    // Globe — starts on the procedural placeholder, crossfades to the real
    // day/night textures once they load.
    earthTexture = createEarthTexture(1024, 512)
    disposables.push(earthTexture)
    const globeGeo = new SphereGeometry(GLOBE_RADIUS, 64, 64)
    globeMaterial = new ShaderMaterial({
        uniforms: {
            uDayMap: { value: earthTexture },
            uNightMap: { value: earthTexture },
            uSunDir: { value: sunDir },
            uTexMix: { value: 0 },
        },
        vertexShader: globeVertexShader,
        fragmentShader: globeFragmentShader,
    })
    globe = new Mesh(globeGeo, globeMaterial)
    globe.renderOrder = 1
    scene.add(globe)
    disposables.push(globeGeo, globeMaterial)

    const mat = globeMaterial
    loadEarthTextures().then(({ day, night, clouds: cloudsTex }) => {
        if (mat !== globeMaterial || !globeMaterial) return
        globeMaterial.uniforms.uDayMap.value = day
        globeMaterial.uniforms.uNightMap.value = night
        gsap.to(globeMaterial.uniforms.uTexMix, { value: 1, duration: 1.2, ease: 'power2.out' })
        if (clouds) {
            const cloudsMat = clouds.material as MeshBasicMaterial
            cloudsMat.map = cloudsTex
            cloudsMat.needsUpdate = true
            gsap.to(cloudsMat, { opacity: 0.5, duration: 1.2, ease: 'power2.out' })
        }
    }).catch(() => {})

    // Cloud layer (texture arrives async; invisible until then)
    const cloudsGeo = new SphereGeometry(GLOBE_RADIUS * 1.015, 48, 48)
    const cloudsMat = new MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        depthWrite: false,
    })
    clouds = new Mesh(cloudsGeo, cloudsMat)
    clouds.renderOrder = 2
    scene.add(clouds)
    disposables.push(cloudsGeo, cloudsMat)

    // Atmosphere rim (front) + limb halo (back-facing shell)
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
    atmosphere.renderOrder = 3
    scene.add(atmosphere)
    disposables.push(atmosGeo, atmosphereMaterial)

    const haloGeo = new SphereGeometry(GLOBE_RADIUS * 1.14, 48, 48)
    const haloMat = new ShaderMaterial({
        vertexShader: atmosphereVertexShader,
        fragmentShader: haloFragmentShader,
        transparent: true,
        side: BackSide,
        depthWrite: false,
        blending: AdditiveBlending,
    })
    const halo = new Mesh(haloGeo, haloMat)
    halo.renderOrder = 0
    scene.add(halo)
    disposables.push(haloGeo, haloMat)

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

        // Invisible, larger hit target so hover/click is forgiving
        const hitGeo = new SphereGeometry(PIN_HIT_RADIUS, 8, 8)
        const hitMat = new MeshBasicMaterial({ visible: false })
        const hit = new Mesh(hitGeo, hitMat)
        hit.position.copy(pinTop)
        scene.add(hit)
        disposables.push(hitGeo, hitMat)

        // Surface halo ring, scales up on hover/selection
        const ringGeo = new RingGeometry(0.18, 0.26, 32)
        const ringMat = new MeshBasicMaterial({
            color: new Color(color),
            transparent: true,
            opacity: 0,
            side: DoubleSide,
            depthWrite: false,
            blending: AdditiveBlending,
        })
        const ring = new Mesh(ringGeo, ringMat)
        ring.position.copy(surfacePos.clone().add(surfaceNormal.clone().multiplyScalar(0.02)))
        ring.lookAt(surfacePos.clone().add(surfaceNormal))
        ring.renderOrder = 3
        scene.add(ring)
        disposables.push(ringGeo, ringMat)

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
            hit,
            stem,
            glow: glowMesh,
            ring,
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

    if (props.entryDive) {
        gsap.to(cameraDistanceGoal, { value: START_DISTANCE, duration: 0.6, ease: 'power3.out' })
    }
})

onUnmounted(() => {
    gsap.killTweensOf(cameraDistanceGoal)
    gsap.killTweensOf(cameraGoal)
    if (globeMaterial) gsap.killTweensOf(globeMaterial.uniforms.uTexMix)
    if (clouds) gsap.killTweensOf(clouds.material)
    disposeScene()
})

watch(earthLocations, buildScene, { deep: true })

// Pointer input handled by usePointerGesture composable

// Reverse dive: pull the camera away from the globe, then let the parent
// swap back to the solar system at the visual peak.
let zoomingOut = false

function zoomOut(onDone: () => void) {
    zoomingOut = true
    gsap.killTweensOf(cameraDistanceGoal)
    gsap.to(cameraDistanceGoal, {
        value: 30,
        duration: 0.55,
        ease: 'power2.in',
        onComplete: () => {
            zoomingOut = false
            onDone()
        },
    })
}

function cancelZoomOut() {
    if (!zoomingOut) return
    zoomingOut = false
    gsap.killTweensOf(cameraDistanceGoal)
}

defineExpose({ zoomOut, cancelZoomOut })

// Selection can also come from outside (prev/next bar, arrow keys), so the
// camera follows selectedCode rather than only the tap that set it.
watch(() => props.selectedCode, (code) => {
    if (!code) return
    const pin = pins.find(p => p.code === code)
    if (pin) flyToPin(pin)
})

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
    if (atmosphereMaterial) atmosphereMaterial.uniforms.uTime.value = t
    if (starField) (starField.material as ShaderMaterial).uniforms.uTime.value = t

    // Slowly orbiting sun for the day/night terminator + drifting clouds
    sunAngle += delta * 0.01
    sunDir.set(Math.cos(sunAngle), 0.25, Math.sin(sunAngle)).normalize()
    if (clouds) clouds.rotation.y += delta * 0.006

    const isTouch = gesture.pointerType.value === 'touch'
    const sens = 0.005 * (isTouch ? 1.5 : 1)
    const dir = settings.invertGlobeDrag ? 1 : -1

    // Process gesture input
    if (gesture.isDragging.value) {
        const drag = gesture.consumeDrag()
        cameraGoal.y += dir * drag.x * sens
        cameraGoal.x = Math.max(-0.8, Math.min(0.8, cameraGoal.x + drag.y * sens))
        idleTime = 0
    }

    const wheel = gesture.consumeWheel()
    if (wheel.delta !== 0) {
        const speed = wheel.ctrl ? 0.003 : 0.015
        cameraDistanceGoal.value = Math.max(8, Math.min(30, cameraDistanceGoal.value + wheel.delta * speed))
        idleTime = 0
    }

    const pinch = gesture.consumePinch()
    if (pinch !== 0) {
        cameraDistanceGoal.value = Math.max(8, Math.min(30, cameraDistanceGoal.value * (1 - pinch)))
        idleTime = 0
    }

    // Momentum capture on release
    if (!gesture.isDragging.value && wasDragging) {
        const vel = gesture.getVelocity()
        momentum.x = vel.x
        momentum.y = vel.y
    }
    wasDragging = gesture.isDragging.value

    // Apply momentum
    if (!gesture.isDragging.value && (Math.abs(momentum.x) > 0.0001 || Math.abs(momentum.y) > 0.0001)) {
        cameraGoal.y += dir * momentum.x * sens
        cameraGoal.x = Math.max(-0.8, Math.min(0.8, cameraGoal.x + momentum.y * sens))
        const decay = Math.pow(0.92, delta * 60)
        momentum.x *= decay
        momentum.y *= decay
    }

    // Tap detection for click
    if (gesture.consumeTap() && camera.value) {
        const pt = gesture.pointer
        raycaster.setFromCamera(new Vector2(pt.x, pt.y), camera.value)
        const pinTargets = pins.map(p => p.hit)
        const hits = raycaster.intersectObjects(pinTargets)
        if (hits.length > 0) {
            const pin = pins.find(p => p.hit === hits[0].object)
            if (pin) {
                emit('select', pin.code)
                flyToPin(pin)
            }
        } else {
            const globeHits = globe ? raycaster.intersectObject(globe) : []
            if (globeHits.length === 0) emit('select', null)
        }
    }

    // Idle auto-rotation
    idleTime += delta
    if (!gesture.isDragging.value && idleTime > 3) {
        cameraGoal.y += delta * 0.08
    }

    // Frame-rate independent camera interpolation
    const baseFactor = zoomingOut ? 0.22 : 0.08
    const af = damp(baseFactor, delta)
    cameraAngle.x += (cameraGoal.x - cameraAngle.x) * af
    cameraAngle.y += (cameraGoal.y - cameraAngle.y) * af
    cameraDistance.value += (cameraDistanceGoal.value - cameraDistance.value) * damp(baseFactor, delta)

    const dist = cameraDistance.value
    const cx = Math.sin(cameraAngle.y) * Math.cos(cameraAngle.x) * dist
    const cy = Math.sin(cameraAngle.x) * dist
    const cz = Math.cos(cameraAngle.y) * Math.cos(cameraAngle.x) * dist

    camera.value.position.set(cx, cy, cz)
    camera.value.lookAt(0, 0, 0)

    // Hover raycast
    if (gesture.isPointerDirty() && camera.value && !gesture.isDragging.value) {
        gesture.clearPointerDirty()
        const pt = gesture.pointer
        raycaster.setFromCamera(new Vector2(pt.x, pt.y), camera.value)
        const pinTargets = pins.map(p => p.hit)
        const hits = raycaster.intersectObjects(pinTargets)
        const hoveredPin = hits.length > 0 ? pins.find(p => p.hit === hits[0].object) : null
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
        pin.hit.position.copy(_tmpVec)
        pin.glow.position.copy(_tmpVec)
        _tmpVec2.copy(pin.surfaceNormal).multiplyScalar(0.35).add(_tmpVec)
        pin.label.position.copy(_tmpVec2)

        // Glow pulse + stem brightening
        const glowPulse = 0.4 + Math.sin(t * 2 + pin.index * 2.3) * 0.2
        ;(pin.glow.material as MeshBasicMaterial).opacity = isHovered || isSelected ? 0.9 : glowPulse
        const stemMat = pin.stem.material as MeshBasicMaterial
        const stemTarget = isHovered || isSelected ? 0.8 : 0.4
        stemMat.opacity += (stemTarget - stemMat.opacity) * 0.15

        // Surface ring: grows and pulses while hovered/selected
        const ringMat = pin.ring.material as MeshBasicMaterial
        const ringTarget = isSelected ? 0.7 : isHovered ? 0.5 : 0
        ringMat.opacity += (ringTarget - ringMat.opacity) * 0.12
        const ringScale = 1 + (isSelected || isHovered ? Math.sin(t * 3.5 + pin.index) * 0.15 + 0.35 : 0)
        pin.ring.scale.setScalar(pin.ring.scale.x + (ringScale - pin.ring.scale.x) * 0.12)

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
