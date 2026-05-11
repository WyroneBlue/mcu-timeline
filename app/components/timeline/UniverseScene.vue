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
import { useRenderLoop, useTres } from '@tresjs/core'
import type { Database } from '~/types/supabase'

type Title = Database['public']['Tables']['titles']['Row']
type ProgressStatus = 'queued' | 'watching' | 'watched' | 'skipped'

const props = defineProps<{
    titles: Title[]
    progressMap: Map<number, ProgressStatus>
    hoveredId: number | null
    selectedId: number | null
    focusedIndex: number
}>()

const emit = defineEmits<{
    hover: [id: number | null]
    select: [id: number | null]
    'update:focusedIndex': [index: number]
}>()

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
    const phaseNum = getPhaseNumber(title.phase)
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

function createGlowTexture(color: string): CanvasTexture {
    const size = 256
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!
    const { r, g, b } = hexToRgb(color)
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    grad.addColorStop(0, `rgba(${r},${g},${b},0.6)`)
    grad.addColorStop(0.2, `rgba(${r},${g},${b},0.25)`)
    grad.addColorStop(0.5, `rgba(${r},${g},${b},0.06)`)
    grad.addColorStop(0.8, `rgba(${r},${g},${b},0.01)`)
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
    glow: Mesh
    bg: Mesh
    titleId: number
    basePos: Vector3
    phaseNum: number
    index: number
}

const cardMeshes: CardEntry[] = []
let sortedTitles: Title[] = []

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

