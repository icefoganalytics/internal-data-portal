import { Path } from "@/utils/deep-pick"
import { User } from "@/models"

import BasePolicy from "@/policies/base-policy"

export class UsersPolicy extends BasePolicy<User> {
  /**
   * User information is always public
   */
  show(): boolean {
    return true
  }

  create(): boolean {
    if (this.user.isSystemAdmin) return true

    return false
  }

  update(): boolean {
    if (this.user.isSystemAdmin) return true
    if (this.user.id === this.record.id) return true

    return false
  }

  destroy(): boolean {
    if (this.user.isSystemAdmin) return true

    return false
  }

  permittedAttributes(): Path[] {
    const attributes: Path[] = ["email", "firstName", "lastName", "position"]

    if (this.user.isSystemAdmin) {
      attributes.push({
        groupMembershipAttributes: ["departmentId", "divisionId", "branchId", "unitId"],
      })
    }

    return attributes
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
