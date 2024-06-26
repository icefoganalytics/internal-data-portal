import { type Ref, reactive, toRefs, ref, unref, watch } from "vue"

import usersApi, { type UsersFilters, type User } from "@/api/users-api"

export { type User, type UsersFilters }

export function useUsers(
  options: Ref<{
    where?: Record<string, unknown>
    filters?: UsersFilters
    page?: number
    perPage?: number
  }> = ref({}),
  {
    isWatchEnabled = true,
  }: {
    isWatchEnabled?: boolean
  } = {}
) {
  const state = reactive<{
    users: User[]
    totalCount: number
    isLoading: boolean
    isErrored: boolean
  }>({
    users: [],
    totalCount: 0,
    isLoading: false,
    isErrored: false,
  })

  async function fetch(): Promise<User[]> {
    state.isLoading = true
    try {
      const { users, totalCount } = await usersApi.list(unref(options))
      state.isErrored = false
      state.users = users
      state.totalCount = totalCount
      return users
    } catch (error) {
      console.error("Failed to fetch users:", error)
      state.isErrored = true
      throw error
    } finally {
      state.isLoading = false
    }
  }

  async function search(searchToken: string): Promise<User[]> {
    state.isLoading = true
    try {
      const { users } = await usersApi.search(searchToken, unref(options))
      state.isErrored = false
      state.users = users
      return users
    } catch (error) {
      console.error("User search failed:", error)
      state.isErrored = true
      throw error
    } finally {
      state.isLoading = false
    }
  }

  if (isWatchEnabled === true) {
    watch(
      () => unref(options),
      async () => {
        await fetch()
      },
      { deep: true, immediate: true }
    )
  }

  return {
    ...toRefs(state),
    fetch,
    refresh: fetch,
    search,
  }
}

export default useUsers
