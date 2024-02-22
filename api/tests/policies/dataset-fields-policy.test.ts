import { DatasetField } from "@/models"
import { RoleTypes } from "@/models/role"
import { UserGroupTypes } from "@/models/user-groups"
import { DatasetFieldsPolicy } from "@/policies"

import {
  accessGrantFactory,
  datasetFactory,
  datasetFieldFactory,
  roleFactory,
  userFactory,
  userGroupFactory,
  userGroupMembershipFactory,
} from "@/factories"
import { AccessTypes, GrantLevels } from "@/models/access-grant"

describe("api/src/policies/dataset-fields-policy.ts", () => {
  describe("DatasetFieldsPolicy", () => {
    describe(".applyScope", () => {
      test.each([{ roleType: RoleTypes.SYSTEM_ADMIN }, { roleType: RoleTypes.BUSINESS_ANALYST }])(
        "when user role is `$roleType`, it returns all records",
        async ({ roleType }) => {
          // Arrange
          const role = roleFactory.build({ role: roleType })
          const requestingUser = await userFactory
            .associations({
              roles: [role],
            })
            .create()
          const datasetOwner = await userFactory.create()

          const dataset = await datasetFactory.create({
            creatorId: datasetOwner.id,
            ownerId: datasetOwner.id,
          })
          const accessibleDatasetField = await datasetFieldFactory.create({
            datasetId: dataset.id,
          })
          const scopedQuery = DatasetFieldsPolicy.applyScope(DatasetField, requestingUser)

          // Act
          const result = await scopedQuery.findAll()

          // Assert
          expect(result).toEqual([
            expect.objectContaining({
              id: accessibleDatasetField.id,
            }),
          ])
        }
      )

      test("when user has role type user, and field belongs to dataset without accessible grants, returns nothing", async () => {
        // Arrange
        const department = await userGroupFactory.create({ type: UserGroupTypes.DEPARTMENT })
        const requestingUserGroupMembership = userGroupMembershipFactory.build({
          departmentId: department.id,
        })
        const datasetOwnerGroupMembership = userGroupMembershipFactory.build({
          departmentId: department.id,
        })
        const role = roleFactory.build({ role: RoleTypes.USER })
        const requestingUser = await userFactory
          .transient({
            include: ["groupMembership"],
          })
          .associations({
            roles: [role],
            groupMembership: requestingUserGroupMembership,
          })
          .create()

        const datasetOwner = await userFactory
          .associations({
            groupMembership: datasetOwnerGroupMembership,
          })
          .create()

        const dataset = await datasetFactory.create({
          creatorId: datasetOwner.id,
          ownerId: datasetOwner.id,
        })
        await datasetFieldFactory.create({
          datasetId: dataset.id,
        })
        const scopedQuery = DatasetFieldsPolicy.applyScope(DatasetField, requestingUser)

        // Act
        const result = await scopedQuery.findAll()

        // Assert
        expect(DatasetField.count()).resolves.toBe(1)
        expect(result).toHaveLength(0)
      })
    })
  })
})
