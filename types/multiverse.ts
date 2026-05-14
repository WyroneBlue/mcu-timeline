export interface Location {
    id: number
    code: string
    name: string
    type: 'planet' | 'realm' | 'dimension' | 'construct' | 'region'
    universe_code: string | null
    description: string | null
    color: string | null
    position_x: number
    position_y: number
    position_z: number
    radius: number
    parent_code: string | null
}

export interface LocationJson {
    id: string
    name: string
    type: Location['type']
    realm: string | null
    universe_code: string | null
    description: string
    color: string
    position_3d: [number, number, number]
    radius: number
    parent_code: string | null
    title_slugs: string[]
    lat?: number
    lng?: number
}

export interface Universe {
    id: number
    code: string
    name: string
    designation: string | null
    description: string | null
    color: string | null
    is_sacred: boolean
    branch_from_code: string | null
}

export interface UniverseJson {
    id: string
    code: string
    name: string
    designation: string
    description: string
    color: string
    is_sacred: boolean
    branch_from: string | null
    title_slugs: string[]
}

export interface TimelineBranch {
    id: number
    event_name: string
    source_title_id: number | null
    chronology_point: number | null
    branch_universe_code: string | null
    description: string | null
    is_nexus_event: boolean
    is_pruned: boolean
    color: string | null
}

export interface TimelineBranchJson {
    id: string
    event_name: string
    description: string
    source_title_slug: string
    chronology_point: number
    branch_universe_code: string | null
    is_nexus_event: boolean
    is_pruned: boolean
    color: string
}

export interface TitleLocation {
    title_id: number
    location_code: string
    is_primary: boolean
}
