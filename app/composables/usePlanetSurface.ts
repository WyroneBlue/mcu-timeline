import { CanvasTexture, LinearFilter, SRGBColorSpace } from 'three'

// Procedural equirectangular surface textures for the solar-system view,
// themed per MCU location so each planet/realm reads as the place from the
// films instead of an abstract glowing orb.

interface SurfaceTheme {
    // Vertical base gradient, pole -> equator -> pole
    base: [string, string] | [string, string, string]
    // Horizontal gas-giant style bands
    bands?: { colors: string[]; count: number }
    // Continent/land blobs
    land?: { colors: string[]; count: number }
    // Glowing crack veins (lava, ice fractures)
    veins?: { color: string; count: number }
    // City-light speckles
    lights?: { color: string; count: number }
    // Polar ice caps
    caps?: string
    // Single glowing equatorial band (Nidavellir's forge ring)
    forgeBand?: string
}

// Film-accurate palettes for known locations; anything not listed falls back
// to a generic theme derived from the location's accent colour.
const THEMES: Record<string, SurfaceTheme> = {
    earth: {
        base: ['#0b2e5e', '#134f8f', '#0b2e5e'],
        land: { colors: ['#2f6b33', '#5a7a3a', '#8a734a'], count: 9 },
        caps: '#e8f2f8',
        lights: { color: '#ffd98a', count: 60 },
    },
    asgard: {
        base: ['#6b4a12', '#b8860b', '#3f2c0a'],
        bands: { colors: ['#d9a441', '#8a6420'], count: 3 },
        land: { colors: ['#e3b85c', '#9c7524'], count: 6 },
        lights: { color: '#ffe9b0', count: 90 },
    },
    jotunheim: {
        base: ['#1c2f4a', '#3d6ea5', '#16263c'],
        land: { colors: ['#9fc4e8', '#6f9dc9'], count: 7 },
        veins: { color: '#cfe8ff', count: 10 },
        caps: '#dceefc',
    },
    hel: {
        base: ['#101a12', '#274232', '#0a120c'],
        land: { colors: ['#3c5c44', '#1e3226'], count: 6 },
        veins: { color: '#69f0ae', count: 6 },
    },
    svartalfheim: {
        base: ['#15161c', '#2e3038', '#101116'],
        land: { colors: ['#3e414c', '#23252d'], count: 8 },
    },
    muspelheim: {
        base: ['#1a0b06', '#3a160a', '#140805'],
        land: { colors: ['#2c1208', '#40190a'], count: 6 },
        veins: { color: '#ff7a3c', count: 14 },
    },
    nidavellir: {
        base: ['#141519', '#2a2c33', '#101115'],
        land: { colors: ['#3a3d46', '#23252b'], count: 5 },
        forgeBand: '#ff9a3c',
    },
    vanaheim: {
        base: ['#1d3a1f', '#3c6e33', '#16301a'],
        land: { colors: ['#6f9a3f', '#c9a94e', '#4a7a35'], count: 8 },
    },
    alfheim: {
        base: ['#a89b72', '#f5ecc9', '#b8ab7f'],
        land: { colors: ['#e8dcae', '#cbbd8b'], count: 6 },
    },
    sakaar: {
        base: ['#4a3a26', '#6e5636', '#3c2f20'],
        land: { colors: ['#8a6a3c', '#5c6e5a', '#7a4a4a', '#4a5a7a'], count: 12 },
        lights: { color: '#ff5c8a', count: 40 },
    },
    titan: {
        base: ['#3a1e10', '#8a4a22', '#2c160c'],
        bands: { colors: ['#a05a28', '#6e3a18'], count: 4 },
        land: { colors: ['#b06a30', '#5c2e14'], count: 7 },
    },
    xandar: {
        base: ['#0e3e46', '#1a6e78', '#0c343a'],
        land: { colors: ['#c9b98b', '#a5946a'], count: 7 },
        lights: { color: '#bfe9ff', count: 110 },
        caps: '#dff4f8',
    },
    vormir: {
        base: ['#171126', '#332352', '#120d1e'],
        bands: { colors: ['#3f2c66', '#241940'], count: 3 },
        land: { colors: ['#2c2144', '#1d1630'], count: 5 },
    },
    ego: {
        base: ['#1c4a52', '#2e7a86', '#1a3e46'],
        bands: { colors: ['#5ec4d0', '#c9a45e', '#3a8a96', '#8a5ec4'], count: 7 },
    },
    morag: {
        base: ['#2c3038', '#4a505c', '#242830'],
        land: { colors: ['#5c6470', '#3a4048'], count: 8 },
        veins: { color: '#4fd1c5', count: 5 },
    },
    contraxia: {
        base: ['#2c1e4a', '#5c3a8a', '#241740'],
        land: { colors: ['#8a6ec4', '#6e54a5'], count: 6 },
        lights: { color: '#ff8ad0', count: 80 },
        caps: '#e0d0f5',
    },
    hala: {
        base: ['#0c3438', '#17656e', '#0a2c30'],
        land: { colors: ['#2a8a94', '#1d6a74'], count: 6 },
        lights: { color: '#9ff5ff', count: 70 },
    },
    'tarnax-iv': {
        base: ['#243a2a', '#41654a', '#1d3022'],
        land: { colors: ['#5c8a64', '#3a5c42'], count: 7 },
    },
}

