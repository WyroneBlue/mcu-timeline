<template>
    <div v-if="isAuthenticated">
        <slot />
    </div>
    <div v-else class="text-center py-20">
        <p class="text-gray-400">Niet ingelogd.</p>
        <NuxtLink to="/admin" class="text-red-400 hover:text-red-300 mt-2 inline-block">
            Ga naar login
        </NuxtLink>
    </div>
</template>

<script setup lang="ts">
const { isAuthenticated, restoreKey } = useAdmin()

onMounted(() => {
    restoreKey()
})
</script>
