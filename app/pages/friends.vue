<template>
    <div class="max-w-4xl mx-auto px-4 sm:px-6 space-y-6 pb-24">
        <div class="pt-4">
            <h1 class="font-display text-3xl tracking-wider text-white mb-1">{{ $t('friends.title') }}</h1>
            <p class="text-white/30 text-sm">{{ $t('friends.subtitle') }}</p>
        </div>

        <!-- Not logged in -->
        <div v-if="!user" class="glass-card p-8 text-center">
            <svg class="w-10 h-10 text-white/10 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            <p class="text-white/40 text-sm mb-4">{{ $t('friends.loginPrompt') }}</p>
            <NuxtLink to="/login" class="inline-flex px-5 py-2 rounded-xl bg-white/10 border border-white/10 text-sm text-white hover:bg-white/15 transition-colors">
                {{ $t('common.login') }}
            </NuxtLink>
        </div>

        <template v-else>
            <!-- Add friend -->
            <div class="glass-card p-5">
                <h2 class="font-display text-lg tracking-wider text-white/60 mb-3">{{ $t('friends.addFriend') }}</h2>
                <form class="flex gap-2" @submit.prevent="sendRequest">
                    <input
                        v-model="searchUsername"
                        type="text"
                        :placeholder="$t('friends.username')"
                        class="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-colors"
                    />
                    <button
                        type="submit"
                        :disabled="!searchUsername.trim() || sending"
                        class="px-5 py-2 rounded-xl bg-white/10 border border-white/10 text-sm text-white hover:bg-white/15 transition-colors disabled:opacity-30"
                    >
                        {{ sending ? '...' : $t('common.send') }}
                    </button>
                </form>
                <p v-if="requestMessage" :class="requestError ? 'text-red-400' : 'text-green-400'" class="text-xs mt-2">
                    {{ requestMessage }}
                </p>
            </div>

            <!-- Pending requests -->
            <div v-if="pendingRequests.length > 0">
                <h2 class="font-display text-lg tracking-wider text-white/60 mb-3">{{ $t('friends.requests') }}</h2>
                <div class="space-y-2">
                    <div
                        v-for="req in pendingRequests"
                        :key="req.id"
                        class="glass-card p-4 flex items-center gap-4"
                    >
                        <div class="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                            <span class="font-display text-lg text-white/40">{{ req.initial }}</span>
                        </div>
                        <div class="flex-1 min-w-0">
                            <span class="text-sm text-white block truncate">{{ req.username }}</span>
                            <span class="text-xs text-white/30">{{ req.incoming ? $t('friends.wantsToAdd') : $t('friends.requestSent') }}</span>
                        </div>
                        <div v-if="req.incoming" class="flex gap-2 shrink-0">
                            <button
                                class="px-3 py-1.5 rounded-lg text-xs bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                                @click="acceptRequest(req.id)"
                            >
                                {{ $t('common.accept') }}
                            </button>
                            <button
                                class="px-3 py-1.5 rounded-lg text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                                @click="declineRequest(req.id)"
                            >
                                {{ $t('common.decline') }}
                            </button>
                        </div>
                        <span v-else class="text-xs text-white/20 shrink-0">{{ $t('friends.waiting') }}</span>
                    </div>
                </div>
            </div>

            <!-- Friends list -->
            <div>
                <h2 class="font-display text-lg tracking-wider text-white/60 mb-3">{{ $t('friends.myFriends') }}</h2>

                <div v-if="friends.length === 0 && !loading" class="glass-card p-8 text-center">
                    <svg class="w-10 h-10 text-white/10 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                    <p class="text-white/40 text-sm">{{ $t('friends.noFriends') }}</p>
                    <p class="text-white/20 text-xs mt-1">{{ $t('friends.addByUsername') }}</p>
                </div>

                <div v-else class="space-y-2">
                    <NuxtLink
                        v-for="friend in friends"
                        :key="friend.id"
                        to="/leaderboard"
                        class="glass-card p-4 flex items-center gap-4 hover:border-white/15 transition-colors block"
                    >
                        <div class="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                            <span class="font-display text-lg text-white/40">{{ friend.initial }}</span>
                        </div>
                        <div class="flex-1 min-w-0">
                            <span class="text-sm text-white block truncate">{{ friend.username }}</span>
                            <span class="text-xs text-white/30">{{ friend.levelName }} · Lvl {{ friend.level }}</span>
                        </div>
                        <div class="text-right shrink-0">
                            <span class="font-mono text-sm text-white/60">{{ friend.xp.toLocaleString() }}</span>
                            <span class="text-[10px] text-white/20 ml-1">{{ $t('common.xp') }}</span>
                        </div>
                    </NuxtLink>
                </div>
            </div>

            <!-- Loading -->
            <div v-if="loading" class="flex justify-center py-8">
                <div class="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ ssr: false })

