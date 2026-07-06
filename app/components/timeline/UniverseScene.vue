<template>
    <primitive :object="scene" />
</template>

<script setup lang="ts">
import {
    Group, Mesh, PlaneGeometry, MeshBasicMaterial, BufferGeometry,
    Float32BufferAttribute, Points, ShaderMaterial, AdditiveBlending,
    Color, Vector3, Raycaster, Vector2, CatmullRomCurve3,
    TubeGeometry, DoubleSide, CanvasTexture, SRGBColorSpace,
    LinearFilter, FrontSide
} from 'three'
import { gsap } from 'gsap'
import { useRenderLoop, useTres } from '@tresjs/core'
import type { Database } from '~/types/supabase'
import type { UniverseLayout } from '~/types/universe'

type Title = Database['public']['Tables']['titles']['Row']
type ProgressStatus = 'queued' | 'watching' | 'watched' | 'skipped'

const props = withDefaults(defineProps<{
    titles: Title[]
    progressMap: Map<number, ProgressStatus>
    hoveredId: number | null
    selectedId: number | null
    focusedIndex: number
    themeBg?: string
    layout?: UniverseLayout
}>(), { themeBg: '#050508', layout: 'phase' })

const emit = defineEmits<{
    hover: [id: number | null]
    select: [id: number | null]
    'update:focusedIndex': [index: number]
}>()

const { settings } = useSettings()
const { showFps, sample } = useRenderStats()

const phaseColors: Record<number, { primary: string; accent: string; bg: string; dark: string }> = {
    1: { primary: '#EF4444', accent: '#FCA5A5', bg: '#3a1218', dark: '#1e0a0e' },
    2: { primary: '#F97316', accent: '#FDBA74', bg: '#3a1e0c', dark: '#1e1006' },
    3: { primary: '#EAB308', accent: '#FDE047', bg: '#3a2e0a', dark: '#1e1805' },
    4: { primary: '#8B5CF6', accent: '#C4B5FD', bg: '#28186a', dark: '#160e38' },
    5: { primary: '#A78BFA', accent: '#DDD6FE', bg: '#2c1468', dark: '#180c38' },
    6: { primary: '#14B8A6', accent: '#5EEAD4', bg: '#0a3a38', dark: '#061e1d' },
    100: { primary: '#6B7280', accent: '#D1D5DB', bg: '#1e2028', dark: '#13141a' },
    101: { primary: '#B45309', accent: '#FCD34D', bg: '#2e1a06', dark: '#1a0e03' },
    102: { primary: '#DC2626', accent: '#FCA5A5', bg: '#2e0a0a', dark: '#1a0505' },
    103: { primary: '#6366F1', accent: '#A5B4FC', bg: '#1e1e3a', dark: '#10101e' },
}

function getPhaseNumber(phase: string | null): number {
    if (!phase) return 100
    if (phase.includes('Pre-Phase 1')) return 101
    if (phase.includes('Pre-Phase')) return 102
    if (phase.includes('1-5') || phase.includes('1-3') || phase.includes('spanning')) return 103
    const match = phase.match(/Phase\s+(\d+)/)
    return match ? parseInt(match[1]) : 100
}

function getPhaseColors(phase: string | null) {
    return phaseColors[getPhaseNumber(phase)] ?? phaseColors[100]
}

function hexToRgb(hex: string) {
    const c = new Color(hex)
    return { r: Math.round(c.r * 255), g: Math.round(c.g * 255), b: Math.round(c.b * 255) }
}

const posterImageCache = new Map<string, HTMLImageElement>()

function posterProxyUrl(tmdbUrl: string): string {
    const match = tmdbUrl.match(/\/t\/p\/(w\d+\/.+\.jpg)/)
    if (match) return `/api/poster/${match[1]}`
    return tmdbUrl
}

function loadPosterImage(url: string): Promise<HTMLImageElement> {
    const proxyUrl = posterProxyUrl(url)
    if (posterImageCache.has(proxyUrl)) return Promise.resolve(posterImageCache.get(proxyUrl)!)
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => { posterImageCache.set(proxyUrl, img); resolve(img) }
        img.onerror = reject
        img.src = proxyUrl
    })
}

