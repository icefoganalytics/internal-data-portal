import { DatasetField } from "@/models"
import { RoleTypes } from "@/models/role"
import { UserGroupTypes } from "@/models/user-groups"
import { DatasetFieldsPolicy } from "@/policies"

import {
  accessGrantFactory,
  accessRequestFactory,
  datasetFactory,
  datasetFieldFactory,
  roleFactory,
  userFactory,
  userGroupFactory,
  userGroupMembershipFactory,
  visualizationControlFactory,
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
          const scopedQuery = DatasetFieldsPolicy.applyScope([], requestingUser)

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
        const scopedQuery = DatasetFieldsPolicy.applyScope([], requestingUser)

        // Act
        const result = await scopedQuery.findAll()

        // Assert
        expect(DatasetField.count()).resolves.toBe(1)
        expect(result).toHaveLength(0)
      })

      test("when user has role type user, and field belongs to dataset with accessible open access grants, returns the datasets fields", async () => {
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

        const accessGrant = accessGrantFactory.build({
          creatorId: datasetOwner.id,
          grantLevel: GrantLevels.GOVERNMENT_WIDE,
          accessType: AccessTypes.OPEN_ACCESS,
        })
        const accessibleDataset = await datasetFactory
          .associations({
            accessGrants: [accessGrant],
          })
          .create({
            creatorId: datasetOwner.id,
            ownerId: datasetOwner.id,
          })
        const inaccessibleDataset = await datasetFactory
          .associations({
            accessGrants: [],
          })
          .create({
            creatorId: datasetOwner.id,
            ownerId: datasetOwner.id,
          })

        const accessibleDatasetField = await datasetFieldFactory.create({
          datasetId: accessibleDataset.id,
        })
        // inaccessible dataset field - for control case
        await datasetFieldFactory.create({
          datasetId: inaccessibleDataset.id,
        })
        const scopedQuery = DatasetFieldsPolicy.applyScope([], requestingUser)

        // Act
        const result = await scopedQuery.findAll()

        // Assert
        expect(DatasetField.count()).resolves.toBe(2)
        expect(result).toEqual([
          expect.objectContaining({
            id: accessibleDatasetField.id,
          }),
        ])
      })

      test("when user has role type user, and field belongs to dataset with accessible screened access grants, without an approved request, restricts the datasets fields", async () => {
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

        const accessGrant = accessGrantFactory.build({
          creatorId: datasetOwner.id,
          grantLevel: GrantLevels.GOVERNMENT_WIDE,
          accessType: AccessTypes.SCREENED_ACCESS,
        })
        const screenedDataset = await datasetFactory
          .associations({
            accessGrants: [accessGrant],
          })
          .create({
            creatorId: datasetOwner.id,
            ownerId: datasetOwner.id,
          })
        const inaccessibleDataset = await datasetFactory
          .associations({
            accessGrants: [],
          })
          .create({
            creatorId: datasetOwner.id,
            ownerId: datasetOwner.id,
          })

        const accessibleDatasetField = await datasetFieldFactory.create({
          datasetId: screenedDataset.id,
          isExcludedFromPreview: false,
        })
        // inaccessible dataset field - via screened access
        await datasetFieldFactory.create({
          datasetId: screenedDataset.id,
          isExcludedFromPreview: true,
        })
        // inaccessible dataset field - for control case
        await datasetFieldFactory.create({
          datasetId: inaccessibleDataset.id,
        })
        const scopedQuery = DatasetFieldsPolicy.applyScope([], requestingUser)

        // Act
        const result = await scopedQuery.findAll()

        // Assert
        expect(DatasetField.count()).resolves.toBe(3)
        expect(result).toHaveLength(1)
        expect(result).toEqual([
          expect.objectContaining({
            id: accessibleDatasetField.id,
            isExcludedFromPreview: false,
          }),
        ])
      })

      test("when user has role type user, and field belongs to dataset with accessible screened access grants, with an approved request, returns the datasets fields", async () => {
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

        const screenedAccessGrant = accessGrantFactory.build({
          creatorId: datasetOwner.id,
          grantLevel: GrantLevels.GOVERNMENT_WIDE,
          accessType: AccessTypes.SCREENED_ACCESS,
        })
        const screenedDataset = await datasetFactory
          .associations({
            accessGrants: [screenedAccessGrant],
          })
          .create({
            creatorId: datasetOwner.id,
            ownerId: datasetOwner.id,
          })
        await accessRequestFactory.create({
          datasetId: screenedDataset.id,
          accessGrantId: screenedAccessGrant.id,
          requestorId: requestingUser.id,
          approvedAt: new Date(),
        })
        const inaccessibleDataset = await datasetFactory
          .associations({
            accessGrants: [],
          })
          .create({
            creatorId: datasetOwner.id,
            ownerId: datasetOwner.id,
          })

        // via screened access with approved request
        const accessibleDatasetField = await datasetFieldFactory.create({
          datasetId: screenedDataset.id,
        })
        // inaccessible dataset field - for control case
        await datasetFieldFactory.create({
          datasetId: inaccessibleDataset.id,
        })
        const scopedQuery = DatasetFieldsPolicy.applyScope([], requestingUser)

        // Act
        const result = await scopedQuery.findAll()

        // Assert
        expect(DatasetField.count()).resolves.toBe(2)
        expect(result).toEqual([
          expect.objectContaining({
            id: accessibleDatasetField.id,
          }),
        ])
      })

      test("when user has role type data owner, and no grants available, returns the fields belonging to the datasets owned by the user", async () => {
        // Arrange
        const department = await userGroupFactory.create({ type: UserGroupTypes.DEPARTMENT })
        const requestingUserGroupMembership = userGroupMembershipFactory.build({
          departmentId: department.id,
        })
        const otherUserGroupMembership = userGroupMembershipFactory.build({
          departmentId: department.id,
        })
        const role = roleFactory.build({ role: RoleTypes.DATA_OWNER })
        const requestingUser = await userFactory
          .transient({
            include: ["groupMembership"],
          })
          .associations({
            roles: [role],
            groupMembership: requestingUserGroupMembership,
          })
          .create()

        const otherUser = await userFactory
          .associations({
            groupMembership: otherUserGroupMembership,
          })
          .create()

        const ownedDataset = await datasetFactory.create({
          creatorId: requestingUser.id,
          ownerId: requestingUser.id,
        })
        const inaccessibleDataset = await datasetFactory
          .associations({
            accessGrants: [],
          })
          .create({
            creatorId: otherUser.id,
            ownerId: otherUser.id,
          })

        const ownedDatasetField = await datasetFieldFactory.create({
          datasetId: ownedDataset.id,
        })
        // inaccessible dataset field - for control case
        await datasetFieldFactory.create({
          datasetId: inaccessibleDataset.id,
        })
        const scopedQuery = DatasetFieldsPolicy.applyScope([], requestingUser)

        // Act
        const result = await scopedQuery.findAll()

        // Assert
        expect(DatasetField.count()).resolves.toBe(2)
        expect(result).toEqual([
          expect.objectContaining({
            id: ownedDatasetField.id,
          }),
        ])
      })

      test("when user has role type data owner, and grants available, returns the fields belonging to the datasets owned by the user and the fields belonging to the accessible datasets", async () => {
        // Arrange
        const department = await userGroupFactory.create({ type: UserGroupTypes.DEPARTMENT })
        const requestingUserGroupMembership = userGroupMembershipFactory.build({
          departmentId: department.id,
        })
        const otherUserGroupMembership = userGroupMembershipFactory.build({
          departmentId: department.id,
        })
        const role = roleFactory.build({ role: RoleTypes.DATA_OWNER })
        const requestingUser = await userFactory
          .transient({
            include: ["groupMembership"],
          })
          .associations({
            roles: [role],
            groupMembership: requestingUserGroupMembership,
          })
          .create()

        const otherUser = await userFactory
          .associations({
            groupMembership: otherUserGroupMembership,
          })
          .create()

        const ownedDataset = await datasetFactory.create({
          creatorId: requestingUser.id,
          ownerId: requestingUser.id,
        })
        const accessGrant = accessGrantFactory.build({
          creatorId: otherUser.id,
          grantLevel: GrantLevels.GOVERNMENT_WIDE,
          accessType: AccessTypes.OPEN_ACCESS,
        })
        const accessibleDataset = await datasetFactory
          .associations({
            accessGrants: [accessGrant],
          })
          .create({
            creatorId: otherUser.id,
            ownerId: otherUser.id,
          })
        const inaccessibleDataset = await datasetFactory.create({
          creatorId: otherUser.id,
          ownerId: otherUser.id,
        })
        const ownedDatasetField = await datasetFieldFactory.create({
          datasetId: ownedDataset.id,
        })
        const accessibleDatasetField = await datasetFieldFactory.create({
          datasetId: accessibleDataset.id,
        })
        // inaccessible dataset field - for control case
        await datasetFieldFactory.create({
          datasetId: inaccessibleDataset.id,
        })
        const scopedQuery = DatasetFieldsPolicy.applyScope([], requestingUser)

        // Act
        const result = await scopedQuery.findAll()

        // Assert
        expect(DatasetField.count()).resolves.toBe(3)
        expect(result).toEqual([
          expect.objectContaining({
            id: ownedDatasetField.id,
          }),
          expect.objectContaining({
            id: accessibleDatasetField.id,
          }),
        ])
      })

      test("when user has role type user, and field belongs to dataset with limited access and preview mode disabled, restricts all datasets fields", async () => {
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

        const accessGrant = accessGrantFactory.build({
          creatorId: datasetOwner.id,
          grantLevel: GrantLevels.GOVERNMENT_WIDE,
          accessType: AccessTypes.SCREENED_ACCESS,
        })
        const dataset = await datasetFactory
          .associations({
            accessGrants: [accessGrant],
          })
          .create({
            creatorId: datasetOwner.id,
            ownerId: datasetOwner.id,
          })
        await visualizationControlFactory.create({
          datasetId: dataset.id,
          hasPreview: false,
        })

        // inaccessible via preview mode disabled
        await datasetFieldFactory.create({
          datasetId: dataset.id,
          isExcludedFromPreview: false,
        })
        // inaccessible via screened access
        await datasetFieldFactory.create({
          datasetId: dataset.id,
          isExcludedFromPreview: true,
        })
        const scopedQuery = DatasetFieldsPolicy.applyScope([], requestingUser)

        // Act
        const result = await scopedQuery.findAll()

        // Assert
        expect(await DatasetField.count()).toBe(2)
        expect(result).toHaveLength(0)
        expect(result).toEqual([])
      })
    })
  })
})
