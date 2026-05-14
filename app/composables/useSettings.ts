export type AppTheme = 'default' | 'sacred-timeline' | 'quantum-realm' | 'dark-dimension' | 'asgard' | 'void'
export type ScrollBehavior = 'snap' | 'free'
export type AutoplayTrailers = 'off' | 'wifi' | 'always'
export type AppLocale = 'en' | 'nl' | 'es' | 'pt' | 'it' | 'tr' | 'ar' | 'zh' | 'ja'

export interface FavoriteCharacter {
    name: string
    slug: string
    startFromSlug?: string
}

const CHARACTERS: FavoriteCharacter[] = [
    { name: 'Iron Man', slug: 'iron-man', startFromSlug: 'iron-man' },
    { name: 'Captain America', slug: 'captain-america', startFromSlug: 'captain-america-the-first-avenger' },
    { name: 'Thor', slug: 'thor', startFromSlug: 'thor' },
    { name: 'Black Widow', slug: 'black-widow', startFromSlug: 'iron-man-2' },
    { name: 'Spider-Man', slug: 'spider-man', startFromSlug: 'spider-man-homecoming' },
    { name: 'Doctor Strange', slug: 'doctor-strange', startFromSlug: 'doctor-strange' },
    { name: 'Scarlet Witch', slug: 'scarlet-witch', startFromSlug: 'avengers-age-of-ultron' },
    { name: 'Black Panther', slug: 'black-panther', startFromSlug: 'black-panther' },
    { name: 'Guardians of the Galaxy', slug: 'guardians', startFromSlug: 'guardians-of-the-galaxy' },
    { name: 'Loki', slug: 'loki', startFromSlug: 'thor' },
    { name: 'Hulk', slug: 'hulk', startFromSlug: 'the-incredible-hulk' },
    { name: 'Hawkeye', slug: 'hawkeye', startFromSlug: 'thor' },
    { name: 'Ant-Man', slug: 'ant-man', startFromSlug: 'ant-man' },
    { name: 'Captain Marvel', slug: 'captain-marvel', startFromSlug: 'captain-marvel' },
    { name: 'Moon Knight', slug: 'moon-knight', startFromSlug: 'moon-knight' },
    { name: 'Ms. Marvel', slug: 'ms-marvel', startFromSlug: 'ms-marvel' },
    { name: 'Shang-Chi', slug: 'shang-chi', startFromSlug: 'shang-chi-and-the-legend-of-the-ten-rings' },
]

export interface AppSettings {
    scrollBehavior: ScrollBehavior
    scrollToNextEnabled: boolean
    theme: AppTheme
    favoriteCharacter: string | null
    reducedMotion: boolean
    showPhaseLabels: boolean
    cardSize: 'small' | 'medium' | 'large'
    autoplayTrailers: AutoplayTrailers
    particleDensity: 'low' | 'medium' | 'high'
    showEasterEggs: boolean
    language: AppLocale
    layoutDrift: boolean
    cameraAutoReset: boolean
}

const STORAGE_KEY = 'lorely:settings'

const defaults: AppSettings = {
    scrollBehavior: 'snap',
    scrollToNextEnabled: true,
    theme: 'default',
    favoriteCharacter: null,
    reducedMotion: false,
    showPhaseLabels: true,
    cardSize: 'medium',
    autoplayTrailers: 'off',
    particleDensity: 'medium',
    showEasterEggs: true,
    language: 'en',
    layoutDrift: false,
    cameraAutoReset: true,
}

function loadSettings(): AppSettings {
    if (typeof localStorage === 'undefined') return { ...defaults }
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) return { ...defaults, ...JSON.parse(raw) }
    } catch {}
    return { ...defaults }
}

function persist(settings: AppSettings) {
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    }
}

const state = reactive<AppSettings>(loadSettings())

watch(state, (s) => persist(s), { deep: true })

export const THEME_CONFIG: Record<AppTheme, {
    label: string
    descriptionKey: string
    bgColor: string
    accentColor: string
    particleColor: string
    glowColor: string
    nebulaColors: string[]
}> = {
    'default': {
        label: 'Deep Space',
        descriptionKey: 'themes.deepSpace',
        bgColor: '#050508',
        accentColor: '#8B5CF6',
        particleColor: '#ffffff',
        glowColor: '#8B5CF6',
        nebulaColors: ['#1a0533', '#0a1628'],
    },
    'sacred-timeline': {
        label: 'Sacred Timeline',
        descriptionKey: 'themes.sacredTimeline',
        bgColor: '#0a0804',
        accentColor: '#F5A623',
        particleColor: '#F5A623',
        glowColor: '#F59E0B',
        nebulaColors: ['#1a1005', '#0f0a02'],
    },
    'quantum-realm': {
        label: 'Quantum Realm',
        descriptionKey: 'themes.quantumRealm',
        bgColor: '#020208',
        accentColor: '#06B6D4',
        particleColor: '#22D3EE',
        glowColor: '#06B6D4',
        nebulaColors: ['#041525', '#0a0520'],
    },
    'dark-dimension': {
        label: 'Dark Dimension',
        descriptionKey: 'themes.darkDimension',
        bgColor: '#080205',
        accentColor: '#DC2626',
        particleColor: '#EF4444',
        glowColor: '#7C3AED',
        nebulaColors: ['#1a0510', '#0d0320'],
    },
    'asgard': {
        label: 'Asgard',
        descriptionKey: 'themes.asgard',
        bgColor: '#050508',
        accentColor: '#EAB308',
        particleColor: '#FDE047',
        glowColor: '#EAB308',
        nebulaColors: ['#0f1528', '#151005'],
    },
    'void': {
        label: 'The Void',
        descriptionKey: 'themes.theVoid',
        bgColor: '#020504',
        accentColor: '#22C55E',
        particleColor: '#4ADE80',
        glowColor: '#16A34A',
        nebulaColors: ['#021a0a', '#0a1505'],
    },
}

export function useSettings() {
    return {
        settings: state,
        themes: THEME_CONFIG,
        characters: CHARACTERS,

        currentTheme: computed(() => THEME_CONFIG[state.theme]),

        setSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
            state[key] = value
        },

        resetSettings() {
            Object.assign(state, { ...defaults })
        },

        getFavoriteCharacter() {
            return CHARACTERS.find(c => c.slug === state.favoriteCharacter) ?? null
        },
    }
}

export function useThemeVariables() {
    if (import.meta.server) return

    watchEffect(() => {
        const theme = THEME_CONFIG[state.theme]
        const root = document.documentElement.style
        root.setProperty('--theme-bg', theme.bgColor)
        root.setProperty('--theme-accent', theme.accentColor)
        root.setProperty('--theme-particle', theme.particleColor)
        root.setProperty('--theme-glow', theme.glowColor)
        root.setProperty('--theme-nebula-1', theme.nebulaColors[0])
        root.setProperty('--theme-nebula-2', theme.nebulaColors[1])
    })
}