function createPosterTexture(title: Title, status: ProgressStatus | undefined, posterImg?: HTMLImageElement): CanvasTexture {
    const w = 280
    const h = 400
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!
    const colors = getPhaseColors(title.phase)
    const rgb = hexToRgb(colors.primary)

    if (posterImg) {
        const imgAspect = posterImg.width / posterImg.height
        const canvasAspect = w / h
        let sx = 0, sy = 0, sw = posterImg.width, sh = posterImg.height
        if (imgAspect > canvasAspect) {
            sw = posterImg.height * canvasAspect
            sx = (posterImg.width - sw) / 2
        } else {
            sh = posterImg.width / canvasAspect
            sy = (posterImg.height - sh) / 2
        }
        ctx.drawImage(posterImg, sx, sy, sw, sh, 0, 0, w, h)

        const bottomGrad = ctx.createLinearGradient(0, h * 0.55, 0, h)
        bottomGrad.addColorStop(0, 'rgba(0,0,0,0)')
        bottomGrad.addColorStop(0.4, 'rgba(0,0,0,0.6)')
        bottomGrad.addColorStop(1, 'rgba(0,0,0,0.92)')
        ctx.fillStyle = bottomGrad
        ctx.fillRect(0, h * 0.55, w, h * 0.45)

        const topGrad = ctx.createLinearGradient(0, 0, 0, h * 0.15)
        topGrad.addColorStop(0, 'rgba(0,0,0,0.5)')
        topGrad.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = topGrad
        ctx.fillRect(0, 0, w, h * 0.15)

        ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},0.4)`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.roundRect(1, 1, w - 2, h - 2, 6)
        ctx.stroke()

        const titleText = title.title.toUpperCase()
        ctx.font = 'bold 16px system-ui'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'bottom'
        const maxWidth = w - 30
        const words = titleText.split(' ')
        const lines: string[] = []
        let currentLine = ''
        for (const word of words) {
            const test = currentLine ? `${currentLine} ${word}` : word
            if (ctx.measureText(test).width > maxWidth && currentLine) {
                lines.push(currentLine)
                currentLine = word
            } else {
                currentLine = test
            }
        }
        if (currentLine) lines.push(currentLine)

        const lineHeight = 20
        const bottomY = h - 14
        const displayLines = lines.slice(0, 2)
        displayLines.forEach((line, i) => {
            const y = bottomY - (displayLines.length - 1 - i) * lineHeight
            ctx.fillStyle = 'rgba(0,0,0,0.7)'
            ctx.fillText(line, w / 2 + 1, y + 1, maxWidth)
            ctx.fillStyle = '#ffffff'
            ctx.globalAlpha = 0.95
            ctx.fillText(line, w / 2, y, maxWidth)
        })
        ctx.globalAlpha = 1

        const chronoNum = `#${title.chronology_index ?? '?'}`
        ctx.font = 'bold 14px system-ui'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'
        ctx.fillStyle = 'rgba(0,0,0,0.5)'
        ctx.fillText(chronoNum, 9, 9)
        ctx.fillStyle = 'rgba(255,255,255,0.7)'
        ctx.fillText(chronoNum, 8, 8)

        if (status === 'watched') {
            ctx.fillStyle = 'rgba(34,197,94,0.8)'
            ctx.beginPath()
            ctx.arc(w - 18, 18, 10, 0, Math.PI * 2)
            ctx.fill()
            ctx.font = 'bold 11px system-ui'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillStyle = '#ffffff'
            ctx.fillText('✓', w - 18, 18)
        }

        const bottomAccent = ctx.createLinearGradient(0, h - 4, w, h - 4)
        bottomAccent.addColorStop(0, 'transparent')
        bottomAccent.addColorStop(0.2, `rgba(${rgb.r},${rgb.g},${rgb.b},0.5)`)
        bottomAccent.addColorStop(0.8, `rgba(${rgb.r},${rgb.g},${rgb.b},0.5)`)
        bottomAccent.addColorStop(1, 'transparent')
        ctx.fillStyle = bottomAccent
        ctx.fillRect(0, h - 3, w, 3)
    } else {
        const grad = ctx.createLinearGradient(0, 0, 0, h)
        grad.addColorStop(0, colors.bg)
        grad.addColorStop(0.35, colors.dark)
        grad.addColorStop(0.65, colors.dark)
        grad.addColorStop(1, colors.bg)
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, w, h)

        ctx.save()
        ctx.globalAlpha = 0.04
        for (let y = 0; y < h; y += 2) {
            for (let x = 0; x < w; x += 2) {
                if (Math.random() > 0.5) {
                    ctx.fillStyle = '#ffffff'
                    ctx.fillRect(x, y, 1, 1)
                }
            }
        }
        ctx.restore()

        ctx.save()
        const topGlow = ctx.createRadialGradient(w / 2, -10, 0, w / 2, -10, w * 0.9)
        topGlow.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},0.25)`)
        topGlow.addColorStop(0.5, `rgba(${rgb.r},${rgb.g},${rgb.b},0.06)`)
        topGlow.addColorStop(1, 'transparent')
        ctx.fillStyle = topGlow
        ctx.fillRect(0, 0, w, h * 0.6)
        ctx.restore()

        ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},0.6)`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.roundRect(1, 1, w - 2, h - 2, 6)
        ctx.stroke()

        const titleText = title.title.toUpperCase()
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 18px system-ui'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        const maxWidth = w - 40
        const words = titleText.split(' ')
        const lines: string[] = []
        let currentLine = ''
        for (const word of words) {
            const test = currentLine ? `${currentLine} ${word}` : word
            if (ctx.measureText(test).width > maxWidth && currentLine) {
                lines.push(currentLine)
                currentLine = word
            } else {
                currentLine = test
            }
        }
        if (currentLine) lines.push(currentLine)

        const lineHeight = 23
        const titleStartY = h / 2 - (lines.length * lineHeight) / 2
        lines.slice(0, 3).forEach((line, i) => {
            ctx.fillStyle = 'rgba(0,0,0,0.5)'
            ctx.fillText(line, w / 2 + 1, titleStartY + i * lineHeight + 1, maxWidth)
            ctx.fillStyle = '#ffffff'
            ctx.globalAlpha = 0.95
            ctx.fillText(line, w / 2, titleStartY + i * lineHeight, maxWidth)
        })
        ctx.globalAlpha = 1

        if (status === 'watched') {
            const badgeY = h - 42
            ctx.fillStyle = 'rgba(34,197,94,0.12)'
            ctx.beginPath()
            ctx.roundRect(w / 2 - 40, badgeY, 80, 20, 10)
            ctx.fill()
            ctx.fillStyle = '#4ADE80'
            ctx.font = 'bold 9px system-ui'
            ctx.textBaseline = 'middle'
            ctx.fillText('✓  WATCHED', w / 2, badgeY + 10)
        }

        const bottomAccent = ctx.createLinearGradient(0, h - 6, w, h - 6)
        bottomAccent.addColorStop(0, 'transparent')
        bottomAccent.addColorStop(0.2, `rgba(${rgb.r},${rgb.g},${rgb.b},0.4)`)
        bottomAccent.addColorStop(0.8, `rgba(${rgb.r},${rgb.g},${rgb.b},0.4)`)
        bottomAccent.addColorStop(1, 'transparent')
        ctx.fillStyle = bottomAccent
        ctx.fillRect(0, h - 3, w, 2)
    }

    const tex = new CanvasTexture(canvas)
    tex.colorSpace = SRGBColorSpace
    tex.minFilter = LinearFilter
    tex.magFilter = LinearFilter
    return tex
}

// Poster textures are cached per (title, watched-state, has-image); only the
// watched badge changes the drawing, so other statuses share one texture.
const posterTexCache = new Map<string, CanvasTexture>()

