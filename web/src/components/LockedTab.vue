<template>
  <v-tooltip>
    <template #activator="{ props }">
      <span v-bind="props">
        <v-tab
          disabled
          append-icon="mdi-lock"
        >
          <!-- The typescript error here doesn't seem to cause any problems, so you can ignore it -->
          <template
            v-for="(_, slotName, index) of $slots"
            :key="`${slotName}-${index}`"
            #[slotName]="slotProps"
            ><slot
              :name="slotName"
              v-bind="slotProps || {}"
            ></slot
          ></template>
        </v-tab>
      </span>
    </template>
    <span class="text-white">You do not have permission to view this tab.</span>
  </v-tooltip>
</template>

<script lang="ts" setup></script>
