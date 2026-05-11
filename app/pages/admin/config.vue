<template>
    <div>
        <NuxtLayout name="admin">
            <AdminAuthGuard>
                <h1 class="text-2xl font-bold mb-6">App Config</h1>

                <div class="space-y-4">
                    <div v-for="item in items" :key="item.key"
                        class="p-5 rounded-xl bg-gray-900 border border-gray-800">
                        <div class="flex items-start justify-between">
                            <div class="flex-1 min-w-0">
                                <h3 class="font-semibold font-mono">{{ item.key }}</h3>
                                <p v-if="item.description" class="text-sm text-gray-400 mt-1">{{ item.description }}</p>
                            </div>
                            <div class="flex gap-2 ml-4 shrink-0">
                                <button @click="editItem(item)"
                                    class="text-blue-400 hover:text-blue-300 text-sm">Bewerk</button>
                                <button @click="deleteItem(item.key)"
                                    class="text-red-400 hover:text-red-300 text-sm">Verwijder</button>
                            </div>
                        </div>
                        <pre class="mt-3 p-3 rounded-lg bg-gray-950 text-xs text-gray-300 overflow-x-auto">{{ JSON.stringify(item.value, null, 2) }}</pre>
                    </div>
                </div>

                <div class="mt-6">
                    <button @click="showForm = true"
                        class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors">
                        + Nieuwe config
                    </button>
                </div>

                <AdminFormModal v-if="showForm" :title="editing ? `Bewerk: ${editingKey}` : 'Nieuwe Config'" @close="closeForm">
                    <form @submit.prevent="save" class="space-y-4">
                        <div>
                            <label class="block text-sm text-gray-400 mb-1">Key</label>
                            <input v-model="configKey" type="text" :disabled="!!editing"
                                class="w-full px-3 py-2 rounded-lg bg-gray-950 border border-gray-700 text-white text-sm focus:outline-none focus:border-red-500 disabled:opacity-50" />
                        </div>
                        <div>
                            <label class="block text-sm text-gray-400 mb-1">Description</label>
                            <input v-model="configDesc" type="text"
                                class="w-full px-3 py-2 rounded-lg bg-gray-950 border border-gray-700 text-white text-sm focus:outline-none focus:border-red-500" />
                        </div>
                        <div>
                            <label class="block text-sm text-gray-400 mb-1">Value (JSON)</label>
                            <textarea v-model="configValue" rows="8"
                                class="w-full px-3 py-2 rounded-lg bg-gray-950 border border-gray-700 text-white text-sm font-mono focus:outline-none focus:border-red-500" />
                        </div>
                        <p v-if="jsonError" class="text-red-400 text-sm">{{ jsonError }}</p>
                        <button type="submit" :disabled="saving"
                            class="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                            {{ saving ? 'Opslaan...' : 'Opslaan' }}
                        </button>
                    </form>
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
const editing = ref(false)
const editingKey = ref('')
const saving = ref(false)
const configKey = ref('')
const configDesc = ref('')
const configValue = ref('')
const jsonError = ref('')

async function load() {
    items.value = await adminFetch('/api/admin/config')
}

function editItem(item: any) {
    editing.value = true
    editingKey.value = item.key
    configKey.value = item.key
    configDesc.value = item.description || ''
    configValue.value = JSON.stringify(item.value, null, 2)
    showForm.value = true
}

function closeForm() {
    showForm.value = false
    editing.value = false
    editingKey.value = ''
    configKey.value = ''
    configDesc.value = ''
    configValue.value = ''
    jsonError.value = ''
}

async function save() {
    jsonError.value = ''
    let parsed: unknown
    try {
        parsed = JSON.parse(configValue.value)
    } catch {
        jsonError.value = 'Ongeldige JSON'
        return
    }

    saving.value = true
    try {
        await adminFetch(`/api/admin/config/${configKey.value}`, {
            method: 'PUT',
            body: { value: parsed, description: configDesc.value },
        })
        closeForm()
        await load()
    } finally {
        saving.value = false
    }
}

async function deleteItem(key: string) {
    if (!confirm(`Weet je zeker dat je "${key}" wilt verwijderen?`)) return
    await adminFetch(`/api/admin/config/${key}`, { method: 'DELETE' })
    await load()
}

onMounted(load)
</script>
