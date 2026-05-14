import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    devtools: { enabled: true },

    modules: [
        '@nuxt/eslint',
        '@nuxt/image',
        '@nuxt/scripts',
        '@pinia/nuxt',
        '@nuxtjs/supabase',
        '@tresjs/nuxt',
        '@vite-pwa/nuxt',
        '@nuxtjs/i18n',
    ],

    i18n: {
        langDir: '../locales',
        locales: [
            { code: 'en', name: 'English', file: 'en.json' },
            { code: 'nl', name: 'Nederlands', file: 'nl.json' },
            { code: 'es', name: 'Español', file: 'es.json' },
            { code: 'pt', name: 'Português', file: 'pt.json' },
            { code: 'it', name: 'Italiano', file: 'it.json' },
            { code: 'tr', name: 'Türkçe', file: 'tr.json' },
            { code: 'ar', name: 'العربية', dir: 'rtl', file: 'ar.json' },
            { code: 'zh', name: '中文', file: 'zh.json' },
            { code: 'ja', name: '日本語', file: 'ja.json' },
        ],
        defaultLocale: 'en',
        strategy: 'no_prefix',
        detectBrowserLanguage: {
            useCookie: true,
            cookieKey: 'ck_locale',
            fallbackLocale: 'en',
        },
        vueI18n: './i18n.config.ts',
    },

    css: ['~/assets/css/main.css'],

    runtimeConfig: {
        tmdbApiKey: process.env.TMDB_API_KEY,
        anthropicApiKey: process.env.ANTHROPIC_API_KEY,
        supabase: {
            serviceKey: process.env.SUPABASE_SERVICE_KEY
        },
        public: {
            appName: 'Canonkeeper',
            supabase: {
                url: process.env.SUPABASE_URL,
                key: process.env.SUPABASE_KEY
            }
        }
    },

    ssr: false,

    supabase: {
        redirect: false,
        redirectOptions: {
            login: '/login',
            callback: '/confirm',
            exclude: ['/*'],
        }
    },

    pwa: {
        registerType: 'autoUpdate',
        manifest: {
            name: 'Canonkeeper — Keep the Canon',
            short_name: 'Canonkeeper',
            description: 'Master every franchise. Track your watch journey through the MCU and beyond.',
            theme_color: '#0A0E1A',
            background_color: '#0A0E1A',
            display: 'standalone',
            orientation: 'portrait',
            start_url: '/',
            icons: [
                { src: '/icon-192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
                { src: '/icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any' },
                { src: '/icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'maskable' },
            ],
        },
        workbox: {
            navigateFallback: '/',
            globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
        },
    },

    vite: {
        plugins: [
            tailwindcss(),
            tsconfigPaths()
        ]
    },

    tres: {
        devtools: true
    }
})