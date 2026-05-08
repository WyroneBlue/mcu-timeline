<template>
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <UContainer class="max-w-md">
            <UCard class="card-hover">
                <template #header>
                    <div class="text-center space-y-2">
                        <div
                            class="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto">
                            <span class="text-white font-bold text-2xl">M</span>
                        </div>
                        <h1 class="text-2xl font-bold text-gray-900">Welkom bij MarvelPath</h1>
                        <p class="text-gray-600">Meld je aan om je MCU-reis te beginnen</p>
                    </div>
                </template>

                <div class="space-y-6">
                    <div class="space-y-4">
                        <UButton color="neutral" variant="outline" size="lg" class="w-full" :loading="isLoading"
                            @click="oauth('google')">
                            <UIcon name="i-heroicons-arrow-right-on-rectangle" class="w-5 h-5 mr-2" />
                            Inloggen met Google
                        </UButton>

                        <UButton color="neutral" variant="outline" size="lg" class="w-full" :loading="isLoading"
                            @click="oauth('github')">
                            <UIcon name="i-heroicons-code-bracket" class="w-5 h-5 mr-2" />
                            Inloggen met GitHub
                        </UButton>
                    </div>

                    <div class="text-center">
                        <UButton variant="ghost" color="neutral" size="sm" @click="signOut">
                            <UIcon name="i-heroicons-arrow-right-on-rectangle" class="w-4 h-4 mr-2" />
                            Uitloggen
                        </UButton>
                    </div>

                    <div class="text-center text-sm text-gray-500">
                        Door in te loggen ga je akkoord met onze
                        <UButton variant="link" color="primary" size="sm">voorwaarden</UButton>
                    </div>
                </div>
            </UCard>
        </UContainer>
    </div>
</template>

<script setup lang="ts">
import type { Provider } from '@supabase/supabase-js'

const client = useSupabaseClient()
const isLoading = ref(false)

async function oauth(provider: Provider) {
    isLoading.value = true
    try {
        await client.auth.signInWithOAuth({
            provider,
            options: { redirectTo: window.location.origin }
        })
    } catch (error) {
        console.error('OAuth error:', error)
    } finally {
        isLoading.value = false
    }
}

async function signOut() {
    try {
        await client.auth.signOut()
    } catch (error) {
        console.error('Sign out error:', error)
    }
}
</script>