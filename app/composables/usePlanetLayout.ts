import { Vector3 } from 'three'
import type { LocationJson } from '~/types/multiverse'

export type PlanetLayout = 'orbital' | 'spiral' | 'zigzag' | 'grid' | 'helix' | 'galaxy' | 'scatter' | 'wave' | 'ring' | 'sphere' | 'constellation' | 'funnel' | 'flower' | 'pyramid' | 'infinity' | 'cross' | 'hourglass' | 'tree' | 'diamond' | 'coil' | 'vortex' | 'dna' | 'staircase' | 'galaxy-ring' | 'web'

interface LayoutInput {
    locations: LocationJson[]
    getTitleCount: (loc: LocationJson) => number
}

function layoutOrbital(input: LayoutInput): Vector3[] {
    const { locations, getTitleCount } = input
    const sorted = [...locations].sort((a, b) => getTitleCount(b) - getTitleCount(a))

    const positions: Vector3[] = new Array(locations.length)

    const rings = [
        { count: 1, radius: 0, yOffset: 0 },
        { count: 5, radius: 8, yOffset: 0 },
        { count: 8, radius: 16, yOffset: 0 },
        { count: 14, radius: 25, yOffset: 0 },
    ]

    let placed = 0
    for (const ring of rings) {
        for (let i = 0; i < ring.count && placed < sorted.length; i++) {
            const loc = sorted[placed]
            const origIdx = locations.indexOf(loc)
            const angle = (i / ring.count) * Math.PI * 2 + ring.radius * 0.1
            const yWave = Math.sin(angle * 2) * ring.radius * 0.08
            positions[origIdx] = new Vector3(
                Math.cos(angle) * ring.radius,
                yWave + ring.yOffset,
                Math.sin(angle) * ring.radius,
            )
            placed++
        }
    }

    return positions
}

function layoutSpiral(input: LayoutInput): Vector3[] {
    const { locations, getTitleCount } = input
    const positions: Vector3[] = []
    const count = locations.length
    const maxRadius = 28
    const totalTurns = 3.5
    const heightAmplitude = 4

    for (let i = 0; i < count; i++) {
        const t = i / (count - 1)
        const angle = t * Math.PI * 2 * totalTurns
        const r = 2 + t * (maxRadius - 2)
        const y = Math.sin(t * Math.PI * 4) * heightAmplitude * t
        positions.push(new Vector3(
            Math.cos(angle) * r,
            y,
            Math.sin(angle) * r,
        ))
    }

    return positions
}

function layoutZigzag(input: LayoutInput): Vector3[] {
    const { locations } = input
    const positions: Vector3[] = []
    const count = locations.length
    const spacing = 4.5
    const amplitude = 10
    const depthAmplitude = 5

    const totalLength = (count - 1) * spacing
    const startX = -totalLength / 2

    for (let i = 0; i < count; i++) {
        const x = startX + i * spacing
        const side = i % 2 === 0 ? 1 : -1
        const progress = i / (count - 1)
        const wave = Math.sin(progress * Math.PI * 2) * 0.3
        const y = side * (amplitude * 0.5 + wave * amplitude * 0.2)
        const z = Math.sin(progress * Math.PI) * -depthAmplitude
        positions.push(new Vector3(x, y, z))
    }

    return positions
}

function layoutGrid(input: LayoutInput): Vector3[] {
    const { locations } = input
    const count = locations.length
    const cols = Math.ceil(Math.sqrt(count * 1.5))
    const rows = Math.ceil(count / cols)
    const spacingX = 7
    const spacingZ = 7
    const positions: Vector3[] = []

    const totalW = (cols - 1) * spacingX
    const totalD = (rows - 1) * spacingZ

    for (let i = 0; i < count; i++) {
        const col = i % cols
        const row = Math.floor(i / cols)
        const x = col * spacingX - totalW / 2
        const z = row * spacingZ - totalD / 2
        const y = Math.sin(col * 0.8) * Math.cos(row * 0.8) * 1.5
        positions.push(new Vector3(x, y, z))
    }

    return positions
}

