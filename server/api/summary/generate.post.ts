import Anthropic from '@anthropic-ai/sdk'

interface SummaryInput {
  slug: string
  title: string
  summary: string
  key_characters: string[]
  key_events: string[]
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const apiKey = config.anthropicApiKey

  if (!apiKey) {
    throw createError({ statusCode: 500, message: 'Anthropic API key not configured' })
  }

  const body = await readBody<{
    currentTitle: string
    skippedSummaries: SummaryInput[]
    mode: 'per-title' | 'flowing-story'
  }>(event)

  if (!body.skippedSummaries?.length) {
    throw createError({ statusCode: 400, message: 'No summaries provided' })
  }

  const anthropic = new Anthropic({ apiKey })

  const summaryBlock = body.skippedSummaries
    .map(s => `### ${s.title}\n${s.summary}\nPersonages: ${s.key_characters.join(', ')}\nEvents: ${s.key_events.join('; ')}`)
    .join('\n\n')

  const systemPrompt = `Je bent een MCU-expert die samenvattingen schrijft voor kijkers die bepaalde titels hebben geskipt. Schrijf in het Nederlands, informeel maar informatief. Vermijd spoilers van de titel die de gebruiker nu gaat kijken. Wees beknopt maar volledig.`

  let userPrompt: string

  if (body.mode === 'per-title') {
    userPrompt = `De gebruiker gaat "${body.currentTitle}" kijken en heeft de volgende titels geskipt. Schrijf voor elke geskipte titel een korte, eigen samenvatting (2-3 zinnen) die precies vertelt wat de kijker moet weten. Gebruik geen opsommingen, schrijf het als vloeiende tekst.

Geskipte titels:
${summaryBlock}

Antwoord in JSON-formaat:
[{"title": "...", "summary": "..."}]

Geef ALLEEN de JSON array terug, geen andere tekst.`
  } else {
    userPrompt = `De gebruiker gaat "${body.currentTitle}" kijken en heeft de volgende titels geskipt. Schrijf één doorlopend, vloeiend verhaal dat alle belangrijke events en personages samenweeft tot een coherent narratief. De lezer hoeft niet te weten welke films dit waren — het gaat om het verhaal. Schrijf het als een episch verhaal in 2e persoon ("Tot nu toe in het MCU..."). Maximaal 300 woorden.

Geskipte titels:
${summaryBlock}

Geef ALLEEN het verhaaltekst terug als plain text, geen JSON of markdown headers.`
  }

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  if (body.mode === 'per-title') {
    try {
      const parsed = JSON.parse(text)
      return { mode: 'per-title', summaries: parsed }
    } catch {
      return { mode: 'per-title', summaries: body.skippedSummaries.map(s => ({ title: s.title, summary: s.summary })) }
    }
  }

  return { mode: 'flowing-story', story: text.trim() }
})
