/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./components/**/*.{js,vue,ts}",
        "./layouts/**/*.vue",
        "./pages/**/*.vue",
        "./plugins/**/*.{js,ts}",
        "./app.vue",
        "./error.vue",
        "./app/**/*.{js,vue,ts}"
    ],
    theme: {
        extend: {
            colors: {
                ck: {
                    bg: '#0A0E1A',
                    elevated: '#141825',
                    surface: '#1C2030',
                    card: 'rgba(255, 255, 255, 0.03)',
                    border: 'rgba(255, 255, 255, 0.08)',
                    primary: '#F5A623',
                    'primary-hover': '#FFB840',
                    secondary: '#8B5CF6',
                    'text-primary': '#F0EDE6',
                    'text-secondary': '#8A8F9E',
                    success: '#34D399',
                    danger: '#EF4444',
                },
                franchise: {
                    mcu: '#F5A623',
                    'star-wars': '#60A5FA',
                    'harry-potter': '#7C3AED',
                    'fast-furious': '#22C55E',
                },
                phase: {
                    'infinity': '#E53E3E',
                    'infinity-accent': '#D69E2E',
                    'multiverse': '#805AD5',
                    'multiverse-accent': '#B794F4',
                    'secret-wars': '#38B2AC',
                    'secret-wars-accent': '#4299E1',
                },
                canon: {
                    core: '#48BB78',
                    extended: '#4299E1',
                    adjacent: '#ED8936',
                    standalone: '#A0AEC0',
                },
                status: {
                    watched: '#34D399',
                    watching: '#3B82F6',
                    queued: '#8A8F9E',
                    skipped: '#ED8936',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                display: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out forwards',
                'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
                'slide-in-right': 'slideInRight 0.5s ease-out forwards',
                'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                fadeInUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                slideInRight: {
                    '0%': { transform: 'translateX(30px)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' },
                },
                pulseGlow: {
                    '0%, 100%': { boxShadow: '0 0 20px -5px var(--phase-current-primary)' },
                    '50%': { boxShadow: '0 0 40px -5px var(--phase-current-primary)' },
                },
            },
            backdropBlur: {
                xs: '2px',
            },
        },
    },
    plugins: [],
}
