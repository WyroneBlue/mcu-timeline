<template>
    <form @submit.prevent="$emit('submit')" class="space-y-4">
        <div v-for="field in fields" :key="field.key">
            <label class="block text-sm text-gray-400 mb-1">
                {{ field.label }}
                <span v-if="field.required" class="text-red-400">*</span>
            </label>

            <select v-if="field.type === 'select'" :value="modelValue[field.key]"
                @change="update(field.key, ($event.target as HTMLSelectElement).value)"
                class="w-full px-3 py-2 rounded-lg bg-gray-950 border border-gray-700 text-white text-sm focus:outline-none focus:border-red-500">
                <option value="" class="text-gray-500">Selecteer...</option>
                <option v-for="opt in field.options" :key="opt" :value="opt">{{ opt }}</option>
            </select>

            <textarea v-else-if="field.type === 'textarea'" :value="modelValue[field.key]"
                @input="update(field.key, ($event.target as HTMLTextAreaElement).value)" rows="3"
                class="w-full px-3 py-2 rounded-lg bg-gray-950 border border-gray-700 text-white text-sm focus:outline-none focus:border-red-500" />

            <textarea v-else-if="field.type === 'json'"
                :value="typeof modelValue[field.key] === 'string' ? modelValue[field.key] : JSON.stringify(modelValue[field.key], null, 2)"
                @input="updateJson(field.key, ($event.target as HTMLTextAreaElement).value)" rows="3"
                class="w-full px-3 py-2 rounded-lg bg-gray-950 border border-gray-700 text-white text-sm font-mono focus:outline-none focus:border-red-500" />

            <input v-else :type="field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'"
                :value="modelValue[field.key]"
                @input="update(field.key, ($event.target as HTMLInputElement).value, field.type === 'number')"
                class="w-full px-3 py-2 rounded-lg bg-gray-950 border border-gray-700 text-white text-sm focus:outline-none focus:border-red-500" />
        </div>

        <button type="submit" :disabled="loading"
            class="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            {{ loading ? 'Opslaan...' : 'Opslaan' }}
        </button>
    </form>
</template>

<script setup lang="ts">
interface Field {
    key: string
    label: string
    type: 'text' | 'number' | 'date' | 'textarea' | 'select' | 'json'
    required?: boolean
    options?: string[]
}

const props = defineProps<{
    modelValue: Record<string, any>
    fields: Field[]
    loading?: boolean
}>()

const emit = defineEmits<{
    'update:modelValue': [value: Record<string, any>]
    submit: []
}>()

function update(key: string, value: any, isNumber = false) {
    const val = isNumber && value !== '' ? Number(value) : value
    emit('update:modelValue', { ...props.modelValue, [key]: val })
}

function updateJson(key: string, raw: string) {
    try {
        const parsed = JSON.parse(raw)
        emit('update:modelValue', { ...props.modelValue, [key]: parsed })
    } catch {
        emit('update:modelValue', { ...props.modelValue, [key]: raw })
    }
}
</script>
