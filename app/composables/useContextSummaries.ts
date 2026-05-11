import contextSummariesJson from '../../data/context-summaries.json'
import mcuTitlesJson from '../../data/mcu-titles.json'

interface ContextSummary {
    title_slug: string
    prerequisite_slugs: string[]
    summary: string
    key_characters: string[]
    key_events: string[]
}

const summaries = contextSummariesJson as ContextSummary[]
const allTitles = mcuTitlesJson as { slug: string; title: string; chronology_index: number }[]

export function useContextSummaries() {
    function getSkippedPrerequisites(
        currentSlug: string,
        skippedSlugs: Set<string>,
    ): { title: string; slug: string; summary: ContextSummary }[] {
        const current = allTitles.find(t => t.slug === currentSlug)
        if (!current) return []

        const preceding = allTitles
            .filter(t => t.chronology_index < current.chronology_index)
            .map(t => t.slug)

        const skippedPreceding = preceding.filter(s => skippedSlugs.has(s))

        const results: { title: string; slug: string; summary: ContextSummary }[] = []
        for (const slug of skippedPreceding) {
            const summary = summaries.find(s => s.title_slug === slug)
            if (summary) {
                const titleData = allTitles.find(t => t.slug === slug)
                if (titleData) {
                    results.push({
                        title: titleData.title,
                        slug: titleData.slug,
                        summary,
                    })
                }
            }
        }

        return results.sort((a, b) => {
            const aIdx = allTitles.find(t => t.slug === a.slug)?.chronology_index ?? 0
            const bIdx = allTitles.find(t => t.slug === b.slug)?.chronology_index ?? 0
            return aIdx - bIdx
        })
    }

    function getSummaryForTitle(slug: string): ContextSummary | null {
        return summaries.find(s => s.title_slug === slug) ?? null
    }

    return {
        getSkippedPrerequisites,
        getSummaryForTitle,
    }
}
