<template>
    <div class="min-h-screen flex items-center justify-center px-6">
        <div class="w-full max-w-sm space-y-8">
            <!-- Logo -->
            <div class="text-center">
                <img src="~/assets/logo/ck-shield.svg" alt="Canonkeeper" class="w-14 h-14 mx-auto mb-3" />
                <div class="font-display text-3xl font-bold tracking-wide text-white mb-2">CANONKEEPER</div>
                <p class="text-white/30 text-sm">Keep the canon. Meld je aan om te beginnen.</p>
            </div>

            <!-- OAuth buttons -->
            <div class="space-y-3">
                <button
                    class="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium hover:bg-white/10 transition-colors disabled:opacity-50"
                    :disabled="isLoading"
                    @click="oauth('google')"
                >
                    <svg class="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" opacity=".6" />
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" opacity=".6" />
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" opacity=".6" />
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" opacity=".6" />
                    </svg>
                    Inloggen met Google
                </button>

                <button
                    class="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium hover:bg-white/10 transition-colors disabled:opacity-50"
                    :disabled="isLoading"
                    @click="oauth('github')"
                >
                    <svg class="w-5 h-5 text-white/60" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    Inloggen met GitHub
                </button>
            </div>

            <!-- Divider -->
            <div class="flex items-center gap-4">
                <div class="flex-1 h-px bg-white/5" />
                <span class="text-xs text-white/20">of</span>
                <div class="flex-1 h-px bg-white/5" />
            </div>

            <!-- Email form -->
            <form class="space-y-4" @submit.prevent="emailSignIn">
                <div>
                    <input
                        v-model="email"
                        type="email"
                        placeholder="E-mailadres"
                        required
                        class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/20 transition-colors"
                    />
                </div>
                <div>
                    <input
                        v-model="password"
                        type="password"
                        placeholder="Wachtwoord"
                        required
                        class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/20 transition-colors"
                    />
                </div>
                <button
                    type="submit"
                    class="w-full px-6 py-3 rounded-xl bg-white/10 border border-white/10 text-white text-sm font-medium hover:bg-white/15 transition-colors disabled:opacity-50"
                    :disabled="isLoading"
                >
                    {{ isSignUp ? 'Account aanmaken' : 'Inloggen' }}
                </button>
            </form>

            <!-- Toggle sign up / sign in -->
            <div class="text-center text-sm">
                <button
                    class="text-white/30 hover:text-white/50 transition-colors"
                    @click="isSignUp = !isSignUp"
                >
                    {{ isSignUp ? 'Heb je al een account? Inloggen' : 'Nog geen account? Registreren' }}
                </button>
            </div>

            <!-- Error -->
            <p v-if="errorMsg" class="text-center text-xs text-red-400/80">{{ errorMsg }}</p>

            <!-- Back -->
            <div class="text-center">
                <NuxtLink to="/" class="text-xs text-white/20 hover:text-white/40 transition-colors">
                    Terug naar home
                </NuxtLink>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false, ssr: false })

import type { Provider } from '@supabase/supabase-js'

const client = useSupabaseClient()
const isLoading = ref(false)
const isSignUp = ref(false)
const email = ref('')
const password = ref('')
const errorMsg = ref('')

async function oauth(provider: Provider) {
    isLoading.value = true
    errorMsg.value = ''
    try {
        const { error } = await client.auth.signInWithOAuth({
            provider,
            options: { redirectTo: window.location.origin + '/timeline' },
        })
        if (error) throw error
    } catch (e: any) {
        errorMsg.value = e.message || 'OAuth fout'
    } finally {
        isLoading.value = false
    }
}

async function emailSignIn() {
    isLoading.value = true
    errorMsg.value = ''
    try {
        if (isSignUp.value) {
            const { error } = await client.auth.signUp({
                email: email.value,
                password: password.value,
            })
            if (error) throw error
            errorMsg.value = ''
            navigateTo('/onboarding')
        } else {
            const { error } = await client.auth.signInWithPassword({
                email: email.value,
                password: password.value,
            })
            if (error) throw error
            navigateTo('/timeline')
        }
    } catch (e: any) {
        errorMsg.value = e.message || 'Inloggen mislukt'
    } finally {
        isLoading.value = false
    }
}
</script>