function getPosterTexture(title: Title, status: ProgressStatus | undefined, img?: HTMLImageElement): CanvasTexture {
    const key = `${title.id}:${status === 'watched' ? 'w' : 'o'}:${img ? 'img' : 'flat'}`
    let tex = posterTexCache.get(key)
    if (!tex) {
        tex = createPosterTexture(title, status, img)
        posterTexCache.set(key, tex)
    }
    return tex
}

// One white radial-gradient texture shared by every halo and nebula; the
// per-mesh tint comes from MeshBasicMaterial.color (multiplies the map).
function createWhiteGlowTexture(): CanvasTexture {
    const size = 256
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    grad.addColorStop(0, 'rgba(255,255,255,0.6)')
    grad.addColorStop(0.2, 'rgba(255,255,255,0.25)')
    grad.addColorStop(0.5, 'rgba(255,255,255,0.06)')
    grad.addColorStop(0.8, 'rgba(255,255,255,0.01)')
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, size, size)
    const tex = new CanvasTexture(canvas)
    tex.minFilter = LinearFilter
    return tex
}

// Phase-specific camera presets: each phase group occupies a different region of 3D space
const phaseLayouts: Record<number, {
    center: Vector3
    cameraOffset: Vector3
    cardSpacing: number
    arcRadius: number
    arcAngle: number
    yOffset: number
}> = {
    1: { center: new Vector3(0, 0, 0), cameraOffset: new Vector3(0, 3, 12), cardSpacing: 4.5, arcRadius: 12, arcAngle: Math.PI * 0.6, yOffset: 0 },
    2: { center: new Vector3(25, 3, -8), cameraOffset: new Vector3(3, 5, 10), cardSpacing: 5, arcRadius: 10, arcAngle: Math.PI * 0.5, yOffset: 3 },
    3: { center: new Vector3(50, -2, 5), cameraOffset: new Vector3(-2, 4, 11), cardSpacing: 4.5, arcRadius: 11, arcAngle: Math.PI * 0.55, yOffset: -2 },
    4: { center: new Vector3(15, 6, -25), cameraOffset: new Vector3(2, 3, 13), cardSpacing: 4, arcRadius: 14, arcAngle: Math.PI * 0.7, yOffset: 6 },
    5: { center: new Vector3(-20, -1, -18), cameraOffset: new Vector3(-3, 5, 12), cardSpacing: 3.5, arcRadius: 13, arcAngle: Math.PI * 0.65, yOffset: -1 },
    6: { center: new Vector3(40, 4, -35), cameraOffset: new Vector3(0, 4, 10), cardSpacing: 5, arcRadius: 8, arcAngle: Math.PI * 0.4, yOffset: 4 },
    100: { center: new Vector3(-35, -5, 15), cameraOffset: new Vector3(-2, 3, 10), cardSpacing: 4, arcRadius: 10, arcAngle: Math.PI * 0.5, yOffset: -5 },
    101: { center: new Vector3(-45, 2, -10), cameraOffset: new Vector3(-3, 4, 9), cardSpacing: 5, arcRadius: 6, arcAngle: Math.PI * 0.3, yOffset: 2 },
    102: { center: new Vector3(-30, 8, -30), cameraOffset: new Vector3(-2, 5, 11), cardSpacing: 4, arcRadius: 10, arcAngle: Math.PI * 0.5, yOffset: 8 },
    103: { center: new Vector3(60, 0, 15), cameraOffset: new Vector3(3, 3, 10), cardSpacing: 5, arcRadius: 7, arcAngle: Math.PI * 0.35, yOffset: 0 },
}

function getLayoutForPhase(phaseNum: number) {
    return phaseLayouts[phaseNum] ?? phaseLayouts[1]
}

const scene = new Group()
const raycaster = new Raycaster()
const pointer = new Vector2()

interface CardEntry {
    card: Mesh
    halo: Mesh
    titleId: number
    basePos: Vector3
    phaseNum: number
    index: number
}

const cardMeshes: CardEntry[] = []
let clickTargets: Mesh[] = []
let sortedTitles: Title[] = []

// Shared GPU resources (created once, disposed on unmount)
const CARD_W = 2.2
const CARD_H = 3.15
const FOV = 55
const cardGeo = new PlaneGeometry(CARD_W, CARD_H)
const haloGeo = new PlaneGeometry(CARD_W * 3, CARD_H * 2.8)
const nebulaGeo = new PlaneGeometry(1, 1)
const sharedGlowTex = createWhiteGlowTexture()

// Stars
const starCount = 3000
const starGeo = new BufferGeometry()
const starPositions = new Float32Array(starCount * 3)
const starSizes = new Float32Array(starCount)
const starColors = new Float32Array(starCount * 3)
for (let i = 0; i < starCount; i++) {
    const r = 60 + Math.random() * 300
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.5
    starPositions[i * 3 + 2] = r * Math.cos(phi)
    starSizes[i] = Math.random() * 2 + 0.4
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
            float twinkle = sin(uTime * 1.5 + position.x * 0.06 + position.z * 0.09) * 0.4 + 0.6;
            vAlpha = (0.35 + aSize * 0.3) * twinkle;
            vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = aSize * (70.0 / -mvPos.z);
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
            vec3 col = mix(vColor, vec3(1.0), core * 0.7);
            gl_FragColor = vec4(col, (glow * 0.55 + core * 0.55) * vAlpha);
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

const staticDisposables: { dispose: () => void }[] = [starGeo, starMat, sharedGlowTex, cardGeo, haloGeo, nebulaGeo]

function addNebula(x: number, y: number, z: number, color: string, size: number) {
    const mat = new MeshBasicMaterial({
        map: sharedGlowTex, color, transparent: true, opacity: 0.12,
        blending: AdditiveBlending, depthWrite: false, side: DoubleSide,
    })
    staticDisposables.push(mat)
    const m = new Mesh(nebulaGeo, mat)
    m.position.set(x, y, z)
    m.scale.set(size, size, 1)
    m.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0)
    nebulaGroup.add(m)
}

