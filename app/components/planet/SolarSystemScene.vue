<template>
    <primitive :object="scene" />
</template>

<script setup lang="ts">
import {
    Group, Mesh, SphereGeometry, PlaneGeometry, BufferGeometry,
    Float32BufferAttribute, Points, ShaderMaterial, MeshBasicMaterial,
    AdditiveBlending, Color, Vector3, Raycaster, Vector2,
    CatmullRomCurve3, TubeGeometry, DoubleSide, CanvasTexture,
    LinearFilter, FrontSide, IcosahedronGeometry
} from 'three'
import { useRenderLoop, useTres } from '@tresjs/core'
import gsap from 'gsap'
import type { Database } from '~/types/supabase'
import type { LocationJson } from '~/types/multiverse'
import type { PlanetLayout } from '~/composables/usePlanetLayout'
import { computeLayout } from '~/composables/usePlanetLayout'
import locationsJson from '../../../data/locations.json'

type Title = Database['public']['Tables']['titles']['Row']
type ProgressStatus = 'queued' | 'watching' | 'watched' | 'skipped'

const props = defineProps<{
    titles: Title[]
    progressMap: Map<number, ProgressStatus>
    hoveredCode: string | null
    selectedCode: string | null
    focusedIndex: number
    layout: PlanetLayout
}>()

const emit = defineEmits<{
    hover: [code: string | null]
    select: [code: string | null]
    'update:focusedIndex': [index: number]
}>()

const locations = computed(() =>
    (locationsJson as LocationJson[]).filter(l => l.parent_code === null)
)

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

function createLabelTexture(name: string, color: string, titleCount: number, type: string): CanvasTexture {
    const w = 256
    const h = 72
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, w, h)

    ctx.font = 'bold 20px system-ui'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillText(name.toUpperCase(), w / 2 + 1, h / 2 - 8 + 1)
    ctx.fillStyle = color
    ctx.globalAlpha = 0.95
    ctx.fillText(name.toUpperCase(), w / 2, h / 2 - 8)

    ctx.globalAlpha = 0.4
    ctx.font = '13px system-ui'
    ctx.fillStyle = '#ffffff'
    ctx.fillText(`${titleCount} titles · ${type}`, w / 2, h / 2 + 14)
    ctx.globalAlpha = 1.0

    const tex = new CanvasTexture(canvas)
    tex.minFilter = LinearFilter
    return tex
}

// --- Shaders per location type ---

const planetVertexShader = `
    varying vec3 vNormal;
    varying vec3 vViewDir;
    varying vec3 vPosition;
    void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vViewDir = normalize(-mvPos.xyz);
        gl_Position = projectionMatrix * mvPos;
    }
`

const planetFragmentShader = `
    uniform vec3 uColor;
    uniform float uTime;
    uniform float uHover;
    uniform float uSelected;
    uniform float uHasUnwatched;
    varying vec3 vNormal;
    varying vec3 vViewDir;
    varying vec3 vPosition;

    float hash(vec3 p) {
        p = fract(p * 0.3183099 + 0.1);
        p *= 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
    }

    float noise(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
            mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
                mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
            mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
    }

    void main() {
        float fresnel = pow(1.0 - abs(dot(vNormal, vViewDir)), 3.0);

        float n = noise(vPosition * 3.0 + uTime * 0.1) * 0.5
                + noise(vPosition * 6.0 - uTime * 0.05) * 0.25
                + noise(vPosition * 12.0 + uTime * 0.15) * 0.125;

        float pulse = uHasUnwatched > 0.5 ? sin(uTime * 2.0) * 0.08 + 1.0 : 1.0;

        float rim = fresnel * (0.7 + uHover * 0.3 + uSelected * 0.4) * pulse;
        float core = (0.12 + n * 0.15 + uHover * 0.1 + uSelected * 0.15) * pulse;

        vec3 col = uColor * (core + rim);
        col += vec3(1.0) * fresnel * 0.15;

        float alpha = core + rim * 0.8;
        gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
    }
`

