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
        // '@nuxtjs/tailwindcss'
    ],

    // css: ['~/assets/css/main.css'],

    runtimeConfig: {
        supabase: {
            serviceKey: process.env.SUPABASE_SERVICE_KEY
        },
        public: {
            supabase: {
                url: process.env.SUPABASE_URL,
                key: process.env.SUPABASE_KEY
            }
        }
    },
    supabase: {
        redirect: false
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