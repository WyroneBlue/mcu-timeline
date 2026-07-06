// Spawn logic for The Watcher easter egg. He no longer appears on every
// visit: 15% chance before discovery (with a pity guarantee on the 6th miss)
// and 20% afterwards — he still watches, rarely. Dev override: ?watcher=1.

const MISS_KEY = 'lorely:watcher-misses'

const SPAWN_SPOTS: Record<'universe' | 'planet', [number, number, number][]> = {
    universe: [
        [-18, 14, -10],
        [35, 16, -20],
        [-10, 12, -30],
        [55, 10, -8],
        [20, 18, -38],
        [-40, 11, 5],
    ],
    planet: [
        [-25, 12, -15],
        [22, 18, -25],
        [-15, 20, -35],
        [30, 14, -12],
        [0, 22, -40],
        [-30, 10, 8],
    ],
}

function readMisses(): number {
    if (typeof localStorage === 'undefined') return 0
    return Number(localStorage.getItem(MISS_KEY) ?? '0') || 0
}

function writeMisses(n: number) {
    if (typeof localStorage !== 'undefined') localStorage.setItem(MISS_KEY, String(n))
}

export function useWatcherSpawn(sceneKey: 'universe' | 'planet') {
    const { settings } = useSettings()
    const { isDiscovered } = useEasterEggs()
    const route = useRoute()

    const watcherPosition = ref<[number, number, number] | null>(null)

    function roll() {
        if (!settings.showEasterEggs) {
            watcherPosition.value = null
            return
        }
        if (watcherPosition.value) return

        const forced = import.meta.dev && route.query.watcher === '1'
        let spawn: boolean
        if (forced) {
            spawn = true
        } else if (isDiscovered('the-watcher')) {
            spawn = Math.random() < 0.2
        } else {
            const misses = readMisses()
            spawn = misses >= 5 || Math.random() < 0.15
            writeMisses(spawn ? 0 : misses + 1)
        }

        if (spawn) {
            const spots = SPAWN_SPOTS[sceneKey]
            watcherPosition.value = spots[Math.floor(Math.random() * spots.length)]
        }
    }

    watch(() => settings.showEasterEggs, roll, { immediate: true })

    return { watcherPosition }
}
