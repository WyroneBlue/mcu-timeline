export default defineNuxtPlugin((nuxtApp) => {
    const i18n = nuxtApp.$i18n as { locale: { value: string } }
    const { settings } = useSettings()

    i18n.locale.value = settings.language

    watch(() => settings.language, (lang) => {
        if (i18n.locale.value !== lang) i18n.locale.value = lang
    })

    watch(() => i18n.locale.value, (loc) => {
        if (settings.language !== loc) settings.language = loc as typeof settings.language
    })
})
