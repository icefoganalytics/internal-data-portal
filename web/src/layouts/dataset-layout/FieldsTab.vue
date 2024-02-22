<template>
  <LockedTab v-if="locked">Fields</LockedTab>
  <v-tab
    v-else
    :to="{ name: routeName, params: { slug } }"
    ><h3>Fields</h3></v-tab
  >
</template>

<script lang="ts" setup>
import { computed } from "vue"
import { useRoute } from "vue-router"

import LockedTab from "@/components/LockedTab.vue"

defineProps({
  slug: {
    type: String,
    required: true,
  },
  locked: {
    type: Boolean,
    default: false,
  },
})

const route = useRoute()

// TODO: maybe vary route by user role?
const routeName = computed(() => {
  switch (route.name) {
    case "DatasetDescriptionManagePage":
    case "DatasetFieldsManagePage":
    case "DatasetAccessManagePage":
      return "DatasetFieldsManagePage"
    default:
      return "DatasetFieldsReadPage"
  }
})
</script>
