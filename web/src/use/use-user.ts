import { type Ref, reactive, unref, watch, toRefs } from "vue"
import { isNil } from "lodash"

import usersApi, { RoleTypes, type User, type UserUpdate } from "@/api/users-api"

export { RoleTypes, type User, type UserUpdate }

export function useUser(
  id: Ref<number | null | undefined>,
  {
    withDeleted = false,
    immediate = true,
  }: {
    immediate?: boolean
    withDeleted?: boolean
  } = {}
) {
  const state = reactive<{
    user: User | null
    isLoading: boolean
    isErrored: boolean
  }>({
    user: null,
    isLoading: false,
    isErrored: false,
  })

  async function fetch() {
    const staticId = unref(id)
    if (isNil(staticId)) {
      throw new Error("id is required")
    }

    state.isLoading = true
    try {
      const { user } = await usersApi.get(staticId, { withDeleted })
      state.user = user
      state.isErrored = false
      return user
    } catch (error) {
      console.error("Failed to fetch user:", error)
      state.isErrored = true
      throw error
    } finally {
      state.isLoading = false
    }
  }

  async function save(customAttributes: UserUpdate): Promise<User> {
    const staticId = unref(id)
    if (isNil(staticId)) {
      throw new Error("id is required")
    }

    const attributes = {
      ...state.user,
      ...customAttributes,
    }

    state.isLoading = true
    try {
      const { user } = await usersApi.update(staticId, attributes)
      state.isErrored = false
      state.user = user
      return user
    } catch (error) {
      console.error("Failed to save current user:", error)
      state.isErrored = true
      throw error
    } finally {
      state.isLoading = false
    }
  }

  async function sync(): Promise<User> {
    const staticId = unref(id)
    if (isNil(staticId)) {
      throw new Error("id is required")
    }

    state.isLoading = true
    try {
      const { user } = await usersApi.sync(staticId)
      state.isErrored = false
      state.user = user
      return user
    } catch (error) {
      console.error("Failed to sync current user:", error)
      state.isErrored = true
      throw error
    } finally {
      state.isLoading = false
    }
  }

  watch(
    () => unref(id),
    async (newId) => {
      if (isNil(newId)) return

      try {
        await fetch()
      } catch (_error) {
        /**
         * ignore the error.
         * This will occur if the dataset owner has been deleted.
         * I'm not really sure how to handle this currently, but in the future,
         * it might make sense to store the error in the state, and/or show it to the
         * user via a toast instead of logging it.
         *
         * It depends on whether we decide that missing users are a normal system state
         * or a bug in the system that should be fixed.
         */
      }
    },
    { immediate }
  )

  return {
    ...toRefs(state),
    fetch,
    refresh: fetch,
    save,
    sync,
  }
}

export default useUser
