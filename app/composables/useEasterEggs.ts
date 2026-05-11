type StoneId = 'space' | 'mind' | 'reality' | 'power' | 'time' | 'soul'

interface EasterEggState {
    watcherEnabled: boolean
    discoveredEggs: string[]
    infinityStones: Record<StoneId, boolean>
    sessionWatchCount: number
}

const STORAGE_KEY = 'lorely:easter-eggs'

function loadState(): EasterEggState {
    if (typeof localStorage === 'undefined') {
        return { watcherEnabled: false, discoveredEggs: [], infinityStones: { space: false, mind: false, reality: false, power: false, time: false, soul: false }, sessionWatchCount: 0 }
    }
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) return JSON.parse(raw)
    } catch {}
    return { watcherEnabled: false, discoveredEggs: [], infinityStones: { space: false, mind: false, reality: false, power: false, time: false, soul: false }, sessionWatchCount: 0 }
}

function saveState(state: EasterEggState) {
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    }
}

const state = reactive<EasterEggState>(loadState())

const allStonesCollected = computed(() =>
    Object.values(state.infinityStones).every(Boolean)
)

const collectedStoneCount = computed(() =>
    Object.values(state.infinityStones).filter(Boolean).length
)

const snapTriggered = ref(false)

function discoverEasterEgg(id: string) {
    if (!state.discoveredEggs.includes(id)) {
        state.discoveredEggs.push(id)
        saveState(state)
    }
}

function collectStone(stone: StoneId) {
    if (!state.infinityStones[stone]) {
        state.infinityStones[stone] = true
        saveState(state)
        if (allStonesCollected.value) {
            snapTriggered.value = true
        }
    }
}

function toggleWatcher() {
    state.watcherEnabled = !state.watcherEnabled
    saveState(state)
}

function incrementWatchCount() {
    state.sessionWatchCount++
}

function isDiscovered(id: string) {
    return state.discoveredEggs.includes(id)
}

function resetSnap() {
    snapTriggered.value = false
}

export function useEasterEggs() {
    return {
        watcherEnabled: computed(() => state.watcherEnabled),
        discoveredEggs: computed(() => state.discoveredEggs),
        infinityStones: computed(() => state.infinityStones),
        sessionWatchCount: computed(() => state.sessionWatchCount),
        allStonesCollected,
        collectedStoneCount,
        snapTriggered: readonly(snapTriggered),
        discoverEasterEgg,
        collectStone,
        toggleWatcher,
        incrementWatchCount,
        isDiscovered,
        resetSnap,
    }
}
