<template>
    <div>
        <Head>
            <Title>Canonkeeper — Keep the Canon</Title>
            <Meta name="description" content="Master every franchise. Track your watch journey through the MCU and beyond." />
            <Meta name="theme-color" :content="currentTheme.bgColor" />
            <Meta name="apple-mobile-web-app-capable" content="yes" />
            <Meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
            <Meta property="og:title" content="Canonkeeper — Keep the Canon" />
            <Meta property="og:description" content="Master every franchise. Track your watch journey through the MCU and beyond." />
            <Meta property="og:type" content="website" />
            <Link rel="apple-touch-icon" href="/apple-touch-icon.svg" />
        </Head>
        <NuxtRouteAnnouncer />
        <NuxtLayout>
            <NuxtPage />
        </NuxtLayout>
    </div>
</template>

<script setup lang="ts">
const { currentTheme } = useSettings()
useThemeVariables()
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
@import "tailwindcss";

@layer base {
    :root {
        --theme-bg: #050508;
        --theme-accent: #8B5CF6;
        --theme-particle: #ffffff;
        --theme-glow: #8B5CF6;
        --theme-nebula-1: #1a0533;
        --theme-nebula-2: #0a1628;

        --color-bg: var(--theme-bg);
        --color-bg-elevated: color-mix(in srgb, var(--theme-bg), white 6%);
        --color-bg-card: rgba(255, 255, 255, 0.03);
        --color-border: rgba(255, 255, 255, 0.08);
        --color-border-hover: rgba(255, 255, 255, 0.15);

        /* Phase accent colors */
        --phase-1-primary: #E53E3E;
        --phase-1-accent: #D69E2E;
        --phase-2-primary: #E53E3E;
        --phase-2-accent: #D69E2E;
        --phase-3-primary: #E53E3E;
        --phase-3-accent: #D69E2E;
        --phase-4-primary: #805AD5;
        --phase-4-accent: #B794F4;
        --phase-5-primary: #805AD5;
        --phase-5-accent: #B794F4;
        --phase-6-primary: #38B2AC;
        --phase-6-accent: #4299E1;

        /* Dynamic phase color (set via JS on scroll) */
        --phase-current-primary: var(--phase-1-primary);
        --phase-current-accent: var(--phase-1-accent);
    }

    html {
        font-family: "Inter", system-ui, sans-serif;
        background-color: var(--color-bg);
        color: #E2E8F0;
        scroll-behavior: smooth;
    }

    body {
        background-color: var(--color-bg);
        min-height: 100vh;
    }
}

@layer components {
    .font-display {
        font-family: "Space Grotesk", "Inter", system-ui, sans-serif;
    }

    .font-mono {
        font-family: "JetBrains Mono", monospace;
    }

    .glass-card {
        background: rgba(255, 255, 255, 0.03);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        transition: border-color 0.3s ease, background 0.3s ease;
    }

    .glass-card:hover {
        border-color: rgba(255, 255, 255, 0.15);
        background: rgba(255, 255, 255, 0.05);
    }

    .glass-card-accent {
        background: rgba(255, 255, 255, 0.03);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        border-left: 3px solid var(--phase-current-primary);
    }

    .cinematic-text {
        font-family: "Space Grotesk", system-ui, sans-serif;
        letter-spacing: 0.05em;
        text-shadow: 0 0 40px rgba(255, 255, 255, 0.1);
    }

    .phase-accent-text {
        color: var(--phase-current-primary);
    }

    .phase-accent-bg {
        background-color: var(--phase-current-primary);
    }

    .phase-accent-border {
        border-color: var(--phase-current-primary);
    }

    .phase-glow {
        box-shadow: 0 0 30px -5px var(--phase-current-primary);
    }

    /* Spoiler system */
    .spoiler-blur {
        filter: blur(8px);
        user-select: none;
        transition: filter 0.4s ease;
        position: relative;
    }

    .spoiler-blur::after {
        content: '';
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(10, 10, 15, 0.3);
        border-radius: inherit;
        cursor: pointer;
    }

    .spoiler-revealed {
        filter: blur(0);
    }

    /* Gradient overlays */
    .gradient-fade-bottom {
        background: linear-gradient(to bottom, transparent, var(--color-bg));
    }

    .gradient-fade-top {
        background: linear-gradient(to top, transparent, var(--color-bg));
    }

    /* Scrollbar styling */
    ::-webkit-scrollbar {
        width: 6px;
    }

    ::-webkit-scrollbar-track {
        background: transparent;
    }

    ::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.15);
        border-radius: 3px;
    }

    ::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.25);
    }
}

@layer utilities {
    .text-balance {
        text-wrap: balance;
    }
}
</style>