const realmFragmentShader = `
    uniform vec3 uColor;
    uniform float uTime;
    uniform float uHover;
    uniform float uSelected;
    uniform float uHasUnwatched;
    varying vec3 vNormal;
    varying vec3 vViewDir;
    varying vec3 vPosition;

    void main() {
        float fresnel = pow(1.0 - abs(dot(vNormal, vViewDir)), 2.5);
        float pulse = sin(uTime * 1.8 + vPosition.y * 4.0) * 0.15 + 0.85;
        float energyPulse = uHasUnwatched > 0.5 ? sin(uTime * 2.5) * 0.1 + 1.0 : 1.0;

        float runePattern = sin(vPosition.x * 8.0 + uTime) * sin(vPosition.y * 8.0 - uTime * 0.7) * sin(vPosition.z * 8.0 + uTime * 0.5);
        runePattern = smoothstep(0.3, 0.5, abs(runePattern)) * 0.3;

        float rim = fresnel * (0.8 + uHover * 0.3 + uSelected * 0.4) * pulse * energyPulse;
        float core = (0.1 + runePattern + uHover * 0.1 + uSelected * 0.15) * pulse * energyPulse;

        vec3 col = uColor * (core + rim);
        col += uColor * runePattern * 0.5;

        float alpha = core + rim * 0.8;
        gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
    }
`

const dimensionFragmentShader = `
    uniform vec3 uColor;
    uniform float uTime;
    uniform float uHover;
    uniform float uSelected;
    uniform float uHasUnwatched;
    varying vec3 vNormal;
    varying vec3 vViewDir;
    varying vec3 vPosition;

    void main() {
        float fresnel = pow(1.0 - abs(dot(vNormal, vViewDir)), 2.0);
        float energyPulse = uHasUnwatched > 0.5 ? sin(uTime * 2.0) * 0.08 + 1.0 : 1.0;

        float crystal = abs(sin(vPosition.x * 12.0 + uTime * 0.5))
                      * abs(sin(vPosition.y * 12.0 - uTime * 0.3))
                      * abs(sin(vPosition.z * 12.0 + uTime * 0.7));
        crystal = smoothstep(0.2, 0.8, crystal) * 0.4;

        float shimmer = sin(dot(vPosition, vec3(4.0, 6.0, 5.0)) + uTime * 3.0) * 0.1 + 0.9;

        float rim = fresnel * (0.9 + uHover * 0.3 + uSelected * 0.4) * shimmer * energyPulse;
        float core = (0.08 + crystal + uHover * 0.1 + uSelected * 0.15) * shimmer * energyPulse;

        vec3 col = uColor * (core + rim);
        vec3 iridescence = vec3(
            sin(fresnel * 3.14 + uTime) * 0.15,
            sin(fresnel * 3.14 + uTime + 2.094) * 0.15,
            sin(fresnel * 3.14 + uTime + 4.189) * 0.15
        );
        col += iridescence;

        float alpha = core + rim * 0.8;
        gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
    }
`

const constructFragmentShader = `
    uniform vec3 uColor;
    uniform float uTime;
    uniform float uHover;
    uniform float uSelected;
    uniform float uHasUnwatched;
    varying vec3 vNormal;
    varying vec3 vViewDir;
    varying vec3 vPosition;

    void main() {
        float fresnel = pow(1.0 - abs(dot(vNormal, vViewDir)), 2.5);
        float energyPulse = uHasUnwatched > 0.5 ? sin(uTime * 2.0) * 0.08 + 1.0 : 1.0;

        float grid = step(0.9, fract(vPosition.x * 5.0 + uTime * 0.2))
                   + step(0.9, fract(vPosition.y * 5.0 - uTime * 0.15))
                   + step(0.9, fract(vPosition.z * 5.0 + uTime * 0.1));
        grid = min(grid, 1.0) * 0.3;

        float rim = fresnel * (0.7 + uHover * 0.3 + uSelected * 0.4) * energyPulse;
        float core = (0.1 + grid + uHover * 0.1 + uSelected * 0.15) * energyPulse;

        vec3 col = uColor * (core + rim);
        col += uColor * grid * 0.4;

        float alpha = core + rim * 0.8;
        gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
    }
`

