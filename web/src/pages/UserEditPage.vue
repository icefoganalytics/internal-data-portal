<template>
  <v-skeleton-loader v-if="isNil(user)" />
  <v-container v-else>
    <h2 class="d-flex flex-column flex-md-row justify-space-between mb-3">
      <span>
        User Profile:
        <v-chip variant="outlined">
          {{ username }}
        </v-chip>
      </span>

      <div class="d-flex justify-space-between mt-4 mb-3 my-md-0">
        <v-btn
          color="primary"
          variant="outlined"
          :to="{ name: 'UsersPage' }"
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
      :user-id="user.id"
      :cancel-button-options="{ to: { name: 'UsersPage' } }"
      @saved="refresh"
    />
    <UserEditForm
      v-else
      class="mt-10"
      :user-id="user.id"
      :cancel-button-options="{ to: { name: 'UsersPage' } }"
      @saved="refresh"
    />
  </v-container>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { isNil } from "lodash"

import useBreadcrumbs from "@/use/use-breadcrumbs"
import useUser from "@/use/use-user"
import useCurrentUser from "@/use/use-current-user"

import AdminUserEditForm from "@/components/users/AdminUserEditForm.vue"
import UserEditForm from "@/components/users/UserEditForm.vue"

const props = defineProps<{
  userId: string
}>()

const userId = computed(() => parseInt(props.userId))
const { user, sync, refresh } = useUser(userId)
const { isSystemAdmin } = useCurrentUser()

const username = computed(() => {
  if (user.value === null) return "loading..."

  const { email } = user.value
  return email.substring(0, email.indexOf("@"))
})

const { setBreadcrumbs } = useBreadcrumbs()

setBreadcrumbs([
  {
    title: "All Users",
    to: { name: "UsersPage" },
  },
  {
    title: "User",
    to: {
      // TODO: set to non-edit user page, once it exists
      name: "UserEditPage",
      params: { userId: props.userId },
    },
  },
  {
    title: "Edit",
    to: {
      name: "UserEditPage",
      params: { userId: props.userId },
    },
  },
])
</script>
