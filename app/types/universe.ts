// Curated universe layouts. The original 25 included many variants of the
// same shape or layouts that scrambled chronology (i % n interleaving); the
// nine below each earn their place visually and keep the timeline readable.
export type UniverseLayout =
    | 'phase'
    | 'galaxy'
    | 'spiral'
    | 'helix'
    | 'grid'
    | 'sphere'
    | 'ring'
    | 'zigzag'
    | 'vortex'

export const UNIVERSE_LAYOUTS: UniverseLayout[] = [
    'phase', 'galaxy', 'spiral', 'helix', 'grid', 'sphere', 'ring', 'zigzag', 'vortex',
]
