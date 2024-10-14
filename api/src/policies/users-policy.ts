import { Path } from "@/utils/deep-pick"
import { User } from "@/models"
import { RoleTypes } from "@/models/role"

import BasePolicy from "@/policies/base-policy"

export class UsersPolicy extends BasePolicy<User> {
  /**
   * User information is always public
   */
  show(): boolean {
    return true
  }

  create(): boolean {
    if (this.user.roleTypes.includes(RoleTypes.SYSTEM_ADMIN)) return true

    return false
  }

  update(): boolean {
    if (this.user.roleTypes.includes(RoleTypes.SYSTEM_ADMIN)) return true
    if (this.user.id === this.record.id) return true

    return false
  }

  destroy(): boolean {
    if (this.user.roleTypes.includes(RoleTypes.SYSTEM_ADMIN)) return true

    return false
  }

  permittedAttributes(): Path[] {
    if (this.user.roleTypes.includes(RoleTypes.SYSTEM_ADMIN)) {
      return [
        "email",
        "firstName",
        "lastName",
        "position",
        {
          groupMembershipAttributes: ["departmentId", "divisionId", "branchId", "unitId"],
        },
      ]
    }
    return ["email", "firstName", "lastName"]
  }

  permittedAttributesForCreate(): Path[] {
    return [
      ...this.permittedAttributes(),
      "setupFromEmailFirstLogin",
      { rolesAttributes: ["role"] },
    ]
  }
}

export default UsersPolicy
