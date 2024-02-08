import { Attributes, CreationOptional, FindOptions, Model, ModelStatic, Op } from "sequelize"

// See api/node_modules/sequelize/types/model.d.ts -> Model
export abstract class BaseModel<
  // eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/no-explicit-any
  TModelAttributes extends {} = any,
  // eslint-disable-next-line @typescript-eslint/ban-types
  TCreationAttributes extends {} = TModelAttributes,
> extends Model<TModelAttributes, TCreationAttributes> {
  declare id: CreationOptional<number>

  public static async findBySlugOrPk<M extends BaseModel>(
    this: ModelStatic<M>,
    slugOrPk: string | number
  ): Promise<M | null> {
    if (typeof slugOrPk === "number" || !isNaN(Number(slugOrPk))) {
      const primaryKey = slugOrPk
      return this.findByPk(primaryKey)
    }

    const slug = slugOrPk
    if (!("slug" in this.getAttributes())) {
      throw new Error(`${this.name} does not have a 'slug' attribute.`)
    }

    // @ts-expect-error - We know that the model has a slug attribute, and are ignoring the TS error
    return this.findOne({ where: { slug } })
  }

  // See api/node_modules/sequelize/types/model.d.ts -> findAll
  // Taken from https://api.rubyonrails.org/v7.1.0/classes/ActiveRecord/Batches.html#method-i-find_each
  // Enforces sort by id, overwriting any supplied order
  public static async findEach<M extends BaseModel>(
    this: ModelStatic<M>,
    processFunction: (record: M) => Promise<void>
  ): Promise<void>
  public static async findEach<M extends BaseModel>(
    this: ModelStatic<M>,
    options: FindOptions<Attributes<M>> & { batchSize?: number },
    processFunction: (record: M) => Promise<void>
  ): Promise<void>
  public static async findEach<M extends BaseModel>(
    this: ModelStatic<M>,
    optionsOrFunction:
      | ((record: M) => Promise<void>)
      | (FindOptions<Attributes<M>> & { batchSize?: number }),
    maybeFunction?: (record: M) => Promise<void>
  ): Promise<void> {
    let options: FindOptions<Attributes<M>> & { batchSize?: number }
    let processFunction: (record: M) => Promise<void>

    if (typeof optionsOrFunction === "function") {
      options = {}
      processFunction = optionsOrFunction
    } else {
      options = optionsOrFunction
      processFunction = maybeFunction!
    }

    const batchSize = options.batchSize ?? 1000
    let lastId = 0
    let continueProcessing = true

    while (continueProcessing) {
      const whereClause = {
        ...options.where,
        id: { [Op.gt]: lastId },
      }
      const records = await this.findAll({
        ...options,
        where: whereClause,
        limit: batchSize,
        order: [["id", "ASC"]],
      })

      for (const record of records) {
        await processFunction(record)
        lastId = record.id
      }

      if (records.length < batchSize) {
        continueProcessing = false
      }
    }
  }
}

export default BaseModel
