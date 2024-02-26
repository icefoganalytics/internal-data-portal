import { faker } from "@faker-js/faker"
import { type DeepPartial } from "fishery"

import { DatasetField } from "@/models"
import { DatasetFieldDataTypes } from "@/models/dataset-field"

import BaseFactory from "@/factories/base-factory"

function assertParamsHasDatasetId(
  params: DeepPartial<DatasetField>
): asserts params is DeepPartial<DatasetField> & { datasetId: number } {
  if (typeof params.datasetId !== "number") {
    throw new Error("datasetId is must be a number")
  }
}

export const datasetFieldFactory = BaseFactory.define<DatasetField>(
  ({ sequence, params, onCreate }) => {
    onCreate((datasetField) => datasetField.save())

    assertParamsHasDatasetId(params)

    const description = faker.datatype.boolean(0.4) ? faker.lorem.sentence() : null
    const note = faker.datatype.boolean(0.1) ? faker.lorem.paragraph() : null

    return DatasetField.build({
      id: sequence,
      datasetId: params.datasetId,
      name: faker.database.column(),
      displayName: faker.database.column(),
      dataType: faker.helpers.enumValue(DatasetFieldDataTypes),
      description,
      note,
    })
  }
)

export default datasetFieldFactory