// Place nebulae near each phase cluster
addNebula(0, 2, -15, '#EF4444', 40)
addNebula(25, 5, -20, '#F97316', 35)
addNebula(50, 0, -10, '#EAB308', 45)
addNebula(15, 10, -35, '#805AD5', 55)
addNebula(-20, 2, -28, '#A78BFA', 40)
addNebula(40, 6, -45, '#14B8A6', 35)
addNebula(-35, -3, 5, '#6B7280', 30)
addNebula(-45, 4, -18, '#B45309', 25)
addNebula(-30, 10, -38, '#DC2626', 30)
addNebula(60, 2, 5, '#6366F1', 28)

const pathGroup = new Group()
scene.add(pathGroup)

const cardGroup = new Group()
scene.add(cardGroup)

let currentLayout: UniverseLayout | null = null
const cardDisposables: { dispose: () => void }[] = []
const pathDisposables: { dispose: () => void }[] = []
const pathOpacity = { value: 1 }

function computePositions(titles: Title[], layoutType: UniverseLayout): Vector3[] {
    const count = titles.length
    if (count === 0) return []

    if (layoutType === 'spiral') {
        // Constant arc-length stepping: equal gaps between neighbours from the
        // centre out, instead of cramming the inner turns.
        const spacing = 4.6
        const startRadius = 5
        const growthPerRadian = 1.1
        let angle = 0
        return titles.map(() => {
            const r = startRadius + growthPerRadian * angle
            const p = new Vector3(Math.cos(angle) * r, Math.sin(angle * 0.9) * 1.2, Math.sin(angle) * r)
            angle += spacing / r
            return p
        })
    }

    if (layoutType === 'zigzag') {
        const spacing = 4.5
        const amplitude = 8
        const depthAmp = 6
        const totalLength = (count - 1) * spacing
        const startX = -totalLength / 2
        return titles.map((_, i) => {
            const x = startX + i * spacing
            const side = i % 2 === 0 ? 1 : -1
            const progress = count > 1 ? i / (count - 1) : 0.5
            const y = side * amplitude * 0.5
            const z = Math.sin(progress * Math.PI) * -depthAmp
            return new Vector3(x, y, z)
        })
    }

    if (layoutType === 'grid') {
        const cols = Math.ceil(Math.sqrt(count * 1.5))
        const spacingX = 5
        const spacingZ = 6
        const totalW = (cols - 1) * spacingX
        const rows = Math.ceil(count / cols)
        const totalD = (rows - 1) * spacingZ
        return titles.map((_, i) => {
            const col = i % cols
            const row = Math.floor(i / cols)
            const x = col * spacingX - totalW / 2
            const z = row * spacingZ - totalD / 2
            const y = Math.sin(col * 0.8) * Math.cos(row * 0.8) * 1.5
            return new Vector3(x, y, z)
        })
    }

    if (layoutType === 'helix') {
        // Single continuous helix: chronology flows along one strand and the
        // height stays within what the camera pitch clamp can actually see.
        const turns = 2.5
        const heightRange = 28
        const radius = 13
        return titles.map((_, i) => {
            const t = i / (count - 1 || 1)
            const angle = t * Math.PI * 2 * turns
            return new Vector3(
                Math.cos(angle) * radius,
                t * heightRange - heightRange / 2,
                Math.sin(angle) * radius,
            )
        })
    }

    if (layoutType === 'galaxy') {
        // Contiguous chronological runs per arm (no i % arms interleaving, so
        // the connecting path never zigzags through the core) and sqrt-radius
        // for even density instead of a crammed centre.
        const arms = 3
        const perArm = Math.ceil(count / arms)
        return titles.map((_, i) => {
            const arm = Math.floor(i / perArm)
            const k = i - arm * perArm
            const t = k / (perArm - 1 || 1)
            const armOffset = (arm / arms) * Math.PI * 2
            const angle = armOffset + t * Math.PI * 1.7
            const r = 6 + Math.sqrt(t) * 32
            const y = Math.sin(i * 2.7) * 1.2 * (1 - t) + Math.sin(angle) * 1.5 * t
            return new Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r)
        })
    }

    if (layoutType === 'ring') {
        const radius = 25
        return titles.map((_, i) => {
            const angle = (i / count) * Math.PI * 2
            const wobbleY = Math.sin(angle * 3) * 3
            const wobbleR = Math.cos(angle * 5) * 2
            return new Vector3(
                Math.cos(angle) * (radius + wobbleR),
                wobbleY,
                Math.sin(angle) * (radius + wobbleR),
            )
        })
    }

    if (layoutType === 'sphere') {
        const radius = 22
        const goldenAngle = Math.PI * (3 - Math.sqrt(5))
        return titles.map((_, i) => {
            const y = 1 - (i / (count - 1 || 1)) * 2
            const radiusAtY = Math.sqrt(1 - y * y)
            const theta = goldenAngle * i
            return new Vector3(
                Math.cos(theta) * radiusAtY * radius,
                y * radius,
                Math.sin(theta) * radiusAtY * radius,
            )
        })
    }

    if (layoutType === 'vortex') {
        const maxRadius = 28
        const height = 30
        const turns = 5
        return titles.map((_, i) => {
            const t = i / (count - 1 || 1)
            const angle = t * Math.PI * 2 * turns
            const r = maxRadius * (1 - t * 0.7)
            const y = t * height - height / 2
            const wobble = Math.sin(t * Math.PI * 8) * 1.5 * (1 - t)
            return new Vector3(Math.cos(angle) * (r + wobble), y, Math.sin(angle) * (r + wobble))
        })
    }

    // 'phase' layout: original phase-cluster arc positioning
    const phaseGroups = new Map<number, { indices: number[] }>()
    titles.forEach((title, i) => {
        const p = getPhaseNumber(title.phase)
        if (!phaseGroups.has(p)) phaseGroups.set(p, { indices: [] })
        phaseGroups.get(p)!.indices.push(i)
    })

    const positions = new Array<Vector3>(count)
    for (const [phaseNum, group] of phaseGroups) {
        const pl = getLayoutForPhase(phaseNum)
        const gc = group.indices.length
        group.indices.forEach((globalIdx, localIdx) => {
            const t = gc > 1 ? localIdx / (gc - 1) : 0.5
            const angle = -pl.arcAngle / 2 + t * pl.arcAngle
            const x = pl.center.x + Math.sin(angle) * pl.arcRadius
            const y = pl.yOffset + Math.sin(t * Math.PI) * 2.5 + Math.cos(angle * 2) * 0.8
            const z = pl.center.z + Math.cos(angle) * pl.arcRadius * 0.4
            positions[globalIdx] = new Vector3(x, y, z)
        })
    }
    return positions
}

