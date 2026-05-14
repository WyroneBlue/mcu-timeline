import contextSummariesJson from '../../data/context-summaries.json'
import mcuTitlesJson from '../../data/mcu-titles.json'

interface ContextSummary {
  title_slug: string
  prerequisite_slugs: string[]
  summary: string
  key_characters: string[]
  key_events: string[]
}

type DisplayMode = 'per-title' | 'flowing-story'

interface PerTitleResult {
  title: string
  summary: string
}

const summaries = contextSummariesJson as ContextSummary[]
const allTitles = mcuTitlesJson as { slug: string; title: string; chronology_index: number }[]

export function useBeforeYouWatch() {
  const mode = ref<DisplayMode>('per-title')
  const loading = ref(false)
  const error = ref<string | null>(null)

  const perTitleSummaries = ref<PerTitleResult[]>([])
  const flowingStory = ref('')
  const hasGenerated = ref(false)

  function getSkippedData(currentSlug: string, skippedSlugs: Set<string>) {
    const current = allTitles.find(t => t.slug === currentSlug)
    if (!current) return []

    const preceding = allTitles
      .filter(t => t.chronology_index < current.chronology_index)
      .map(t => t.slug)

    const skippedPreceding = preceding.filter(s => skippedSlugs.has(s))

    return skippedPreceding
      .map(slug => {
        const summary = summaries.find(s => s.title_slug === slug)
        const titleData = allTitles.find(t => t.slug === slug)
        if (!summary || !titleData) return null
        return {
          slug: titleData.slug,
          title: titleData.title,
          summary: summary.summary,
          key_characters: summary.key_characters,
          key_events: summary.key_events,
        }
      })
      .filter(Boolean) as { slug: string; title: string; summary: string; key_characters: string[]; key_events: string[] }[]
  }

  async function generate(currentSlug: string, skippedSlugs: Set<string>) {
    const skippedData = getSkippedData(currentSlug, skippedSlugs)
    if (skippedData.length === 0) return

    const currentTitle = allTitles.find(t => t.slug === currentSlug)?.title || currentSlug

    loading.value = true
    error.value = null

    try {
      const result = await $fetch('/api/summary/generate', {
        method: 'POST',
        body: {
          currentTitle,
          skippedSummaries: skippedData,
          mode: mode.value,
        },
      })

      if (result.mode === 'per-title') {
        perTitleSummaries.value = result.summaries as PerTitleResult[]
        flowingStory.value = ''
      } else {
        flowingStory.value = result.story as string
        perTitleSummaries.value = []
      }

      hasGenerated.value = true
    } catch (e: any) {
      error.value = e?.data?.message || 'Kon samenvatting niet genereren'
      perTitleSummaries.value = skippedData.map(s => ({ title: s.title, summary: s.summary }))
      hasGenerated.value = true
    } finally {
      loading.value = false
    }
  }

  async function switchMode(newMode: DisplayMode, currentSlug: string, skippedSlugs: Set<string>) {
    mode.value = newMode
    await generate(currentSlug, skippedSlugs)
  }

  return {
    mode,
    loading,
    error,
    perTitleSummaries,
    flowingStory,
    hasGenerated,
    getSkippedData,
    generate,
    switchMode,
  }
}
