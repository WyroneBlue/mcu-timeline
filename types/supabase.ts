export type Database = {
    public: {
        Tables: {
            titles: {
                Row: {
                    id: number
                    tmdb_id: number | null
                    type: 'movie' | 'series'
                    title: string
                    slug: string
                    release_date: string | null
                    chronology_index: number | null
                    phase: string | null
                    saga: string | null
                    poster_url: string | null
                    backdrop_url: string | null
                    overview: string | null
                    is_canon_mcu: boolean | null
                }
                Insert: Partial<Database['public']['Tables']['titles']['Row']>
                Update: Partial<Database['public']['Tables']['titles']['Row']>
                Relationships: []
            }
            progress: {
                Row: {
                    user_id: string
                    title_id: number
                    status: 'queued' | 'watching' | 'watched' | 'skipped'
                    watched_at: string | null
                }
                Insert: {
                    user_id: string
                    title_id: number
                    status?: 'queued' | 'watching' | 'watched' | 'skipped'
                    watched_at?: string | null
                }
                Update: Partial<Database['public']['Tables']['progress']['Insert']>
                Relationships: []
            }
            badges: {
                Row: { id: number; code: string; name: string; description: string | null; icon: string | null }
                Insert: { code: string; name: string; description?: string | null; icon?: string | null }
                Update: Partial<Database['public']['Tables']['badges']['Insert']>
                Relationships: []
            }
            user_badges: {
                Row: { user_id: string; badge_id: number; awarded_at: string | null }
                Insert: { user_id: string; badge_id: number; awarded_at?: string | null }
                Update: Partial<Database['public']['Tables']['user_badges']['Insert']>
                Relationships: []
            }
            xp_events: {
                Row: { id: number; user_id: string; title_id: number | null; event_type: 'watch' | 'review' | 'quiz'; xp_delta: number; created_at: string | null; metadata_json: unknown }
                Insert: { user_id: string; title_id?: number | null; event_type: 'watch' | 'review' | 'quiz'; xp_delta: number; metadata_json?: unknown }
                Update: Partial<Database['public']['Tables']['xp_events']['Insert']>
                Relationships: []
            }
            profiles: {
                Row: { id: string; username: string | null; avatar_url: string | null; favorite_hero: string | null; created_at: string | null }
                Insert: { id: string; username?: string | null; avatar_url?: string | null; favorite_hero?: string | null }
                Update: Partial<Database['public']['Tables']['profiles']['Insert']>
                Relationships: []
            }
            friends: {
                Row: { user_id: string; friend_id: string; status: 'pending' | 'accepted'; created_at: string | null }
                Insert: { user_id: string; friend_id: string; status?: 'pending' | 'accepted' }
                Update: Partial<Database['public']['Tables']['friends']['Insert']>
                Relationships: []
            }
        }
        Views: {}
        Functions: {}
        Enums: {}
    }
}

