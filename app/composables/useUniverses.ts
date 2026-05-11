import type { Database } from '~/types/supabase'
import type { UniverseJson, TimelineBranchJson } from '~/types/multiverse'
import universesJson from '../../data/universes.json'
import branchesJson from '../../data/timeline-branches.json'

type Universe = Database['public']['Tables']['universes']['Row']
type TimelineBranch = Database['public']['Tables']['timeline_branches']['Row']

function localUniverses(): Universe[] {
    return (universesJson as UniverseJson[]).map((u, i) => ({
        id: i + 1,
        code: u.code,
        name: u.name,
        designation: u.designation,
        description: u.description,
        color: u.color,
        is_sacred: u.is_sacred,
        branch_from_code: u.branch_from,
    })) as Universe[]
}

function localBranches(): TimelineBranch[] {
    return (branchesJson as TimelineBranchJson[]).map((b, i) => ({
        id: i + 1,
        event_name: b.event_name,
        source_title_id: null,
        chronology_point: b.chronology_point,
        branch_universe_code: b.branch_universe_code,
        description: b.description,
        is_nexus_event: b.is_nexus_event,
        is_pruned: b.is_pruned,
        color: b.color,
    })) as TimelineBranch[]
}

export function useUniverses() {
    const client = useSupabaseClient<Database>()

    async function getUniverses(): Promise<Universe[]> {
        try {
            const { data, error } = await client
                .from('universes')
                .select('*')
                .order('name')
            if (error) throw error
            if (data && data.length > 0) return data as Universe[]
        } catch {
            // fallback
        }
        return localUniverses()
    }

    async function getUniverseByCode(code: string): Promise<Universe | null> {
        try {
            const { data, error } = await client
                .from('universes')
                .select('*')
                .eq('code', code)
                .single()
            if (error) throw error
            return data as Universe
        } catch {
            return localUniverses().find(u => u.code === code) ?? null
        }
    }

    async function getTimelineBranches(): Promise<TimelineBranch[]> {
        try {
            const { data, error } = await client
                .from('timeline_branches')
                .select('*')
                .order('chronology_point')
            if (error) throw error
            if (data && data.length > 0) return data as TimelineBranch[]
        } catch {
            // fallback
        }
        return localBranches()
    }

    function getTitleSlugsForUniverse(universeCode: string): string[] {
        const universe = (universesJson as UniverseJson[]).find(u => u.code === universeCode)
        return universe?.title_slugs ?? []
    }

    function getBranchesForTitle(titleSlug: string): TimelineBranchJson[] {
        return (branchesJson as TimelineBranchJson[]).filter(
            b => b.source_title_slug === titleSlug
        )
    }

    return {
        getUniverses,
        getUniverseByCode,
        getTimelineBranches,
        getTitleSlugsForUniverse,
        getBranchesForTitle,
    }
}
