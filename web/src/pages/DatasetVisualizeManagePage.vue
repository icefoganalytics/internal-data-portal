<template>
  <v-skeleton-loader
    v-if="isNil(dataset)"
    type="card"
  />
  <VisualizePropertiesFormCard
    v-else
    :visualization-control-id="dataset.visualizationControl.id"
    @saved="refreshTable"
  />

  <v-spacer class="mt-6" />
  <v-skeleton-loader
    v-if="isNil(dataset)"
    type="table"
  />
  <SwitchableDatasetEntryPreviewsTable
    v-else
    ref="switchableDatasetEntryPreviewsTable"
    :dataset-id="dataset.id"
    :visualization-control-id="dataset.visualizationControl.id"
  />
</template>

<script setup lang="ts">
import { ref, toRefs } from "vue"
import { isNil } from "lodash"

import { useBreadcrumbs } from "@/use/use-breadcrumbs"
import { useDataset } from "@/use/use-dataset"

import SwitchableDatasetEntryPreviewsTable from "@/components/dataset-entry-previews/SwitchableDatasetEntryPreviewsTable.vue"
import VisualizePropertiesFormCard from "@/components/visualization-controls/VisualizePropertiesFormCard.vue"

const props = defineProps({
  slug: {
    type: String,
    required: true,
  },
})

const { slug } = toRefs(props)
const { dataset } = useDataset(slug)

const switchableDatasetEntryPreviewsTable = ref<InstanceType<
  typeof SwitchableDatasetEntryPreviewsTable
> | null>(null)

function refreshTable() {
  if (isNil(switchableDatasetEntryPreviewsTable.value)) {
    return
  }

  switchableDatasetEntryPreviewsTable.value.refresh()
}

const { setBreadcrumbs } = useBreadcrumbs()

setBreadcrumbs([
  {
    title: "Datasets",
    to: {
      name: "DatasetsPage",
    },
  },
  {
    title: "Visualize",
    to: {
      name: "DatasetVisualizeReadPage",
      params: { slug: props.slug },
    },
  },
  {
    title: "Manage",
    to: {
      name: "DatasetVisualizeManagePage",
      params: { slug: props.slug },
    },
  },
])
</script>