function getFragmentShader(type: string): string {
    switch (type) {
        case 'realm': return realmFragmentShader
        case 'dimension': return dimensionFragmentShader
        case 'construct': return constructFragmentShader
        default: return planetFragmentShader
    }
}

function getGeometry(type: string, radius: number): SphereGeometry | IcosahedronGeometry {
    if (type === 'dimension') return new IcosahedronGeometry(radius, 4)
    if (type === 'construct') return new IcosahedronGeometry(radius, 3)
    return new SphereGeometry(radius, 32, 32)
}

// --- Scene setup ---

const scene = new Group()
const raycaster = new Raycaster()
const pointer = new Vector2()

interface LocationEntry {
    sphere: Mesh
    atmosphere: Mesh
    glow: Mesh
    label: Mesh
    code: string
    type: string
    basePos: Vector3
    color: string
    radius: number
    titleCount: number
    index: number
    hasUnwatched: boolean
}

const locationMeshes: LocationEntry[] = []
const disposables: { dispose: () => void }[] = []
let isTransitioning = false

// Stars
const starCount = 2500
const starGeo = new BufferGeometry()
const starPositions = new Float32Array(starCount * 3)
const starSizes = new Float32Array(starCount)
const starColors = new Float32Array(starCount * 3)
for (let i = 0; i < starCount; i++) {
    const r = 60 + Math.random() * 200
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

// Nebulae
const nebulaGroup = new Group()
scene.add(nebulaGroup)

function addNebula(x: number, y: number, z: number, color: string, size: number) {
    const tex = createGlowTexture(color)
    disposables.push(tex)
    const geo = new PlaneGeometry(size, size)
    disposables.push(geo)
    const mat = new MeshBasicMaterial({
        map: tex, transparent: true, opacity: 0.06,
        blending: AdditiveBlending, depthWrite: false, side: DoubleSide,
    })
    disposables.push(mat)
    const m = new Mesh(geo, mat)
    m.position.set(x, y, z)
    m.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0)
    nebulaGroup.add(m)
}

addNebula(0, 8, -15, '#D69E2E', 40)
addNebula(-12, -8, 5, '#9F7AEA', 35)
addNebula(15, -5, -18, '#4299E1', 45)
addNebula(-18, -3, -10, '#ED8936', 30)
addNebula(8, -10, 5, '#48BB78', 32)

const connectionGroup = new Group()
scene.add(connectionGroup)

const locationGroup = new Group()
scene.add(locationGroup)

function hasUnwatchedTitles(titleSlugs: string[]): boolean {
    const slugSet = new Set(titleSlugs)
    for (const title of props.titles) {
        if (slugSet.has(title.slug)) {
            const status = props.progressMap.get(title.id)
            if (!status || (status !== 'watched' && status !== 'skipped')) return true
        }
    }
    return false
}

