const focusMode = ref(false)

export function useFocusMode() {
    function toggle() {
        focusMode.value = !focusMode.value
    }

    function exit() {
        focusMode.value = false
    }

    return {
        focusMode: readonly(focusMode),
        toggleFocusMode: toggle,
        exitFocusMode: exit,
    }
}