function buildPath(positions: Vector3[]) {
    while (pathGroup.children.length > 0) pathGroup.remove(pathGroup.children[0])
    pathDisposables.forEach(d => d.dispose())
    pathDisposables.length = 0

    if (positions.length < 2) return

    const curve = new CatmullRomCurve3(positions.map(p => p.clone()), false, 'catmullrom', 0.3)
    const tubeGeo = new TubeGeometry(curve, positions.length * 12, 0.015, 6, false)
    pathDisposables.push(tubeGeo)
    const tubeMat = new ShaderMaterial({
        vertexShader: `
            varying vec2 vUv;
            void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
        `,
        fragmentShader: `
            uniform float uTime;
            uniform float uOpacity;
            varying vec2 vUv;
            void main() {
                float energy = sin(vUv.x * 50.0 - uTime * 3.5) * 0.5 + 0.5;
                float alpha = 0.05 + energy * 0.18;
                vec3 c1 = vec3(0.93, 0.26, 0.26);
                vec3 c2 = vec3(0.55, 0.36, 0.96);
                vec3 c3 = vec3(0.08, 0.72, 0.65);
                vec3 color = vUv.x < 0.5 ? mix(c1, c2, vUv.x * 2.0) : mix(c2, c3, (vUv.x - 0.5) * 2.0);
                gl_FragColor = vec4(color, alpha * uOpacity);
            }
        `,
        uniforms: { uTime: { value: 0 }, uOpacity: { value: pathOpacity.value } },
        transparent: true, blending: AdditiveBlending, depthWrite: false,
    })
    pathDisposables.push(tubeMat)
    pathGroup.add(new Mesh(tubeGeo, tubeMat))

    const dotCount = positions.length * 5
    const dotGeo = new BufferGeometry()
    const dPos = new Float32Array(dotCount * 3)
    const dSizes = new Float32Array(dotCount)
    const dProgress = new Float32Array(dotCount)
    for (let i = 0; i < dotCount; i++) {
        const t = i / dotCount
        const p = curve.getPoint(t)
        dPos[i * 3] = p.x; dPos[i * 3 + 1] = p.y; dPos[i * 3 + 2] = p.z
        dSizes[i] = 1.0 + Math.random() * 1.5
        dProgress[i] = t
    }
    dotGeo.setAttribute('position', new Float32BufferAttribute(dPos, 3))
    dotGeo.setAttribute('aSize', new Float32BufferAttribute(dSizes, 1))
    dotGeo.setAttribute('aProgress', new Float32BufferAttribute(dProgress, 1))
    pathDisposables.push(dotGeo)

    const dotMat = new ShaderMaterial({
        vertexShader: `
            attribute float aSize;
            attribute float aProgress;
            uniform float uTime;
            varying float vAlpha;
            varying vec3 vColor;
            void main() {
                float wave = sin(aProgress * 70.0 - uTime * 4.5) * 0.5 + 0.5;
                vAlpha = 0.15 + wave * 0.5;
                vec3 c1 = vec3(0.93, 0.26, 0.26);
                vec3 c2 = vec3(0.55, 0.36, 0.96);
                vec3 c3 = vec3(0.08, 0.72, 0.65);
                vColor = aProgress < 0.5 ? mix(c1, c2, aProgress * 2.0) : mix(c2, c3, (aProgress - 0.5) * 2.0);
                vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = aSize * wave * (25.0 / -mvPos.z);
                gl_Position = projectionMatrix * mvPos;
            }
        `,
        fragmentShader: `
            uniform float uOpacity;
            varying float vAlpha;
            varying vec3 vColor;
            void main() {
                float d = length(gl_PointCoord - vec2(0.5));
                if (d > 0.5) discard;
                float glow = 1.0 - smoothstep(0.0, 0.5, d);
                gl_FragColor = vec4(vColor, glow * vAlpha * uOpacity);
            }
        `,
        uniforms: { uTime: { value: 0 }, uOpacity: { value: pathOpacity.value } },
        transparent: true, blending: AdditiveBlending, depthWrite: false,
    })
    pathDisposables.push(dotMat)
    pathGroup.add(new Points(dotGeo, dotMat))
}

// Reposition existing meshes for the active layout. Rebuilding meshes on a
// layout switch is never needed — only the target positions change.
function applyLayout(animated: boolean) {
    const positions = computePositions(sortedTitles, props.layout)

    cardMeshes.forEach((entry) => {
        const target = positions[entry.index]
        if (!target) return
        gsap.killTweensOf(entry.basePos)
        if (animated) {
            gsap.to(entry.basePos, {
                x: target.x, y: target.y, z: target.z,
                duration: 1.2, ease: 'power3.inOut', delay: entry.index * 0.006,
            })
        } else {
            entry.basePos.copy(target)
        }
    })

    if (animated) {
        // The tube can't morph, so fade it out, rebuild at the destination and
        // fade back in once the cards have (mostly) arrived.
        gsap.killTweensOf(pathOpacity)
        gsap.to(pathOpacity, {
            value: 0, duration: 0.3, ease: 'power1.out',
            onComplete: () => {
                buildPath(positions)
                gsap.to(pathOpacity, { value: 1, duration: 0.6, ease: 'power1.in', delay: 0.9 })
            },
        })
    } else {
        buildPath(positions)
    }

    return positions
}

let lastStatusById = new Map<number, ProgressStatus | undefined>()

