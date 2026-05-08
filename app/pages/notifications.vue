<template>
    <div class="max-w-4xl mx-auto space-y-6">
        <div class="text-center space-y-4">
            <h1 class="text-3xl font-bold text-gray-900">Notificaties</h1>
            <p class="text-gray-600">Beheer je notificatievoorkeuren</p>
        </div>

        <!-- Notification Settings -->
        <UCard class="card-hover">
            <template #header>
                <h2 class="text-xl font-semibold">Instellingen</h2>
            </template>
            <div class="space-y-6">
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="font-medium text-gray-900">Push Notificaties</h3>
                        <p class="text-sm text-gray-600">Ontvang meldingen over nieuwe content en updates</p>
                    </div>
                    <UToggle v-model="settings.pushNotifications" />
                </div>

                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="font-medium text-gray-900">Email Notificaties</h3>
                        <p class="text-sm text-gray-600">Wekelijkse samenvattingen en belangrijke updates</p>
                    </div>
                    <UToggle v-model="settings.emailNotifications" />
                </div>

                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="font-medium text-gray-900">Quiz Herinneringen</h3>
                        <p class="text-sm text-gray-600">Herinneringen om deel te nemen aan wekelijkse quizzen</p>
                    </div>
                    <UToggle v-model="settings.quizReminders" />
                </div>

                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="font-medium text-gray-900">Vrienden Activiteit</h3>
                        <p class="text-sm text-gray-600">Updates over wat je vrienden bekijken</p>
                    </div>
                    <UToggle v-model="settings.friendActivity" />
                </div>
            </div>
        </UCard>

        <!-- Recent Notifications -->
        <UCard class="card-hover">
            <template #header>
                <div class="flex items-center justify-between">
                    <h2 class="text-xl font-semibold">Recente Notificaties</h2>
                    <UButton variant="ghost" color="neutral" size="sm" @click="markAllAsRead">
                        <UIcon name="i-heroicons-check" class="w-4 h-4 mr-2" />
                        Alles als gelezen markeren
                    </UButton>
                </div>
            </template>
            <div class="space-y-3">
                <div v-if="notifications.length === 0" class="text-center py-8">
                    <UIcon name="i-heroicons-bell" class="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">Geen notificaties</h3>
                    <p class="text-gray-600">Je hebt nog geen notificaties ontvangen.</p>
                </div>
                <div v-else class="space-y-3">
                    <div v-for="notification in notifications" :key="notification.id" :class="[
                        'p-4 rounded-lg border transition-colors',
                        notification.read ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'
                    ]">
                        <div class="flex items-start space-x-3">
                            <div class="flex-shrink-0">
                                <UIcon :name="getNotificationIcon(notification.type)" :class="[
                                    'w-5 h-5',
                                    notification.read ? 'text-gray-400' : 'text-blue-600'
                                ]" />
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="font-medium text-gray-900">{{ notification.title }}</p>
                                <p class="text-sm text-gray-600 mt-1">{{ notification.message }}</p>
                                <p class="text-xs text-gray-500 mt-2">{{ formatDate(notification.created_at) }}</p>
                            </div>
                            <div class="flex-shrink-0">
                                <UButton v-if="!notification.read" @click="markAsRead(notification.id)" variant="ghost"
                                    color="neutral" size="sm">
                                    <UIcon name="i-heroicons-check" class="w-4 h-4" />
                                </UButton>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </UCard>

        <!-- Test Notifications -->
        <UCard class="card-hover">
            <template #header>
                <h2 class="text-xl font-semibold">Test Notificaties</h2>
            </template>
            <div class="space-y-4">
                <p class="text-gray-600">Test je notificatie-instellingen</p>
                <div class="flex flex-wrap gap-2">
                    <UButton @click="testPushNotification" color="primary" size="sm">
                        <UIcon name="i-heroicons-device-phone-mobile" class="w-4 h-4 mr-2" />
                        Test Push
                    </UButton>
                    <UButton @click="testEmailNotification" color="primary" size="sm">
                        <UIcon name="i-heroicons-envelope" class="w-4 h-4 mr-2" />
                        Test Email
                    </UButton>
                    <UButton @click="testQuizReminder" color="primary" size="sm">
                        <UIcon name="i-heroicons-academic-cap" class="w-4 h-4 mr-2" />
                        Test Quiz
                    </UButton>
                </div>
            </div>
        </UCard>
    </div>
</template>

<script setup lang="ts">
type Notification = {
    id: string
    type: 'push' | 'email' | 'quiz' | 'friend' | 'achievement'
    title: string
    message: string
    read: boolean
    created_at: string
}

const settings = ref({
    pushNotifications: true,
    emailNotifications: true,
    quizReminders: true,
    friendActivity: false
})

const notifications = ref<Notification[]>([
    {
        id: '1',
        type: 'achievement',
        title: 'Badge verdiend!',
        message: 'Je hebt de "First Watch" badge verdiend door je eerste film te bekijken.',
        read: false,
        created_at: new Date().toISOString()
    },
    {
        id: '2',
        type: 'quiz',
        title: 'Nieuwe quiz beschikbaar',
        message: 'De wekelijkse MCU quiz is nu beschikbaar. Test je kennis!',
        read: true,
        created_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
        id: '3',
        type: 'friend',
        title: 'Vriend activiteit',
        message: 'MCU_Master heeft net "Avengers: Endgame" bekeken.',
        read: true,
        created_at: new Date(Date.now() - 172800000).toISOString()
    }
])

function getNotificationIcon(type: string) {
    const icons = {
        push: 'i-heroicons-device-phone-mobile',
        email: 'i-heroicons-envelope',
        quiz: 'i-heroicons-academic-cap',
        friend: 'i-heroicons-users',
        achievement: 'i-heroicons-trophy'
    }
    return icons[type as keyof typeof icons] || 'i-heroicons-bell'
}

function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('nl-NL', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

function markAsRead(id: string) {
    const notification = notifications.value.find(n => n.id === id)
    if (notification) {
        notification.read = true
    }
}

function markAllAsRead() {
    notifications.value.forEach(notification => {
        notification.read = true
    })
}

async function testPushNotification() {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Test Push Notificatie', {
            body: 'Dit is een test notificatie van MarvelPath!',
            icon: '/favicon.ico'
        })
    } else if ('Notification' in window && Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission()
        if (permission === 'granted') {
            new Notification('Test Push Notificatie', {
                body: 'Dit is een test notificatie van MarvelPath!',
                icon: '/favicon.ico'
            })
        }
    } else {
        alert('Push notificaties worden niet ondersteund door deze browser.')
    }
}

function testEmailNotification() {
    alert('Email notificatie test - in een echte app zou dit een email versturen.')
}

function testQuizReminder() {
    alert('Quiz herinnering test - in een echte app zou dit een notificatie tonen.')
}
</script>
