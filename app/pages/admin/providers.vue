<template>
    <div>
        <NuxtLayout name="admin">
            <AdminAuthGuard>
                <div class="flex items-center justify-between mb-6">
                    <h1 class="text-2xl font-bold">Ticket Providers</h1>
                    <button @click="showForm = true"
                        class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors">
                        + Nieuwe provider
                    </button>
                </div>

                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="border-b border-gray-800 text-left text-gray-400">
                                <th class="pb-3 pr-4">Naam</th>
                                <th class="pb-3 pr-4">Code</th>
                                <th class="pb-3 pr-4">URL</th>
                                <th class="pb-3 pr-4">Landen</th>
                                <th class="pb-3">Acties</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in items" :key="item.id"
                                class="border-b border-gray-800/50 hover:bg-gray-900/50">
                                <td class="py-3 pr-4 font-medium">{{ item.name }}</td>
                                <td class="py-3 pr-4 text-gray-400 font-mono text-xs">{{ item.code }}</td>
                                <td class="py-3 pr-4 text-gray-400 text-xs truncate max-w-xs">{{ item.base_url }}</td>
                                <td class="py-3 pr-4">
                                    <span v-for="c in item.country_codes" :key="c"
                                        class="inline-block px-1.5 py-0.5 rounded text-xs bg-gray-800 text-gray-300 mr-1">
                                        {{ c }}
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

                <AdminFormModal v-if="showForm" :title="editing ? 'Bewerk Provider' : 'Nieuwe Provider'" @close="closeForm">
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
    { key: 'code', label: 'Code', type: 'text', required: true },
    { key: 'name', label: 'Naam', type: 'text', required: true },
    { key: 'base_url', label: 'Base URL', type: 'text' },
    { key: 'logo_url', label: 'Logo URL', type: 'text' },
    { key: 'country_codes', label: 'Landen (JSON array)', type: 'json', required: true },
]

async function load() {
    items.value = await adminFetch('/api/admin/providers')
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
            if (formData.value[f.key] !== undefined) body[f.key] = formData.value[f.key]
        }
        if (editing.value) {
            await adminFetch(`/api/admin/providers/${editing.value}`, { method: 'PUT', body })
        } else {
            await adminFetch('/api/admin/providers', { method: 'POST', body })
        }
        closeForm()
        await load()
    } finally {
        saving.value = false
    }
}

async function deleteItem(id: number) {
    if (!confirm('Weet je zeker dat je deze provider wilt verwijderen?')) return
    await adminFetch(`/api/admin/providers/${id}`, { method: 'DELETE' })
    await load()
}

onMounted(load)
</script>
