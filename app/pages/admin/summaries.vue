<template>
    <div>
        <NuxtLayout name="admin">
            <AdminAuthGuard>
                <div class="flex items-center justify-between mb-6">
                    <h1 class="text-2xl font-bold">Context Summaries</h1>
                    <button @click="showForm = true"
                        class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors">
                        + Nieuwe summary
                    </button>
                </div>

                <div class="space-y-4">
                    <div v-for="item in items" :key="item.id"
                        class="p-5 rounded-xl bg-gray-900 border border-gray-800">
                        <div class="flex items-start justify-between">
                            <div class="flex-1 min-w-0">
                                <h3 class="font-semibold">{{ item.titles?.title || `Title #${item.title_id}` }}</h3>
                                <p class="text-sm text-gray-400 mt-2 line-clamp-2">{{ item.summary_text }}</p>
                                <div class="flex gap-2 mt-3 flex-wrap">
                                    <span v-for="char in (item.key_characters || []).slice(0, 4)" :key="char"
                                        class="px-2 py-0.5 rounded text-xs bg-gray-800 text-gray-300">
                                        {{ char }}
                                    </span>
                                </div>
                            </div>
                            <div class="flex gap-2 ml-4 shrink-0">
                                <button @click="editItem(item)"
                                    class="text-blue-400 hover:text-blue-300 text-sm">Bewerk</button>
                                <button @click="deleteItem(item.id)"
                                    class="text-red-400 hover:text-red-300 text-sm">Verwijder</button>
                            </div>
                        </div>
                    </div>
                </div>

                <AdminFormModal v-if="showForm" :title="editing ? 'Bewerk Summary' : 'Nieuwe Summary'" @close="closeForm">
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
    { key: 'title_id', label: 'Title ID', type: 'number', required: true },
    { key: 'summary_text', label: 'Samenvatting', type: 'textarea', required: true },
    { key: 'prerequisite_title_ids', label: 'Prerequisite IDs (JSON array)', type: 'json' },
    { key: 'key_characters', label: 'Key Characters (JSON array)', type: 'json' },
    { key: 'key_events', label: 'Key Events (JSON array)', type: 'json' },
    { key: 'spoiler_level', label: 'Spoiler Level', type: 'select', options: ['safe', 'mild', 'heavy'] },
]

async function load() {
    items.value = await adminFetch('/api/admin/summaries')
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
        const body = { ...formData.value }
        delete body.titles
        if (editing.value) {
            await adminFetch(`/api/admin/summaries/${editing.value}`, { method: 'PUT', body })
        } else {
            await adminFetch('/api/admin/summaries', { method: 'POST', body })
        }
        closeForm()
        await load()
    } finally {
        saving.value = false
    }
}

async function deleteItem(id: number) {
    if (!confirm('Weet je zeker dat je deze summary wilt verwijderen?')) return
    await adminFetch(`/api/admin/summaries/${id}`, { method: 'DELETE' })
    await load()
}

onMounted(load)
</script>
