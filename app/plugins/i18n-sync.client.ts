import type { LocaleObject } from '@nuxtjs/i18n'

export default defineNuxtPlugin(async (nuxtApp) => {
    const i18n = nuxtApp.$i18n as {
        locale: { value: string }
        locales: { value: LocaleObject[] }
        setLocale: (locale: string) => Promise<void>
    }
    const { settings } = useSettings()

    // Keep <html lang/dir> in sync with the active locale. With strategy
    // 'no_prefix' and the locale applied client-side (below), Nuxt i18n's head
    // handling doesn't update these, so RTL locales (ar) wouldn't flip direction.
    const applyHtmlAttrs = (loc: string) => {
        const meta = i18n.locales.value.find(l => l.code === loc)
        document.documentElement.lang = loc
        document.documentElement.dir = meta?.dir ?? 'ltr'
    }

    // settings.language (localStorage) is the single source of truth. Apply it
    // on boot via setLocale so the lazy-loaded message bundle for that locale is
    // actually fetched and merged — a raw locale.value assignment switches the
    // active locale without loading its messages, leaving keys falling back to
    // English. We always call setLocale (no equality guard) because the active
    // locale can already match the target while its bundle is still unloaded.
    await i18n.setLocale(settings.language)
    applyHtmlAttrs(settings.language)

    watch(() => settings.language, (lang) => {
        if (i18n.locale.value !== lang) i18n.setLocale(lang)
    })

    watch(() => i18n.locale.value, (loc) => {
        if (settings.language !== loc) settings.language = loc as typeof settings.language
        applyHtmlAttrs(loc)
    })
})
