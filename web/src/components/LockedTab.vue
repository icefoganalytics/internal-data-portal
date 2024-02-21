<template>
  <v-tab
    disabled
    append-icon="mdi-lock"
    >
    <template
      v-for="(_, slotName) of $slots"
      #[slotName]="slotProps"
      ><slot
        :name="slotName"
        v-bind="slotProps || {}"
      ></slot
    ></template>
  </v-tab>
</template>

<script lang="ts" setup></script>
