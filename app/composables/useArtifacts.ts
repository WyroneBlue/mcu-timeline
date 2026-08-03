export interface Artifact {
    id: string
    name: string
    icon: string
    description: string
    unlockHint: string
    requiredSlugs: string[]
}

export const ARTIFACTS: Artifact[] = [
    {
        id: 'caps-shield',
        name: "Captain America's Shield",
        icon: '🛡️',
        description: 'Vibranium schild gesmeed door Howard Stark',
        unlockHint: 'Voltooi Phase 1',
        requiredSlugs: ['iron-man', 'the-incredible-hulk', 'iron-man-2', 'thor', 'captain-america-the-first-avenger', 'the-avengers'],
    },
    {
        id: 'mjolnir',
        name: 'Mjolnir',
        icon: '🔨',
        description: 'Whosoever holds this hammer, if they be worthy...',
        unlockHint: 'Bekijk alle Thor films',
        requiredSlugs: ['thor', 'thor-the-dark-world', 'thor-ragnarok', 'thor-love-and-thunder'],
    },
    {
        id: 'eye-of-agamotto',
        name: 'Eye of Agamotto',
        icon: '👁️',
        description: 'Bevat de Time Stone — boog het lot naar je wil',
        unlockHint: 'Bekijk alle Doctor Strange films',
        requiredSlugs: ['doctor-strange', 'doctor-strange-in-the-multiverse-of-madness'],
    },
    {
        id: 'web-shooters',
        name: 'Web Shooters',
        icon: '🕸️',
        description: "Peter Parker's eigen uitvinding",
        unlockHint: 'Bekijk alle MCU Spider-Man films',
        requiredSlugs: ['spider-man-homecoming', 'spider-man-far-from-home', 'spider-man-no-way-home'],
    },
    {
        id: 'vibranium-heart',
        name: 'Heart-Shaped Herb',
        icon: '💜',
        description: 'Kracht van de Black Panther',
        unlockHint: 'Bekijk alle Black Panther films',
        requiredSlugs: ['black-panther', 'black-panther-wakanda-forever'],
    },
    {
        id: 'pym-particles',
        name: 'Pym Particles',
        icon: '⚛️',
        description: 'Verander van formaat — het Quantum Realm wacht',
        unlockHint: 'Bekijk alle Ant-Man films',
        requiredSlugs: ['ant-man', 'ant-man-and-the-wasp', 'ant-man-and-the-wasp-quantumania'],
    },
    {
        id: 'ten-rings',
        name: 'Ten Rings',
        icon: '🔟',
        description: 'Duizend jaar oud, onmetelijke kracht',
        unlockHint: 'Bekijk Shang-Chi',
        requiredSlugs: ['shang-chi-and-the-legend-of-the-ten-rings'],
    },
    {
        id: 'darkhold',
        name: 'Darkhold',
        icon: '📕',
        description: 'Het Boek der Verdoemden — elke lezer betaalt een prijs',
        unlockHint: 'Bekijk WandaVision + Multiverse of Madness',
        requiredSlugs: ['wandavision', 'doctor-strange-in-the-multiverse-of-madness'],
    },
    {
        id: 'tesseract',
        name: 'Tesseract',
        icon: '🔷',
        description: 'De Space Stone, verborgen in een kosmische kubus',
        unlockHint: 'Bekijk Captain America TFA + Avengers + Captain Marvel',
        requiredSlugs: ['captain-america-the-first-avenger', 'the-avengers', 'captain-marvel'],
    },
    {
        id: 'nano-gauntlet',
        name: 'Nano Gauntlet',
        icon: '🤌',
        description: 'Gebouwd door Tony Stark — de snap die alles terugbracht',
        unlockHint: 'Bekijk Infinity War + Endgame',
        requiredSlugs: ['avengers-infinity-war', 'avengers-endgame'],
    },
]

const STORAGE_KEY = 'lorely:artifacts'

function loadUnlocked(): Set<string> {
    if (typeof localStorage === 'undefined') return new Set()
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) return new Set(JSON.parse(raw))
    } catch {}
    return new Set()
}

function saveUnlocked(ids: Set<string>) {
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
    }
}

const unlocked = ref(loadUnlocked())

function checkUnlocks(watchedSlugs: Set<string>): Artifact[] {
    const newlyUnlocked: Artifact[] = []
    for (const artifact of ARTIFACTS) {
        if (unlocked.value.has(artifact.id)) continue
        if (artifact.requiredSlugs.every(s => watchedSlugs.has(s))) {
            unlocked.value.add(artifact.id)
            newlyUnlocked.push(artifact)
        }
    }
    if (newlyUnlocked.length > 0) {
        saveUnlocked(unlocked.value)
    }
    return newlyUnlocked
}

function getProgress(artifact: Artifact, watchedSlugs: Set<string>): { done: number; total: number } {
    const done = artifact.requiredSlugs.filter(s => watchedSlugs.has(s)).length
    return { done, total: artifact.requiredSlugs.length }
}

export function useArtifacts() {
    return {
        artifacts: ARTIFACTS,
        unlocked: computed(() => unlocked.value),
        unlockedCount: computed(() => unlocked.value.size),
        totalCount: ARTIFACTS.length,
        isUnlocked: (id: string) => unlocked.value.has(id),
        checkUnlocks,
        getProgress,
    }
}
