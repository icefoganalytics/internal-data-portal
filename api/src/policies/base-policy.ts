import { ModelStatic, Model, Attributes, FindOptions, ScopeOptions } from "sequelize"

import { User } from "@/models"
import { Path, deepPick } from "@/utils/deep-pick"

export type Actions = "show" | "create" | "update" | "destroy"

/**
 * See PolicyFactory below for policy with scope helpers
 */
export class BasePolicy<M extends Model> {
  protected user: User
  protected record: M

  constructor(user: User, record: M) {
    this.user = user
    this.record = record
  }

  show(): boolean {
    return false
  }

  create(): boolean {
    return false
  }

  update(): boolean {
    return false
  }

  destroy(): boolean {
    return false
  }

  permitAttributes(record: Partial<M>): Partial<M> {
    return deepPick(record, this.permittedAttributes())
  }

  permitAttributesForCreate(record: Partial<M>): Partial<M> {
    if (this.permittedAttributesForCreate !== BasePolicy.prototype.permittedAttributesForCreate) {
      return deepPick(record, this.permittedAttributesForCreate())
    } else {
      return deepPick(record, this.permittedAttributes())
    }
  }

  permitAttributesForUpdate(record: Partial<M>): Partial<M> {
    if (this.permittedAttributesForUpdate !== BasePolicy.prototype.permittedAttributesForUpdate) {
      return deepPick(record, this.permittedAttributesForUpdate())
    } else {
      return deepPick(record, this.permittedAttributes())
    }
  }

  permittedAttributes(): Path[] {
    throw new Error("Not Implemented")
  }

  permittedAttributesForCreate(): Path[] {
    throw new Error("Not Implemented")
  }

  permittedAttributesForUpdate(): Path[] {
    throw new Error("Not Implemented")
  }

  /**
   * Add to support return policy information via this.reponse.json({ someObject, policy })
   *
   * If this method becomes complex, it should be broken out into a serializer.
   *
   * @returns a JSON representation of the policy
   */
  toJSON(): Record<Actions, boolean> {
    return {
      show: this.show(),
      create: this.create(),
      update: this.update(),
      destroy: this.destroy(),
    }
  }
}

export default BasePolicy

// See api/node_modules/sequelize/types/model.d.ts -> Model -> scope
export type BaseScopeOptions = string | ScopeOptions

export const POLICY_SCOPE_NAME = "policyScope"

export function PolicyFactory<M extends Model>(modelClass: ModelStatic<M>) {
  const policyClass = class Policy extends BasePolicy<M> {
    static applyScope(scopes: BaseScopeOptions[], user: User): ModelStatic<M> {
      this.ensurePolicyScope()

      return modelClass.scope([...scopes, { method: [POLICY_SCOPE_NAME, user] }])
    }

    /**
     * Just in time scope creation for model class.
     * TODO: to have scope creation occur at definition time, instead of execution time.
     */
    static ensurePolicyScope() {
      if (Object.prototype.hasOwnProperty.call(modelClass.options.scopes, POLICY_SCOPE_NAME)) {
        return
      }

      modelClass.addScope(POLICY_SCOPE_NAME, this.policyScope.bind(modelClass))
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    static policyScope(user: User): FindOptions<Attributes<M>> {
      throw new Error("Derived classes must implement policyScope method")
    }
  }

  return policyClass
}
