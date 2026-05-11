<template>
    <div>
        <NuxtLayout name="admin">
            <AdminAuthGuard>
                <div class="flex items-center justify-between mb-6">
                    <h1 class="text-2xl font-bold">Quiz Vragen</h1>
                    <button @click="showForm = true"
                        class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors">
                        + Nieuwe vraag
                    </button>
                </div>

                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="border-b border-gray-800 text-left text-gray-400">
                                <th class="pb-3 pr-4">Vraag</th>
                                <th class="pb-3 pr-4">Title</th>
                                <th class="pb-3 pr-4">Moeilijkheid</th>
                                <th class="pb-3">Acties</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in items" :key="item.id"
                                class="border-b border-gray-800/50 hover:bg-gray-900/50">
                                <td class="py-3 pr-4 font-medium max-w-md truncate">{{ item.question }}</td>
                                <td class="py-3 pr-4 text-gray-400">{{ item.titles?.title || '-' }}</td>
                                <td class="py-3 pr-4">
                                    <span class="px-2 py-0.5 rounded-full text-xs"
                                        :class="{
                                            'bg-green-900/50 text-green-400': item.difficulty === 'easy',
                                            'bg-yellow-900/50 text-yellow-400': item.difficulty === 'medium',
                                            'bg-red-900/50 text-red-400': item.difficulty === 'hard'
                                        }">
                                        {{ item.difficulty }}
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

                <AdminFormModal v-if="showForm" :title="editing ? 'Bewerk Vraag' : 'Nieuwe Vraag'" @close="closeForm">
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
    { key: 'question', label: 'Vraag', type: 'textarea', required: true },
    { key: 'options', label: 'Opties (JSON array)', type: 'json', required: true },
    { key: 'correct_index', label: 'Correct Index (0-based)', type: 'number', required: true },
    { key: 'difficulty', label: 'Moeilijkheid', type: 'select', options: ['easy', 'medium', 'hard'], required: true },
    { key: 'title_id', label: 'Title ID', type: 'number' },
    { key: 'franchise_id', label: 'Franchise ID', type: 'number', required: true },
]

async function load() {
    items.value = await adminFetch('/api/admin/quizzes')
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
            await adminFetch(`/api/admin/quizzes/${editing.value}`, { method: 'PUT', body })
        } else {
            await adminFetch('/api/admin/quizzes', { method: 'POST', body })
        }
        closeForm()
        await load()
    } finally {
        saving.value = false
    }
}

async function deleteItem(id: number) {
    if (!confirm('Weet je zeker dat je deze vraag wilt verwijderen?')) return
    await adminFetch(`/api/admin/quizzes/${id}`, { method: 'DELETE' })
    await load()
}

onMounted(load)
</script>
