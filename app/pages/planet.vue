<script setup lang="ts">
// This page will be enhanced with TresJS/Three.js in the future
// For now, it shows a beautiful coming soon page
</script>
<template>
    <div
        class="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div class="max-w-4xl px-6 mx-auto space-y-8 text-center">
            <!-- Hero Section -->
            <div class="space-y-4">
                <div
                    class="flex items-center justify-center w-32 h-32 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse">
                    <!-- <UIcon name="i-heroicons-globe-alt" class="w-16 h-16 text-white" /> -->
                </div>
                <h1 class="text-4xl font-bold text-white md:text-6xl">MCU Planet View</h1>
                <p class="max-w-2xl mx-auto text-xl text-gray-300">
                    Interactieve 3D weergave van het Marvel Cinematic Universe
                </p>
            </div>

            <!-- Coming Soon Card -->
            <UCard class="max-w-2xl mx-auto glass-effect">
                <template #header>
                    <div class="text-center">
                        <UIcon name="i-heroicons-wrench-screwdriver" class="w-12 h-12 mx-auto mb-4 text-blue-500" />
                        <h2 class="text-2xl font-bold text-gray-900">3D View in Development</h2>
                    </div>
                </template>
                <div class="space-y-6">
                    <p class="text-center text-gray-600">
                        We're working on an amazing 3D interactive experience for exploring the MCU timeline.
                        This will include a planet view with orbiting titles, phase rings, and immersive navigation.
                    </p>

                    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div class="p-4 rounded-lg bg-blue-50">
                            <UIcon name="i-heroicons-cube" class="w-8 h-8 mb-2 text-blue-600" />
                            <h3 class="font-semibold text-gray-900">3D Visualization</h3>
                            <p class="text-sm text-gray-600">Interactive planet with orbiting MCU titles</p>
                        </div>
                        <div class="p-4 rounded-lg bg-purple-50">
                            <UIcon name="i-heroicons-sparkles" class="w-8 h-8 mb-2 text-purple-600" />
                            <h3 class="font-semibold text-gray-900">Phase Rings</h3>
                            <p class="text-sm text-gray-600">Visual representation of MCU phases</p>
                        </div>
                        <div class="p-4 rounded-lg bg-green-50">
                            <UIcon name="i-heroicons-cursor-arrow-rays" class="w-8 h-8 mb-2 text-green-600" />
                            <h3 class="font-semibold text-gray-900">Interactive</h3>
                            <p class="text-sm text-gray-600">Click and explore individual titles</p>
                        </div>
                        <div class="p-4 rounded-lg bg-orange-50">
                            <UIcon name="i-heroicons-device-phone-mobile" class="w-8 h-8 mb-2 text-orange-600" />
                            <h3 class="font-semibold text-gray-900">Mobile Ready</h3>
                            <p class="text-sm text-gray-600">Touch controls for mobile devices</p>
                        </div>
                    </div>

                    <div class="flex flex-col justify-center gap-4 sm:flex-row">
                        <UButton to="/timeline" color="primary" size="lg">
                            <UIcon name="i-heroicons-list-bullet" class="w-5 h-5 mr-2" />
                            Bekijk 2D Timeline
                        </UButton>
                        <UButton to="/" variant="outline" color="neutral" size="lg">
                            <UIcon name="i-heroicons-home" class="w-5 h-5 mr-2" />
                            Terug naar Home
                        </UButton>
                    </div>
                </div>
            </UCard>

            <!-- Features Preview -->
            <div class="grid grid-cols-1 gap-6 mt-12 md:grid-cols-3">
                <div class="space-y-3 text-center">
                    <div
                        class="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-cyan-500">
                        <!-- <UIcon name="i-heroicons-film" class="w-8 h-8 text-white" /> -->
                    </div>
                    <h3 class="text-lg font-semibold text-white">Films & Series</h3>
                    <p class="text-gray-300">Explore all MCU content in 3D space</p>
                </div>
                <div class="space-y-3 text-center">
                    <div
                        class="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
                        <!-- <UIcon name="i-heroicons-chart-bar" class="w-8 h-8 text-white" /> -->
                    </div>
                    <h3 class="text-lg font-semibold text-white">Progress Tracking</h3>
                    <p class="text-gray-300">Visual progress indicators in 3D</p>
                </div>
                <div class="space-y-3 text-center">
                    <div
                        class="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-green-500 to-teal-500">
                        <!-- <UIcon name="i-heroicons-users" class="w-8 h-8 text-white" /> -->
                    </div>
                    <h3 class="text-lg font-semibold text-white">Social Features</h3>
                    <p class="text-gray-300">See friends' progress in 3D space</p>
                </div>
            </div>
        </div>
    </div>
</template>