function layoutHelix(input: LayoutInput): Vector3[] {
    const { locations } = input
    const count = locations.length
    const positions: Vector3[] = []
    const turns = 3
    const heightRange = 30
    const radius = 10

    for (let i = 0; i < count; i++) {
        const t = i / (count - 1 || 1)
        const angle = t * Math.PI * 2 * turns
        const strand = i % 2 === 0 ? 1 : -1
        const x = Math.cos(angle) * radius * strand
        const y = t * heightRange - heightRange / 2
        const z = Math.sin(angle) * radius * strand
        positions.push(new Vector3(x, y, z))
    }
    return positions
}

function layoutGalaxy(input: LayoutInput): Vector3[] {
    const { locations, getTitleCount } = input
    const sorted = [...locations].sort((a, b) => getTitleCount(b) - getTitleCount(a))
    const count = sorted.length
    const positions: Vector3[] = new Array(locations.length)
    const arms = 3
    const maxRadius = 28

    for (let i = 0; i < count; i++) {
        const loc = sorted[i]
        const origIdx = locations.indexOf(loc)
        const t = i / (count - 1 || 1)
        const arm = i % arms
        const armOffset = (arm / arms) * Math.PI * 2
        const angle = t * Math.PI * 3 + armOffset
        const r = 1.5 + t * (maxRadius - 1.5)
        const wobble = Math.sin(t * Math.PI * 6) * 1.5
        const y = Math.sin(angle * 0.7) * 2 * t + wobble * 0.3
        positions[origIdx] = new Vector3(
            Math.cos(angle) * r,
            y,
            Math.sin(angle) * r,
        )
    }
    return positions
}

function layoutScatter(input: LayoutInput): Vector3[] {
    const { locations } = input
    const count = locations.length
    const positions: Vector3[] = []
    const spread = 25

    let seed = 42
    const random = () => {
        seed = (seed * 16807 + 0) % 2147483647
        return seed / 2147483647
    }

    for (let i = 0; i < count; i++) {
        const x = (random() - 0.5) * spread * 2
        const y = (random() - 0.5) * spread * 1.2
        const z = (random() - 0.5) * spread * 2
        positions.push(new Vector3(x, y, z))
    }
    return positions
}

function layoutWave(input: LayoutInput): Vector3[] {
    const { locations } = input
    const count = locations.length
    const cols = Math.ceil(Math.sqrt(count * 1.5))
    const spacingX = 6
    const spacingZ = 6
    const positions: Vector3[] = []

    const totalW = (cols - 1) * spacingX
    const rows = Math.ceil(count / cols)
    const totalD = (rows - 1) * spacingZ

    for (let i = 0; i < count; i++) {
        const col = i % cols
        const row = Math.floor(i / cols)
        const x = col * spacingX - totalW / 2
        const z = row * spacingZ - totalD / 2
        const y = Math.sin(col * 0.6 + row * 0.4) * 5 + Math.cos(col * 0.3 - row * 0.7) * 3
        positions.push(new Vector3(x, y, z))
    }
    return positions
}

function layoutRing(input: LayoutInput): Vector3[] {
    const { locations } = input
    const count = locations.length
    const positions: Vector3[] = []
    const radius = 20

    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2
        const wobbleY = Math.sin(angle * 3) * 2.5
        const wobbleR = Math.cos(angle * 5) * 1.5
        positions.push(new Vector3(
            Math.cos(angle) * (radius + wobbleR),
            wobbleY,
            Math.sin(angle) * (radius + wobbleR),
        ))
    }
    return positions
}

