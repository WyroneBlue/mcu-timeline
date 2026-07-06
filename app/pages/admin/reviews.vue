<template>
    <div>
        <NuxtLayout name="admin">
            <AdminAuthGuard>
                <div class="flex items-center justify-between mb-6">
                    <h1 class="text-2xl font-bold">Reviews</h1>
                </div>

                <div class="flex gap-2 mb-6">
                    <button v-for="tab in tabs" :key="tab.value" @click="setTab(tab.value)"
                        class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        :class="activeTab === tab.value ? 'bg-red-600 text-white' : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'">
                        {{ tab.label }}
                        <span v-if="counts[tab.value] !== undefined" class="ml-1 text-xs opacity-70">({{ counts[tab.value] }})</span>
                    </button>
                </div>

                <div v-if="loading" class="text-center py-12 text-gray-400">Laden...</div>

                <div v-else-if="items.length === 0" class="text-center py-12 text-gray-500">
                    Geen reviews gevonden.
                </div>

                <div v-else class="space-y-4">
                    <div v-for="item in items" :key="item.id"
                        class="p-5 rounded-xl bg-gray-900 border border-gray-800">
                        <div class="flex items-start justify-between gap-4">
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center gap-2 flex-wrap">
                                    <h3 class="font-semibold">{{ item.titles?.title || `Title #${item.title_id}` }}</h3>
                                    <span class="text-sm text-gray-400">— {{ item.profiles?.username || item.user_id }}</span>
                                    <span class="px-2 py-0.5 rounded text-xs" :class="statusClass(item.status)">
                                        {{ item.status }}
                                    </span>
                                    <span v-if="item.report_count > 0" class="px-2 py-0.5 rounded text-xs bg-orange-900/50 text-orange-300">
                                        {{ item.report_count }} report{{ item.report_count === 1 ? '' : 's' }}
                                    </span>
                                    <span class="text-xs text-gray-500">{{ item.locale }}</span>
                                </div>
                                <p class="text-sm text-gray-300 mt-2 whitespace-pre-line">{{ item.body }}</p>
                                <p v-if="item.moderation?.reason" class="text-xs text-gray-500 mt-2">
                                    Moderatie ({{ item.moderation.source }}): {{ item.moderation.reason }}
                                </p>
                                <p class="text-xs text-gray-600 mt-1">{{ new Date(item.created_at).toLocaleString() }}</p>
                            </div>
                            <div class="flex gap-2 ml-4 shrink-0">
                                <button v-if="item.status !== 'approved'" @click="setStatus(item.id, 'approved')"
                                    class="text-green-400 hover:text-green-300 text-sm">Approve</button>
                                <button v-if="item.status !== 'rejected'" @click="setStatus(item.id, 'rejected')"
                                    class="text-yellow-400 hover:text-yellow-300 text-sm">Reject</button>
                                <button @click="deleteItem(item.id)"
                                    class="text-red-400 hover:text-red-300 text-sm">Verwijder</button>
                            </div>
                        </div>
                    </div>
                </div>
            </AdminAuthGuard>
        </NuxtLayout>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

interface AdminReview {
    id: number
    user_id: string
    title_id: number
    body: string
    locale: string
    status: string
    moderation: { source?: string, reason?: string } | null
    report_count: number
    created_at: string
    titles: { title: string } | null
    profiles: { username: string | null } | null
}

const { adminFetch } = useAdmin()
const items = ref<AdminReview[]>([])
const loading = ref(false)
const activeTab = ref<string>('flagged')
const counts = reactive<Record<string, number>>({})

const tabs = [
    { value: 'flagged', label: 'Flagged' },
    { value: 'pending', label: 'Pending' },
    { value: 'all', label: 'All' },
]

function statusClass(status: string) {
    const classes: Record<string, string> = {
        approved: 'bg-green-900/50 text-green-300',
        pending: 'bg-amber-900/50 text-amber-300',
        flagged: 'bg-orange-900/50 text-orange-300',
        rejected: 'bg-red-900/50 text-red-300',
    }
    return classes[status] || 'bg-gray-800 text-gray-300'
}

async function load() {
    loading.value = true
    try {
        const query = activeTab.value === 'all' ? '' : `?status=${activeTab.value}`
        items.value = await adminFetch(`/api/admin/reviews${query}`)
        counts[activeTab.value] = items.value.length
    } finally {
        loading.value = false
    }
}

function setTab(tab: string) {
    activeTab.value = tab
    load()
}

async function setStatus(id: number, status: 'approved' | 'rejected') {
    await adminFetch(`/api/admin/reviews/${id}`, { method: 'PUT', body: { status } })
    await load()
}

async function deleteItem(id: number) {
    if (!confirm('Weet je zeker dat je deze review wilt verwijderen?')) return
    await adminFetch(`/api/admin/reviews/${id}`, { method: 'DELETE' })
    await load()
}

onMounted(load)
</script>
