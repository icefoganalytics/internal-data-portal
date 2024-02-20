import { Dataset, User } from "@/models"

import { Path } from "@/utils/deep-pick"
import { AccessGrant } from "@/models"
import { AccessTypes } from "@/models/access-grant"
import BasePolicy from "@/policies/base-policy"
import { isNil } from "lodash"

export class DatasetsPolicy extends BasePolicy<Dataset> {
  private _mostPermissiveAccessGrant: AccessGrant | null = null

  constructor(user: User, record: Dataset) {
    super(user, record)
  }

  show(): boolean {
    if (this.user.isSystemAdmin || this.user.isBusinessAnalyst) {
      return true
    } else if (this.user.isDataOwner && this.record.ownerId === this.user.id) {
      return true
    } else if (this.userAccessType() === AccessTypes.OPEN_ACCESS) {
      return true
    }
    // TODO: need to update this to also show base on access grants

    return false
  }

  create(): boolean {
    if (this.user.isSystemAdmin || this.user.isBusinessAnalyst) {
      return true
    } else if (this.user.isDataOwner && this.record.ownerId === this.user.id) {
      return true
    }

    return false
  }

  update(): boolean {
    if (this.user.isSystemAdmin || this.user.isBusinessAnalyst) {
      return true
    } else if (this.user.isDataOwner && this.record.ownerId === this.user.id) {
      return true
    }

    return false
  }

  permittedAttributes(): Path[] {
    return [
      ...(this.user.isSystemAdmin || this.user.isBusinessAnalyst ? ["ownerId"] : []),
      "name",
      "description",
      "subscriptionUrl",
      "subscriptionAccessCode",
      "isSubscribable",
      "isSpatialData",
      "isLiveData",
      "termsOfUse",
      "credits",
      "ownerNotes",

      // stateful attributes - maybe should require a stateful controller endpoint to update?
      "deactivatedAt",
      "publishedAt",
    ]
  }

  permittedAttributesForCreate(): Path[] {
    return [
      ...this.permittedAttributes(),
      {
        stewardshipAttributes: [
          "ownerId",
          "supportId",
          "departmentId",
          "divisionId",
          "branchId",
          "unitId",
        ],
      },
    ]
  }

  public userAccessType(): AccessTypes {
    const accessGrant = this.mostPermissiveAccessGrant()
    if (!isNil(accessGrant)) {
      return accessGrant.accessType
    }
    return AccessTypes.NO_ACCESS
  }

  public mostPermissiveAccessGrant(): AccessGrant | null {
    if (this._mostPermissiveAccessGrant === null) {
      this._mostPermissiveAccessGrant = this.record.mostPermissiveAccessGrantFor(this.user)
    }

    return this._mostPermissiveAccessGrant
  }
}

export default DatasetsPolicy