function layoutSphere(input: LayoutInput): Vector3[] {
    const { locations } = input
    const count = locations.length
    const positions: Vector3[] = []
    const radius = 18
    const goldenAngle = Math.PI * (3 - Math.sqrt(5))

    for (let i = 0; i < count; i++) {
        const y = 1 - (i / (count - 1 || 1)) * 2
        const radiusAtY = Math.sqrt(1 - y * y)
        const theta = goldenAngle * i
        positions.push(new Vector3(
            Math.cos(theta) * radiusAtY * radius,
            y * radius,
            Math.sin(theta) * radiusAtY * radius,
        ))
    }
    return positions
}

function layoutConstellation(input: LayoutInput): Vector3[] {
    const { locations } = input
    const count = locations.length
    const positions: Vector3[] = []
    const clusterCount = Math.max(3, Math.ceil(count / 5))
    const clusterSpread = 22
    const innerSpread = 6

    let seed = 137
    const random = () => {
        seed = (seed * 16807 + 0) % 2147483647
        return seed / 2147483647
    }

    const centers: Vector3[] = []
    for (let c = 0; c < clusterCount; c++) {
        centers.push(new Vector3(
            (random() - 0.5) * clusterSpread * 2,
            (random() - 0.5) * clusterSpread * 0.8,
            (random() - 0.5) * clusterSpread * 2,
        ))
    }

    for (let i = 0; i < count; i++) {
        const center = centers[i % clusterCount]
        const offsetAngle = random() * Math.PI * 2
        const offsetR = random() * innerSpread
        const offsetY = (random() - 0.5) * innerSpread * 0.6
        positions.push(new Vector3(
            center.x + Math.cos(offsetAngle) * offsetR,
            center.y + offsetY,
            center.z + Math.sin(offsetAngle) * offsetR,
        ))
    }
    return positions
}

function layoutFunnel(input: LayoutInput): Vector3[] {
    const { locations } = input
    const count = locations.length
    const positions: Vector3[] = []
    const height = 30
    const maxRadius = 22
    const turns = 4

    for (let i = 0; i < count; i++) {
        const t = i / (count - 1 || 1)
        const y = t * height - height / 2
        const r = maxRadius * (1 - t * 0.85)
        const angle = t * Math.PI * 2 * turns
        positions.push(new Vector3(
            Math.cos(angle) * r,
            y,
            Math.sin(angle) * r,
        ))
    }
    return positions
}

function layoutFlower(input: LayoutInput): Vector3[] {
    const { locations } = input
    const count = locations.length
    const positions: Vector3[] = []
    const petals = 6
    const petalRadius = 14
    const centerRadius = 3

    for (let i = 0; i < count; i++) {
        if (i === 0) {
            positions.push(new Vector3(0, 0, 0))
            continue
        }
        const petal = (i - 1) % petals
        const ring = Math.floor((i - 1) / petals)
        const petalAngle = (petal / petals) * Math.PI * 2
        const r = centerRadius + (ring + 1) * 4
        const spread = (ring + 1) * 0.3
        const offsetAngle = petalAngle + (Math.sin(ring * 1.5) * spread)
        const y = Math.sin(ring * 0.8) * 2
        positions.push(new Vector3(
            Math.cos(offsetAngle) * Math.min(r, petalRadius + ring * 2),
            y,
            Math.sin(offsetAngle) * Math.min(r, petalRadius + ring * 2),
        ))
    }
    return positions
}

function layoutPyramid(input: LayoutInput): Vector3[] {
    const { locations } = input
    const count = locations.length
    const positions: Vector3[] = []
    const layerSpacing = 6
    let placed = 0
    let layer = 0

    while (placed < count) {
        const layerSize = (layer + 1) * (layer + 1)
        const side = layer + 1
        const y = -layer * layerSpacing
        const spread = layer * 5

        for (let j = 0; j < layerSize && placed < count; j++) {
            const row = Math.floor(j / side)
            const col = j % side
            const x = col * 5 - (side - 1) * 2.5
            const z = row * 5 - (side - 1) * 2.5
            positions.push(new Vector3(x, y, z))
            placed++
        }
        layer++
    }
    return positions
}

