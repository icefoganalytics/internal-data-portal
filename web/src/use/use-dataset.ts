import { type Ref, reactive, unref, watch, toRefs } from "vue"
import { isNil } from "lodash"

import datasetsApi, { DatasetDetailedResult, Policy } from "@/api/datasets-api"

export function useDataset(slug: Ref<string>) {
  const state = reactive<{
    dataset: DatasetDetailedResult | null
    policy: Policy | null
    isLoading: boolean
    isErrored: boolean
  }>({
    dataset: null,
    policy: null,
    isLoading: false,
    isErrored: false,
  })

  async function fetch() {
    state.isLoading = true
    try {
      const { dataset, policy } = await datasetsApi.get(unref(slug))
      state.dataset = dataset
      state.policy = policy
      state.isErrored = false
      return dataset
    } catch (error) {
      console.error("Failed to fetch dataset:", error)
      state.isErrored = true
      throw error
    } finally {
      state.isLoading = false
    }
  }

  async function save() {
    if (isNil(state.dataset)) {
      throw new Error("No dataset to save")
    }

    state.isLoading = true
    try {
      const { dataset } = await datasetsApi.update(unref(slug), state.dataset)
      state.dataset = dataset
      state.isErrored = false
      return dataset
    } catch (error) {
      console.error("Failed to save dataset:", error)
      state.isErrored = true
      throw error
    } finally {
      state.isLoading = false
    }
  }

  watch(
    () => unref(slug),
    async () => {
      await fetch()
    },
    { immediate: true }
  )

  return {
    ...toRefs(state),
    refresh: fetch,
    save,
  }
}

export default useDataset