function addNebula(x: number, y: number, z: number, color: string, size: number) {
    const tex = createGlowTexture(color)
    const geo = new PlaneGeometry(size, size)
    const mat = new MeshBasicMaterial({
        map: tex, transparent: true, opacity: 0.12,
        blending: AdditiveBlending, depthWrite: false, side: DoubleSide,
    })
    const m = new Mesh(geo, mat)
    m.position.set(x, y, z)
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

let currentTitleCount = 0
const disposables: { dispose: () => void }[] = []

function buildCards() {
    while (cardGroup.children.length > 0) cardGroup.remove(cardGroup.children[0])
    while (pathGroup.children.length > 0) pathGroup.remove(pathGroup.children[0])
    cardMeshes.length = 0
    disposables.forEach(d => d.dispose())
    disposables.length = 0

    sortedTitles = [...props.titles].sort((a, b) => (a.chronology_index ?? 0) - (b.chronology_index ?? 0))

    const phaseGroups = new Map<number, { titles: Title[], globalIndices: number[] }>()
    sortedTitles.forEach((title, globalIdx) => {
        const p = getPhaseNumber(title.phase)
        if (!phaseGroups.has(p)) phaseGroups.set(p, { titles: [], globalIndices: [] })
        phaseGroups.get(p)!.titles.push(title)
        phaseGroups.get(p)!.globalIndices.push(globalIdx)
    })

    const allPathPoints: Vector3[] = []

    for (const [phaseNum, group] of phaseGroups) {
        const layout = getLayoutForPhase(phaseNum)
        const count = group.titles.length

        group.titles.forEach((title, localIdx) => {
            const t = count > 1 ? localIdx / (count - 1) : 0.5
            const angle = -layout.arcAngle / 2 + t * layout.arcAngle

            const x = layout.center.x + Math.sin(angle) * layout.arcRadius
            const y = layout.yOffset + Math.sin(t * Math.PI) * 2.5 + Math.cos(angle * 2) * 0.8
            const z = layout.center.z + Math.cos(angle) * layout.arcRadius * 0.4

            const status = props.progressMap.get(title.id)
            const colors = getPhaseColors(title.phase)

            const cardW = 2.2
            const cardH = 3.15
            const cardGeo = new PlaneGeometry(cardW, cardH)
            disposables.push(cardGeo)
            const texture = createPosterTexture(title, status)
            disposables.push(texture)
            const cardMat = new MeshBasicMaterial({
                map: texture, transparent: true,
                opacity: status === 'skipped' ? 0.3 : 0.95,
                side: FrontSide,
            })
            disposables.push(cardMat)
            const card = new Mesh(cardGeo, cardMat)
            const pos = new Vector3(x, y, z)
            card.position.copy(pos)
            card.userData.titleId = title.id
            cardGroup.add(card)

            if (title.poster_url) {
                loadPosterImage(title.poster_url).then(img => {
                    const newTex = createPosterTexture(title, status, img)
                    disposables.push(newTex)
                    cardMat.map = newTex
                    cardMat.needsUpdate = true
                }).catch(() => {})
            }

            const glowTex = createGlowTexture(colors.primary)
            disposables.push(glowTex)
            const glowGeo = new PlaneGeometry(cardW * 2.5, cardH * 2.5)
            disposables.push(glowGeo)
            const glowMat = new MeshBasicMaterial({
                map: glowTex, transparent: true,
                opacity: status === 'watched' ? 0.2 : 0.06,
                blending: AdditiveBlending, depthWrite: false, side: DoubleSide,
            })
            disposables.push(glowMat)
            const glow = new Mesh(glowGeo, glowMat)
            glow.position.copy(pos)
            glow.position.z -= 0.1
            cardGroup.add(glow)

            // Soft background card — low-opacity phase-colored plane behind each card
            const bgGeo = new PlaneGeometry(cardW * 3.5, cardH * 3)
            disposables.push(bgGeo)
            const bgGlowTex = createGlowTexture(colors.dark)
            disposables.push(bgGlowTex)
            const bgMat = new MeshBasicMaterial({
                map: bgGlowTex, transparent: true,
                opacity: 0.06,
                blending: AdditiveBlending, depthWrite: false, side: DoubleSide,
            })
            disposables.push(bgMat)
            const bgMesh = new Mesh(bgGeo, bgMat)
            bgMesh.position.copy(pos)
            bgMesh.position.z -= 0.2
            cardGroup.add(bgMesh)

            const globalIdx = group.globalIndices[localIdx]
            cardMeshes.push({ card, glow, bg: bgMesh, titleId: title.id, basePos: pos.clone(), phaseNum, index: globalIdx })
            allPathPoints.push(pos.clone())
        })
    }

    // Sort path points by global index for the connecting line
    const sortedCards = [...cardMeshes].sort((a, b) => a.index - b.index)
    const pathPoints = sortedCards.map(c => c.basePos.clone())

    if (pathPoints.length >= 2) {
        const curve = new CatmullRomCurve3(pathPoints, false, 'catmullrom', 0.3)
        const tubeGeo = new TubeGeometry(curve, pathPoints.length * 12, 0.015, 6, false)
        disposables.push(tubeGeo)
        const tubeMat = new ShaderMaterial({
            vertexShader: `
                varying vec2 vUv;
                void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
            `,
            fragmentShader: `
                uniform float uTime;
                varying vec2 vUv;
                void main() {
                    float energy = sin(vUv.x * 50.0 - uTime * 3.5) * 0.5 + 0.5;
                    float alpha = 0.05 + energy * 0.18;
                    vec3 c1 = vec3(0.93, 0.26, 0.26);
                    vec3 c2 = vec3(0.55, 0.36, 0.96);
                    vec3 c3 = vec3(0.08, 0.72, 0.65);
                    vec3 color = vUv.x < 0.5 ? mix(c1, c2, vUv.x * 2.0) : mix(c2, c3, (vUv.x - 0.5) * 2.0);
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            uniforms: { uTime: { value: 0 } },
            transparent: true, blending: AdditiveBlending, depthWrite: false,
        })
        disposables.push(tubeMat)
        pathGroup.add(new Mesh(tubeGeo, tubeMat))

        const dotCount = pathPoints.length * 5
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
        disposables.push(dotGeo)

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
            transparent: true, blending: AdditiveBlending, depthWrite: false,
        })
        disposables.push(dotMat)
        pathGroup.add(new Points(dotGeo, dotMat))
    }

    currentTitleCount = sortedTitles.length
}

watch(() => props.titles.length, () => {
    if (props.titles.length !== currentTitleCount) buildCards()
})
buildCards()

const { camera, renderer } = useTres()
if (renderer.value) renderer.value.setClearColor(0x050508, 1)
watch(renderer, (r) => { if (r) r.setClearColor(0x050508, 1) })

// Camera system
let isDragging = false
let dragStart = { x: 0, y: 0 }
let cameraAngle = { x: 0, y: 0.15 }
let cameraDistance = 18
let targetAngle = { x: 0, y: 0.15 }
let targetDistance = 18
let cameraCenter = new Vector3(0, 0, 0)
let targetCenter = new Vector3(0, 0, 0)
let lastHoveredId: number | null = null
let autoRotate = true
let flyingToTarget = false
let flyProgress = 0

function flyToCard(index: number) {
    const entry = cardMeshes.find(c => c.index === index)
    if (!entry) return

    targetCenter = entry.basePos.clone()
    targetDistance = 6.5
    targetAngle.y = 0.05

    const dir = new Vector3().subVectors(entry.basePos, new Vector3(0, 0, 0)).normalize()
    targetAngle.x = Math.atan2(dir.x, dir.z)

    flyingToTarget = true
    flyProgress = 0
    autoRotate = false
}

// Watch focused index changes from parent (Next/Prev buttons)
watch(() => props.focusedIndex, (newIdx) => {
    flyToCard(newIdx)
})

function onPointerDown(e: PointerEvent) {
    isDragging = true
    autoRotate = false
    dragStart = { x: e.clientX, y: e.clientY }
}

function onPointerMove(e: PointerEvent) {
    const canvas = renderer.value?.domElement
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    if (isDragging) {
        const dx = e.clientX - dragStart.x
        const dy = e.clientY - dragStart.y
        targetAngle.x -= dx * 0.004
        targetAngle.y = Math.max(-0.6, Math.min(0.6, targetAngle.y + dy * 0.004))
        dragStart = { x: e.clientX, y: e.clientY }
    }
}

function onPointerUp(e: PointerEvent) {
    const wasDrag = Math.abs(e.clientX - dragStart.x) > 5 || Math.abs(e.clientY - dragStart.y) > 5
    isDragging = false
    if (!wasDrag && camera.value) {
        raycaster.setFromCamera(pointer, camera.value)
        const clickables = cardMeshes.map(c => c.card)
        const intersects = raycaster.intersectObjects(clickables, false)
        const hit = intersects.find(i => i.object.userData.titleId != null)
        if (hit) {
            const id = hit.object.userData.titleId
            const entry = cardMeshes.find(p => p.titleId === id)
            if (entry) {
                const deselecting = id === props.selectedId
                if (deselecting) {
                    emit('select', null)
                    targetDistance = 14
                    targetAngle.y = 0.12
                    flyingToTarget = true
                    flyProgress = 0
                } else {
                    emit('select', id)
                    emit('update:focusedIndex', entry.index)
                    flyToCard(entry.index)
                }
            }
        } else {
            emit('select', null)
            targetDistance = 14
            targetAngle.y = 0.12
        }
    }
}



let scrollCooldown = false

function onWheel(e: WheelEvent) {
    e.preventDefault()
    autoRotate = false

    if (e.ctrlKey || e.metaKey) {
        const speed = 0.004
        targetDistance = Math.max(4, Math.min(60, targetDistance + e.deltaY * speed))
        return
    }

    if (scrollCooldown) return
    scrollCooldown = true
    setTimeout(() => { scrollCooldown = false }, 300)

    const direction = e.deltaY > 0 ? 1 : -1
    const nextIndex = Math.max(0, Math.min(cardMeshes.length - 1, props.focusedIndex + direction))
    if (nextIndex !== props.focusedIndex) {
        emit('update:focusedIndex', nextIndex)
    }
}

onMounted(() => {
    const canvas = renderer.value?.domElement
    if (!canvas) return
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('wheel', onWheel, { passive: false })
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

const { onLoop } = useRenderLoop()
let elapsed = 0

onLoop(({ delta }) => {
    elapsed += delta

    starMat.uniforms.uTime.value = elapsed
    pathGroup.children.forEach(child => {
        const m = child as any
        if (m.material?.uniforms?.uTime) m.material.uniforms.uTime.value = elapsed
    })

    if (flyingToTarget) {
        flyProgress = Math.min(1, flyProgress + delta * 2.4)
        const ease = 1 - Math.pow(1 - flyProgress, 4)
        const lerpSpeed = 0.06 + ease * 0.14
        cameraCenter.lerp(targetCenter, lerpSpeed)
        cameraDistance += (targetDistance - cameraDistance) * lerpSpeed
        cameraAngle.x += (targetAngle.x - cameraAngle.x) * lerpSpeed
        cameraAngle.y += (targetAngle.y - cameraAngle.y) * lerpSpeed
        if (flyProgress >= 1) flyingToTarget = false
    } else {
        const lerpSpeed = 0.08
        cameraAngle.x += (targetAngle.x - cameraAngle.x) * lerpSpeed
        cameraAngle.y += (targetAngle.y - cameraAngle.y) * lerpSpeed
        cameraDistance += (targetDistance - cameraDistance) * lerpSpeed
        cameraCenter.lerp(targetCenter, 0.06)
    }

    if (autoRotate && !props.selectedId) {
        targetAngle.x += delta * 0.04
    }

    if (camera.value) {
        const cx = cameraCenter.x + Math.sin(cameraAngle.x) * Math.cos(cameraAngle.y) * cameraDistance
        const cy = cameraCenter.y + Math.sin(cameraAngle.y) * cameraDistance
        const cz = cameraCenter.z + Math.cos(cameraAngle.x) * Math.cos(cameraAngle.y) * cameraDistance
        camera.value.position.set(cx, cy, cz)
        camera.value.lookAt(cameraCenter)
    }

    const focusedEntry = cardMeshes.find(c => c.index === props.focusedIndex)
    const hasFocus = !!(props.selectedId || focusedEntry)

    for (const entry of cardMeshes) {
        const { card, glow, bg, titleId, basePos, index } = entry
        const hover = titleId === props.hoveredId
        const selected = titleId === props.selectedId
        const focused = index === props.focusedIndex && !selected
        const cardMat = card.material as MeshBasicMaterial
        const glowMat = glow.material as MeshBasicMaterial
        const bgMat = bg.material as MeshBasicMaterial
        const status = props.progressMap.get(titleId)

        const bobSpeed = 0.4 + (index % 5) * 0.08
        const bobAmp = 0.08 + (index % 3) * 0.03
        const bob = Math.sin(elapsed * bobSpeed + basePos.x * 0.3 + index * 1.1) * bobAmp
        card.position.y = basePos.y + bob
        glow.position.y = basePos.y + bob
        bg.position.y = basePos.y + bob

        if (camera.value) {
            const dir = new Vector3().subVectors(camera.value.position, card.position)
            const angle = Math.atan2(dir.x, dir.z)
            card.rotation.y += (angle - card.rotation.y) * 0.15
            glow.rotation.y = card.rotation.y
            bg.rotation.y = card.rotation.y
        }

        let occludeAmount = 0
        if (hasFocus && camera.value && !selected && !focused && focusedEntry) {
            const camPos = camera.value.position
            const distToCard = camPos.distanceTo(card.position)
            const distToFocused = camPos.distanceTo(focusedEntry.card.position)

            if (distToCard < distToFocused) {
                const toCard = new Vector3().subVectors(card.position, camPos).normalize()
                const toFocused = new Vector3().subVectors(focusedEntry.card.position, camPos).normalize()
                const dot = toCard.dot(toFocused)
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
        card.scale.lerp(new Vector3(targetScale, targetScale, 1), scaleLerp)
        glow.scale.copy(card.scale)
        bg.scale.copy(card.scale)

        const baseCardOpacity = selected ? 1.0 : focused ? 1.0 : hover ? 1.0 : (status === 'skipped' ? 0.25 : 0.88)
        const targetCardOpacity = baseCardOpacity * (1.0 - occludeAmount * 0.97)
        cardMat.opacity += (targetCardOpacity - cardMat.opacity) * 0.18

        const glowPulse = selected || focused ? Math.sin(elapsed * 2.0) * 0.06 : 0
        const baseGlowOpacity = selected ? 0.55 + glowPulse : focused ? 0.4 + glowPulse : hover ? 0.3 : (status === 'watched' ? 0.2 : 0.06)
        const targetGlowOpacity = baseGlowOpacity * (1.0 - occludeAmount)
        glowMat.opacity += (targetGlowOpacity - glowMat.opacity) * 0.14

        const baseBgOpacity = selected ? 0.15 : focused ? 0.12 : hover ? 0.09 : 0.05
        const targetBgOpacity = baseBgOpacity * (1.0 - occludeAmount)
        bgMat.opacity += (targetBgOpacity - bgMat.opacity) * 0.14
    }

    if (camera.value && !isDragging) {
        raycaster.setFromCamera(pointer, camera.value)
        const clickables = cardMeshes.map(c => c.card)
        const intersects = raycaster.intersectObjects(clickables, false)
        const hit = intersects.find(i => i.object.userData.titleId != null)
        const newId = hit ? hit.object.userData.titleId : null
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
})
</script>
