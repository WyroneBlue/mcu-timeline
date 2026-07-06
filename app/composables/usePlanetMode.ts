import type { Database } from '~/types/supabase'
import type { LocationJson } from '~/types/multiverse'
import locationsJson from '../../data/locations.json'

type Title = Database['public']['Tables']['titles']['Row']

export type PlanetViewState = 'solar-system' | 'traveling' | 'earth-detail'

export function usePlanetMode(titles: Ref<Title[]>) {
    const viewState = ref<PlanetViewState>('solar-system')
    const selectedLocationCode = ref<string | null>(null)
    const selectedTitleSlug = ref<string | null>(null)

    const allLocations = computed(() => locationsJson as LocationJson[])

    const solarSystemLocations = computed(() =>
        allLocations.value.filter(l => l.parent_code === null)
    )

    const earthLocations = computed(() =>
        allLocations.value.filter(l => l.parent_code === 'earth' && l.lat != null && l.lng != null)
    )

    const selectedLocation = computed(() => {
        if (!selectedLocationCode.value) return null
        return allLocations.value.find(l => l.id === selectedLocationCode.value) ?? null
    })

    const titlesForLocation = computed(() => {
        if (!selectedLocation.value) return []
        const slugs = new Set(selectedLocation.value.title_slugs)
        return titles.value
            .filter(t => slugs.has(t.slug))
            .sort((a, b) => (a.chronology_index ?? 0) - (b.chronology_index ?? 0))
    })

    const selectedTitle = computed(() => {
        if (!selectedTitleSlug.value) return null
        return titles.value.find(t => t.slug === selectedTitleSlug.value) ?? null
    })

    function enterEarth() {
        viewState.value = 'earth-detail'
        selectedLocationCode.value = null
        selectedTitleSlug.value = null
    }

    // Cinematic dive: the solar-system scene stays mounted during
    // 'traveling' while the camera flies toward earth; completeTravel()
    // swaps to the earth-detail scene at the visual peak.
    function beginTravel() {
        viewState.value = 'traveling'
        selectedLocationCode.value = null
        selectedTitleSlug.value = null
    }

    function completeTravel() {
        if (viewState.value === 'traveling') enterEarth()
    }

    function exitEarth() {
        viewState.value = 'solar-system'
        selectedLocationCode.value = null
        selectedTitleSlug.value = null
    }

    function selectLocation(code: string | null) {
        selectedLocationCode.value = code
        selectedTitleSlug.value = null
    }

    function selectTitle(slug: string | null) {
        selectedTitleSlug.value = slug
    }

    function nextTitle() {
        const list = titlesForLocation.value
        if (list.length === 0) return
        const idx = list.findIndex(t => t.slug === selectedTitleSlug.value)
        if (idx < list.length - 1) {
            selectedTitleSlug.value = list[idx + 1].slug
        }
    }

    function prevTitle() {
        const list = titlesForLocation.value
        if (list.length === 0) return
        const idx = list.findIndex(t => t.slug === selectedTitleSlug.value)
        if (idx > 0) {
            selectedTitleSlug.value = list[idx - 1].slug
        }
    }

    function reset() {
        viewState.value = 'solar-system'
        selectedLocationCode.value = null
        selectedTitleSlug.value = null
    }

    return {
        viewState,
        selectedLocationCode,
        selectedTitleSlug,
        allLocations,
        solarSystemLocations,
        earthLocations,
        selectedLocation,
        titlesForLocation,
        selectedTitle,
        selectLocation,
        selectTitle,
        enterEarth,
        beginTravel,
        completeTravel,
        exitEarth,
        nextTitle,
        prevTitle,
        reset,
    }
}
