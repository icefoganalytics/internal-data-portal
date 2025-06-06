<template>
  <v-skeleton-loader
    v-if="isNil(user)"
    type="card"
  />
  <v-form
    v-else
    v-model="isValid"
    @submit.prevent="saveWrapper"
  >
    <v-row>
      <v-col
        cols="12"
        md="6"
      >
        <v-text-field
          v-model="user.firstName"
          label="First name *"
          :rules="[required]"
          variant="outlined"
          required
        />
      </v-col>
      <v-col
        cols="12"
        md="6"
      >
        <v-text-field
          v-model="user.lastName"
          label="Last name *"
          :rules="[required]"
          variant="outlined"
          required
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col
        cols="12"
        md="6"
      >
        <v-text-field
          v-model="user.email"
          label="Email *"
          :rules="[required]"
          variant="outlined"
          required
        />
      </v-col>
      <v-col
        cols="12"
        md="6"
      >
        <v-text-field
          v-model="user.position"
          label="Position"
          variant="outlined"
        />
      </v-col>
    </v-row>

    <v-divider class="my-6"></v-divider>

    <v-row>
      <v-col
        cols="12"
        md="6"
      >
        <UserGroupAutocomplete
          :model-value="groupMembershipAttributes.departmentId"
          :type="UserGroupTypes.DEPARTMENT"
          :parent-id="null"
          :rules="[required]"
          label="Department"
          variant="outlined"
          required
          @update:model-value="updateDepartment"
        />
      </v-col>
      <v-col
        cols="12"
        md="6"
      >
        <UserGroupAutocomplete
          :model-value="groupMembershipAttributes.divisionId"
          :type="UserGroupTypes.DIVISION"
          :parent-id="groupMembershipAttributes.departmentId"
          label="Division"
          variant="outlined"
          clearable
          :readonly="isNil(groupMembershipAttributes.departmentId)"
          :disabled="isNil(groupMembershipAttributes.departmentId)"
          :append-inner-icon="isNil(groupMembershipAttributes.departmentId) ? 'mdi-lock' : ''"
          @update:model-value="updateDivision"
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col
        cols="12"
        md="6"
      >
        <UserGroupAutocomplete
          :model-value="groupMembershipAttributes.branchId"
          :type="UserGroupTypes.BRANCH"
          :parent-id="groupMembershipAttributes.divisionId"
          label="Branch"
          variant="outlined"
          clearable
          :readonly="isNil(groupMembershipAttributes.divisionId)"
          :disabled="isNil(groupMembershipAttributes.divisionId)"
          :append-inner-icon="isNil(groupMembershipAttributes.divisionId) ? 'mdi-lock' : ''"
          @update:model-value="updateBranch"
        />
      </v-col>
      <v-col
        cols="12"
        md="6"
      >
        <UserGroupAutocomplete
          :model-value="groupMembershipAttributes.unitId"
          :type="UserGroupTypes.UNIT"
          :parent-id="groupMembershipAttributes.branchId"
          label="Unit"
          variant="outlined"
          clearable
          :readonly="isNil(groupMembershipAttributes.branchId)"
          :disabled="isNil(groupMembershipAttributes.branchId)"
          :append-inner-icon="isNil(groupMembershipAttributes.branchId) ? 'mdi-lock' : ''"
          @update:model-value="updateUnit"
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col
        cols="12"
        md="6"
      >
        <h3 class="mb-1">Roles</h3>

        <v-chip
          v-for="(roleType, index) in user.roleTypes"
          :key="index"
          class="ma-2"
          color="info"
          size="large"
        >
          {{ formatRole(roleType) }}
        </v-chip>
      </v-col>
    </v-row>
    <v-row>
      <v-spacer />
      <v-col class="d-flex justify-end">
        <v-btn
          :loading="isLoading"
          color="error"
          variant="outlined"
          v-bind="cancelButtonOptions"
          text="Cancel"
        />
        <!-- TODO: add ability to request update of yukon government directory information during save -->
        <v-btn
          class="ml-3"
          :loading="isLoading"
          type="submit"
          color="success"
          text="Save"
        />
      </v-col>
    </v-row>
  </v-form>
</template>

<script setup lang="ts">
import { isNil } from "lodash"
import { ref, toRefs, watch } from "vue"
import { useI18n } from "vue-i18n"
import { VBtn } from "vuetify/lib/components/index.mjs"

import { required } from "@/utils/validators"

import { GroupMembership } from "@/api/users-api"
import { UserGroupTypes } from "@/api/user-groups-api"
import useSnack from "@/use/use-snack"
import useUser from "@/use/use-user"

import UserGroupAutocomplete from "@/components/user-groups/UserGroupAutocomplete.vue"

type CancelButtonOptions = VBtn["$props"]

const props = withDefaults(
  defineProps<{
    userId: number
    cancelButtonOptions?: CancelButtonOptions
  }>(),
  {
    cancelButtonOptions: ({ userId }) => ({
      to: {
        name: "UserPage",
        params: { userId },
      },
    }),
  }
)

const emit = defineEmits(["saved"])

const { userId } = toRefs(props)
const { user, save, isLoading } = useUser(userId)

const snack = useSnack()

const isValid = ref(false)
const groupMembershipAttributes = ref<Partial<GroupMembership>>({})

async function saveWrapper() {
  if (!isValid.value) {
    snack.notify("Please fill out all required fields", { color: "error" })
    return
  }

  await save({
    groupMembershipAttributes: groupMembershipAttributes.value,
  })
  emit("saved")
}

watch(
  () => user.value,
  (newUser) => {
    if (isNil(newUser)) return

    const { groupMembership } = newUser
    const { departmentId, divisionId, branchId, unitId } = groupMembership

    groupMembershipAttributes.value = {
      departmentId,
      divisionId,
      branchId,
      unitId,
    }
  },
  {
    deep: true,
    immediate: true,
  }
)

function clearDivision() {
  groupMembershipAttributes.value.divisionId = null
  clearBranch()
}

function clearBranch() {
  groupMembershipAttributes.value.branchId = null
  clearUnit()
}

function clearUnit() {
  groupMembershipAttributes.value.unitId = null
}

async function updateDepartment(newDepartmentId: number | null) {
  if (isNil(newDepartmentId)) {
    throw new Error("Department id is required")
  }

  groupMembershipAttributes.value.departmentId = newDepartmentId
  clearDivision()
}

async function updateDivision(newDivisionId: number | null) {
  if (isNil(newDivisionId)) {
    clearDivision()
    return
  }

  groupMembershipAttributes.value.divisionId = newDivisionId
  clearBranch()
}

async function updateBranch(newBranchId: number | null) {
  if (isNil(newBranchId)) {
    clearBranch()
    return
  }

  groupMembershipAttributes.value.branchId = newBranchId
  clearUnit()
}

async function updateUnit(newUnitId: number | null) {
  if (isNil(newUnitId)) {
    clearUnit()
    return
  }

  groupMembershipAttributes.value.unitId = newUnitId
}

const { t } = useI18n()

function formatRole(roleType: string) {
  return t(`roles.role_types.${roleType}`, roleType)
}
</script>
