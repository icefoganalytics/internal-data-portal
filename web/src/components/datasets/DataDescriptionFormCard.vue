<template>
  <v-card>
    <v-card-title class="d-flex justify-space-between align-center">
      Data Description
      <SaveStateProgress
        :saving="isLoading"
        @click="saveAndNotify"
      />
    </v-card-title>
    <v-card-text>
      <!-- TODO: make the skeleton loader an external component that matches the form -->
      <v-skeleton-loader
        v-if="isNil(dataset)"
        type="card"
      />
      <v-form
        v-else
        ref="form"
        v-model="isValid"
        class="d-flex mt-6"
      >
        <v-row>
          <v-col
            cols="12"
            md="6"
          >
            <v-row>
              <v-col
                cols="12"
                md="8"
              >
                <v-text-field
                  v-model="dataset.name"
                  :rules="[required]"
                  label="Name *"
                  variant="outlined"
                  required
                  @update:model-value="debouncedSaveAndNotify"
                />
              </v-col>
              <v-col
                cols="12"
                md="4"
                class="d-flex flex-column justify-start"
              >
                <template v-if="isEmpty(dataset.integration) && isEmpty(dataset.file)">
                  <v-btn
                    color="primary"
                    :to="{
                      name: 'DatasetIntegrationNewPage',
                      params: { slug },
                    }"
                  >
                    Add API Link
                  </v-btn>
                  <DatasetFileCreateDialog
                    :dataset-id="dataset.id"
                    :activator-props="{
                      class: 'mt-2',
                      color: 'primary',
                      variant: 'outlined',
                    }"
                    @created="refresh"
                  />
                </template>
                <v-btn
                  v-else-if="!isEmpty(dataset.integration)"
                  color="primary"
                  :to="{
                    name: 'DatasetIntegrationManagePage',
                    params: { slug },
                  }"
                >
                  Manage API Link
                </v-btn>
                <DatasetFileUpdateDialog
                  v-else-if="!isEmpty(dataset.file)"
                  :dataset-id="dataset.id"
                  :dataset-file-id="dataset.file.id"
                  :activator-props="{
                    color: 'primary',
                  }"
                />
                <template v-else>
                  Error: Dataset has both an integrated and uploaded source, contact support.
                </template>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-textarea
                  v-model="dataset.description"
                  :rules="[required]"
                  label="Description *"
                  variant="outlined"
                  rows="6"
                  required
                  @update:model-value="debouncedSaveAndNotify"
                />
              </v-col>
            </v-row>
            <v-row>
              <v-col>
                <v-checkbox
                  v-model="dataset.isSpatialData"
                  label="Spatial?"
                  @update:model-value="saveAndNotify"
                />
              </v-col>
            </v-row>
            <v-row>
              <v-col
                cols="12"
                md="3"
              >
                <v-checkbox
                  v-model="dataset.isLiveData"
                  label="Live data?"
                  @update:model-value="liveDataSaveAndNotify"
                />
              </v-col>
              <v-col
                cols="12"
                md="9"
              >
                <DatePicker
                  v-if="dataset.isLiveData"
                  v-model="dataset.publishedAt"
                  :field-options="{
                    label: 'Date Published *',
                    variant: 'outlined',
                  }"
                  @update:model-value="saveAndNotify"
                />
                <DatePicker
                  v-else
                  :model-value="dataset.publishedAt"
                  :field-options="{
                    label: 'Date Published',
                    disabled: true,
                    variant: 'outlined',
                  }"
                />
              </v-col>
            </v-row>
          </v-col>
          <v-col
            cols="12"
            md="6"
          >
            <v-row>
              <v-col
                cols="12"
                md="3"
              >
                <v-checkbox
                  :model-value="isInactive"
                  label="inactive"
                  @update:model-value="deactivateDatasetAndSaveAndNotify"
                />
              </v-col>
              <v-col
                cols="12"
                md="9"
              >
                <DatePicker
                  v-model="dataset.deactivatedAt"
                  :field-options="{
                    label: 'Date Deactivated',
                    variant: 'outlined',
                  }"
                  @update:model-value="saveAndNotify"
                />
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-textarea
                  v-model="dataset.termsOfUse"
                  label="Terms of Use"
                  variant="outlined"
                  rows="4"
                  @update:model-value="debouncedSaveAndNotify"
                />
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-textarea
                  v-model="dataset.credits"
                  label="Credits"
                  variant="outlined"
                  rows="4"
                  @update:model-value="debouncedSaveAndNotify"
                />
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-form>
    </v-card-text>
  </v-card>
</template>

<script lang="ts" setup>
import { computed, ref, toRefs } from "vue"
import { debounce, isNil, isEmpty } from "lodash"

import { type VForm } from "vuetify/lib/components/index.mjs"

import { required } from "@/utils/validators"
import { useSnack } from "@/use/use-snack"
import { useDataset } from "@/use/use-dataset"

import DatePicker from "@/components/DatePicker.vue"
import SaveStateProgress from "@/components/SaveStateProgress.vue"
import DatasetFileCreateDialog from "@/components/dataset-files/DatasetFileCreateDialog.vue"
import DatasetFileUpdateDialog from "@/components/dataset-files/DatasetFileUpdateDialog.vue"

const props = defineProps({
  slug: {
    type: String,
    required: true,
  },
})

const { slug } = toRefs(props)
const { dataset, isLoading, save, refresh } = useDataset(slug)
const snack = useSnack()

const form = ref<InstanceType<typeof VForm> | null>(null)
const isValid = ref(null)
const isInactive = computed<boolean>(() => !isNil(dataset.value?.deactivatedAt))

async function liveDataSaveAndNotify(value: boolean | null) {
  if (isNil(dataset.value)) return

  if (value === true) {
    dataset.value.publishedAt = new Date().toISOString()
  } else {
    dataset.value.publishedAt = null
  }
  await saveAndNotify()
}

async function deactivateDatasetAndSaveAndNotify(value: boolean | null) {
  if (isNil(dataset.value)) return

  if (value) {
    // TODO: verify this is creating the correct date value
    dataset.value.deactivatedAt = new Date().toISOString()
  } else {
    dataset.value.deactivatedAt = null
  }
  await saveAndNotify()
}

async function saveAndNotify() {
  if (!isValid.value) {
    snack.notify("Please fill out all required fields", {
      color: "error",
    })
    return
  }

  try {
    await save()
    snack.notify("Dataset saved", {
      color: "success",
    })
  } catch (error) {
    snack.notify("Error saving dataset", {
      color: "error",
    })
  }
}

const debouncedSaveAndNotify = debounce(saveAndNotify, 1000)
</script>
