// Banned-word matching for review moderation.
// Words are matched on normalized text (lowercase, diacritics stripped) with
// word boundaries, so substrings inside legitimate words don't trigger
// (no Scunthorpe problem).

const BANNED_WORDS_EN = [
    'asshole',
    'bastard',
    'bitch',
    'chink',
    'cocksucker',
    'cunt',
    'dickhead',
    'faggot',
    'fag',
    'fuck',
    'fucker',
    'fucking',
    'kike',
    'motherfucker',
    'nigger',
    'nigga',
    'paki',
    'retard',
    'retarded',
    'shit',
    'shithead',
    'slut',
    'spic',
    'tranny',
    'twat',
    'wanker',
    'whore',
]

const BANNED_WORDS_NL = [
    'flikker',
    'godverdomme',
    'hoer',
    'kanker',
    'kankerlijer',
    'klootzak',
    'kut',
    'lul',
    'mongool',
    'neuk',
    'neuken',
    'teringlijer',
    'tyfuslijer',
]

export function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
}

const BANNED_WORDS = [...BANNED_WORDS_EN, ...BANNED_WORDS_NL]

const BANNED_PATTERNS: RegExp[] = BANNED_WORDS.map((word) => {
    const escaped = normalizeText(word).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    // \b is ASCII-only; use letter/digit lookaround so accented neighbours also count as word chars
    return new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, 'iu')
})

/** Returns the first banned word found (word-boundary match on normalized text), or null. */
export function findBannedWord(text: string): string | null {
    const normalized = normalizeText(text)
    for (let i = 0; i < BANNED_PATTERNS.length; i++) {
        if (BANNED_PATTERNS[i]!.test(normalized)) {
            return BANNED_WORDS[i]!
        }
    }
    return null
}