function buildCards() {
    while (cardGroup.children.length > 0) cardGroup.remove(cardGroup.children[0])
    cardMeshes.length = 0
    cardDisposables.forEach(d => d.dispose())
    cardDisposables.length = 0

    sortedTitles = [...props.titles]
    const positions = computePositions(sortedTitles, props.layout)

    sortedTitles.forEach((title, globalIdx) => {
        const pos = positions[globalIdx]
        const status = props.progressMap.get(title.id)
        const colors = getPhaseColors(title.phase)

        const cardMat = new MeshBasicMaterial({
            map: getPosterTexture(title, status), transparent: true,
            opacity: status === 'skipped' ? 0.3 : 0.95,
            side: FrontSide,
            depthWrite: false,
        })
        cardDisposables.push(cardMat)
        const card = new Mesh(cardGeo, cardMat)
        card.renderOrder = 2
        card.position.copy(pos)
        card.userData.titleId = title.id
        cardGroup.add(card)

        if (title.poster_url) {
            loadPosterImage(title.poster_url).then(img => {
                const currentStatus = props.progressMap.get(title.id)
                cardMat.map = getPosterTexture(title, currentStatus, img)
                cardMat.needsUpdate = true
            }).catch(() => {})
        }

        const haloMat = new MeshBasicMaterial({
            map: sharedGlowTex, color: colors.primary, transparent: true,
            opacity: status === 'watched' ? 0.2 : 0.08,
            blending: AdditiveBlending, depthWrite: false, side: DoubleSide,
        })
        cardDisposables.push(haloMat)
        const halo = new Mesh(haloGeo, haloMat)
        halo.renderOrder = 1
        halo.position.copy(pos)
        halo.position.z -= 0.15
        cardGroup.add(halo)

        cardMeshes.push({ card, halo, titleId: title.id, basePos: pos.clone(), phaseNum: getPhaseNumber(title.phase), index: globalIdx })
    })

    clickTargets = cardMeshes.map(c => c.card)
    lastStatusById = new Map(props.progressMap)
    buildPath(positions)
    currentLayout = props.layout
}

const titleIdsSignature = (ts: Title[]) => ts.map(t => t.id).join(',')

watch(() => props.titles, (newTitles, oldTitles) => {
    if (titleIdsSignature(newTitles) === titleIdsSignature(oldTitles ?? [])) return
    buildCards()
    if (settings.cameraAutoReset) flyToCard(props.focusedIndex)
})

watch(() => props.layout, (newLayout) => {
    if (newLayout === currentLayout) return
    currentLayout = newLayout
    const positions = applyLayout(true)
    if (positions) flyToOverview(positions)
})

// Status changes only swap the affected card's texture — no rebuild, no
// full-canvas redraw hitch. (Also fixes the watched-badge never updating when
// no status filter is active: the titles array identity doesn't change then.)
watch(() => props.progressMap, (map) => {
    for (const entry of cardMeshes) {
        const status = map.get(entry.titleId)
        if (status === lastStatusById.get(entry.titleId)) continue
        const title = sortedTitles[entry.index]
        if (!title) continue
        const img = title.poster_url ? posterImageCache.get(posterProxyUrl(title.poster_url)) : undefined
        const mat = entry.card.material as MeshBasicMaterial
        mat.map = getPosterTexture(title, status, img)
        mat.needsUpdate = true
    }
    lastStatusById = new Map(map)
})

buildCards()

const { camera, renderer } = useTres()
function applyBg() {
    if (renderer.value) renderer.value.setClearColor(new Color(props.themeBg), 1)
}
applyBg()
watch(renderer, () => applyBg())
watch(() => props.themeBg, () => applyBg())

// Camera rig: cameraCenter + camState are the single source of truth composed
// in onLoop. GSAP owns them while `cameraTweening`; the drag/wheel targets take
// back over via syncTargetsAndRelease() so the two never fight.
let isDragging = false
let dragStart = { x: 0, y: 0 }
const camState = { distance: 18, angleX: 0, angleY: 0.15 }
const targetAngle = { x: 0, y: 0.15 }
let targetDistance = 18
const cameraCenter = new Vector3(0, 0, 0)
const targetCenter = new Vector3(0, 0, 0)
let lastHoveredId: number | null = null
let autoRotate = true
let cameraTweening = false
let camTl: gsap.core.Timeline | null = null
let pointerDirty = false
let lastPointerType = 'mouse'

