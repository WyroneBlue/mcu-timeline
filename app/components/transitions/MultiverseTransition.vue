<template>
    <Teleport to="body">
        <div
            v-if="activeTransition"
            class="fixed inset-0 z-[9999] pointer-events-none"
        >
            <ClientOnly>
                <TresCanvas
                    class="w-full h-full"
                    :clear-color="0x000000"
                    :alpha="true"
                    antialias
                >
                    <TresPerspectiveCamera :position="[0, 0, 5]" :fov="60" />
                    <component
                        :is="TransitionShader"
                        :type="activeTransition"
                        :progress="transitionProgress"
                    />
                </TresCanvas>
            </ClientOnly>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { useMultiverseTransitions } from '~/composables/useMultiverseTransitions'
import TransitionShader from './TransitionShader.vue'

const { activeTransition, transitionProgress } = useMultiverseTransitions()
</script>
