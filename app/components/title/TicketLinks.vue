<template>
    <div v-if="filteredProviders.length > 0" class="glass-card p-5 space-y-3">
        <h3 class="font-display text-lg tracking-wider text-white flex items-center gap-2">
            <svg class="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
            </svg>
            TICKETS KOPEN
        </h3>
        <div class="flex flex-wrap gap-2">
            <a
                v-for="provider in filteredProviders"
                :key="provider.code"
                :href="provider.base_url"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white/50 hover:text-white hover:border-white/20 transition-colors"
            >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
                {{ provider.name }}
            </a>
        </div>
    </div>
</template>

<script setup lang="ts">
import ticketProvidersJson from '../../../data/ticket-providers-seed.json'

const props = defineProps<{
    countryCode?: string | null
}>()

const providers = ticketProvidersJson as { code: string; name: string; base_url: string; country_codes: string[] }[]

const detectedCountry = computed(() => {
    if (props.countryCode) return props.countryCode
    if (import.meta.client) {
        const lang = navigator.language || ''
        if (lang.includes('nl') || lang.includes('NL')) return 'NL'
        if (lang.includes('be') || lang.includes('BE')) return 'BE'
        if (lang.includes('de') || lang.includes('DE')) return 'DE'
        if (lang.includes('en-GB')) return 'GB'
        if (lang.includes('en')) return 'US'
        if (lang.includes('fr')) return 'FR'
    }
    return 'NL'
})

const filteredProviders = computed(() =>
    providers.filter(p => p.country_codes.includes(detectedCountry.value))
)
</script>
