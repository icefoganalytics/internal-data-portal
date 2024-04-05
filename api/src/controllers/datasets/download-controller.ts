import { isNil } from "lodash"
import { format } from "fast-csv"

import { Dataset } from "@/models"
import { DatasetsPolicy } from "@/policies"
import { CreateService } from "@/services/datasets/download"

import { BaseController } from "@/controllers/base-controller"

export class DownloadController extends BaseController {
  async create() {
    const dataset = await this.loadDataset()
    if (isNil(dataset)) {
      return this.response.status(404).send("Dataset not found.")
    }

    const policy = this.buildPolicy(dataset)
    if (!policy.download()) {
      return this.response.status(403).send("You are not allowed to download this dataset.")
    }

    const searchToken = this.query.searchToken as string

    const fileName = await this.buildFileName(dataset.name)
    this.response.status(201)
    this.response.header("Content-Type", "text/csv")
    this.response.attachment(fileName)
    const csvStream = format({ headers: false })
    csvStream.pipe(this.response)

    try {
      await CreateService.perform(csvStream, dataset, this.currentUser, { searchToken })
    } catch (error) {
      console.error(`Failed to generate CSV: ${error}`)
      csvStream.write(`Failed to generate CSV due to server error.\n`)
      csvStream.write(`Error: ${error}\n`)
    } finally {
      csvStream.end()
    }
  }

  private async buildFileName(datasetName: string) {
    const date = new Date().toISOString().split("T")[0]
    return `Export, ${datasetName}, ${date}.csv`
  }

  private buildPolicy(dataset: Dataset) {
    return new DatasetsPolicy(this.currentUser, dataset)
  }

  private async loadDataset(): Promise<Dataset | null> {
    const { datasetIdOrSlug } = this.request.params
    return Dataset.findBySlugOrPk(datasetIdOrSlug, {
      include: [
        // for data rendering logic
        "integration",
        {
          association: "fields",
          where: { isExcludedFromSearch: false },
        },
        // for policy logic
        {
          association: "owner",
          include: ["groupMembership"],
        },
        "accessGrants",
        "accessRequests",
      ],
    })
  }
}

export default DownloadController