function mulberry32(seed: number) {
    let a = seed
    return () => {
        a |= 0
        a = (a + 0x6D2B79F5) | 0
        let t = Math.imul(a ^ (a >>> 15), 1 | a)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

function hashString(s: string): number {
    let h = 2166136261
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i)
        h = Math.imul(h, 16777619)
    }
    return h >>> 0
}

function shade(hex: string, factor: number): string {
    const n = parseInt(hex.slice(1), 16)
    const r = Math.round(Math.min(255, ((n >> 16) & 255) * factor))
    const g = Math.round(Math.min(255, ((n >> 8) & 255) * factor))
    const b = Math.round(Math.min(255, (n & 255) * factor))
    return `rgb(${r},${g},${b})`
}

function fallbackTheme(color: string): SurfaceTheme {
    return {
        base: [shade(color, 0.25), shade(color, 0.55), shade(color, 0.2)] as [string, string, string],
        land: { colors: [shade(color, 0.8), shade(color, 0.4)], count: 7 },
    }
}

// Draws an irregular blob that wraps horizontally (equirect seam-safe)
function drawBlob(ctx: CanvasRenderingContext2D, w: number, cx: number, cy: number, r: number, color: string, rand: () => number) {
    for (const offset of [-w, 0, w]) {
        ctx.beginPath()
        const points = 10
        for (let i = 0; i <= points; i++) {
            const a = (i / points) * Math.PI * 2
            const wobble = r * (0.6 + rand() * 0.5)
            const x = cx + offset + Math.cos(a) * wobble * 1.6
            const y = cy + Math.sin(a) * wobble * 0.8
            if (i === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
        }
        ctx.closePath()
        ctx.fillStyle = color
        ctx.fill()
    }
}

export function createPlanetSurfaceTexture(locId: string, accentColor: string): CanvasTexture {
    const w = 512
    const h = 256
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!
    const theme = THEMES[locId] ?? fallbackTheme(accentColor)
    const rand = mulberry32(hashString(locId))

    // Base gradient
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    if (theme.base.length === 3) {
        grad.addColorStop(0, theme.base[0])
        grad.addColorStop(0.5, theme.base[1])
        grad.addColorStop(1, theme.base[2]!)
    } else {
        grad.addColorStop(0, theme.base[0])
        grad.addColorStop(1, theme.base[1])
    }
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    // Gas-giant bands with wavy edges
    if (theme.bands) {
        ctx.globalAlpha = 0.45
        for (let b = 0; b < theme.bands.count; b++) {
            const y0 = (b + 0.5) * (h / (theme.bands.count + 1)) + (rand() - 0.5) * 14
            const bandH = 8 + rand() * 20
            const color = theme.bands.colors[b % theme.bands.colors.length]
            ctx.fillStyle = color
            ctx.beginPath()
            ctx.moveTo(0, y0)
            for (let x = 0; x <= w; x += 16) {
                ctx.lineTo(x, y0 + Math.sin(x * 0.02 + b * 3 + rand()) * 5)
            }
            for (let x = w; x >= 0; x -= 16) {
                ctx.lineTo(x, y0 + bandH + Math.sin(x * 0.025 + b * 5) * 5)
            }
            ctx.closePath()
            ctx.fill()
        }
        ctx.globalAlpha = 1
    }

    // Land masses
    if (theme.land) {
        ctx.globalAlpha = 0.9
        for (let i = 0; i < theme.land.count; i++) {
            const color = theme.land.colors[i % theme.land.colors.length]
            drawBlob(ctx, w, rand() * w, h * (0.18 + rand() * 0.64), 12 + rand() * 30, color, rand)
        }
        ctx.globalAlpha = 1
    }

    // Glowing crack veins
    if (theme.veins) {
        ctx.strokeStyle = theme.veins.color
        ctx.shadowColor = theme.veins.color
        ctx.shadowBlur = 4
        for (let i = 0; i < theme.veins.count; i++) {
            ctx.lineWidth = 0.8 + rand() * 1.4
            ctx.globalAlpha = 0.5 + rand() * 0.4
            ctx.beginPath()
            let x = rand() * w
            let y = rand() * h
            ctx.moveTo(x, y)
            const segments = 4 + Math.floor(rand() * 5)
            for (let s = 0; s < segments; s++) {
                x += (rand() - 0.5) * 90
                y += (rand() - 0.5) * 40
                ctx.lineTo(x, y)
            }
            ctx.stroke()
        }
        ctx.shadowBlur = 0
        ctx.globalAlpha = 1
    }

    // Nidavellir's glowing forge ring around the equator
    if (theme.forgeBand) {
        const bandGrad = ctx.createLinearGradient(0, h * 0.44, 0, h * 0.56)
        bandGrad.addColorStop(0, 'rgba(0,0,0,0)')
        bandGrad.addColorStop(0.5, theme.forgeBand)
        bandGrad.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = bandGrad
        ctx.shadowColor = theme.forgeBand
        ctx.shadowBlur = 10
        ctx.fillRect(0, h * 0.44, w, h * 0.12)
        ctx.shadowBlur = 0
    }

    // City lights
    if (theme.lights) {
        ctx.fillStyle = theme.lights.color
        for (let i = 0; i < theme.lights.count; i++) {
            ctx.globalAlpha = 0.35 + rand() * 0.6
            const size = 0.6 + rand() * 1.4
            ctx.fillRect(rand() * w, h * 0.15 + rand() * h * 0.7, size, size)
        }
        ctx.globalAlpha = 1
    }

    // Polar caps
    if (theme.caps) {
        for (const top of [true, false]) {
            const capGrad = ctx.createLinearGradient(0, top ? 0 : h, 0, top ? h * 0.14 : h * 0.86)
            capGrad.addColorStop(0, theme.caps)
            capGrad.addColorStop(1, 'rgba(255,255,255,0)')
            ctx.fillStyle = capGrad
            ctx.fillRect(0, top ? 0 : h * 0.86, w, h * 0.14)
        }
    }

    // Fine grain so flat areas don't band
    ctx.globalAlpha = 0.05
    for (let i = 0; i < 900; i++) {
        ctx.fillStyle = rand() > 0.5 ? '#ffffff' : '#000000'
        ctx.fillRect(rand() * w, rand() * h, 1, 1)
    }
    ctx.globalAlpha = 1

    const tex = new CanvasTexture(canvas)
    tex.colorSpace = SRGBColorSpace
    tex.minFilter = LinearFilter
    tex.magFilter = LinearFilter
    return tex
}