function layoutInfinity(input: LayoutInput): Vector3[] {
    const { locations } = input
    const count = locations.length
    const positions: Vector3[] = []
    const scaleX = 18
    const scaleZ = 10

    for (let i = 0; i < count; i++) {
        const t = (i / count) * Math.PI * 2
        const x = Math.sin(t) * scaleX
        const z = Math.sin(t) * Math.cos(t) * scaleZ
        const y = Math.sin(t * 3) * 2.5
        positions.push(new Vector3(x, y, z))
    }
    return positions
}

function layoutCross(input: LayoutInput): Vector3[] {
    const { locations } = input
    const count = locations.length
    const positions: Vector3[] = []
    const armLength = 24
    const spacing = 4

    for (let i = 0; i < count; i++) {
        const arm = i % 4
        const dist = Math.floor(i / 4) * spacing + spacing
        const y = Math.sin(dist * 0.3) * 1.5
        switch (arm) {
            case 0: positions.push(new Vector3(dist, y, 0)); break
            case 1: positions.push(new Vector3(-dist, y, 0)); break
            case 2: positions.push(new Vector3(0, y, dist)); break
            case 3: positions.push(new Vector3(0, y, -dist)); break
        }
    }
    return positions
}

function layoutHourglass(input: LayoutInput): Vector3[] {
    const { locations } = input
    const count = locations.length
    const positions: Vector3[] = []
    const height = 30
    const maxRadius = 18

    for (let i = 0; i < count; i++) {
        const t = i / (count - 1 || 1)
        const y = t * height - height / 2
        const pinch = Math.abs(t - 0.5) * 2
        const r = 1.5 + pinch * maxRadius
        const angle = t * Math.PI * 2 * 5
        positions.push(new Vector3(
            Math.cos(angle) * r,
            y,
            Math.sin(angle) * r,
        ))
    }
    return positions
}

function layoutTree(input: LayoutInput): Vector3[] {
    const { locations } = input
    const count = locations.length
    const positions: Vector3[] = []
    const trunkHeight = 10
    const trunkCount = Math.max(1, Math.floor(count * 0.15))
    const crownCount = count - trunkCount

    for (let i = 0; i < trunkCount; i++) {
        const t = i / (trunkCount - 1 || 1)
        positions.push(new Vector3(
            Math.sin(t * 2) * 0.5,
            -15 + t * trunkHeight,
            Math.cos(t * 2) * 0.5,
        ))
    }

    const goldenAngle = Math.PI * (3 - Math.sqrt(5))
    for (let i = 0; i < crownCount; i++) {
        const t = i / (crownCount - 1 || 1)
        const y = 1 - t * 1.4
        const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y))
        const theta = goldenAngle * i
        const r = radiusAtY * 16
        positions.push(new Vector3(
            Math.cos(theta) * r,
            -5 + trunkHeight + (1 - t) * 14,
            Math.sin(theta) * r,
        ))
    }
    return positions
}

function layoutDiamond(input: LayoutInput): Vector3[] {
    const { locations } = input
    const count = locations.length
    const positions: Vector3[] = []
    const height = 30
    const maxRadius = 16
    const turns = 6

    for (let i = 0; i < count; i++) {
        const t = i / (count - 1 || 1)
        const y = t * height - height / 2
        const diamond = 1 - Math.abs(t - 0.5) * 2
        const r = diamond * maxRadius + 1
        const angle = t * Math.PI * 2 * turns
        positions.push(new Vector3(
            Math.cos(angle) * r,
            y,
            Math.sin(angle) * r,
        ))
    }
    return positions
}

