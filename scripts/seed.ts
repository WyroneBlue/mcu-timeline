import { createClient } from '@supabase/supabase-js'
import titlesData from '../data/mcu-titles.json' assert { type: 'json' }
import retconsData from '../data/retcons-seed.json' assert { type: 'json' }
import quizData from '../data/quiz-questions.json' assert { type: 'json' }
import summariesData from '../data/context-summaries.json' assert { type: 'json' }
import locationsData from '../data/locations.json' assert { type: 'json' }
import universesData from '../data/universes.json' assert { type: 'json' }
import branchesData from '../data/timeline-branches.json' assert { type: 'json' }

const url = process.env.SUPABASE_URL as string
const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY as string

if (!url || !key) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY/ANON_KEY')
    process.exit(1)
}

const client = createClient(url, key)

async function seedFranchise() {
    const { error } = await client.from('franchises').upsert({
        code: 'mcu',
        name: 'Marvel Cinematic Universe',
        slug: 'mcu',
        description: 'Het Marvel Cinematic Universe — van Iron Man tot Secret Wars',
        color_primary: '#E53E3E',
        color_accent: '#D69E2E',
        sort_order: 1
    }, { onConflict: 'code' })
    if (error) throw error
    console.log('Seeded MCU franchise')
}

async function seedTitles() {
    const { data: franchise } = await client
        .from('franchises')
        .select('id')
        .eq('code', 'mcu')
        .single()

    if (!franchise) throw new Error('MCU franchise not found')

    const titlesWithFranchise = titlesData.map(t => {
        const { characters, teams, franchise: _f, ...rest } = t as any
        return { ...rest, franchise_id: franchise.id }
    })

    const { error } = await client.from('titles').upsert(titlesWithFranchise, { onConflict: 'slug' })
    if (error) throw error
    console.log(`Seeded ${titlesData.length} titles`)
}

async function seedRetcons() {
    const { data: titles } = await client
        .from('titles')
        .select('id, slug')

    if (!titles) throw new Error('No titles found')

    const slugToId = new Map(titles.map(t => [t.slug, t.id]))

    const retcons = retconsData
        .filter(r => slugToId.has(r.source_slug) && slugToId.has(r.affected_slug))
        .map(r => ({
            source_title_id: slugToId.get(r.source_slug),
            affected_title_id: slugToId.get(r.affected_slug),
            description: r.description,
            retcon_type: r.retcon_type
        }))

    if (retcons.length > 0) {
        const { error } = await client.from('retcons').upsert(retcons)
        if (error) throw error
    }
    console.log(`Seeded ${retcons.length} retcons`)
}

async function seedQuizQuestions() {
    const { data: franchise } = await client
        .from('franchises')
        .select('id')
        .eq('code', 'mcu')
        .single()

    if (!franchise) throw new Error('MCU franchise not found')

    const { data: titles } = await client
        .from('titles')
        .select('id, slug')

    if (!titles) throw new Error('No titles found')
    const slugToId = new Map(titles.map(t => [t.slug, t.id]))

    const questions = quizData.map((q: any) => ({
        franchise_id: franchise.id,
        title_id: slugToId.get(q.title_slug) || null,
        question: q.question,
        options: q.options,
        correct_index: q.correct_index,
        difficulty: q.difficulty
    }))

    await client.from('quiz_questions').delete().eq('franchise_id', franchise.id)
    const { error } = await client.from('quiz_questions').insert(questions)
    if (error) throw error
    console.log(`Seeded ${questions.length} quiz questions`)
}

async function seedContextSummaries() {
    const { data: titles } = await client
        .from('titles')
        .select('id, slug')

    if (!titles) throw new Error('No titles found')
    const slugToId = new Map(titles.map(t => [t.slug, t.id]))

    const summaries = (summariesData as any[])
        .filter((s: any) => slugToId.has(s.title_slug))
        .map((s: any) => ({
            title_id: slugToId.get(s.title_slug),
            prerequisite_title_ids: s.prerequisite_slugs
                .filter((slug: string) => slugToId.has(slug))
                .map((slug: string) => slugToId.get(slug)),
            summary_text: s.summary,
            key_characters: s.key_characters,
            key_events: s.key_events,
            spoiler_level: 'safe'
        }))

    if (summaries.length > 0) {
        const titleIds = summaries.map((s: any) => s.title_id).filter(Boolean)
        if (titleIds.length > 0) {
            await client.from('context_summaries').delete().in('title_id', titleIds)
        }
        const { error } = await client.from('context_summaries').insert(summaries)
        if (error) throw error
    }
    console.log(`Seeded ${summaries.length} context summaries`)
}

async function seedLocations() {
    const locations = locationsData.map((loc: any) => ({
        code: loc.id,
        name: loc.name,
        type: loc.type,
        universe_code: loc.universe_code,
        description: loc.description,
        color: loc.color,
        position_x: loc.position_3d[0],
        position_y: loc.position_3d[1],
        position_z: loc.position_3d[2],
        radius: loc.radius,
        parent_code: loc.parent_code,
    }))

    const { error } = await client.from('locations').upsert(locations, { onConflict: 'code' })
    if (error) throw error
    console.log(`Seeded ${locations.length} locations`)

    const { data: titles } = await client.from('titles').select('id, slug')
    if (!titles) return
    const slugToId = new Map(titles.map(t => [t.slug, t.id]))

    const titleLocations: { title_id: number; location_code: string; is_primary: boolean }[] = []
    for (const loc of locationsData as any[]) {
        for (let i = 0; i < loc.title_slugs.length; i++) {
            const titleId = slugToId.get(loc.title_slugs[i])
            if (titleId) {
                titleLocations.push({
                    title_id: titleId,
                    location_code: loc.id,
                    is_primary: i === 0,
                })
            }
        }
    }

    if (titleLocations.length > 0) {
        await client.from('title_locations').delete().neq('title_id', 0)
        const { error: tlError } = await client.from('title_locations').insert(titleLocations)
        if (tlError) throw tlError
    }
    console.log(`Seeded ${titleLocations.length} title-location mappings`)
}

async function seedUniverses() {
    const universes = universesData.map((u: any) => ({
        code: u.code,
        name: u.name,
        designation: u.designation,
        description: u.description,
        color: u.color,
        is_sacred: u.is_sacred,
        branch_from_code: u.branch_from,
    }))

    const { error } = await client.from('universes').upsert(universes, { onConflict: 'code' })
    if (error) throw error
    console.log(`Seeded ${universes.length} universes`)
}

async function seedTimelineBranches() {
    const { data: titles } = await client.from('titles').select('id, slug')
    if (!titles) throw new Error('No titles found')
    const slugToId = new Map(titles.map(t => [t.slug, t.id]))

    const branches = branchesData.map((b: any) => ({
        event_name: b.event_name,
        source_title_id: slugToId.get(b.source_title_slug) || null,
        chronology_point: b.chronology_point,
        branch_universe_code: b.branch_universe_code,
        description: b.description,
        is_nexus_event: b.is_nexus_event,
        is_pruned: b.is_pruned,
        color: b.color,
    }))

    await client.from('timeline_branches').delete().neq('id', 0)
    const { error } = await client.from('timeline_branches').insert(branches)
    if (error) throw error
    console.log(`Seeded ${branches.length} timeline branches`)
}

async function main() {
    await seedFranchise()
    await seedTitles()
    await seedRetcons()
    await seedQuizQuestions()
    await seedContextSummaries()
    await seedLocations()
    await seedUniverses()
    await seedTimelineBranches()
    console.log('Seed complete!')
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})
