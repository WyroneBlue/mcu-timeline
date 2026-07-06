import type { Database } from '~/types/supabase'

type DisplayMode = 'per-title' | 'flowing-story'

interface PerTitleResult {
  title: string
  summary: string
}

interface GenerateResponse {
  mode: DisplayMode
  gap: number[]
  summaries?: PerTitleResult[]
  story?: string
  cached: boolean
  fallback?: boolean
}

export function useBeforeYouWatch() {
  const client = useSupabaseClient<Database>()
  const { t, locale } = useI18n()

  const mode = ref<DisplayMode>('per-title')
  const loading = ref(false)
  const error = ref<string | null>(null)

  const perTitleSummaries = ref<PerTitleResult[]>([])
  const flowingStory = ref('')
  const hasGenerated = ref(false)
  const cached = ref(false)

  async function generate(titleId: number) {
    loading.value = true
    error.value = null

    try {
      const { data: { session } } = await client.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      const result = await $fetch<GenerateResponse>('/api/summary/generate', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          title_id: titleId,
          mode: mode.value,
          locale: locale.value,
        },
      })

      cached.value = !!result.cached

      if (result.mode === 'per-title') {
        perTitleSummaries.value = result.summaries ?? []
        flowingStory.value = ''
      }
      else {
        flowingStory.value = result.story ?? ''
        perTitleSummaries.value = []
      }

      hasGenerated.value = true
    }
    catch {
      error.value = t('previouslyOn.generationFailed')
    }
    finally {
      loading.value = false
    }
  }

  async function switchMode(newMode: DisplayMode, titleId: number) {
    mode.value = newMode
    await generate(titleId)
  }

  return {
    mode,
    loading,
    error,
    perTitleSummaries,
    flowingStory,
    hasGenerated,
    cached,
    generate,
    switchMode,
  }
}