function shortestAngle(from: number, to: number) {
    return from + ((((to - from + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI
}

function syncTargetsAndRelease() {
    targetCenter.copy(cameraCenter)
    targetDistance = camState.distance
    targetAngle.x = camState.angleX
    targetAngle.y = camState.angleY
    cameraTweening = false
}

function killCameraTweens() {
    if (camTl) {
        camTl.kill()
        camTl = null
    }
    if (cameraTweening) syncTargetsAndRelease()
}

function flyTo(opts: { center?: Vector3; distance?: number; angleX?: number; angleY?: number; duration?: number }) {
    killCameraTweens()
    autoRotate = false
    cameraTweening = true
    const duration = opts.duration ?? 1.1
    camTl = gsap.timeline({
        onComplete: () => {
            camTl = null
            syncTargetsAndRelease()
        },
    })
    if (opts.center) {
        camTl.to(cameraCenter, { x: opts.center.x, y: opts.center.y, z: opts.center.z, duration, ease: 'power3.inOut' }, 0)
    }
    const stateTarget: Record<string, number> = {}
    if (opts.distance != null) stateTarget.distance = opts.distance
    if (opts.angleY != null) stateTarget.angleY = opts.angleY
    if (opts.angleX != null) stateTarget.angleX = shortestAngle(camState.angleX, opts.angleX)
    if (Object.keys(stateTarget).length > 0) {
        camTl.to(camState, { ...stateTarget, duration, ease: 'power3.inOut' }, 0)
    }
}

// Distance that frames a card (plus margin) in the vertical fov.
function fitDistance() {
    return (CARD_H * 1.15 / 2) / Math.tan((FOV / 2) * Math.PI / 180) + 2
}

function flyToCard(index: number) {
    const entry = cardMeshes.find(c => c.index === index)
    if (!entry) return
    const azimuth = Math.atan2(entry.basePos.x, entry.basePos.z)
    flyTo({
        center: new Vector3(entry.basePos.x, entry.basePos.y + 0.2, entry.basePos.z),
        distance: fitDistance(),
        angleX: azimuth,
        angleY: 0.05,
    })
}

// Frame the bounding sphere of a layout so every layout switch lands on a
// well-composed establishing shot.
function flyToOverview(positions: Vector3[]) {
    if (positions.length === 0) return
    const center = new Vector3()
    positions.forEach(p => center.add(p))
    center.divideScalar(positions.length)
    let radius = 0
    positions.forEach(p => { radius = Math.max(radius, center.distanceTo(p)) })
    const fovRad = (FOV / 2) * Math.PI / 180
    const distance = Math.min(60, Math.max(12, (radius / Math.sin(fovRad)) * 1.15))
    flyTo({ center, distance, angleY: 0.28, duration: 1.3 })
}

// Watch focused index changes from parent (Next/Prev buttons)
watch(() => props.focusedIndex, (newIdx) => {
    if (settings.cameraAutoReset) flyToCard(newIdx)
})

function onPointerDown(e: PointerEvent) {
    isDragging = true
    autoRotate = false
    killCameraTweens()
    dragStart = { x: e.clientX, y: e.clientY }
}

function onPointerMove(e: PointerEvent) {
    const canvas = renderer.value?.domElement
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    pointerDirty = true
    lastPointerType = e.pointerType
    if (isDragging) {
        const dx = e.clientX - dragStart.x
        const dy = e.clientY - dragStart.y
        targetAngle.x -= dx * 0.004
        targetAngle.y = Math.max(-0.6, Math.min(0.6, targetAngle.y + dy * 0.004))
        dragStart = { x: e.clientX, y: e.clientY }
    }
}

function onPointerLeave() {
    pointerDirty = false
    if (lastHoveredId !== null) {
        lastHoveredId = null
        emit('hover', null)
    }
}

function onPointerUp(e: PointerEvent) {
    const wasDrag = Math.abs(e.clientX - dragStart.x) > 5 || Math.abs(e.clientY - dragStart.y) > 5
    isDragging = false
    if (!wasDrag && camera.value) {
        raycaster.setFromCamera(pointer, camera.value)
        const intersects = raycaster.intersectObjects(clickTargets, false)
        const hit = intersects.find(i => i.object.userData.titleId != null)
        if (hit) {
            const id = hit.object.userData.titleId
            const entry = cardMeshes.find(p => p.titleId === id)
            if (entry) {
                const deselecting = id === props.selectedId
                if (deselecting) {
                    emit('select', null)
                    flyTo({ distance: 14, angleY: 0.12, duration: 0.9 })
                } else {
                    emit('select', id)
                    emit('update:focusedIndex', entry.index)
                    flyToCard(entry.index)
                }
            }
        } else {
            emit('select', null)
            flyTo({ distance: 14, angleY: 0.12, duration: 0.9 })
        }
    }
}

let scrollCooldown = false

function onWheel(e: WheelEvent) {
    e.preventDefault()
    autoRotate = false
    killCameraTweens()

    // Ctrl/Cmd + scroll = zoom
    if (e.ctrlKey || e.metaKey) {
        const speed = 0.004
        targetDistance = Math.max(4, Math.min(60, targetDistance + e.deltaY * speed))
        return
    }

    if (settings.scrollBehavior === 'snap') {
        // Snap: jump one card per scroll tick
        if (scrollCooldown) return
        scrollCooldown = true
        setTimeout(() => { scrollCooldown = false }, 300)

        const direction = e.deltaY > 0 ? 1 : -1
        const nextIndex = Math.max(0, Math.min(cardMeshes.length - 1, props.focusedIndex + direction))
        if (nextIndex !== props.focusedIndex) {
            emit('update:focusedIndex', nextIndex)
        }
    } else {
        // Free scroll: smooth camera movement along the timeline
        const speed = 0.015
        targetCenter.x += e.deltaY * speed
        targetCenter.x = Math.max(-50, Math.min(70, targetCenter.x))
    }
}

onMounted(() => {
    const canvas = renderer.value?.domElement
    if (!canvas) return
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointerleave', onPointerLeave)
    canvas.addEventListener('wheel', onWheel, { passive: false })
})

onUnmounted(() => {
    const canvas = renderer.value?.domElement
    if (canvas) {
        canvas.removeEventListener('pointerdown', onPointerDown)
        canvas.removeEventListener('pointermove', onPointerMove)
        canvas.removeEventListener('pointerup', onPointerUp)
        canvas.removeEventListener('pointerleave', onPointerLeave)
        canvas.removeEventListener('wheel', onWheel)
    }
    if (camTl) camTl.kill()
    gsap.killTweensOf(pathOpacity)
    cardMeshes.forEach(entry => gsap.killTweensOf(entry.basePos))
    cardDisposables.forEach(d => d.dispose())
    cardDisposables.length = 0
    pathDisposables.forEach(d => d.dispose())
    pathDisposables.length = 0
    staticDisposables.forEach(d => d.dispose())
    posterTexCache.forEach(tex => tex.dispose())
    posterTexCache.clear()
})

const { onLoop } = useRenderLoop()
let elapsed = 0

// Scratch objects: the loop must not allocate.
const _billboardDir = new Vector3()
const _toCard = new Vector3()
const _toFocused = new Vector3()
const _scaleTarget = new Vector3()

onLoop(({ delta }) => {
    elapsed += delta

    starMat.uniforms.uTime.value = elapsed
    pathGroup.children.forEach(child => {
        const m = child as Mesh
        const mat = m.material as ShaderMaterial
        if (mat?.uniforms?.uTime) mat.uniforms.uTime.value = elapsed
        if (mat?.uniforms?.uOpacity) mat.uniforms.uOpacity.value = pathOpacity.value
    })

    if (!cameraTweening) {
        camState.angleX += (targetAngle.x - camState.angleX) * 0.08
        camState.angleY += (targetAngle.y - camState.angleY) * 0.08
        camState.distance += (targetDistance - camState.distance) * 0.08
        cameraCenter.lerp(targetCenter, 0.06)
    }

    if (autoRotate && !props.selectedId && !cameraTweening) {
        targetAngle.x += delta * 0.04
    }

    if (camera.value) {
        const cx = cameraCenter.x + Math.sin(camState.angleX) * Math.cos(camState.angleY) * camState.distance
        const cy = cameraCenter.y + Math.sin(camState.angleY) * camState.distance
        const cz = cameraCenter.z + Math.cos(camState.angleX) * Math.cos(camState.angleY) * camState.distance
        camera.value.position.set(cx, cy, cz)
        camera.value.lookAt(cameraCenter)
    }

    const focusedEntry = cardMeshes.find(c => c.index === props.focusedIndex)
    const hasFocus = !!(props.selectedId || focusedEntry)

    for (const entry of cardMeshes) {
        const { card, halo, titleId, basePos, index } = entry
        const hover = titleId === props.hoveredId
        const selected = titleId === props.selectedId
        const focused = index === props.focusedIndex && !selected
        const cardMat = card.material as MeshBasicMaterial
        const haloMat = halo.material as MeshBasicMaterial
        const status = props.progressMap.get(titleId)

        let driftX = 0, driftY = 0, driftZ = 0
        if (settings.layoutDrift) {
            const driftSpeed = 0.12
            const driftAmp = 1.2
            const phase = index * 0.7
            driftX = Math.sin(elapsed * driftSpeed + phase) * driftAmp * Math.cos(index * 0.3)
            driftY = Math.cos(elapsed * driftSpeed * 0.7 + phase * 1.3) * driftAmp * 0.5
            driftZ = Math.sin(elapsed * driftSpeed * 0.5 + phase * 0.9) * driftAmp * Math.sin(index * 0.5)
        }

        const bobSpeed = 0.4 + (index % 5) * 0.08
        const bobAmp = 0.08 + (index % 3) * 0.03
        const bob = Math.sin(elapsed * bobSpeed + basePos.x * 0.3 + index * 1.1) * bobAmp
        const px = basePos.x + driftX
        const py = basePos.y + bob + driftY
        const pz = basePos.z + driftZ
        card.position.set(px, py, pz)
        halo.position.set(px, py, pz - 0.15)

        if (camera.value) {
            _billboardDir.subVectors(camera.value.position, card.position)
            const angle = Math.atan2(_billboardDir.x, _billboardDir.z)
            card.rotation.y += (angle - card.rotation.y) * 0.15
            halo.rotation.y = card.rotation.y
        }

        let occludeAmount = 0
        if (hasFocus && camera.value && !selected && !focused && focusedEntry) {
            const camPos = camera.value.position
            const distToCard = camPos.distanceTo(card.position)
            const distToFocused = camPos.distanceTo(focusedEntry.card.position)

            if (distToCard < distToFocused) {
                _toCard.subVectors(card.position, camPos).normalize()
                _toFocused.subVectors(focusedEntry.card.position, camPos).normalize()
                const dot = _toCard.dot(_toFocused)
                if (dot > 0.55) {
                    occludeAmount = Math.min(1.0, (dot - 0.55) / 0.3)
                }
            }

            if (occludeAmount < 1.0 && distToCard < distToFocused * 0.85) {
                const proximityFade = 1.0 - Math.min(1.0, (distToFocused * 0.85 - distToCard) / 4.0)
                occludeAmount = Math.max(occludeAmount, 1.0 - proximityFade)
            }
        }

        const targetScale = selected ? 1.3 : focused ? 1.15 : hover ? 1.08 : 1.0
        const scaleLerp = selected || focused ? 0.18 : 0.12
        card.scale.lerp(_scaleTarget.set(targetScale, targetScale, 1), scaleLerp)
        halo.scale.copy(card.scale)

        const baseCardOpacity = selected ? 1.0 : focused ? 1.0 : hover ? 1.0 : (status === 'skipped' ? 0.25 : 0.88)
        const targetCardOpacity = baseCardOpacity * (1.0 - occludeAmount * 0.97)
        const cardDiff = targetCardOpacity - cardMat.opacity
        cardMat.opacity = Math.abs(cardDiff) < 0.005 ? targetCardOpacity : cardMat.opacity + cardDiff * 0.18

        const glowPulse = selected || focused ? Math.sin(elapsed * 2.0) * 0.06 : 0
        const baseHaloOpacity = selected ? 0.6 + glowPulse : focused ? 0.45 + glowPulse : hover ? 0.32 : (status === 'watched' ? 0.22 : 0.09)
        const targetHaloOpacity = baseHaloOpacity * (1.0 - occludeAmount)
        const haloDiff = targetHaloOpacity - haloMat.opacity
        haloMat.opacity = Math.abs(haloDiff) < 0.005 ? targetHaloOpacity : haloMat.opacity + haloDiff * 0.14
    }

    // Hover raycast only when the pointer actually moved (never per-frame),
    // and never for touch — tap selection runs its own raycast in onPointerUp.
    if (pointerDirty && camera.value && !isDragging && lastPointerType !== 'touch') {
        pointerDirty = false
        raycaster.setFromCamera(pointer, camera.value)
        const hit = raycaster.intersectObjects(clickTargets, false)[0]
        const newId = (hit?.object.userData.titleId as number | undefined) ?? null
        if (newId !== lastHoveredId) {
            lastHoveredId = newId
            emit('hover', newId)
        }
    }

    stars.rotation.y = elapsed * 0.008
    stars.rotation.x = elapsed * 0.003

    nebulaGroup.children.forEach((n, i) => {
        n.rotation.z = elapsed * 0.012 * (i % 2 === 0 ? 1 : -1)
        const mat = (n as Mesh).material as MeshBasicMaterial
        mat.opacity = 0.12 + Math.sin(elapsed * 0.2 + i * 1.8) * 0.06
    })

    if (import.meta.dev && showFps.value && renderer.value) sample(renderer.value, delta)
})
</script>