function buildLocations() {
    while (locationGroup.children.length > 0) locationGroup.remove(locationGroup.children[0])
    while (connectionGroup.children.length > 0) connectionGroup.remove(connectionGroup.children[0])
    locationMeshes.length = 0
    disposables.forEach(d => d.dispose())
    disposables.length = 0

    const locs = locations.value
    const layoutPositions = computeLayout(props.layout, locs, props.titles)

    locs.forEach((loc, index) => {
        const color = loc.color || typeColors[loc.type] || '#ffffff'
        const titleCount = loc.title_slugs.length
        const baseRadius = Math.max(0.3, loc.radius * (0.6 + titleCount * 0.04))
        const pos = layoutPositions[index] ?? new Vector3(loc.position_3d[0], loc.position_3d[1], loc.position_3d[2])
        const unwatched = hasUnwatchedTitles(loc.title_slugs)

        // Main sphere
        const sphereGeo = getGeometry(loc.type, baseRadius)
        disposables.push(sphereGeo)

        const sphereMat = new ShaderMaterial({
            vertexShader: planetVertexShader,
            fragmentShader: getFragmentShader(loc.type),
            uniforms: {
                uColor: { value: new Color(color) },
                uTime: { value: 0 },
                uHover: { value: 0 },
                uSelected: { value: 0 },
                uHasUnwatched: { value: unwatched ? 1.0 : 0.0 },
            },
            transparent: true,
            depthWrite: true,
            side: FrontSide,
        })
        disposables.push(sphereMat)

        const sphere = new Mesh(sphereGeo, sphereMat)
        sphere.position.copy(pos)
        sphere.renderOrder = 1
        locationGroup.add(sphere)

        // Atmosphere ring (outer glow shell)
        const atmosGeo = new SphereGeometry(baseRadius * 1.3, 24, 24)
        disposables.push(atmosGeo)
        const atmosMat = new ShaderMaterial({
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
                uniform float uHover;
                uniform float uSelected;
                varying vec3 vNormal;
                varying vec3 vViewDir;
                void main() {
                    float fresnel = pow(1.0 - abs(dot(vNormal, vViewDir)), 4.0);
                    float intensity = fresnel * (0.3 + uHover * 0.2 + uSelected * 0.3);
                    gl_FragColor = vec4(uColor, intensity * 0.5);
                }
            `,
            uniforms: {
                uColor: { value: new Color(color) },
                uHover: { value: 0 },
                uSelected: { value: 0 },
            },
            transparent: true,
            depthWrite: false,
            side: FrontSide,
        })
        disposables.push(atmosMat)
        const atmosphere = new Mesh(atmosGeo, atmosMat)
        atmosphere.position.copy(pos)
        atmosphere.renderOrder = 2
        locationGroup.add(atmosphere)

        // Glow plane
        const glowTex = createGlowTexture(color)
        disposables.push(glowTex)
        const glowGeo = new PlaneGeometry(baseRadius * 6, baseRadius * 6)
        disposables.push(glowGeo)
        const glowMat = new MeshBasicMaterial({
            map: glowTex, transparent: true, opacity: 0.25,
            blending: AdditiveBlending, depthWrite: false, side: DoubleSide,
        })
        disposables.push(glowMat)
        const glow = new Mesh(glowGeo, glowMat)
        glow.position.copy(pos)
        glow.renderOrder = 3
        locationGroup.add(glow)

        // Label
        const labelTex = createLabelTexture(loc.name, color, titleCount, loc.type)
        disposables.push(labelTex)
        const labelGeo = new PlaneGeometry(3.5, 1.0)
        disposables.push(labelGeo)
        const labelMat = new MeshBasicMaterial({
            map: labelTex, transparent: true, opacity: 0.7,
            depthWrite: false, side: DoubleSide,
        })
        disposables.push(labelMat)
        const label = new Mesh(labelGeo, labelMat)
        label.position.set(pos.x, pos.y + baseRadius + 1.0, pos.z)
        label.renderOrder = 4
        locationGroup.add(label)

        locationMeshes.push({
            sphere, atmosphere, glow, label,
            code: loc.id, type: loc.type,
            basePos: pos.clone(),
            color, radius: baseRadius,
            titleCount, index,
            hasUnwatched: unwatched,
        })
    })

    buildConnections(locs)
}

function buildConnections(locs: LocationJson[]) {
    const locMap = new Map<string, LocationJson>()
    locs.forEach(l => locMap.set(l.id, l))

    const posMap = new Map<string, Vector3>()
    for (const entry of locationMeshes) {
        posMap.set(entry.code, entry.basePos)
    }

    const connections = new Set<string>()
    for (const loc of locs) {
        if (loc.parent_code && locMap.has(loc.parent_code)) {
            const key = [loc.id, loc.parent_code].sort().join('|')
            if (!connections.has(key)) {
                connections.add(key)
                const start = posMap.get(loc.id) ?? new Vector3(...loc.position_3d)
                const end = posMap.get(loc.parent_code) ?? new Vector3(...locMap.get(loc.parent_code)!.position_3d)
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
                            float alpha = 0.04 + energy * 0.12;
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

watch(() => props.layout, (newLayout) => {
    const locs = locations.value
    const newPositions = computeLayout(newLayout, locs, props.titles)
    isTransitioning = true

    for (const entry of locationMeshes) {
        const newPos = newPositions[entry.index]
        if (!newPos) continue

        entry.basePos.copy(newPos)

        const targets = [entry.sphere, entry.atmosphere, entry.glow]
        for (const mesh of targets) {
            gsap.to(mesh.position, {
                x: newPos.x,
                y: newPos.y,
                z: newPos.z,
                duration: 1.4,
                ease: 'power3.inOut',
            })
        }

        gsap.to(entry.label.position, {
            x: newPos.x,
            y: newPos.y + entry.radius + 1.0,
            z: newPos.z,
            duration: 1.4,
            ease: 'power3.inOut',
        })
    }

    const selectedEntry = props.selectedCode
        ? locationMeshes.find(e => e.code === props.selectedCode)
        : locationMeshes[props.focusedIndex]

    if (selectedEntry) {
        const newPos = newPositions[selectedEntry.index]
        if (newPos) {
            gsap.to(cameraGoal.target, {
                x: newPos.x,
                y: newPos.y,
                z: newPos.z,
                duration: 1.4,
                ease: 'power3.inOut',
            })
        }
    } else {
        gsap.to(cameraGoal.target, { x: 0, y: 0, z: 0, duration: 1.4, ease: 'power3.inOut' })
    }

    while (connectionGroup.children.length > 0) connectionGroup.remove(connectionGroup.children[0])
    setTimeout(() => {
        isTransitioning = false
        buildConnections(locs)
    }, 1500)
})

// --- Camera ---

const { camera } = useTres()
const cameraState = reactive({
    angle: { x: 0.15, y: 0 },
    distance: 35,
    target: new Vector3(0, 0, 0),
})
const cameraGoal = reactive({
    angle: { x: 0.15, y: 0 },
    distance: 35,
    target: new Vector3(0, 0, 0),
})
let isDragging = false
let dragStart = { x: 0, y: 0 }
let idleTime = 0

function flyToLocation(index: number) {
    const entry = locationMeshes[index]
    if (!entry) return

    gsap.to(cameraGoal.target, {
        x: entry.basePos.x,
        y: entry.basePos.y,
        z: entry.basePos.z,
        duration: 1.2,
        ease: 'power3.inOut',
    })
    gsap.to(cameraGoal, {
        distance: Math.max(8, entry.radius * 12),
        duration: 1.2,
        ease: 'power3.inOut',
    })
    gsap.to(cameraGoal.angle, {
        y: cameraState.angle.y,
        duration: 1.2,
        ease: 'power3.inOut',
    })
    idleTime = 0
}

watch(() => props.focusedIndex, (idx) => {
    if (settings.cameraAutoReset && idx >= 0 && idx < locationMeshes.length) flyToLocation(idx)
})

watch(() => props.selectedCode, (code) => {
    if (code) {
        const idx = locationMeshes.findIndex(e => e.code === code)
        if (idx >= 0) {
            emit('update:focusedIndex', idx)
            flyToLocation(idx)
            gsap.to(cameraGoal, {
                distance: Math.max(6, locationMeshes[idx].radius * 8),
                duration: 1.2,
                ease: 'power3.inOut',
            })
        }
    } else {
        gsap.to(cameraGoal.target, { x: 0, y: 0, z: 0, duration: 1.0, ease: 'power2.inOut' })
        gsap.to(cameraGoal, { distance: 35, duration: 1.0, ease: 'power2.inOut' })
    }
})

// --- Pointer events ---

function onPointerDown(e: PointerEvent) {
    isDragging = true
    dragStart = { x: e.clientX, y: e.clientY }
    idleTime = 0
}

function onPointerMove(e: PointerEvent) {
    const rect = (e.target as HTMLElement)?.closest('canvas')?.getBoundingClientRect()
    if (!rect) return
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

    if (isDragging) {
        const dx = e.clientX - dragStart.x
        const dy = e.clientY - dragStart.y
        cameraGoal.angle.y -= dx * 0.005
        cameraGoal.angle.x = Math.max(-0.5, Math.min(0.8, cameraGoal.angle.x + dy * 0.005))
        dragStart = { x: e.clientX, y: e.clientY }
        idleTime = 0
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
            if (hit) emit('select', hit.code)
        } else {
            emit('select', null)
        }
    }
}

function onWheel(e: WheelEvent) {
    e.preventDefault()
    const speed = e.ctrlKey || e.metaKey ? 0.003 : 0.015
    cameraGoal.distance = Math.max(5, Math.min(80, cameraGoal.distance + e.deltaY * speed))
    idleTime = 0
}

let canvasEl: HTMLCanvasElement | null = null

onMounted(() => {
    canvasEl = document.querySelector('.planet-container canvas')
    if (canvasEl) {
        canvasEl.addEventListener('wheel', onWheel, { passive: false })
    }
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
})

// --- Render loop ---

const { settings } = useSettings()
const { onLoop } = useRenderLoop()
let elapsed = 0

onLoop(({ delta }) => {
    elapsed += delta
    idleTime += delta
    starMat.uniforms.uTime.value = elapsed

    // Auto-rotate when idle
    if (idleTime > 3.0 && !isDragging && !props.selectedCode) {
        cameraGoal.angle.y += delta * 0.04
    }

    connectionGroup.children.forEach(child => {
        const mat = (child as Mesh).material as ShaderMaterial
        if (mat.uniforms?.uTime) mat.uniforms.uTime.value = elapsed
    })

    nebulaGroup.children.forEach(child => {
        child.rotation.z += delta * 0.006
        const mat = (child as Mesh).material as MeshBasicMaterial
        mat.opacity = 0.06 + Math.sin(elapsed * 0.3 + child.position.x) * 0.02
    })

    // Smooth camera interpolation
    if (camera.value) {
        const lerpSpeed = isDragging ? 0.12 : 0.06
        cameraState.angle.x += (cameraGoal.angle.x - cameraState.angle.x) * lerpSpeed
        cameraState.angle.y += (cameraGoal.angle.y - cameraState.angle.y) * lerpSpeed
        cameraState.distance += (cameraGoal.distance - cameraState.distance) * lerpSpeed
        cameraState.target.lerp(cameraGoal.target, lerpSpeed)

        const d = cameraState.distance
        camera.value.position.set(
            cameraState.target.x + Math.sin(cameraState.angle.y) * Math.cos(cameraState.angle.x) * d,
            cameraState.target.y + Math.sin(cameraState.angle.x) * d,
            cameraState.target.z + Math.cos(cameraState.angle.y) * Math.cos(cameraState.angle.x) * d,
        )
        camera.value.lookAt(cameraState.target)
    }

    // Update location meshes
    for (const entry of locationMeshes) {
        const isHovered = entry.code === props.hoveredCode
        const isSelected = entry.code === props.selectedCode
        const isFocused = entry.index === props.focusedIndex && props.selectedCode !== null

        const sphereMat = entry.sphere.material as ShaderMaterial
        sphereMat.uniforms.uTime.value = elapsed
        sphereMat.uniforms.uHover.value += ((isHovered ? 1.0 : 0.0) - sphereMat.uniforms.uHover.value) * 0.1
        sphereMat.uniforms.uSelected.value += (((isSelected || isFocused) ? 1.0 : 0.0) - sphereMat.uniforms.uSelected.value) * 0.1

        const atmosMat = entry.atmosphere.material as ShaderMaterial
        atmosMat.uniforms.uHover.value = sphereMat.uniforms.uHover.value
        atmosMat.uniforms.uSelected.value = sphereMat.uniforms.uSelected.value

        if (!isTransitioning) {
            let driftX = 0, driftY = 0, driftZ = 0
            if (settings.layoutDrift) {
                const driftSpeed = 0.1
                const driftAmp = 0.8
                const phase = entry.index * 0.7
                driftX = Math.sin(elapsed * driftSpeed + phase) * driftAmp * Math.cos(entry.index * 0.3)
                driftY = Math.cos(elapsed * driftSpeed * 0.7 + phase * 1.3) * driftAmp * 0.4
                driftZ = Math.sin(elapsed * driftSpeed * 0.5 + phase * 0.9) * driftAmp * Math.sin(entry.index * 0.5)
            }

            const bobSpeed = 0.3 + (entry.index % 5) * 0.06
            const bobAmp = 0.06 + (entry.index % 3) * 0.02
            const bob = Math.sin(elapsed * bobSpeed + entry.basePos.x * 0.2 + entry.index * 0.9) * bobAmp
            entry.sphere.position.x = entry.basePos.x + driftX
            entry.sphere.position.y = entry.basePos.y + bob + driftY
            entry.sphere.position.z = entry.basePos.z + driftZ
            entry.atmosphere.position.x = entry.basePos.x + driftX
            entry.atmosphere.position.y = entry.basePos.y + bob + driftY
            entry.atmosphere.position.z = entry.basePos.z + driftZ
            entry.glow.position.x = entry.basePos.x + driftX
            entry.glow.position.y = entry.basePos.y + bob + driftY
            entry.glow.position.z = entry.basePos.z + driftZ
            entry.label.position.x = entry.basePos.x + driftX
            entry.label.position.y = entry.basePos.y + entry.radius + 1.0 + bob + driftY
            entry.label.position.z = entry.basePos.z + driftZ
        }

        // Slow rotation for dimensions
        if (entry.type === 'dimension') {
            entry.sphere.rotation.y += delta * 0.15
            entry.sphere.rotation.x += delta * 0.05
        }

        // Scale
        const targetScale = isSelected ? 1.35 : isHovered ? 1.15 : isFocused ? 1.1 : 1.0
        const currentScale = entry.sphere.scale.x
        const newScale = currentScale + (targetScale - currentScale) * 0.08
        entry.sphere.scale.setScalar(newScale)
        entry.atmosphere.scale.setScalar(newScale)

        // Glow
        const glowMat = entry.glow.material as MeshBasicMaterial
        const glowPulse = isSelected || isFocused ? Math.sin(elapsed * 2.0) * 0.06 : 0
        glowMat.opacity = (isSelected ? 0.45 : isHovered ? 0.35 : isFocused ? 0.3 : 0.2) + glowPulse

        // Billboard
        if (camera.value) {
            entry.glow.quaternion.copy(camera.value.quaternion)
            entry.label.quaternion.copy(camera.value.quaternion)
        }

        // Label opacity
        const labelMat = entry.label.material as MeshBasicMaterial
        labelMat.opacity = isSelected || isHovered || isFocused ? 0.95 : 0.55
    }
})

onUnmounted(() => {
    if (canvasEl) canvasEl.removeEventListener('wheel', onWheel)
    window.removeEventListener('pointerdown', onPointerDown)
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
    disposables.forEach(d => d.dispose())
    starGeo.dispose()
    starMat.dispose()
})
</script>
