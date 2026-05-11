import type { Database } from '~/types/supabase'
import type { LocationJson } from '~/types/multiverse'
import locationsJson from '../../data/locations.json'

type Location = Database['public']['Tables']['locations']['Row']
type Title = Database['public']['Tables']['titles']['Row']

function localLocations(): Location[] {
    return (locationsJson as LocationJson[]).map((loc, i) => ({
        id: i + 1,
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
    })) as Location[]
}

export function useLocations() {
    const client = useSupabaseClient<Database>()

    async function getLocations(): Promise<Location[]> {
        try {
            const { data, error } = await client
                .from('locations')
                .select('*')
                .order('name')
            if (error) throw error
            if (data && data.length > 0) return data as Location[]
        } catch {
            // fallback
        }
        return localLocations()
    }

    async function getLocationByCode(code: string): Promise<Location | null> {
        try {
            const { data, error } = await client
                .from('locations')
                .select('*')
                .eq('code', code)
                .single()
            if (error) throw error
            return data as Location
        } catch {
            return localLocations().find(l => l.code === code) ?? null
        }
    }

    function getTitleSlugsForLocation(locationCode: string): string[] {
        const loc = (locationsJson as LocationJson[]).find(l => l.id === locationCode)
        return loc?.title_slugs ?? []
    }

    async function getLocationsForTitle(titleSlug: string): Promise<Location[]> {
        const all = (locationsJson as LocationJson[])
        const matching = all.filter(loc => loc.title_slugs.includes(titleSlug))
        return matching.map((loc, i) => ({
            id: i + 1,
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
        })) as Location[]
    }

    return {
        getLocations,
        getLocationByCode,
        getTitleSlugsForLocation,
        getLocationsForTitle,
    }
}
