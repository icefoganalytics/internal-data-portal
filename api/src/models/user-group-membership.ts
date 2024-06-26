import {
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ForeignKey,
  DataTypes,
  BelongsToGetAssociationMixin,
  BelongsToSetAssociationMixin,
  BelongsToCreateAssociationMixin,
  NonAttribute,
  Association,
} from "sequelize"
import { isNil } from "lodash"

import sequelize from "@/db/db-client"

import User from "@/models/user"
import UserGroup, { UserGroupTypes } from "@/models/user-groups"

export class UserGroupMembership extends Model<
  InferAttributes<UserGroupMembership>,
  InferCreationAttributes<UserGroupMembership>
> {
  declare id: CreationOptional<number>
  declare userId: ForeignKey<User["id"]>
  declare departmentId: ForeignKey<UserGroup["id"]>
  declare divisionId: ForeignKey<UserGroup["id"]> | null
  declare branchId: ForeignKey<UserGroup["id"]> | null
  declare unitId: ForeignKey<UserGroup["id"]> | null
  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>
  declare deletedAt: CreationOptional<Date | null>

  // https://sequelize.org/docs/v6/other-topics/typescript/#usage
  // https://sequelize.org/docs/v6/core-concepts/assocs/#foohasmanybar
  // https://sequelize.org/api/v7/types/_sequelize_core.index.hasmanyaddassociationmixin
  declare getUser: BelongsToGetAssociationMixin<User>
  declare setUser: BelongsToSetAssociationMixin<User, User["id"]>
  declare createUser: BelongsToCreateAssociationMixin<User>

  declare getDepartment: BelongsToGetAssociationMixin<UserGroup>
  declare setDepartment: BelongsToSetAssociationMixin<UserGroup, UserGroup["id"]>
  declare createDepartment: BelongsToCreateAssociationMixin<UserGroup>

  declare getDivision: BelongsToGetAssociationMixin<UserGroup>
  declare setDivision: BelongsToSetAssociationMixin<UserGroup, UserGroup["id"]>
  declare createDivision: BelongsToCreateAssociationMixin<UserGroup>

  declare getBranch: BelongsToGetAssociationMixin<UserGroup>
  declare setBranch: BelongsToSetAssociationMixin<UserGroup, UserGroup["id"]>
  declare createBranch: BelongsToCreateAssociationMixin<UserGroup>

  declare getUnit: BelongsToGetAssociationMixin<UserGroup>
  declare setUnit: BelongsToSetAssociationMixin<UserGroup, UserGroup["id"]>
  declare createUnit: BelongsToCreateAssociationMixin<UserGroup>

  declare user?: NonAttribute<User>
  declare department?: NonAttribute<UserGroup>
  declare division?: NonAttribute<UserGroup>
  declare branch?: NonAttribute<UserGroup>
  declare unit?: NonAttribute<UserGroup>

  declare static associations: {
    user: Association<UserGroupMembership, User>
    department: Association<UserGroupMembership, UserGroup>
    division: Association<UserGroupMembership, UserGroup>
    branch: Association<UserGroupMembership, UserGroup>
    unit: Association<UserGroupMembership, UserGroup>
  }

  static establishAssociations() {
    this.belongsTo(User)
    this.belongsTo(UserGroup, { as: "department" })
    this.belongsTo(UserGroup, { as: "division" })
    this.belongsTo(UserGroup, { as: "branch" })
    this.belongsTo(UserGroup, { as: "unit" })
  }
}

UserGroupMembership.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: "users",
        key: "id",
      },
      allowNull: false,
      unique: true,
    },
    departmentId: {
      type: DataTypes.INTEGER,
      references: {
        model: "user_groups",
        key: "id",
      },
      allowNull: true,
    },
    divisionId: {
      type: DataTypes.INTEGER,
      references: {
        model: "user_groups",
        key: "id",
      },
      allowNull: true,
    },
    branchId: {
      type: DataTypes.INTEGER,
      references: {
        model: "user_groups",
        key: "id",
      },
      allowNull: true,
    },
    unitId: {
      type: DataTypes.INTEGER,
      references: {
        model: "user_groups",
        key: "id",
      },
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    validate: {
      async validUserGroupings(this: UserGroupMembership) {
        if (isNil(this.departmentId)) {
          throw new Error("departmentId cannot be null")
        }

        const ids = [this.departmentId, this.divisionId, this.branchId, this.unitId]
          .map((id) => Number(id))
          .filter((id) => !isNaN(id) && id > 0)
        const userGroups = await UserGroup.findAll({
          where: {
            id: ids,
          },
        })
        const potentialDepartment = userGroups.find(
          (userGroup) =>
            userGroup.id === this.departmentId && userGroup.type === UserGroupTypes.DEPARTMENT
        )
        if (isNil(potentialDepartment)) {
          throw new Error("departmentId does not reference a valid department")
        }

        if (!isNil(this.division)) {
          const potentialDivision = userGroups.find(
            (userGroup) =>
              userGroup.id === this.divisionId && userGroup.type === UserGroupTypes.DIVISION
          )
          if (isNil(potentialDivision) || potentialDivision.parentId !== this.departmentId) {
            throw new Error("divisionId does not reference a valid division")
          }

          if (!isNil(this.branchId)) {
            const potentialBranch = userGroups.find(
              (userGroup) =>
                userGroup.id === this.branchId && userGroup.type === UserGroupTypes.BRANCH
            )
            if (isNil(potentialBranch) || potentialBranch.parentId !== this.divisionId) {
              throw new Error("branchId does not reference a valid branch")
            }

            if (!isNil(this.unitId)) {
              const potentialUnit = userGroups.find(
                (userGroup) =>
                  userGroup.id === this.unitId && userGroup.type === UserGroupTypes.UNIT
              )
              if (isNil(potentialUnit) || potentialUnit.parentId !== this.branchId) {
                throw new Error("unitId does not reference a valid unit")
              }
            }
          }
        }
      },
    },
  }
)

export default UserGroupMembership
