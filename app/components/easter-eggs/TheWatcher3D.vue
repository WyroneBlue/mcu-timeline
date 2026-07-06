<template>
    <primitive :object="group" />
</template>

<script setup lang="ts">
import {
    Group, Mesh, LatheGeometry, SphereGeometry, PlaneGeometry,
    MeshBasicMaterial, ShaderMaterial, CanvasTexture, AdditiveBlending,
    Vector2, BufferGeometry, Float32BufferAttribute, Points,
    Color as ThreeColor, LinearFilter,
} from 'three'
import { useRenderLoop, useTres } from '@tresjs/core'

const props = withDefaults(defineProps<{
    position: [number, number, number]
    opacity?: number
    scale?: number
}>(), { opacity: 0.85, scale: 8.0 })

const group = new Group()
group.position.set(...props.position)
const s = props.scale
group.scale.setScalar(s)

// Cloak: lathe profile from wide base over shoulders to hood peak,
// near-black blue with a fresnel rim so he reads against the void.
const cloakProfile = [
    new Vector2(0.0, 0.0),
    new Vector2(0.85, 0.02),
    new Vector2(0.8, 0.5),
    new Vector2(0.58, 1.5),
    new Vector2(0.52, 2.3),
    new Vector2(0.48, 2.85),
    new Vector2(0.36, 3.15),
    new Vector2(0.3, 3.55),
    new Vector2(0.14, 3.92),
    new Vector2(0.0, 4.0),
]
const cloakGeo = new LatheGeometry(cloakProfile, 24)
const cloakMat = new ShaderMaterial({
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
        uniform float uOpacity;
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
            float fresnel = pow(1.0 - abs(dot(vNormal, vViewDir)), 2.5);
            vec3 base = vec3(0.02, 0.03, 0.09);
            vec3 rim = vec3(0.25, 0.3, 0.55);
            vec3 col = base + rim * fresnel * 0.85;
            gl_FragColor = vec4(col, uOpacity * (0.85 + fresnel * 0.15));
        }
    `,
    uniforms: { uOpacity: { value: props.opacity } },
    transparent: true,
    depthWrite: false,
})
const cloak = new Mesh(cloakGeo, cloakMat)
group.add(cloak)

// Hood cavity: dark half-sphere inset where the face would be
const faceGeo = new SphereGeometry(0.26, 16, 16)
const faceMat = new MeshBasicMaterial({ color: new ThreeColor(0.01, 0.01, 0.03), transparent: true, opacity: props.opacity })
const face = new Mesh(faceGeo, faceMat)
face.position.set(0, 3.35, 0.12)
group.add(face)

// Glowing eyes: small emissive spheres + one shared glow billboard texture
function createEyeGlowTexture(): CanvasTexture {
    const size = 64
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    grad.addColorStop(0, 'rgba(190, 225, 255, 0.9)')
    grad.addColorStop(0.35, 'rgba(120, 180, 255, 0.4)')
    grad.addColorStop(1, 'rgba(60, 120, 255, 0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, size, size)
    const tex = new CanvasTexture(canvas)
    tex.minFilter = LinearFilter
    return tex
}

const eyeGlowTex = createEyeGlowTexture()
const eyeGeo = new SphereGeometry(0.035, 8, 8)
const eyeMat = new MeshBasicMaterial({ color: new ThreeColor(0.85, 0.95, 1.0) })
const eyeGlowGeo = new PlaneGeometry(0.28, 0.28)
const eyeGlowMat = new MeshBasicMaterial({
    map: eyeGlowTex, transparent: true, opacity: 0.9,
    blending: AdditiveBlending, depthWrite: false,
})
for (const side of [-1, 1]) {
    const eye = new Mesh(eyeGeo, eyeMat)
    eye.position.set(side * 0.11, 3.38, 0.3)
    group.add(eye)
    const glow = new Mesh(eyeGlowGeo, eyeGlowMat)
    glow.position.set(side * 0.11, 3.38, 0.32)
    group.add(glow)
}

// Ambient particle ring, same as the sprite variant
const particleCount = 10
const pGeo = new BufferGeometry()
const pPositions = new Float32Array(particleCount * 3)
for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2
    const radius = 0.6 + Math.random() * 1.0
    const height = 0.5 + Math.random() * 3.5
    pPositions[i * 3] = Math.cos(angle) * radius
    pPositions[i * 3 + 1] = height
    pPositions[i * 3 + 2] = Math.sin(angle) * radius
}
pGeo.setAttribute('position', new Float32BufferAttribute(pPositions, 3))
const pMat = new MeshBasicMaterial({
    color: new ThreeColor(0.3, 0.4, 0.8),
    transparent: true,
    opacity: props.opacity * 0.06,
    blending: AdditiveBlending,
    depthWrite: false,
})
const particles = new Points(pGeo, pMat)
group.add(particles)

const { camera } = useTres()
const { onLoop } = useRenderLoop()
let elapsed = 0

onLoop(({ delta }) => {
    elapsed += delta

    const breathe = s * (1 + Math.sin(elapsed * 0.2 * Math.PI * 2) * 0.01)
    group.scale.setScalar(breathe)

    if (camera.value) {
        const dx = camera.value.position.x - group.position.x
        const dz = camera.value.position.z - group.position.z
        group.rotation.y = Math.atan2(dx, dz)
    }

    particles.rotation.y = elapsed * 0.06
})

onUnmounted(() => {
    cloakGeo.dispose(); cloakMat.dispose()
    faceGeo.dispose(); faceMat.dispose()
    eyeGeo.dispose(); eyeMat.dispose()
    eyeGlowGeo.dispose(); eyeGlowMat.dispose(); eyeGlowTex.dispose()
    pGeo.dispose(); pMat.dispose()
})
</script>
