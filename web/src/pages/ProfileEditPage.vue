<template>
  <v-skeleton-loader v-if="isNil(currentUser)" />
  <v-container v-else>
    <h2 class="d-flex flex-column flex-md-row justify-space-between mb-3">
      My Profile

      <div class="d-flex justify-space-between mt-4 mb-3 my-md-0">
        <v-btn
          color="primary"
          variant="outlined"
          :to="{ name: 'ProfilePage' }"
        >
          Back
        </v-btn>
        <v-btn
          class="ml-md-3"
          title="Sync profile with external directory"
          color="primary"
          append-icon="mdi-sync"
          @click="sync"
        >
          Sync
        </v-btn>
      </div>
    </h2>

    <AdminUserEditForm
      v-if="isSystemAdmin"
      class="mt-10"
      :user-id="currentUser.id"
      :cancel-button-options="{ to: { name: 'ProfilePage' } }"
      @saved="refresh"
    />
    <UserEditForm
      v-else
      class="mt-10"
      :user-id="currentUser.id"
      :cancel-button-options="{ to: { name: 'ProfilePage' } }"
      @saved="refresh"
    />
  </v-container>
</template>

<script setup lang="ts">
import { isNil } from "lodash"

import useBreadcrumbs from "@/use/use-breadcrumbs"
import useCurrentUser from "@/use/use-current-user"

import AdminUserEditForm from "@/components/users/AdminUserEditForm.vue"
import UserEditForm from "@/components/users/UserEditForm.vue"

const { currentUser, isSystemAdmin, sync, refresh } = useCurrentUser()

const { setBreadcrumbs } = useBreadcrumbs()

setBreadcrumbs([
  {
    title: "Profile",
    to: { name: "ProfilePage" },
  },
  {
    title: "Edit",
    to: { name: "ProfileEditPage" },
  },
])
</script>