function layoutCoil(input: LayoutInput): Vector3[] {
    const { locations } = input
    const count = locations.length
    const positions: Vector3[] = []
    const radius = 10
    const height = 35
    const turns = 8

    for (let i = 0; i < count; i++) {
        const t = i / (count - 1 || 1)
        const angle = t * Math.PI * 2 * turns
        const y = t * height - height / 2
        positions.push(new Vector3(
            Math.cos(angle) * radius,
            y,
            Math.sin(angle) * radius,
        ))
    }
    return positions
}

function layoutVortex(input: LayoutInput): Vector3[] {
    const { locations } = input
    const count = locations.length
    const positions: Vector3[] = []
    const maxRadius = 22
    const height = 25
    const turns = 5

    for (let i = 0; i < count; i++) {
        const t = i / (count - 1 || 1)
        const angle = t * Math.PI * 2 * turns
        const r = maxRadius * (1 - t * 0.7)
        const y = t * height - height / 2
        const wobble = Math.sin(t * Math.PI * 8) * 1.5 * (1 - t)
        positions.push(new Vector3(
            Math.cos(angle) * (r + wobble),
            y,
            Math.sin(angle) * (r + wobble),
        ))
    }
    return positions
}

function layoutDna(input: LayoutInput): Vector3[] {
    const { locations } = input
    const count = locations.length
    const positions: Vector3[] = []
    const radius = 8
    const height = 35
    const turns = 4

    for (let i = 0; i < count; i++) {
        const t = i / (count - 1 || 1)
        const angle = t * Math.PI * 2 * turns
        const y = t * height - height / 2
        const strand = i % 3
        if (strand === 2) {
            const midAngle = angle + Math.PI * 0.5
            positions.push(new Vector3(
                Math.cos(midAngle) * radius * 0.3,
                y,
                Math.sin(midAngle) * radius * 0.3,
            ))
        } else {
            const offset = strand === 0 ? 0 : Math.PI
            positions.push(new Vector3(
                Math.cos(angle + offset) * radius,
                y,
                Math.sin(angle + offset) * radius,
            ))
        }
    }
    return positions
}

function layoutStaircase(input: LayoutInput): Vector3[] {
    const { locations } = input
    const count = locations.length
    const positions: Vector3[] = []
    const stepWidth = 5
    const stepHeight = 2.5
    const stepsPerFlight = 6
    const flightDepth = 8

    for (let i = 0; i < count; i++) {
        const flight = Math.floor(i / stepsPerFlight)
        const step = i % stepsPerFlight
        const direction = flight % 2 === 0 ? 1 : -1
        const x = step * stepWidth * direction - (stepsPerFlight * stepWidth * direction) / 2
        const y = i * stepHeight - (count * stepHeight) / 2
        const z = flight * flightDepth - (Math.floor(count / stepsPerFlight) * flightDepth) / 2
        positions.push(new Vector3(x, y, z))
    }
    return positions
}

function layoutGalaxyRing(input: LayoutInput): Vector3[] {
    const { locations } = input
    const count = locations.length
    const positions: Vector3[] = []
    const rings = 3
    const baseRadius = 8

    for (let i = 0; i < count; i++) {
        const ringIdx = i % rings
        const posInRing = Math.floor(i / rings)
        const ringCount = Math.ceil(count / rings)
        const angle = (posInRing / ringCount) * Math.PI * 2
        const r = baseRadius + ringIdx * 7
        const tilt = ringIdx * 0.3
        const y = Math.sin(angle) * r * Math.sin(tilt) + Math.sin(angle * 3) * 1.5
        positions.push(new Vector3(
            Math.cos(angle) * r * Math.cos(tilt),
            y,
            Math.sin(angle) * r,
        ))
    }
    return positions
}

