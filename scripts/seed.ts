import { createClient } from '@supabase/supabase-js'
import titles from '../data/titles.sample.json' assert { type: 'json' }

const url = process.env.SUPABASE_URL as string
const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY as string

if (!url || !key) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY/ANON_KEY')
    process.exit(1)
}

const client = createClient(url, key)

async function main() {
    const { error } = await client.from('titles').upsert(titles, { onConflict: 'slug' })
    if (error) throw error
    console.log(`Seeded ${titles.length} titles`)
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})

