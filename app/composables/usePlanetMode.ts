import type { Database } from '~/types/supabase'
import type { LocationJson } from '~/types/multiverse'
import locationsJson from '../../data/locations.json'

type Title = Database['public']['Tables']['titles']['Row']

export type PlanetViewState = 'solar-system' | 'traveling' | 'earth-detail'

export interface JourneyStop {
    title: Title
    /** Top-level location: a planet/realm, or Earth itself. */
    location: LocationJson
    /** For Earth stops, the place on the globe — null when the data names none. */
    earthLocation: LocationJson | null
}

// Locations are traversed in story order: each one sorts by the earliest title
// that plays there, so Next walks the timeline (Earth/Iron Man → Asgard/Thor →
// …) instead of the raw JSON order. Locations without titles trail at the end,
// keeping their original relative order.
//
// SolarSystemScene derives its own mesh list with this same helper — both must
// stay in the same order or focusedIndex would address different locations in
// the scene than in the wrapper.
export function orderLocationsByChronology(
    locations: LocationJson[],
    titles: Title[],
): LocationJson[] {
    const chronoBySlug = new Map<string, number>()
    for (const t of titles) {
        if (t.chronology_index != null) chronoBySlug.set(t.slug, t.chronology_index)
    }

    const firstChrono = (loc: LocationJson) => {
        let min = Infinity
        for (const slug of loc.title_slugs) {
            const c = chronoBySlug.get(slug)
            if (c !== undefined && c < min) min = c
        }
        return min
    }

    return locations
        .map((loc, i) => ({ loc, i, key: firstChrono(loc) }))
        .sort((a, b) => (a.key !== b.key ? a.key - b.key : a.i - b.i))
        .map(e => e.loc)
}

export function usePlanetMode(titles: Ref<Title[]>) {
    const viewState = ref<PlanetViewState>('solar-system')
    const selectedLocationCode = ref<string | null>(null)
    const selectedTitleSlug = ref<string | null>(null)

    const allLocations = computed(() => locationsJson as LocationJson[])

    const solarSystemLocations = computed(() =>
        orderLocationsByChronology(
            allLocations.value.filter(l => l.parent_code === null),
            titles.value,
        )
    )

    const earthLocations = computed(() =>
        orderLocationsByChronology(
            allLocations.value.filter(l => l.parent_code === 'earth' && l.lat != null && l.lng != null),
            titles.value,
        )
    )

    // The journey is the timeline told through space: one stop per title, in
    // story order, at the place that title belongs to. Titles without a mapped
    // location are skipped.
    //
    // Picking that place is a judgement call for the ~20 titles that span
    // several locations, so the rule is deliberately conservative: Earth stays
    // home base, and a title only travels off-world when it plays nowhere on
    // Earth, or when it is the title that introduces a substantial off-world
    // location (Thor → Asgard, Ant-Man → Quantum Realm). Without that second
    // clause every Earth-bound blockbuster would be dragged to whichever exotic
    // side location it briefly visits.
    const journey = computed(() => {
        const locs = solarSystemLocations.value
        const chrono = new Map<string, number>()
        for (const t of titles.value) {
            if (t.chronology_index != null) chrono.set(t.slug, t.chronology_index)
        }

        const byTitle = new Map<string, LocationJson[]>()
        for (const l of locs) {
            for (const slug of l.title_slugs) {
                const list = byTitle.get(slug)
                if (list) list.push(l)
                else byTitle.set(slug, [l])
            }
        }

        const mappedCount = (l: LocationJson) =>
            l.title_slugs.filter(s => chrono.has(s)).length
        const introducedBy = (l: LocationJson) => {
            let min = Infinity
            let slug: string | null = null
            for (const s of l.title_slugs) {
                const c = chrono.get(s)
                if (c !== undefined && c < min) { min = c; slug = s }
            }
            return slug
        }

        const stops: JourneyStop[] = []
        for (const title of titles.value) {
            const candidates = byTitle.get(title.slug)
            if (!candidates || candidates.length === 0) continue

            const earth = candidates.find(l => l.id === 'earth')
            const offworld = candidates.filter(l => l.id !== 'earth')

            let location = earth ?? offworld[0]
            if (!earth && offworld.length > 0) {
                location = offworld[0]
            } else {
                const home = offworld.find(l => mappedCount(l) >= 3 && introducedBy(l) === title.slug)
                if (home) location = home
            }
            if (!location) continue

            // Earth stops zoom all the way in to the place on the globe where
            // the title plays, when the data names one.
            const earthLocation = location.id === 'earth'
                ? earthLocations.value.find(l => l.title_slugs.includes(title.slug)) ?? null
                : null

            stops.push({ title, location, earthLocation })
        }
        return stops
    })

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
        journey,
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
