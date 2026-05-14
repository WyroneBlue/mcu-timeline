<template>
    <div v-if="isLoading" class="text-center py-20">
        <p class="text-gray-400">Laden...</p>
    </div>
    <div v-else-if="isAuthenticated">
        <slot />
    </div>
    <div v-else class="text-center py-20">
        <p class="text-gray-400">{{ !user ? 'Niet ingelogd.' : 'Geen admin-rechten.' }}</p>
        <NuxtLink to="/admin" class="text-red-400 hover:text-red-300 mt-2 inline-block">
            Ga naar admin login
        </NuxtLink>
    </div>
</template>

<script setup lang="ts">
const user = useSupabaseUser()
const { isAuthenticated, isLoading, checkAdmin } = useAdmin()

onMounted(() => {
    checkAdmin()
})
</script>
