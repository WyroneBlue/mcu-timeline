<template>
    <div>
        <NuxtLayout name="admin">
            <AdminAuthGuard>
                <div class="flex items-center justify-between mb-6">
                    <h1 class="text-2xl font-bold">Titles</h1>
                    <button @click="showForm = true"
                        class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors">
                        + Nieuwe title
                    </button>
                </div>

                <p v-if="loadError" class="text-red-400 mb-4">{{ loadError }}</p>

                <div v-if="items.length === 0 && !loadError" class="text-center py-12 text-gray-500">
                    Geen titles gevonden. Voeg een nieuwe title toe.
                </div>

                <div v-if="items.length > 0" class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="border-b border-gray-800 text-left text-gray-400">
                                <th class="pb-3 pr-4">Title</th>
                                <th class="pb-3 pr-4">Type</th>
                                <th class="pb-3 pr-4">Phase</th>
                                <th class="pb-3 pr-4">Canon</th>
                                <th class="pb-3 pr-4">Status</th>
                                <th class="pb-3">Acties</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in items" :key="item.id"
                                class="border-b border-gray-800/50 hover:bg-gray-900/50">
                                <td class="py-3 pr-4 font-medium">{{ item.title }}</td>
                                <td class="py-3 pr-4 text-gray-400">{{ item.type }}</td>
                                <td class="py-3 pr-4 text-gray-400">{{ item.phase }}</td>
                                <td class="py-3 pr-4 text-gray-400">{{ item.canon_level }}</td>
                                <td class="py-3 pr-4">
                                    <span class="px-2 py-0.5 rounded-full text-xs"
                                        :class="item.release_status === 'released' ? 'bg-green-900/50 text-green-400' : 'bg-yellow-900/50 text-yellow-400'">
                                        {{ item.release_status }}
                                    </span>
                                </td>
                                <td class="py-3">
                                    <button @click="editItem(item)"
                                        class="text-blue-400 hover:text-blue-300 mr-3">Bewerk</button>
                                    <button @click="deleteItem(item.id)"
                                        class="text-red-400 hover:text-red-300">Verwijder</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <AdminFormModal v-if="showForm" :title="editing ? 'Bewerk Title' : 'Nieuwe Title'" @close="closeForm">
                    <AdminJsonForm v-model="formData" :fields="fields" @submit="save" :loading="saving" />
                </AdminFormModal>
            </AdminAuthGuard>
        </NuxtLayout>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const { adminFetch } = useAdmin()
const items = ref<any[]>([])
const showForm = ref(false)
const editing = ref<number | null>(null)
const saving = ref(false)
const formData = ref<Record<string, any>>({})

const fields = [
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'slug', label: 'Slug', type: 'text', required: true },
    { key: 'type', label: 'Type', type: 'select', options: ['movie', 'series', 'special', 'short'], required: true },
    { key: 'phase', label: 'Phase', type: 'text' },
    { key: 'saga', label: 'Saga', type: 'text' },
    { key: 'release_date', label: 'Release Date', type: 'date' },
    { key: 'release_status', label: 'Status', type: 'select', options: ['released', 'upcoming', 'announced'], required: true },
    { key: 'canon_level', label: 'Canon Level', type: 'select', options: ['core', 'extended', 'adjacent', 'standalone'] },
    { key: 'chronology_index', label: 'Chronology Index', type: 'number' },
    { key: 'story_year', label: 'Story Year (bijv. "1942-1945")', type: 'text' },
    { key: 'story_order', label: 'Story Order', type: 'number' },
    { key: 'mcu_relevance_score', label: 'Relevance Score (1-10)', type: 'number' },
    { key: 'tmdb_id', label: 'TMDB ID', type: 'number' },
    { key: 'overview', label: 'Overview', type: 'textarea' },
    { key: 'poster_url', label: 'Poster URL', type: 'text' },
    { key: 'trailer_url', label: 'Trailer URL', type: 'text' },
    { key: 'streaming_platform', label: 'Streaming Platform', type: 'text' },
]

const loadError = ref('')

async function load() {
    loadError.value = ''
    try {
        items.value = await adminFetch('/api/admin/titles')
    } catch (e: any) {
        loadError.value = e?.data?.message || 'Kon data niet laden'
    }
}

function editItem(item: any) {
    editing.value = item.id
    formData.value = { ...item }
    showForm.value = true
}

function closeForm() {
    showForm.value = false
    editing.value = null
    formData.value = {}
}

async function save() {
    saving.value = true
    try {
        const body: Record<string, any> = {}
        for (const f of fields) {
            if (formData.value[f.key] !== undefined && formData.value[f.key] !== '') {
                body[f.key] = formData.value[f.key]
            }
        }
        if (editing.value) {
            await adminFetch(`/api/admin/titles/${editing.value}`, { method: 'PUT', body })
        } else {
            if (!body.franchise_id) {
                const titles = items.value
                if (titles.length > 0) body.franchise_id = titles[0].franchise_id
            }
            await adminFetch('/api/admin/titles', { method: 'POST', body })
        }
        closeForm()
        await load()
    } finally {
        saving.value = false
    }
}

async function deleteItem(id: number) {
    if (!confirm('Weet je zeker dat je deze title wilt verwijderen?')) return
    await adminFetch(`/api/admin/titles/${id}`, { method: 'DELETE' })
    await load()
}

onMounted(load)
</script>
