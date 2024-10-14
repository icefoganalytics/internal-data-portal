import { computed, reactive, toRefs } from "vue"
import { isNil } from "lodash"

import { sleep } from "@/utils/sleep"
import usersApi, { RoleTypes, type User } from "@/api/users-api"

export { RoleTypes, type User }

// Global state
const state = reactive<{
  currentUser: User | null
  isLoading: boolean
  isErrored: boolean
  isCached: boolean
}>({
  currentUser: null,
  isLoading: false,
  isErrored: false,
  isCached: false,
})

export function useCurrentUser() {
  const isReady = computed(() => !state.isLoading && !state.isErrored)

  const isSystemAdmin = computed(
    () => state.currentUser?.roles?.some(({ role }) => role === RoleTypes.SYSTEM_ADMIN)
  )

  async function fetch(): Promise<User> {
    state.isLoading = true
    try {
      const { user } = await usersApi.fetchCurrentUser()
      state.isErrored = false
      state.currentUser = user
      state.isCached = true
      return user
    } catch (error) {
      console.error("Failed to fetch current user:", error)
      state.isErrored = true
      throw error
    } finally {
      state.isLoading = false
    }
  }

  async function ensure(): Promise<User | null> {
    // TODO: add max timeout
    while (state.isLoading) {
      await sleep(75)
    }

    if (state.isErrored) {
      console.error("Current user store has errored, returning state.currentUser.")
      return state.currentUser
    }

    // Trust the back-end and above logic; when state.isCached, user must be a full user.
    if (state.isCached) return state.currentUser as User

    return fetch()
  }

  async function sync(): Promise<User> {
    if (isNil(state.currentUser)) {
      throw new Error("No user to sync.")
    }

    state.isLoading = true
    try {
      const { user } = await usersApi.sync(state.currentUser.id)
      state.isErrored = false
      state.currentUser = user
      state.isCached = true
      return user
    } catch (error) {
      console.error("Failed to sync current user:", error)
      state.isErrored = true
      throw error
    } finally {
      state.isLoading = false
    }
  }

  // I think this needs to be called during logout or current user will persist?
  function reset() {
    state.currentUser = null
    state.isLoading = false
    state.isErrored = false
    state.isCached = false
  }

  return {
    ...toRefs(state),
    isReady,
    isSystemAdmin,
    fetch,
    refresh: fetch,
    ensure,
    reset,
    sync,
  }
}

export default useCurrentUser
