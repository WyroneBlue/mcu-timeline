export function useAdmin() {
    const adminKey = useState<string>('admin-key', () => '')
    const isAuthenticated = computed(() => adminKey.value.length > 0)

    function setKey(key: string) {
        adminKey.value = key
        if (import.meta.client) {
            sessionStorage.setItem('admin-key', key)
        }
    }

    function restoreKey() {
        if (import.meta.client) {
            adminKey.value = sessionStorage.getItem('admin-key') || ''
        }
    }

    async function adminFetch<T>(path: string, options: any = {}): Promise<T> {
        return $fetch<T>(path, {
            ...options,
            headers: {
                ...options.headers,
                Authorization: `Bearer ${adminKey.value}`,
            },
        })
    }

    return { adminKey, isAuthenticated, setKey, restoreKey, adminFetch }
}
