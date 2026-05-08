<template>
    <div>
        <NuxtRouteAnnouncer />
        <NuxtLayout>
            <NuxtPage />
        </NuxtLayout>
    </div>
</template>

<style>
@import "tailwindcss";

@layer base {
    html {
        font-family: "Inter", system-ui, sans-serif;
    }

    body {
        @apply bg-gray-50 text-gray-900;
    }
}

@layer components {
    .gradient-bg {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .card-hover {
        @apply transition-all duration-200 hover:shadow-lg hover:-translate-y-1;
    }

    .btn-primary {
        @apply bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200;
    }

    .btn-secondary {
        @apply bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium px-4 py-2 rounded-lg transition-colors duration-200;
    }

    .glass-effect {
        @apply bg-white/80 backdrop-blur-sm border border-white/20;
    }
}
</style>