function layoutWeb(input: LayoutInput): Vector3[] {
    const { locations } = input
    const count = locations.length
    const positions: Vector3[] = []
    const spokes = 8
    const maxRadius = 22

    if (count > 0) {
        positions.push(new Vector3(0, 0, 0))
    }
    for (let i = 1; i < count; i++) {
        const spoke = (i - 1) % spokes
        const ringNum = Math.floor((i - 1) / spokes) + 1
        const angle = (spoke / spokes) * Math.PI * 2 + (ringNum % 2) * (Math.PI / spokes)
        const r = ringNum * (maxRadius / Math.ceil(count / spokes))
        const y = Math.sin(ringNum * 0.8 + spoke * 0.5) * 2
        positions.push(new Vector3(
            Math.cos(angle) * r,
            y,
            Math.sin(angle) * r,
        ))
    }
    return positions
}

const layoutFns: Record<PlanetLayout, (input: LayoutInput) => Vector3[]> = {
    orbital: layoutOrbital,
    spiral: layoutSpiral,
    zigzag: layoutZigzag,
    grid: layoutGrid,
    helix: layoutHelix,
    galaxy: layoutGalaxy,
    scatter: layoutScatter,
    wave: layoutWave,
    ring: layoutRing,
    sphere: layoutSphere,
    constellation: layoutConstellation,
    funnel: layoutFunnel,
    flower: layoutFlower,
    pyramid: layoutPyramid,
    infinity: layoutInfinity,
    cross: layoutCross,
    hourglass: layoutHourglass,
    tree: layoutTree,
    diamond: layoutDiamond,
    coil: layoutCoil,
    vortex: layoutVortex,
    dna: layoutDna,
    staircase: layoutStaircase,
    'galaxy-ring': layoutGalaxyRing,
    web: layoutWeb,
}

export function computeLayout(
    layout: PlanetLayout,
    locations: LocationJson[],
    titles: { slug: string }[],
): Vector3[] {
    const slugSet = new Map<string, number>()
    for (const loc of locations) {
        slugSet.set(loc.id, loc.title_slugs.length)
    }

    return layoutFns[layout]({
        locations,
        getTitleCount: (loc) => slugSet.get(loc.id) ?? 0,
    })
}

export function usePlanetLayout() {
    const layout = ref<PlanetLayout>('orbital')

    const layouts: { value: PlanetLayout; label: string; icon: string }[] = [
        { value: 'orbital', label: 'Orbital', icon: 'orbital' },
        { value: 'spiral', label: 'Spiral', icon: 'spiral' },
        { value: 'zigzag', label: 'Zigzag', icon: 'zigzag' },
        { value: 'grid', label: 'Grid', icon: 'grid' },
        { value: 'helix', label: 'Helix', icon: 'helix' },
        { value: 'galaxy', label: 'Galaxy', icon: 'galaxy' },
        { value: 'scatter', label: 'Scatter', icon: 'scatter' },
        { value: 'wave', label: 'Wave', icon: 'wave' },
        { value: 'ring', label: 'Ring', icon: 'ring' },
        { value: 'sphere', label: 'Sphere', icon: 'sphere' },
        { value: 'constellation', label: 'Constellation', icon: 'constellation' },
        { value: 'funnel', label: 'Funnel', icon: 'funnel' },
        { value: 'flower', label: 'Flower', icon: 'flower' },
        { value: 'pyramid', label: 'Pyramid', icon: 'pyramid' },
        { value: 'infinity', label: 'Infinity', icon: 'infinity' },
        { value: 'cross', label: 'Cross', icon: 'cross' },
        { value: 'hourglass', label: 'Hourglass', icon: 'hourglass' },
        { value: 'tree', label: 'Tree', icon: 'tree' },
        { value: 'diamond', label: 'Diamond', icon: 'diamond' },
        { value: 'coil', label: 'Coil', icon: 'coil' },
        { value: 'vortex', label: 'Vortex', icon: 'vortex' },
        { value: 'dna', label: 'DNA', icon: 'dna' },
        { value: 'staircase', label: 'Staircase', icon: 'staircase' },
        { value: 'galaxy-ring', label: 'Galaxy Ring', icon: 'galaxy-ring' },
        { value: 'web', label: 'Web', icon: 'web' },
    ]

    return { layout, layouts }
}
