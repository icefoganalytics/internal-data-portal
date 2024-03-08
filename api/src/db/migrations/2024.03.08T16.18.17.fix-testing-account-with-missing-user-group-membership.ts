import { isEmpty, isNil } from "lodash"

import { User, UserGroup, UserGroupMembership } from "@/models"

import type { Migration } from "@/db/umzug"
import { DEFAULT_ORDER } from "@/models/user-groups"

export const up: Migration = async () => {
  const user = await User.findOne({
    where: { email: "michael@icefoganalytics.com" },
    include: "groupMembership",
  })

  if (isNil(user)) return

  if (!isEmpty(user.groupMembership)) return

  const [defaultGroup] = await UserGroup.findOrCreate({
    where: {
      type: UserGroup.Types.DEPARTMENT,
      name: "Unassigned",
    },
    defaults: {
      name: "Unassigned",
      type: UserGroup.Types.DEPARTMENT,
      order: DEFAULT_ORDER,
    },
  })

  return UserGroupMembership.create({
    userId: user.id,
    departmentId: defaultGroup.id,
  })
}

export const down: Migration = async () => {
  // nop
}
