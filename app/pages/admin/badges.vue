<template>
    <div>
        <NuxtLayout name="admin">
            <AdminAuthGuard>
                <div class="flex items-center justify-between mb-6">
                    <h1 class="text-2xl font-bold">Badges</h1>
                    <button @click="showForm = true"
                        class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors">
                        + Nieuwe badge
                    </button>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div v-for="item in items" :key="item.id"
                        class="p-5 rounded-xl bg-gray-900 border border-gray-800">
                        <div class="flex items-start justify-between">
                            <div>
                                <span class="text-2xl">{{ item.icon }}</span>
                                <h3 class="font-semibold mt-2">{{ item.name }}</h3>
                                <p class="text-sm text-gray-400 mt-1">{{ item.description }}</p>
                                <p class="text-xs text-gray-600 mt-2 font-mono">{{ item.code }}</p>
                            </div>
                            <div class="flex gap-2">
                                <button @click="editItem(item)"
                                    class="text-blue-400 hover:text-blue-300 text-sm">Bewerk</button>
                                <button @click="deleteItem(item.id)"
                                    class="text-red-400 hover:text-red-300 text-sm">X</button>
                            </div>
                        </div>
                    </div>
                </div>

                <AdminFormModal v-if="showForm" :title="editing ? 'Bewerk Badge' : 'Nieuwe Badge'" @close="closeForm">
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
    { key: 'description', label: 'Beschrijving', type: 'textarea' },
    { key: 'icon', label: 'Icon (emoji)', type: 'text' },
]

async function load() {
    items.value = await adminFetch('/api/admin/badges')
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
            await adminFetch(`/api/admin/badges/${editing.value}`, { method: 'PUT', body })
        } else {
            await adminFetch('/api/admin/badges', { method: 'POST', body })
        }
        closeForm()
        await load()
    } finally {
        saving.value = false
    }
}

async function deleteItem(id: number) {
    if (!confirm('Weet je zeker dat je deze badge wilt verwijderen?')) return
    await adminFetch(`/api/admin/badges/${id}`, { method: 'DELETE' })
    await load()
}

onMounted(load)
</script>
