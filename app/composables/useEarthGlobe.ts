import { Vector3, CanvasTexture, LinearFilter } from 'three'

export function latLngToVector3(lat: number, lng: number, radius: number): Vector3 {
    const phi = (90 - lat) * (Math.PI / 180)
    const theta = (lng + 180) * (Math.PI / 180)
    return new Vector3(
        -(radius * Math.sin(phi) * Math.cos(theta)),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
    )
}

function latLngToCanvas(lat: number, lng: number, w: number, h: number): [number, number] {
    const x = ((lng + 180) / 360) * w
    const y = ((90 - lat) / 180) * h
    return [x, y]
}

const CONTINENTS: [number, number][][] = [
    // North America
    [
        [-170, 64], [-168, 60], [-162, 60], [-153, 58], [-148, 60], [-141, 60],
        [-130, 55], [-125, 48], [-124, 42], [-117, 32], [-105, 25], [-97, 26],
        [-82, 25], [-81, 30], [-75, 35], [-70, 42], [-67, 45], [-60, 47],
        [-55, 52], [-60, 55], [-65, 58], [-73, 62], [-80, 64], [-83, 67],
        [-88, 68], [-95, 70], [-105, 69], [-115, 70], [-125, 72], [-135, 72],
        [-145, 70], [-155, 68], [-163, 66], [-170, 64],
    ],
    // South America
    [
        [-82, 9], [-77, 8], [-72, 12], [-62, 11], [-52, 4], [-50, 0],
        [-50, -5], [-45, -6], [-38, -5], [-35, -10], [-37, -15], [-40, -22],
        [-48, -28], [-53, -33], [-57, -37], [-65, -42], [-69, -46],
        [-73, -50], [-75, -53], [-70, -55], [-68, -52], [-66, -45],
        [-70, -38], [-71, -30], [-70, -18], [-75, -15], [-76, -5],
        [-78, 0], [-80, 5], [-82, 9],
    ],
    // Europe
    [
        [-10, 36], [-6, 37], [0, 38], [3, 43], [5, 44], [10, 44],
        [13, 45], [16, 46], [20, 40], [24, 38], [26, 40], [28, 41],
        [30, 42], [32, 46], [30, 50], [28, 52], [22, 55], [20, 57],
        [24, 60], [25, 65], [20, 68], [15, 69], [12, 66], [5, 62],
        [5, 58], [0, 52], [-5, 48], [-10, 44], [-10, 36],
    ],
    // Africa
    [
        [-18, 15], [-17, 12], [-8, 5], [0, 6], [5, 4], [10, 4],
        [10, 2], [12, -5], [18, -10], [28, -16], [33, -20], [36, -25],
        [32, -28], [28, -32], [26, -34], [18, -35], [15, -30],
        [12, -20], [15, -10], [20, -5], [30, 0], [35, 5],
        [40, 10], [44, 12], [50, 12], [43, 15], [35, 20], [33, 30],
        [35, 35], [30, 32], [25, 32], [15, 30], [10, 32], [5, 35],
        [-5, 35], [-10, 30], [-15, 28], [-17, 22], [-18, 15],
    ],
    // Asia
    [
        [30, 42], [35, 38], [38, 33], [42, 30], [48, 30], [52, 25],
        [56, 27], [63, 25], [68, 24], [72, 22], [77, 8], [80, 15],
        [88, 22], [92, 20], [96, 16], [100, 14], [103, 2], [105, 5],
        [108, 10], [110, 18], [115, 22], [120, 23], [122, 30], [127, 34],
        [130, 35], [133, 34], [135, 35], [140, 36], [142, 40], [145, 44],
        [142, 47], [135, 50], [130, 48], [128, 42], [122, 40], [120, 47],
        [118, 50], [115, 52], [110, 54], [100, 55], [90, 55], [80, 54],
        [70, 55], [60, 55], [55, 52], [50, 50], [45, 48], [40, 45],
        [35, 45], [30, 42],
    ],
    // Russia (north)
    [
        [30, 60], [40, 60], [50, 58], [60, 60], [70, 60], [80, 62],
        [90, 65], [100, 64], [110, 60], [120, 62], [130, 60],
        [140, 62], [150, 60], [160, 63], [170, 65], [180, 66],
        [180, 72], [170, 72], [160, 70], [150, 70], [140, 72],
        [130, 73], [120, 74], [110, 73], [100, 72], [90, 70],
        [80, 70], [70, 72], [60, 70], [50, 68], [40, 66],
        [30, 65], [30, 60],
    ],
    // Australia
    [
        [115, -22], [120, -18], [128, -15], [133, -12], [136, -12],
        [140, -15], [142, -11], [145, -15], [148, -20], [150, -24],
        [152, -28], [153, -30], [150, -35], [145, -38], [138, -36],
        [135, -34], [130, -33], [125, -34], [118, -35], [115, -33],
        [114, -28], [114, -24], [115, -22],
    ],
]

export function createEarthTexture(width = 1024, height = 512): CanvasTexture {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!

    ctx.fillStyle = '#080e1a'
    ctx.fillRect(0, 0, width, height)

    ctx.strokeStyle = 'rgba(66, 153, 225, 0.06)'
    ctx.lineWidth = 0.5
    for (let lat = -60; lat <= 60; lat += 30) {
        const y = ((90 - lat) / 180) * height
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
    }
    for (let lng = -150; lng <= 180; lng += 30) {
        const x = ((lng + 180) / 360) * width
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
    }

    for (const continent of CONTINENTS) {
        ctx.beginPath()
        const [sx, sy] = latLngToCanvas(continent[0][1], continent[0][0], width, height)
        ctx.moveTo(sx, sy)
        for (let i = 1; i < continent.length; i++) {
            const [cx, cy] = latLngToCanvas(continent[i][1], continent[i][0], width, height)
            ctx.lineTo(cx, cy)
        }
        ctx.closePath()

        ctx.fillStyle = 'rgba(30, 80, 60, 0.5)'
        ctx.fill()

        ctx.strokeStyle = 'rgba(66, 153, 225, 0.35)'
        ctx.lineWidth = 1.2
        ctx.stroke()
    }

    const tex = new CanvasTexture(canvas)
    tex.minFilter = LinearFilter
    return tex
}

export function createPinGlowTexture(color: string): CanvasTexture {
    const size = 128
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    grad.addColorStop(0, color + 'cc')
    grad.addColorStop(0.3, color + '44')
    grad.addColorStop(0.7, color + '11')
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, size, size)
    const tex = new CanvasTexture(canvas)
    tex.minFilter = LinearFilter
    return tex
}

export function createPinLabelTexture(name: string, color: string, titleCount: number): CanvasTexture {
    const w = 256
    const h = 64
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, w, h)

    ctx.font = 'bold 18px system-ui'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    ctx.fillStyle = 'rgba(0,0,0,0.6)'
    ctx.fillText(name.toUpperCase(), w / 2 + 1, h / 2 - 6 + 1)
    ctx.fillStyle = color
    ctx.globalAlpha = 0.95
    ctx.fillText(name.toUpperCase(), w / 2, h / 2 - 6)

    ctx.globalAlpha = 0.5
    ctx.font = '13px system-ui'
    ctx.fillStyle = '#ffffff'
    ctx.fillText(`${titleCount} titles`, w / 2, h / 2 + 14)
    ctx.globalAlpha = 1.0

    const tex = new CanvasTexture(canvas)
    tex.minFilter = LinearFilter
    return tex
}