import type { Database } from '~/types/supabase'

interface FriendEntry {
    id: string
    username: string
    initial: string
    xp: number
    level: number
    levelName: string
}

interface PendingRequest {
    id: string
    username: string
    initial: string
    incoming: boolean
}

const { t } = useI18n()
const client = useSupabaseClient<Database>()
const user = useSupabaseUser()
const { getLevelFromXP, getLevelName } = useXP()

const loading = ref(true)
const friends = ref<FriendEntry[]>([])
const pendingRequests = ref<PendingRequest[]>([])
const searchUsername = ref('')
const sending = ref(false)
const requestMessage = ref('')
const requestError = ref(false)

async function loadFriends() {
    if (!user.value) return

    try {
        const { data: friendRows } = await client
            .from('friends')
            .select('user_id, friend_id, status')
            .or(`user_id.eq.${user.value.id},friend_id.eq.${user.value.id}`)

        if (!friendRows) return

        const accepted = friendRows.filter(f => f.status === 'accepted')
        const pending = friendRows.filter(f => f.status === 'pending')

        const friendIds = accepted.map(f => f.user_id === user.value!.id ? f.friend_id : f.user_id)

        if (friendIds.length > 0) {
            const { data: profiles } = await client
                .from('profiles')
                .select('id, username, xp_total, level_int')
                .in('id', friendIds)

            if (profiles) {
                friends.value = profiles.map(p => {
                    const level = p.level_int || getLevelFromXP(p.xp_total || 0)
                    const name = p.username || t('common.anonymous')
                    return {
                        id: p.id,
                        username: name,
                        initial: name.charAt(0).toUpperCase(),
                        xp: p.xp_total || 0,
                        level,
                        levelName: getLevelName(level),
                    }
                }).sort((a, b) => b.xp - a.xp)
            }
        }

        const pendingIds = pending.map(f => ({
            odId: f.user_id === user.value!.id ? f.friend_id : f.user_id,
            incoming: f.friend_id === user.value!.id,
        }))

        if (pendingIds.length > 0) {
            const { data: pendingProfiles } = await client
                .from('profiles')
                .select('id, username')
                .in('id', pendingIds.map(p => p.odId))

            if (pendingProfiles) {
                pendingRequests.value = pendingProfiles.map(p => {
                    const match = pendingIds.find(pi => pi.odId === p.id)
                    const name = p.username || t('common.anonymous')
                    return {
                        id: p.id,
                        username: name,
                        initial: name.charAt(0).toUpperCase(),
                        incoming: match?.incoming ?? false,
                    }
                })
            }
        }
    } catch {
        // Supabase unavailable
    } finally {
        loading.value = false
    }
}

async function sendRequest() {
    if (!user.value || !searchUsername.value.trim()) return
    sending.value = true
    requestMessage.value = ''
    requestError.value = false

    try {
        const { data: profile } = await client
            .from('profiles')
            .select('id')
            .eq('username', searchUsername.value.trim())
            .single()

        if (!profile) {
            requestMessage.value = t('friends.userNotFound')
            requestError.value = true
            return
        }

        if (profile.id === user.value.id) {
            requestMessage.value = t('friends.cantAddSelf')
            requestError.value = true
            return
        }

        const { error } = await client.from('friends').insert({
            user_id: user.value.id,
            friend_id: profile.id,
            status: 'pending',
        })

        if (error) {
            if (error.code === '23505') {
                requestMessage.value = t('friends.alreadySent')
            } else {
                requestMessage.value = t('friends.somethingWrong')
            }
            requestError.value = true
            return
        }

        requestMessage.value = t('friends.requestSentTo', { username: searchUsername.value.trim() })
        searchUsername.value = ''
        await loadFriends()
    } catch {
        requestMessage.value = t('friends.couldNotSend')
        requestError.value = true
    } finally {
        sending.value = false
    }
}

async function acceptRequest(friendId: string) {
    if (!user.value) return
    try {
        await client
            .from('friends')
            .update({ status: 'accepted' })
            .eq('user_id', friendId)
            .eq('friend_id', user.value.id)
        await loadFriends()
    } catch { /* silent */ }
}

async function declineRequest(friendId: string) {
    if (!user.value) return
    try {
        await client
            .from('friends')
            .delete()
            .eq('user_id', friendId)
            .eq('friend_id', user.value.id)
        await loadFriends()
    } catch { /* silent */ }
}

onMounted(() => loadFriends())
</script>
