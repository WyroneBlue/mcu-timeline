export type Database = {
    public: {
        Tables: {
            franchises: {
                Row: {
                    id: number
                    code: string
                    name: string
                    slug: string
                    description: string | null
                    color_primary: string | null
                    color_accent: string | null
                    sort_order: number | null
                }
                Insert: Partial<Database['public']['Tables']['franchises']['Row']> & { code: string; name: string; slug: string }
                Update: Partial<Database['public']['Tables']['franchises']['Row']>
                Relationships: []
            }
            titles: {
                Row: {
                    id: number
                    franchise_id: number
                    tmdb_id: number | null
                    type: 'movie' | 'series' | 'special' | 'short'
                    title: string
                    slug: string
                    release_date: string | null
                    release_status: 'released' | 'upcoming' | 'announced'
                    chronology_index: number | null
                    story_year: string | null
                    story_order: number | null
                    phase: string | null
                    saga: string | null
                    poster_url: string | null
                    backdrop_url: string | null
                    overview: string | null
                    runtime_minutes: number | null
                    streaming_url: string | null
                    streaming_platform: string | null
                    trailer_url: string | null
                    canon_level: 'core' | 'extended' | 'adjacent' | 'standalone'
                    mcu_relevance_score: number | null
                    retcon_notes: string | null
                    retconned_by: number[] | null
                    retcon_date: string | null
                    created_at: string | null
                }
                Insert: Partial<Database['public']['Tables']['titles']['Row']> & { franchise_id: number; type: string; title: string; slug: string }
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
            profiles: {
                Row: {
                    id: string
                    username: string | null
                    avatar_url: string | null
                    favorite_hero: string | null
                    xp_total: number
                    level_int: number
                    streak_current: number
                    streak_last_date: string | null
                    onboarding_completed: boolean
                    spoiler_mode: 'smart' | 'reveal_all'
                    country_code: string | null
                    city: string | null
                    created_at: string | null
                }
                Insert: { id: string; username?: string | null; avatar_url?: string | null; favorite_hero?: string | null }
                Update: Partial<Database['public']['Tables']['profiles']['Row']>
                Relationships: []
            }
            badges: {
                Row: { id: number; code: string; name: string; description: string | null; icon: string | null; franchise_id: number | null }
                Insert: { code: string; name: string; description?: string | null; icon?: string | null; franchise_id?: number | null }
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
                Row: { id: number; user_id: string; title_id: number | null; event_type: 'watch' | 'review' | 'quiz' | 'badge' | 'streak'; xp_delta: number; created_at: string; metadata_json: unknown }
                Insert: { user_id: string; title_id?: number | null; event_type: 'watch' | 'review' | 'quiz' | 'badge' | 'streak'; xp_delta: number; metadata_json?: unknown }
                Update: Partial<Database['public']['Tables']['xp_events']['Insert']>
                Relationships: []
            }
            friends: {
                Row: { user_id: string; friend_id: string; status: 'pending' | 'accepted'; created_at: string | null }
                Insert: { user_id: string; friend_id: string; status?: 'pending' | 'accepted' }
                Update: Partial<Database['public']['Tables']['friends']['Insert']>
                Relationships: []
            }
            title_videos: {
                Row: { id: number; title_id: number; youtube_key: string; name: string; video_type: 'trailer' | 'teaser' | 'clip' | 'behind_the_scenes' | 'featurette' | 'bloopers'; official: boolean; sort_order: number }
                Insert: { title_id: number; youtube_key: string; name: string; video_type: 'trailer' | 'teaser' | 'clip' | 'behind_the_scenes' | 'featurette' | 'bloopers'; official?: boolean; sort_order?: number }
                Update: Partial<Database['public']['Tables']['title_videos']['Insert']>
                Relationships: []
            }
            retcons: {
                Row: { id: number; source_title_id: number; affected_title_id: number; description: string; retcon_type: 'canon_change' | 'timeline_shift' | 'character_change'; created_at: string | null }
                Insert: { source_title_id: number; affected_title_id: number; description: string; retcon_type: 'canon_change' | 'timeline_shift' | 'character_change' }
                Update: Partial<Database['public']['Tables']['retcons']['Insert']>
                Relationships: []
            }
            context_summaries: {
                Row: { id: number; title_id: number; prerequisite_title_ids: unknown; summary_text: string; key_characters: unknown; key_events: unknown; spoiler_level: 'safe' | 'mild' | 'heavy' }
                Insert: { title_id: number; summary_text: string; prerequisite_title_ids?: unknown; key_characters?: unknown; key_events?: unknown; spoiler_level?: 'safe' | 'mild' | 'heavy' }
                Update: Partial<Database['public']['Tables']['context_summaries']['Insert']>
                Relationships: []
            }
            quiz_questions: {
                Row: { id: number; franchise_id: number; title_id: number | null; question: string; options: unknown; correct_index: number; difficulty: 'easy' | 'medium' | 'hard' }
                Insert: { franchise_id: number; question: string; options: unknown; correct_index: number; title_id?: number | null; difficulty?: 'easy' | 'medium' | 'hard' }
                Update: Partial<Database['public']['Tables']['quiz_questions']['Insert']>
                Relationships: []
            }
            quiz_scores: {
                Row: { id: number; user_id: string; quiz_id: string; score: number; max_score: number; completed_at: string | null }
                Insert: { user_id: string; quiz_id: string; score: number; max_score: number }
                Update: Partial<Database['public']['Tables']['quiz_scores']['Insert']>
                Relationships: []
            }
            ticket_providers: {
                Row: { id: number; code: string; name: string; logo_url: string | null; base_url: string | null; country_codes: string[] }
                Insert: { code: string; name: string; country_codes: string[]; logo_url?: string | null; base_url?: string | null }
                Update: Partial<Database['public']['Tables']['ticket_providers']['Insert']>
                Relationships: []
            }
            title_tickets: {
                Row: { id: number; title_id: number; provider_id: number; ticket_url: string; available_from: string | null; available_until: string | null }
                Insert: { title_id: number; provider_id: number; ticket_url: string; available_from?: string | null; available_until?: string | null }
                Update: Partial<Database['public']['Tables']['title_tickets']['Insert']>
                Relationships: []
            }
            notifications: {
                Row: { id: number; user_id: string; type: 'new_release' | 'ticket_available' | 'badge' | 'level_up' | 'friend' | 'quiz' | 'streak'; title: string; message: string | null; data: unknown; read: boolean; created_at: string }
                Insert: { user_id: string; type: 'new_release' | 'ticket_available' | 'badge' | 'level_up' | 'friend' | 'quiz' | 'streak'; title: string; message?: string | null; data?: unknown }
                Update: Partial<Database['public']['Tables']['notifications']['Insert']> & { read?: boolean }
                Relationships: []
            }
            upcoming_releases: {
                Row: { id: number; franchise_id: number; title_id: number; release_date: string; announced_at: string | null }
                Insert: { franchise_id: number; title_id: number; release_date: string }
                Update: Partial<Database['public']['Tables']['upcoming_releases']['Insert']>
                Relationships: []
            }
            app_config: {
                Row: { key: string; value: unknown; description: string | null; updated_at: string | null }
                Insert: { key: string; value: unknown; description?: string | null }
                Update: Partial<Database['public']['Tables']['app_config']['Insert']>
                Relationships: []
            }
            locations: {
                Row: { id: number; code: string; name: string; type: 'planet' | 'realm' | 'dimension' | 'construct' | 'region'; universe_code: string | null; description: string | null; color: string | null; position_x: number; position_y: number; position_z: number; radius: number; parent_code: string | null }
                Insert: { code: string; name: string; type: 'planet' | 'realm' | 'dimension' | 'construct' | 'region'; universe_code?: string | null; description?: string | null; color?: string | null; position_x?: number; position_y?: number; position_z?: number; radius?: number; parent_code?: string | null }
                Update: Partial<Database['public']['Tables']['locations']['Insert']>
                Relationships: []
            }
            title_locations: {
                Row: { title_id: number; location_code: string; is_primary: boolean }
                Insert: { title_id: number; location_code: string; is_primary?: boolean }
                Update: Partial<Database['public']['Tables']['title_locations']['Insert']>
                Relationships: []
            }
            universes: {
                Row: { id: number; code: string; name: string; designation: string | null; description: string | null; color: string | null; is_sacred: boolean; branch_from_code: string | null }
                Insert: { code: string; name: string; designation?: string | null; description?: string | null; color?: string | null; is_sacred?: boolean; branch_from_code?: string | null }
                Update: Partial<Database['public']['Tables']['universes']['Insert']>
                Relationships: []
            }
            timeline_branches: {
                Row: { id: number; event_name: string; source_title_id: number | null; chronology_point: number | null; branch_universe_code: string | null; description: string | null; is_nexus_event: boolean; is_pruned: boolean; color: string | null }
                Insert: { event_name: string; source_title_id?: number | null; chronology_point?: number | null; branch_universe_code?: string | null; description?: string | null; is_nexus_event?: boolean; is_pruned?: boolean; color?: string | null }
                Update: Partial<Database['public']['Tables']['timeline_branches']['Insert']>
                Relationships: []
            }
        }
        Views: {}
        Functions: {
            fn_recalc_xp: { Args: { uid: string }; Returns: void }
            fn_create_notification: { Args: { p_user_id: string; p_type: string; p_title: string; p_message?: string; p_data?: unknown }; Returns: number }
        }
        Enums: {}
    }
}
